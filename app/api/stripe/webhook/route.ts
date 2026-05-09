import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import sql from '@/lib/db';

export async function POST(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

  const stripe = new Stripe(key, { apiVersion: '2024-06-20' as any });
  const sig = request.headers.get('stripe-signature') || '';
  const body = await request.text();

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { campaignId } = session.metadata || {};
      const grossCents = session.amount_total || 0;

      if (campaignId && grossCents > 0) {
        try {
          // Stripe processing fee: 2.9% + 30¢
          const stripeFeeCents = Math.round(grossCents * 0.029 + 30);
          const netCents = grossCents - stripeFeeCents;
          
          await sql`
            UPDATE campaigns 
            SET total_budget_cents = total_budget_cents + ${netCents},
                budget_remaining_cents = budget_remaining_cents + ${netCents},
                updated_at = NOW()
            WHERE id = ${campaignId}
          `;
          console.log(`✅ Campaign ${campaignId}: +$${(netCents/100).toFixed(2)} (gross: $${(grossCents/100).toFixed(2)}, stripe: $${(stripeFeeCents/100).toFixed(2)})`);
        } catch (dbError: any) {
          console.error('DB update failed:', dbError.message);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('Webhook error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
