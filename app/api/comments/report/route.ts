import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/comments/report
 * Body: { commentId, reason }
 * Reports a comment for moderation.
 */
export async function POST(request: Request) {
  try {
    const user = await getUser();
    const { rateLimit, getRateLimitKey } = await import('@/lib/rate-limit');
    const rl = await rateLimit(getRateLimitKey(request), { maxRequests: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const { commentId, reason } = body;

    if (!commentId) {
      return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
    }
    if (!['spam', 'harassment', 'inappropriate', 'other'].includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
    }

    // Check comment exists
    const [comment] = await sql`SELECT id FROM page_comments WHERE id = ${commentId}`;
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Upsert report (unique per comment + user)
    await sql`
      INSERT INTO comment_reports (comment_id, reporter_id, reason)
      VALUES (${commentId}, ${user?.id || null}, ${reason})
      ON CONFLICT (comment_id, reporter_id) DO UPDATE SET reason = ${reason}
    `;

    // Update report count
    const [{ count }] = await sql`
      SELECT COUNT(*)::int as count FROM comment_reports WHERE comment_id = ${commentId}
    `;
    await sql`UPDATE page_comments SET report_count = ${count} WHERE id = ${commentId}`;

    return NextResponse.json({ reported: true, report_count: count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
