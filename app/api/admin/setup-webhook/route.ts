import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: 'STRIPE_SECRET_KEY not set' }, { status: 500 });

  const stripe = new Stripe(key, { apiVersion: '2024-06-20' });

  try {
    // Check if webhook already exists
    const existing = await stripe.webhookEndpoints.list();
    const already = existing.data.find(e => e.url === 'https://selah.fm/api/stripe/webhook');

    if (already) {
      return NextResponse.json({
        exists: true,
        id: already.id,
        secret: already.secret,
        instruction: 'Add this to Railway: STRIPE_WEBHOOK_SECRET=' + (already.secret || '(secret hidden — use Stripe Dashboard to reveal)'),
      });
    }

    // Create new webhook
    const webhook = await stripe.webhookEndpoints.create({
      url: 'https://selah.fm/api/stripe/webhook',
      enabled_events: ['checkout.session.completed'],
    });

    return NextResponse.json({
      created: true,
      id: webhook.id,
      secret: webhook.secret,
      instruction: '✅ Add this to Railway → selah-fm → Variables:',
      variable: 'STRIPE_WEBHOOK_SECRET',
      value: webhook.secret,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
