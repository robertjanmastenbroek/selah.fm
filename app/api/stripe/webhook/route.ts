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
      }
    }

    return NextResponse.json({ received: true });
  } catch (dbError: any) {
    console.error('Webhook DB update failed:', dbError.message);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
}
