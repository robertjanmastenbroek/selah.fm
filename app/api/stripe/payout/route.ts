import { NextResponse } from 'next/server';

/**
 * POST /api/stripe/payout — triggers a Stripe Connect transfer for an approved submission.
 * Called automatically by the review route on approval.
 */
export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

  try {
    const { submissionId } = await request.json();
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as any });
    const { default: sql } = await import('@/lib/db');

    // Get submission + creator info
    const subs = await sql`
      SELECT s.id, s.creator_id, s.payout_amount_cents, s.payout_status,
             u.stripe_account_id, u.stripe_onboarding_complete, u.email
      FROM submissions s
      JOIN users u ON u.id = s.creator_id
      WHERE s.id = ${submissionId} AND s.review_status = 'approved'
    `;

    const sub = subs[0];
    if (!sub) return NextResponse.json({ error: 'Submission not found or not approved' }, { status: 404 });
    if (!sub.stripe_account_id || !sub.stripe_onboarding_complete) {
      return NextResponse.json({ error: 'Creator has not completed Stripe onboarding' }, { status: 400 });
    }
    if (!sub.payout_amount_cents || sub.payout_amount_cents < 1) {
      return NextResponse.json({ error: 'Payout amount too small' }, { status: 400 });
    }
    if (sub.payout_status === 'paid') {
      return NextResponse.json({ error: 'Already paid' }, { status: 409 });
    }

    // Create Stripe transfer
    const transfer = await stripe.transfers.create({
      amount: sub.payout_amount_cents,
      currency: 'usd',
      destination: sub.stripe_account_id,
      transfer_group: `submission_${submissionId}`,
      metadata: { submission_id: submissionId, creator_id: sub.creator_id },
    });

    // Update payout status
    await sql`
      UPDATE submissions SET payout_status = 'processing', stripe_transfer_id = ${transfer.id}
      WHERE id = ${submissionId}
    `;

    return NextResponse.json({
      success: true,
      transfer_id: transfer.id,
      amount_cents: sub.payout_amount_cents,
    });
  } catch (e: any) {
    console.error('Payout error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
