import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import sql from '@/lib/db';
import { emailWrapper } from '@/lib/email-templates';

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

  try {
    // Handle PaymentIntent succeeded (on-platform Elements) AND checkout.session.completed (legacy)
    const paymentIntent = event.type === 'payment_intent.succeeded'
      ? event.data.object
      : event.type === 'checkout.session.completed'
        ? null
        : null;

    const session = event.type === 'checkout.session.completed' ? event.data.object : null;

    const metadata = paymentIntent?.metadata || session?.metadata || {};
    const { campaignId, type } = metadata;
    const grossCents = paymentIntent?.amount || session?.amount_total || 0;
    
    if (!campaignId || grossCents <= 0) {
      return NextResponse.json({ received: true });
    }

    // Idempotency: prevent duplicate processing
    const intentId = paymentIntent?.id || session?.id || '';
    if (intentId) {
      const existing = await sql`SELECT id FROM campaign_donations WHERE payment_intent_id = ${intentId} LIMIT 1`;
      if (existing.length > 0) return NextResponse.json({ received: true, duplicate: true });
    }

    // ── Always add full amount to campaign budget (fees handled at payout) ──
    await sql`
      UPDATE campaigns 
      SET total_budget_cents = total_budget_cents + ${grossCents},
          budget_remaining_cents = budget_remaining_cents + ${grossCents},
          status = CASE WHEN status = 'draft' THEN 'active' ELSE status END,
          updated_at = NOW()
      WHERE id = ${campaignId}
    `;

    // ── Fan donation: record + notify ───────────────────────
    if (type === 'campaign_donation') {
      try {
        const { donorId, donorName, message } = metadata;
        const displayName = donorName || 'A fan';

        await sql`
          INSERT INTO campaign_donations (campaign_id, donor_id, amount_cents, donor_name, message, anonymous)
          VALUES (${campaignId}, ${donorId || null}, ${grossCents}, ${displayName}, ${message || null}, false)
        `;

        // Live ticker event
        const donorFirst = (displayName || 'Someone').split(' ')[0];
        const donorLastInitial = (displayName || ' ').split(' ').slice(1).join(' ')[0] || '';
        await sql`
          INSERT INTO live_ticker_events (campaign_id, event_type, payload)
          VALUES (${campaignId}, 'donation_received', ${JSON.stringify({
            first_name: donorFirst,
            last_initial: donorLastInitial ? donorLastInitial + '.' : '',
            amount: Math.round(grossCents / 100),
          })})
        `.catch(() => {});

        // Notify artist + send email
        const campaignRows = await sql`
          SELECT c.artist_id, c.track_title, u.email
          FROM campaigns c JOIN users u ON u.id = c.artist_id
          WHERE c.id = ${campaignId}
        `;
        if (campaignRows.length > 0) {
          const artist = campaignRows[0];
          const donationDollars = (grossCents / 100).toFixed(2);

          await sql`
            INSERT INTO notifications (user_id, type, message, link)
            VALUES (${artist.artist_id}, 'earning',
              ${`${displayName} donated $${donationDollars} to "${artist.track_title}"!`},
              ${`/c/${campaignId}`})
          `;

          // Email notification
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
                  cta: { text: 'View campaign', url: `https://selah.fm/c/${campaignId}` },
                }),
              }),
            }).catch(() => {});
          }
        }
      } catch (donationErr) {
        console.error('Donation recording failed:', donationErr);
      }
    }

    // ── Referral bonus: only on artist self-funding ──────────
    if (!type || type === 'campaign_deposit') {
      try {
        const campaignRows = await sql`
          SELECT c.artist_id, u.email FROM campaigns c JOIN users u ON u.id = c.artist_id
          WHERE c.id = ${campaignId}
        `;
        if (campaignRows.length > 0) {
          const artistEmail = campaignRows[0].email;
          const artistId = campaignRows[0].artist_id;

          const referralRows = await sql`
            SELECT referrer_id FROM referrals WHERE referred_email = ${artistEmail} AND status = 'pending' LIMIT 1
          `;
          if (referralRows.length > 0) {
            const referrerId = referralRows[0].referrer_id;
            const bonusTotal = Math.floor(grossCents * 0.10);
            const bonusEach = Math.floor(bonusTotal / 2);

            if (bonusEach > 0) {
              await sql`UPDATE campaigns SET total_budget_cents = total_budget_cents + ${bonusEach}, budget_remaining_cents = budget_remaining_cents + ${bonusEach}, updated_at = NOW() WHERE artist_id = ${referrerId} AND status = 'active' LIMIT 1`;
              await sql`UPDATE campaigns SET total_budget_cents = total_budget_cents + ${bonusEach}, budget_remaining_cents = budget_remaining_cents + ${bonusEach}, updated_at = NOW() WHERE id = ${campaignId}`;
              await sql`UPDATE referrals SET status = 'completed', completed_at = NOW() WHERE referred_email = ${artistEmail} AND status = 'pending'`;
              const bonusDollars = (bonusEach / 100).toFixed(2);
              await sql`INSERT INTO notifications (user_id, type, message, link) VALUES (${referrerId}, 'earning', ${`You earned $${bonusDollars} referral bonus!`}, '/dashboard'), (${artistId}, 'earning', ${`You received a $${bonusDollars} referral welcome bonus!`}, '/dashboard')`;
            }
          }
        }
      } catch (refErr) { console.error('Referral bonus failed:', refErr); }
    }

    return NextResponse.json({ received: true });
  } catch (dbError: any) {
    console.error('Webhook DB update failed:', dbError.message);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
}
