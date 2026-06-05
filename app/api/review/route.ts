import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { trackApproveSubmission } from '@/lib/analytics-server';
import { ADMIN_EMAILS } from '@/lib/constants';

export async function POST(request: Request) {
  const { rateLimit, getRateLimitKey } = await import('@/lib/rate-limit');
  const rl = await rateLimit(getRateLimitKey(request), { maxRequests: 30, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });

  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { submissionId, status, feedback } = await request.json();
    
    // Require minimum 20-char feedback for both approval and rejection
    if (!feedback || feedback.trim().length < 20) {
      return NextResponse.json({ error: 'Feedback must be at least 20 characters' }, { status: 400 });
    }
    
    // Verify the submission exists and get campaign ownership
    const subs = await sql`
      SELECT s.id, s.campaign_id, s.creator_id, s.content_url, s.views_verified, s.payout_amount_cents,
             c.artist_id, c.cpm_rate_cents, c.max_payout_per_submission_cents, c.track_title, c.budget_remaining_cents, c.status as campaign_status
      FROM submissions s
      JOIN campaigns c ON c.id = s.campaign_id
      WHERE s.id = ${submissionId}
    `;

    if (subs.length === 0) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = subs[0];

    // Ownership check: campaign artist OR admin can review
    const isAdmin = ADMIN_EMAILS.includes(session.email || '');
    if (sub.artist_id !== session.id && !isAdmin) {
      return NextResponse.json({ error: 'You can only review submissions on your own campaigns' }, { status: 403 });
    }

    // If undoing (setting back to pending), restore full artist charge to budget
    // payout_amount_cents is the creator's full earnings (no fee deduction).
    // Artist was charged 1.20x that amount (CPM + 20% platform fee).
    if (status === 'pending' && sub.payout_amount_cents && sub.payout_amount_cents > 0) {
      const artistChargeCents = Math.round(sub.payout_amount_cents * 1.20);
      await sql`
        UPDATE campaigns
        SET budget_remaining_cents = budget_remaining_cents + ${artistChargeCents},
            updated_at = NOW()
        WHERE id = ${sub.campaign_id}
      `;
    }

    // If approving, calculate payout
    if (status === 'approved') {
      const MIN_PAYOUT_CENTS = 500; // $5 minimum payout per submission
      const views = parseInt(sub.views_verified || '0');
      let grossCents = Math.round((views / 1000) * sub.cpm_rate_cents);
      
      // Apply max payout cap
      if (sub.max_payout_per_submission_cents && grossCents > sub.max_payout_per_submission_cents) {
        grossCents = sub.max_payout_per_submission_cents;
      }
      
      // Enforce $5 minimum payout
      if (grossCents < MIN_PAYOUT_CENTS) {
        return NextResponse.json({
          error: `Payout would be $${(grossCents / 100).toFixed(2)}. Minimum payout is $5.00. This submission needs more views to qualify.`
        }, { status: 400 });
      }

      // Creator earns the FULL CPM amount (no 20% deduction).
      // Artist is charged 1.20x = CPM + 20% platform fee.
      const creatorEarnsCents = grossCents;
      const artistChargeCents = Math.round(grossCents * 1.20);

      // Check budget remaining against the artist's charge (CPM + fee)
      // Skip budget check for $0-budget campaigns (auto-generated, pre-funded externally)
      if (sub.budget_remaining_cents > 0 && sub.budget_remaining_cents < artistChargeCents) {
        return NextResponse.json({ 
          error: `Insufficient budget. Remaining: $${(sub.budget_remaining_cents / 100).toFixed(2)}, needed: $${(artistChargeCents / 100).toFixed(2)}` 
        }, { status: 400 });
      }

      // Deduct full artist charge from campaign budget (skip for $0-budget campaigns)
      if (sub.budget_remaining_cents > 0) {
        await sql`
          UPDATE campaigns
          SET budget_remaining_cents = budget_remaining_cents - ${artistChargeCents},
              updated_at = NOW()
          WHERE id = ${sub.campaign_id}
        `;
      }

      const result = await sql`
        UPDATE submissions
        SET review_status = 'approved', reviewed_at = NOW(), reviewed_by = ${session.id},
            payout_amount_cents = ${creatorEarnsCents}, payout_status = 'processing'
        WHERE id = ${submissionId}
        RETURNING *
      `;

      // Structured side-effects: notify creator, process payout, track analytics
      // All fire-and-forget: failures are logged but don't break the main response
      const earningsDollars = (creatorEarnsCents / 100).toFixed(2);
      let payoutNote: string | null = null;

      // 1. Create notification (fire-and-forget with logging)
      sql`
        INSERT INTO notifications (user_id, type, message, link, metadata)
        VALUES (
          ${sub.creator_id}, 'approval',
          ${`Your submission on "${sub.track_title}" was approved — $${earningsDollars} earned (${views.toLocaleString()} views)`},
          '/earnings',
          ${JSON.stringify({ submission_id: submissionId, amount_cents: creatorEarnsCents })}
        )
      `.catch((e: any) => console.error('[review] Notification failed:', e.message));

      // 2. Attempt auto-payout via Stripe (fire-and-forget with logging)
      (async () => {
        try {
          const payoutRes = await fetch(`${process.env.NEXTAUTH_URL || 'https://selah.fm'}/api/stripe/payout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submissionId }),
          });
          if (!payoutRes.ok) {
            const payoutErr = await payoutRes.json().catch(() => ({ error: 'Unknown' }));
            payoutNote = payoutErr.error || 'Payout deferred';
            if (payoutErr.error?.includes('Stripe onboarding') || payoutErr.error?.includes('not completed')) {
              const creatorData = await sql`SELECT email, display_name FROM users WHERE id = ${sub.creator_id}`;
              if (creatorData.length > 0 && creatorData[0].email) {
                fetch(`${process.env.NEXTAUTH_URL || 'https://selah.fm'}/api/email/send`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    to: creatorData[0].email,
                    subject: `$${earningsDollars} earned — complete your payout setup`,
                    html: `<h2>You earned $${earningsDollars} on Selah.fm!</h2><p>Hi ${creatorData[0].display_name || 'Creator'},</p><p>Your video was approved and you've earned <strong>$${earningsDollars}</strong>. To receive your payout, you need to connect your bank account (takes 2 minutes).</p><p><a href="https://selah.fm/earnings" style="display:inline-block;padding:12px 24px;background:#4338CA;color:white;border-radius:8px;text-decoration:none;font-weight:600;">Set up payouts →</a></p><p style="color:#888;font-size:13px;">Payouts are processed within 2-3 business days after setup. Works in 40+ countries.</p>`,
                  }),
                }).catch((e: any) => console.error('[review] Payout setup email failed:', e.message));
              }
            }
          } else {
            payoutNote = 'Payout processing';
          }
        } catch (e: any) {
          payoutNote = 'Payout endpoint unreachable';
          console.error('[review] Payout fetch failed:', e.message);
        }
      })();

      // 3. GA tracking (fire-and-forget)
      trackApproveSubmission(session.id).catch((e: any) => console.error('[review] Analytics failed:', e.message));

      const responseData = { ...result[0], payout_note: payoutNote };
      return NextResponse.json(responseData);
    }

    // Rejection
    const result = await sql`
      UPDATE submissions
      SET review_status = ${status}, reviewed_at = NOW(), reviewed_by = ${session.id},
          rejection_reason = ${feedback || null}
      WHERE id = ${submissionId}
      RETURNING *
    `;

    if (status === 'rejected' && result.length > 0) {
      const feedbackMsg = feedback ? `Reason: "${feedback}"` : 'No specific reason given.';
      sql`
        INSERT INTO notifications (user_id, type, message, link, metadata)
        VALUES (
          ${sub.creator_id}, 'rejection',
          ${`Your submission on "${sub.track_title}" was rejected. ${feedbackMsg}`},
          '/earnings',
          ${JSON.stringify({ submission_id: submissionId, feedback })}
        )
      `.catch((e: any) => console.error('[review] Rejection notification failed:', e.message));
    }

    return NextResponse.json(result[0]);
  } catch (e: any) {
    console.error('Review error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
