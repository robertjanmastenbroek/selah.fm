import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';
import { ADMIN_EMAILS } from '@/lib/constants';

/**
 * POST /api/submissions/[id]/dispute — Creator disputes a rejection
 * GET /api/submissions/[id]/dispute — Admin resolves a dispute
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Rate limit
  const { rateLimit, getRateLimitKey } = await import('@/lib/rate-limit');
  const rl = await rateLimit(getRateLimitKey(request), { maxRequests: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });
  }

  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const submissionId = params.id;
    const { reason } = await request.json();

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json({ error: 'Please provide a detailed reason for your dispute (min 10 characters)' }, { status: 400 });
    }

    // Verify the submission exists and belongs to this creator
    const subs = await sql`
      SELECT s.id, s.creator_id, s.review_status, s.rejection_reason,
             s.dispute_status, c.track_title
      FROM submissions s
      JOIN campaigns c ON c.id = s.campaign_id
      WHERE s.id = ${submissionId}
    `;

    if (subs.length === 0) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = subs[0];

    // Only the creator who submitted can dispute
    if (sub.creator_id !== user.id) {
      return NextResponse.json({ error: 'Only the submission creator can dispute' }, { status: 403 });
    }

    // Can only dispute rejected submissions
    if (sub.review_status !== 'rejected') {
      return NextResponse.json({ error: 'Can only dispute rejected submissions' }, { status: 400 });
    }

    // Check for existing dispute
    if (sub.dispute_status === 'pending' || sub.dispute_status === 'under_review') {
      return NextResponse.json({ error: 'A dispute is already in progress for this submission' }, { status: 400 });
    }

    // Create dispute
    await sql`
      UPDATE submissions SET
        dispute_reason = ${reason.trim()},
        dispute_status = 'pending',
        disputed_at = NOW()
      WHERE id = ${submissionId}
    `;

    // Notify admin
    const adminEmail = ADMIN_EMAILS[0] || 'motomotosings@gmail.com';
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: 'Selah.fm <info@selah.fm>',
          to: [adminEmail],
          subject: `Dispute filed for submission on "${sub.track_title}"`,
          html: `
            <h2>New Dispute</h2>
            <p>A creator has disputed a rejection on <strong>"${sub.track_title}"</strong>.</p>
            <p><strong>Original rejection reason:</strong> ${sub.rejection_reason || 'None provided'}</p>
            <p><strong>Creator's dispute reason:</strong> ${reason}</p>
            <p><a href="https://selah.fm/admin/disputes" style="display:inline-block;padding:12px 24px;background:#4338CA;color:white;border-radius:8px;text-decoration:none;">Review dispute →</a></p>
          `,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      message: 'Dispute filed. An admin will review it shortly.',
      dispute_status: 'pending',
    });
  } catch (e: any) {
    console.error('Dispute error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * GET /api/submissions/[id]/dispute?action=resolve — Admin resolves a dispute
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const isAdmin = ADMIN_EMAILS.includes(user.email || '');
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const resolution = searchParams.get('resolution');

  try {
    const submissionId = params.id;
    const subs = await sql`
      SELECT s.id, s.dispute_status, s.dispute_reason, s.review_status,
             s.rejection_reason, s.creator_id, s.content_url,
             c.track_title, c.artist_id
      FROM submissions s
      JOIN campaigns c ON c.id = s.campaign_id
      WHERE s.id = ${submissionId}
    `;

    if (subs.length === 0) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = subs[0];

    if (action === 'resolve') {
      if (sub.dispute_status !== 'pending' && sub.dispute_status !== 'under_review') {
        return NextResponse.json({ error: 'No active dispute on this submission' }, { status: 400 });
      }

      // Resolve in favor of creator: approve the submission
      await sql`
        UPDATE submissions SET
          dispute_status = 'resolved',
          dispute_resolved_at = NOW(),
          dispute_resolution = ${resolution || 'Resolved in favor of creator'},
          review_status = 'approved'
        WHERE id = ${submissionId}
      `;

      // Notify creator
      await sql`
        INSERT INTO notifications (user_id, type, message, link)
        VALUES (${sub.creator_id}, 'approval',
          ${`Your dispute on "${sub.track_title}" was resolved — submission approved!`},
          '/earnings')
      `;

      return NextResponse.json({
        ok: true,
        message: 'Dispute resolved. Submission approved.',
        resolution: 'approved',
      });
    }

    if (action === 'reject') {
      if (sub.dispute_status !== 'pending' && sub.dispute_status !== 'under_review') {
        return NextResponse.json({ error: 'No active dispute on this submission' }, { status: 400 });
      }

      await sql`
        UPDATE submissions SET
          dispute_status = 'rejected',
          dispute_resolved_at = NOW(),
          dispute_resolution = ${resolution || 'Dispute rejected — original decision stands'}
        WHERE id = ${submissionId}
      `;

      await sql`
        INSERT INTO notifications (user_id, type, message, link)
        VALUES (${sub.creator_id}, 'rejection',
          ${`Your dispute on "${sub.track_title}" was reviewed and the original decision stands.`},
          '/earnings')
      `;

      return NextResponse.json({
        ok: true,
        message: 'Dispute rejected. Original decision stands.',
        resolution: 'rejected',
      });
    }

    // Return dispute info for admin review UI
    return NextResponse.json({
      submission_id: sub.id,
      track_title: sub.track_title,
      rejection_reason: sub.rejection_reason,
      dispute_reason: sub.dispute_reason,
      dispute_status: sub.dispute_status,
      disputed_at: sub.disputed_at,
      content_url: sub.content_url,
    });
  } catch (e: any) {
    console.error('Dispute admin error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
