import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const runtime = 'nodejs';

/**
 * GET /api/admin/community/stats
 * Returns aggregate community metrics for the admin dashboard.
 */
export async function GET(request: Request) {
  try {
    // Admin check
    const cookies = request.headers.get('cookie') || '';
    const sessionMatch = cookies.match(/sb-[^=]+=([^;]+)/);
    if (!sessionMatch) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const [user] = await sql`SELECT email FROM auth.users WHERE id::text = ${sessionMatch[1]} LIMIT 1`;
    if (!user || user.email !== 'motomotosings@gmail.com') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Total feedback
    const [feedbackStats] = await sql`
      SELECT COUNT(*)::int as total,
             COALESCE(AVG(CASE WHEN helpful THEN 100 ELSE 0 END), 0)::int as helpful_pct
      FROM artist_feedback
    `;

    // Total edit suggestions with status breakdown
    const [editStats] = await sql`
      SELECT COUNT(*)::int as total,
             COALESCE(SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END), 0)::int as approved,
             COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0)::int as rejected
      FROM artist_edit_suggestions
    `;

    // Average moderation time (approved/rejected suggestions)
    const [modStats] = await sql`
      SELECT COALESCE(
        EXTRACT(EPOCH FROM AVG(updated_at - created_at)) / 3600, 0
      )::int as avg_hours
      FROM artist_edit_suggestions
      WHERE status IN ('approved', 'rejected')
        AND updated_at IS NOT NULL
    `;

    // Top contributors (users with most approved edits)
    const [contributorStats] = await sql`
      SELECT COUNT(DISTINCT user_id)::int as total
      FROM artist_edit_suggestions
      WHERE status = 'approved' AND user_id IS NOT NULL
    `;

    const approvalRate = editStats.total > 0
      ? Math.round((editStats.approved / editStats.total) * 100)
      : 0;

    return NextResponse.json({
      totalFeedback: feedbackStats?.total || 0,
      helpfulPercent: feedbackStats?.helpful_pct || 0,
      totalEdits: editStats?.total || 0,
      approvalRate,
      avgModerationHours: modStats?.avg_hours || 0,
      topContributors: contributorStats?.total || 0,
    });
  } catch (e: any) {
    console.error('[ADMIN COMMUNITY STATS] Error:', e.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
