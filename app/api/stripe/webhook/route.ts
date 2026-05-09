import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

  const stripe = new Stripe(key, { apiVersion: '2024-06-20' as any });
  const sig = request.headers.get('stripe-signature') || '';
  const body = await request.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body, sig, process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test'
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { campaignId } = session.metadata || {};
      const amount = (session.amount_total || 0) / 100;

      // Update campaign budget in DB
      // await sql`UPDATE campaigns SET budget_remaining_cents = budget_remaining_cents + ${amount * 100} WHERE id = ${campaignId}`;
      
      console.log(`✅ Payment confirmed: $${amount} for campaign ${campaignId}`);
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
