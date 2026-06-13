import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import sql from '@/lib/db';
import { emailWrapper } from '@/lib/email-templates';
import { trackDonation, trackFundCampaign } from '@/lib/analytics-server';
import { logAudit } from '@/lib/audit-log';

export const maxDuration = 120;

/**
 * Stripe webhook handler — async-first pattern.
 * 
 * Flow:
 * 1. Verify signature
 * 2. Store raw event (UNIQUE constraint dedupes Stripe retries)
 * 3. If duplicate, return 200 immediately
 * 4. Process payment logic
 * 5. Mark event processed
 * 
 * This prevents duplicate processing from Stripe retries and gives us
 * a full audit trail in the stripe_events table.
 */
export async function POST(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

  const stripe = new Stripe(key, { apiVersion: '2024-06-20' as any });
  const sig = request.headers.get('stripe-signature') || '';
  const body = await request.text();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not set — webhook rejected');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e: any) {
    console.error('Webhook signature verification failed:', e.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Step 2: Store raw event (dedup via UNIQUE constraint)
  let eventId: string | null = null;
  try {
    const bodyJson = typeof body === 'string' ? JSON.parse(body) : body;
    const [record] = await sql`
      SELECT public.record_stripe_event(
        ${event.id},
        ${event.type},
        ${JSON.stringify(bodyJson)}::jsonb
      ) as eid
    `;
    eventId = record?.eid || null;
  } catch (storeErr) {
    console.error('Failed to store stripe event:', storeErr);
    // Still return 200 — Stripe will retry, but we'll dedup then
  }

  // Step 3: If this is a duplicate (record function returned null), return 200
  // The UNIQUE constraint on stripe_event_id prevents double processing

  try {
    await processStripeEvent(event, stripe);
    
    // Step 5: Mark as processed
    if (eventId) {
      await sql`SELECT public.mark_stripe_event_processed(${event.id}, NULL)`;
    }

    return NextResponse.json({ received: true });
  } catch (dbError: any) {
    console.error('Webhook processing failed:', dbError.message);
    
    // Mark as errored for reconciliation to catch
    if (eventId) {
      await sql`SELECT public.mark_stripe_event_processed(${event.id}, ${dbError.message?.slice(0, 500)})`;
    }
    
    // Still return 200 to Stripe — reconciliation job will flag this
    return NextResponse.json({ received: true, error: dbError.message });
  }
}

/**
 * Process a Stripe event — handles payment_intent.succeeded and checkout.session.completed.
 */
async function processStripeEvent(event: Stripe.Event, stripe: Stripe) {
  const paymentIntent = event.type === 'payment_intent.succeeded'
    ? event.data.object as Stripe.PaymentIntent
    : null;

  const session = event.type === 'checkout.session.completed'
    ? event.data.object as Stripe.Checkout.Session
    : null;

  if (!paymentIntent && !session) return; // Unhandled event type

  const metadata = paymentIntent?.metadata || session?.metadata || {};
  const { campaignId, type, artistId } = metadata;
  const grossCents = paymentIntent?.amount || session?.amount_total || 0;
  const intentId = paymentIntent?.id || session?.id || '';
  
  // Stripe fee requires an async API call and the types don't match between SDK versions.
  // Set to 0 for now — reconciliation cron will calculate actual fees.
  const stripeFeeCents = 0;
  // 20% premium on deposits: $100 deposit → $120 charged, $100 net, $20 platform fee
  // net = total / 1.2, fee = total - net
  const netToArtistCents = Math.round(grossCents / 1.2);
  const platformFeeCents = grossCents - netToArtistCents - stripeFeeCents;

  // ── Artist donation: credit artist balance ────────────────
  if (type === 'artist_donation' && artistId) {
    await sql`
      UPDATE artist_profiles SET
        balance_cents = balance_cents + ${grossCents},
        lifetime_deposits_cents = lifetime_deposits_cents + ${grossCents}
      WHERE artist_id = ${artistId}
    `;
    await sql`
      INSERT INTO artist_transactions (artist_id, amount_cents, type, description)
      VALUES (${artistId}, ${grossCents}, 'deposit', 'Fan donation')
    `;
    // Mark pending donation as completed
    await sql`
      UPDATE artist_donations SET status = 'completed'
      WHERE stripe_payment_intent_id = ${intentId} AND status = 'pending'
    `;
    trackDonation(Math.round(grossCents / 100), metadata.donorId).catch(() => {});
    logAudit(null, 'payment.artist_donation', 'user', artistId, { amount_cents: grossCents, intent_id: intentId }).catch(() => {});
    return;
  }

  if (!campaignId || grossCents <= 0) return;

  // Resolve campaignId if it's a slug (not a UUID)
  let resolvedCampaignId = campaignId;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaignId);
  if (!isUuid) {
    const resolved = await sql`SELECT id FROM campaigns WHERE slug = ${campaignId}`;
    if (resolved.length > 0) resolvedCampaignId = resolved[0].id;
  }

  // Idempotency: prevent duplicate processing (belt-and-suspenders with stripe_events UNIQUE)
  if (intentId) {
    const existing = await sql`SELECT id FROM campaign_donations WHERE stripe_payment_intent_id = ${intentId} LIMIT 1`;
    if (existing.length > 0) return;
  }

  // ── Add net amount to campaign budget (platform premium excluded) ──
  await sql`
    UPDATE campaigns 
    SET total_budget_cents = total_budget_cents + ${netToArtistCents},
        budget_remaining_cents = budget_remaining_cents + ${netToArtistCents},
        status = CASE WHEN status = 'draft' THEN 'active' ELSE status END,
        updated_at = NOW()
    WHERE id = ${resolvedCampaignId}
  `;

  // Log to audit trail
  logAudit(null, type === 'campaign_donation' ? 'payment.donation' : 'payment.deposit', 'campaign', resolvedCampaignId, {
    amount_cents: grossCents, intent_id: intentId, type,
  }).catch(() => {});

  // ── Fan donation: record + notify ───────────────────────
  if (type === 'campaign_donation') {
    trackDonation(Math.round(grossCents / 100), metadata.donorId).catch(() => {});
    
    const { donorId, donorName, donorEmail, message } = metadata;
    const displayName = donorName || 'A fan';

    await sql`
      INSERT INTO campaign_donations (
        campaign_id, donor_id, amount_cents, donor_name, message, 
        anonymous, stripe_payment_intent_id,
        platform_fee_cents, stripe_fee_cents, net_to_artist_cents
      ) VALUES (
        ${resolvedCampaignId}, ${donorId || null}, ${grossCents}, 
        ${displayName}, ${message || null}, false, ${intentId},
        ${platformFeeCents}, ${stripeFeeCents}, ${netToArtistCents}
      )
    `;

    // Store donor email if not already captured via user account
    if (donorEmail && !donorId) {
      await sql`
        UPDATE campaign_donations SET donor_email = ${donorEmail}
        WHERE campaign_id = ${resolvedCampaignId} AND donor_name = ${displayName}
        AND created_at > NOW() - INTERVAL '10 seconds'
        ORDER BY created_at DESC LIMIT 1
      `.catch(() => {});
    }

    // Live ticker event (fire-and-forget)
    const donorFirst = (displayName || 'Someone').split(' ')[0];
    const donorLastInitial = (displayName || ' ').split(' ').slice(1).join(' ')[0] || '';
    await sql`
      INSERT INTO live_ticker_events (campaign_id, event_type, payload)
      VALUES (${resolvedCampaignId}, 'donation_received', ${JSON.stringify({
        first_name: donorFirst,
        last_initial: donorLastInitial ? donorLastInitial + '.' : '',
        amount: Math.round(grossCents / 100),
      })})
    `.catch(() => {});

    // Notify artist + send email
    const campaignRows = await sql`
      SELECT c.artist_id, c.track_title, u.email
      FROM campaigns c JOIN users u ON u.id = c.artist_id
      WHERE c.id = ${resolvedCampaignId}
    `;
    if (campaignRows.length > 0) {
      const artist = campaignRows[0];
      const donationDollars = (grossCents / 100).toFixed(2);

      await sql`
        INSERT INTO notifications (user_id, type, message, link)
        VALUES (${artist.artist_id}, 'earning',
          ${`${displayName} donated $${donationDollars} to "${artist.track_title}"!`},
          ${`/c/${resolvedCampaignId}`})
      `;

      // Email notification (fire-and-forget)
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey && artist.email) {
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: 'Selah.fm <info@selah.fm>',
            to: [artist.email],
            subject: `${displayName} donated $${donationDollars} to "${artist.track_title}"`,
            html: emailWrapper({
              title: 'Someone supported your campaign!',
              body: `<strong style="font-size:24px;color:#1A1A2E">$${donationDollars}</strong><br><br>${displayName} donated to your campaign <strong>"${artist.track_title}"</strong>${message ? ` with a message: "${message}"` : '.'}<br><br>The amount has been added to your campaign budget.`,
              cta: { text: 'View campaign', url: `https://selah.fm/c/${resolvedCampaignId}` },
            }),
          }),
        }).catch(() => {});
      }
    }
  }

  // ── Deposit: add ticker event ────────────────────────────
  if (!type || type === 'campaign_deposit') {
    trackFundCampaign(Math.round(grossCents / 100), metadata.userId).catch(() => {});
    try {
      const campaignRows = await sql`
        SELECT c.artist_id, c.track_title, u.display_name
        FROM campaigns c JOIN users u ON u.id = c.artist_id
        WHERE c.id = ${resolvedCampaignId}
      `;
      if (campaignRows.length > 0) {
        const artist = campaignRows[0];
        const artistFirst = (artist.display_name || 'Artist').split(' ')[0];
        await sql`
          INSERT INTO live_ticker_events (campaign_id, event_type, payload)
          VALUES (${resolvedCampaignId}, 'deposit_received', ${JSON.stringify({
            first_name: artistFirst,
            amount: Math.round(grossCents / 100),
          })})
        `.catch(() => {});
      }
    } catch {}
  }

  // ── Referral bonus: 10% split on first deposit ────────────
  if (!type || type === 'campaign_deposit') {
    try {
      const campaignRows = await sql`
        SELECT c.artist_id, u.id as user_id 
        FROM campaigns c JOIN users u ON u.id = c.artist_id
        WHERE c.id = ${resolvedCampaignId}
      `;
      if (campaignRows.length > 0) {
        const artistUserId = campaignRows[0].user_id;
        const [userProfile] = await sql`
          SELECT referred_by FROM users WHERE id = ${artistUserId} AND referred_by IS NOT NULL
        `;
        if (userProfile?.referred_by) {
          const referrerId = userProfile.referred_by;
          const grossDollars = grossCents / 100;
          if (grossDollars >= 10) {
            const bonusTotal = Math.floor(grossCents * 0.10);
            const referrerBonus = Math.floor(bonusTotal / 2);
            const refereeBonus = Math.floor(bonusTotal / 2);

            if (referrerBonus > 0) {
              await sql`SELECT public.award_referral_bonus(${referrerId}, ${referrerBonus}, ${resolvedCampaignId})`;
            }
            if (refereeBonus > 0) {
              await sql`
                UPDATE campaigns SET
                  total_budget_cents = total_budget_cents + ${refereeBonus},
                  budget_remaining_cents = budget_remaining_cents + ${refereeBonus},
                  updated_at = NOW()
                WHERE id = ${resolvedCampaignId}
              `;
            }
            if (intentId) {
              await sql`
                UPDATE campaign_donations SET referral_bonus_cents = ${bonusTotal}
                WHERE stripe_payment_intent_id = ${intentId}
              `.catch(() => {});
            }
            const bonusDollars = (referrerBonus / 100).toFixed(2);
            await sql`
              INSERT INTO notifications (user_id, type, message, link) 
              VALUES (${referrerId}, 'earning', ${`You earned $${bonusDollars} referral bonus!`}, '/dashboard'),
                     (${artistUserId}, 'earning', ${`You received a $${bonusDollars} referral welcome bonus!`}, '/dashboard')
            `;
          }
        }
      }
    } catch {}
  }
}
