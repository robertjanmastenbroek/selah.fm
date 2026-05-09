import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import sql from '@/lib/db';

/**
 * Process a payout to a creator via Stripe Connect.
 * Called when artist approves a submission — transfers funds from platform to creator.
 */
export async function POST(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

  try {
    const { submissionId } = await request.json();
    if (!submissionId) return NextResponse.json({ error: 'Missing submissionId' }, { status: 400 });

    // Get submission with creator's Connect ID
    const subs = await sql`
      SELECT s.id, s.payout_amount_cents, s.payout_status, s.creator_id,
             u.stripe_connect_id, u.display_name
      FROM submissions s
      JOIN users u ON u.id = s.creator_id
      WHERE s.id = ${submissionId}
    `;

    if (subs.length === 0) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = subs[0];

    if (sub.payout_status === 'paid') {
      return NextResponse.json({ error: 'Already paid' }, { status: 400 });
    }

    if (!sub.stripe_connect_id) {
      return NextResponse.json({ error: 'Creator has not set up payouts. They need to connect Stripe.' }, { status: 400 });
    }

    const amountCents = sub.payout_amount_cents || 0;
    if (amountCents <= 0) {
      return NextResponse.json({ error: 'No payout amount calculated' }, { status: 400 });
    }

    const stripe = new Stripe(key, { apiVersion: '2024-06-20' as any });

    // Transfer to creator's Connect account
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: 'usd',
      destination: sub.stripe_connect_id,
      metadata: { submissionId: sub.id, creatorName: sub.display_name },
    });

    // Mark submission as paid
    await sql`
      UPDATE submissions
      SET payout_status = 'paid', stripe_payout_id = ${transfer.id}, updated_at = NOW()
      WHERE id = ${sub.id}
    `;

    // Notify the creator
    try {
      await sql`
        INSERT INTO notifications (user_id, type, message, link, metadata)
        VALUES (
          ${sub.creator_id},
          'payout',
          ${`You received $${(amountCents / 100).toFixed(2)} — payout processed`},
          '/earnings',
          ${JSON.stringify({ submission_id: sub.id, amount_cents: amountCents })}
        )
      `;
    } catch (notifErr) {
      console.error('Payout notification failed:', notifErr);
    }

    return NextResponse.json({
      ok: true,
      transferId: transfer.id,
      amount: amountCents / 100,
    });
  } catch (e: any) {
    console.error('Payout error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
