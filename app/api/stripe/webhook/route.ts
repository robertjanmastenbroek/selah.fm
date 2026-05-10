import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import sql from '@/lib/db';

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
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { campaignId } = session.metadata || {};
      const grossCents = session.amount_total || 0;

      if (campaignId && grossCents > 0) {
        const stripeFeeCents = Math.round(grossCents * 0.029 + 30);
        const netCents = grossCents - stripeFeeCents;
        
        await sql`
          UPDATE campaigns 
          SET total_budget_cents = total_budget_cents + ${netCents},
              budget_remaining_cents = budget_remaining_cents + ${netCents},
              status = CASE WHEN status = 'draft' THEN 'active' ELSE status END,
              updated_at = NOW()
          WHERE id = ${campaignId}
        `;

        // ── Referral bonus: 10% of deposit split between referrer & referred ──
        // Only fires on the first deposit from a referred user
        try {
          const campaignRows = await sql`
            SELECT c.artist_id, u.email
            FROM campaigns c
            JOIN users u ON u.id = c.artist_id
            WHERE c.id = ${campaignId}
          `;
          if (campaignRows.length > 0) {
            const artistEmail = campaignRows[0].email;
            const artistId = campaignRows[0].artist_id;

            const referralRows = await sql`
              SELECT r.referrer_id, r.referred_email
              FROM referrals r
              WHERE r.referred_email = ${artistEmail}
                AND r.status = 'pending'
              LIMIT 1
            `;

            if (referralRows.length > 0) {
              const referrerId = referralRows[0].referrer_id;
              // 10% of net deposit, split 50/50
              const bonusTotal = Math.floor(netCents * 0.10);
              const bonusEach = Math.floor(bonusTotal / 2);

              if (bonusEach > 0) {
                // Credit referrer's active campaign
                await sql`
                  UPDATE campaigns
                  SET total_budget_cents = total_budget_cents + ${bonusEach},
                      budget_remaining_cents = budget_remaining_cents + ${bonusEach},
                      updated_at = NOW()
                  WHERE artist_id = ${referrerId}
                    AND status = 'active'
                  LIMIT 1
                `;

                // Credit referred artist's campaign (the one who just deposited)
                await sql`
                  UPDATE campaigns
                  SET total_budget_cents = total_budget_cents + ${bonusEach},
                      budget_remaining_cents = budget_remaining_cents + ${bonusEach},
                      updated_at = NOW()
                  WHERE id = ${campaignId}
                `;

                // Mark referral as completed
                await sql`
                  UPDATE referrals
                  SET status = 'completed', completed_at = NOW()
                  WHERE referred_email = ${artistEmail}
                    AND status = 'pending'
                `;

                // Notify both users
                const bonusDollars = (bonusEach / 100).toFixed(2);
                await sql`
                  INSERT INTO notifications (user_id, type, message, link)
                  VALUES 
                    (${referrerId}, 'earning', ${`You earned $${bonusDollars} referral bonus! It's been added to your active campaign.`}, '/dashboard'),
                    (${artistId}, 'earning', ${`You received a $${bonusDollars} referral welcome bonus! It's been added to your campaign.`}, '/dashboard')
                `;
              }
            }
          }
        } catch (refErr) {
          // Referral bonus is non-critical — don't block the webhook
          console.error('Referral bonus processing failed:', refErr);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (dbError: any) {
    console.error('Webhook DB update failed:', dbError.message);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
}
