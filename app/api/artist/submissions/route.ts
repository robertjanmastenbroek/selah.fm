import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/artist/submissions
 * Returns all submissions for the artist's campaigns.
 * Authenticated — only the artist can see their own submissions.
 */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const submissions = await sql`
      SELECT s.id, s.content_url, s.platform, s.review_status, s.payout_status,
             s.views_verified, s.payout_amount_cents, s.submitted_at, s.created_at,
             s.creator_id, s.review_feedback,
             c.track_title, c.slug as campaign_slug,
             u.display_name as creator_name,
             u.profile_image_url as creator_avatar
      FROM submissions s
      JOIN campaigns c ON c.id = s.campaign_id
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      JOIN discovered_artists da ON da.id = cc.discovered_artist_id
      JOIN artist_profiles ap ON ap.artist_id = da.id
      LEFT JOIN users u ON u.id = s.creator_id
      WHERE ap.claimed_by_user_id = ${user.id}
      ORDER BY s.created_at DESC
      LIMIT 50
    `;

    // Unread count: submissions created in last 24h that are pending review
    const unread = submissions.filter((s: any) => {
      const age = Date.now() - new Date(s.created_at).getTime();
      return age < 24 * 60 * 60 * 1000 && s.review_status === 'pending';
    }).length;

    return NextResponse.json({ submissions, unread });
  } catch (e: any) {
    console.error('[artist/submissions] Error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * PATCH /api/artist/submissions
 * Review a submission — approve or reject with feedback.
 * Body: { submissionId, action: 'approve' | 'reject', feedback?: string, views_verified?: number }
 */
export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { submissionId, action, feedback, views_verified } = await req.json();
    if (!submissionId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request: submissionId and action required' }, { status: 400 });
    }

    // Verify the submission belongs to this artist
    const [sub] = await sql`
      SELECT s.id, s.campaign_id, s.creator_id, s.review_status, s.payout_amount_cents,
             s.views_verified, c.track_title, c.cpm_rate_cents, c.total_budget_cents,
             c.budget_remaining_cents
      FROM submissions s
      JOIN campaigns c ON c.id = s.campaign_id
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      JOIN discovered_artists da ON da.id = cc.discovered_artist_id
      JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE s.id = ${submissionId} AND ap.claimed_by_user_id = ${user.id}
    `;

    if (!sub) {
      return NextResponse.json({ error: 'Submission not found or not yours' }, { status: 404 });
    }

    if (sub.review_status !== 'pending') {
      return NextResponse.json({ error: 'Already reviewed' }, { status: 409 });
    }

    if (action === 'approve') {
      // Calculate payout: views * CPM / 1000
      const cpmCents = sub.cpm_rate_cents || 10;
      const views = views_verified || sub.views_verified || 0;
      const payoutCents = Math.round((views * cpmCents) / 1000);

      // Check remaining budget
      const remaining = sub.budget_remaining_cents || 0;
      if (payoutCents > remaining) {
        return NextResponse.json({
          error: `Not enough budget. Payout would be $${(payoutCents/100).toFixed(2)} but only $${(remaining/100).toFixed(2)} remaining`
        }, { status: 400 });
      }

      await sql`
        UPDATE submissions SET
          review_status = 'approved',
          review_feedback = ${feedback || null},
          payout_amount_cents = ${payoutCents},
          payout_status = 'processing',
          views_verified = ${views},
          reviewed_at = NOW()
        WHERE id = ${submissionId}
      `;

      // Deduct from budget
      await sql`
        UPDATE campaigns SET
          budget_remaining_cents = budget_remaining_cents - ${payoutCents},
          total_verified_views = (COALESCE(CAST(total_verified_views AS INTEGER), 0) + ${views})::text,
          approved_submissions = (COALESCE(CAST(approved_submissions AS INTEGER), 0) + 1)::text
        WHERE id = ${sub.campaign_id}
      `;

      // Add a notification for the creator
      await sql`
        INSERT INTO notifications (user_id, type, title, message, link_to)
        VALUES (${sub.creator_id}, 'submission_approved',
          'Submission approved!',
          ${`Your submission for "${sub.track_title}" was approved — $${(payoutCents/100).toFixed(2)} earned for ${views.toLocaleString()} verified views. Feedback: ${feedback || 'None'}`},
          ${`/artist/${user.id}/tracks/${sub.campaign_id}`}
        )
      `;

      return NextResponse.json({ ok: true, payout_cents: payoutCents, views, feedback });
    } else {
      // Reject
      await sql`
        UPDATE submissions SET
          review_status = 'rejected',
          review_feedback = ${feedback || null},
          reviewed_at = NOW()
        WHERE id = ${submissionId}
      `;

      // Notify the creator
      await sql`
        INSERT INTO notifications (user_id, type, title, message, link_to)
        VALUES (${sub.creator_id}, 'submission_rejected',
          'Submission not approved',
          ${`Your submission for "${sub.track_title}" was not approved.${feedback ? ' Feedback: ' + feedback : ''}`},
          ${`/artist/${user.id}/tracks/${sub.campaign_id}`}
        )
      `;

      return NextResponse.json({ ok: true, rejected: true, feedback });
    }
  } catch (e: any) {
    console.error('[artist/submissions] PATCH error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
