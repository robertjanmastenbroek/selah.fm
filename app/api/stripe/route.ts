import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
  const { rateLimit, getRateLimitKey } = await import('@/lib/rate-limit');
  const rl = rateLimit(getRateLimitKey(request), { maxRequests: 10, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  try {
    const { amount, campaignId } = await request.json();
    const stripe = new Stripe(key, { apiVersion: '2024-06-20' as any });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL || 'https://selah.fm'}/dashboard?deposit=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'https://selah.fm'}/dashboard?deposit=cancelled`,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Campaign budget deposit` },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      metadata: { campaignId, type: 'campaign_deposit' },
      payment_intent_data: {
        transfer_group: campaignId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
