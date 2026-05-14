import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { trackApproveSubmission } from '@/lib/analytics-server';

export async function POST(request: Request) {
  const { rateLimit, getRateLimitKey } = await import('@/lib/rate-limit');
  const rl = rateLimit(getRateLimitKey(request), { maxRequests: 30, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });

  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { submissionId, status, feedback } = await request.json();
    
    // Verify the submission exists and get campaign ownership
    const subs = await sql`
      SELECT s.id, s.campaign_id, s.creator_id, s.views_verified, s.payout_amount_cents,
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
    if (sub.artist_id !== session.id) {
      return NextResponse.json({ error: 'You can only review submissions on your own campaigns' }, { status: 403 });
    }

    // If undoing (setting back to pending), restore gross amount to budget
    if (status === 'pending' && sub.payout_amount_cents && sub.payout_amount_cents > 0) {
      // payout_amount_cents is net (creator's 80% share). Restore gross = net / 0.8
      const grossRestore = Math.round(sub.payout_amount_cents / 0.8);
      await sql`
        UPDATE campaigns
        SET budget_remaining_cents = budget_remaining_cents + ${grossRestore},
            updated_at = NOW()
        WHERE id = ${sub.campaign_id}
      `;
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

      // Check budget remaining (use gross, not net — campaign pays full amount)
      if (sub.budget_remaining_cents < grossCents) {
        return NextResponse.json({ 
          error: `Insufficient budget. Remaining: $${(sub.budget_remaining_cents / 100).toFixed(2)}, payout: $${(grossCents / 100).toFixed(2)}` 
        }, { status: 400 });
      }

      // Deduct gross from campaign budget (platform fee is taken from gross)
      await sql`
        UPDATE campaigns
        SET budget_remaining_cents = budget_remaining_cents - ${grossCents},
            updated_at = NOW()
        WHERE id = ${sub.campaign_id}
      `;

      const result = await sql`
        UPDATE submissions
        SET review_status = 'approved', reviewed_at = NOW(), reviewed_by = ${session.id},
            payout_amount_cents = ${netCents}, payout_status = 'processing'
        WHERE id = ${submissionId}
        RETURNING *
      `;

      // Notify the creator + send email
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
        const creatorData = await sql`SELECT email, display_name FROM users WHERE id = ${sub.creator_id}`;
        if (creatorData.length > 0) {
          // Creator notified via NotificationBell above. Welcome emails handled via info@selah.fm
        }
      } catch {}

      // Attempt auto-payout via Stripe
      try {
        const payoutRes = await fetch(`${process.env.NEXTAUTH_URL || 'https://selah.fm'}/api/stripe/payout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId }),
        });
        if (!payoutRes.ok) {
          console.log('Auto-payout deferred — creator may need to set up Stripe Connect');
        }
      } catch (payoutErr) {
        console.log('Auto-payout attempt failed (non-critical):', payoutErr);
      }

      // Server-side GA tracking
      trackApproveSubmission(session.id).catch(() => {});

      return NextResponse.json(result[0]);
    }

    // Rejection
    const result = await sql`
      UPDATE submissions
      SET review_status = ${status}, reviewed_at = NOW(), reviewed_by = ${session.id},
          rejection_feedback = ${feedback || null}
      WHERE id = ${submissionId}
      RETURNING *
    `;

    if (status === 'rejected' && result.length > 0) {
      const feedbackMsg = feedback ? `Reason: "${feedback}"` : 'No specific reason given.';
      try {
        await sql`
          INSERT INTO notifications (user_id, type, message, link, metadata)
          VALUES (
            ${sub.creator_id}, 'rejection',
            ${`Your submission on "${sub.track_title}" was rejected. ${feedbackMsg}`},
            '/earnings',
            ${JSON.stringify({ submission_id: submissionId, feedback })}
          )
        `;
        const creatorData = await sql`SELECT email, display_name FROM users WHERE id = ${sub.creator_id}`;
        if (creatorData.length > 0) {
          // Creator notified via NotificationBell above. Rejection emails handled via info@selah.fm
        }
      } catch {}
    }

    return NextResponse.json(result[0]);
  } catch (e: any) {
    console.error('Review error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
