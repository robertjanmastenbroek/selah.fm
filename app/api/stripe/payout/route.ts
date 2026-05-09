import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

  try {
    const { amount, creatorStripeId, submissionId } = await request.json();
    const stripe = new Stripe(key, { apiVersion: '2024-06-20' as any });

    // Transfer from platform to creator
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      destination: creatorStripeId || 'acct_default',
      metadata: { submissionId },
    });

    // Update submission payout status
    // await sql`UPDATE submissions SET payout_status = 'paid', stripe_payout_id = ${transfer.id} WHERE id = ${submissionId}`;

    return NextResponse.json({ ok: true, transferId: transfer.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
