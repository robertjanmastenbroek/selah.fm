import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { submissionId, status } = await request.json();
    
    // Verify the submission exists and get campaign ownership
    const subs = await sql`
      SELECT s.id, s.campaign_id, s.creator_id, s.views_verified,
             c.artist_id, c.cpm_rate_cents, c.max_payout_per_submission_cents, c.track_title, c.budget_remaining_cents, c.status as campaign_status
      FROM submissions s
      JOIN campaigns c ON c.id = s.campaign_id
      WHERE s.id = ${submissionId}
    `;

    if (subs.length === 0) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = subs[0];

    // Ownership check: only the campaign artist can review
    const users = await sql`SELECT id FROM users WHERE email = ${session.email}`;
    if (users.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (sub.artist_id !== users[0].id) {
      return NextResponse.json({ error: 'You can only review submissions on your own campaigns' }, { status: 403 });
    }

    // If approving, calculate payout
    if (status === 'approved') {
      const views = parseInt(sub.views_verified || '0');
      let grossCents = Math.round((views / 1000) * sub.cpm_rate_cents);
      
      // Apply max payout cap
      if (sub.max_payout_per_submission_cents && grossCents > sub.max_payout_per_submission_cents) {
        grossCents = sub.max_payout_per_submission_cents;
      }
      
      // Deduct 20% platform fee
      const platformFeeCents = Math.round(grossCents * 0.20);
      const netCents = grossCents - platformFeeCents;

      // Check budget remaining
      if (sub.budget_remaining_cents < netCents) {
        return NextResponse.json({ 
          error: `Insufficient budget. Remaining: $${(sub.budget_remaining_cents / 100).toFixed(2)}, payout: $${(netCents / 100).toFixed(2)}` 
        }, { status: 400 });
      }

      const result = await sql`
        UPDATE submissions
        SET review_status = 'approved', reviewed_at = NOW(), reviewed_by = ${users[0].id},
            payout_amount_cents = ${netCents}, payout_status = 'processing'
        WHERE id = ${submissionId}
        RETURNING *
      `;

      // Notify the creator
      try {
        const netDollars = (netCents / 100).toFixed(2);
        await sql`
          INSERT INTO notifications (user_id, type, message, link, metadata)
          VALUES (
            ${sub.creator_id}, 'approval',
            ${`Your submission on "${sub.track_title}" was approved — $${netDollars} earned (${views.toLocaleString()} views)`},
            '/earnings',
            ${JSON.stringify({ submission_id: submissionId, amount_cents: netCents })}
          )
        `;
      } catch (notifErr) {
        console.error('Approval notification failed:', notifErr);
      }

      return NextResponse.json(result[0]);
    }

    // Rejection
    const result = await sql`
      UPDATE submissions
      SET review_status = ${status}, reviewed_at = NOW(), reviewed_by = ${users[0].id}
      WHERE id = ${submissionId}
      RETURNING *
    `;

    if (status === 'rejected' && result.length > 0) {
      try {
        await sql`
          INSERT INTO notifications (user_id, type, message, link, metadata)
          VALUES (
            ${sub.creator_id}, 'rejection',
            ${`Your submission on "${sub.track_title}" was rejected — check the artist's feedback`},
            '/earnings',
            ${JSON.stringify({ submission_id: submissionId })}
          )
        `;
      } catch (notifErr) {
        console.error('Rejection notification failed:', notifErr);
      }
    }

    return NextResponse.json(result[0]);
  } catch (e: any) {
    console.error('Review error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
