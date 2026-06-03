import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/earnings/leaderboard?limit=50&search=name
 * Public leaderboard — returns top creators by total verified view earnings.
 * No auth required.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const search = searchParams.get('search') || '';

    const conditions: string[] = ['s.payout_status = \'paid\''];
    const params: any[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`u.display_name ILIKE $${pIdx}`);
      params.push(`%${search}%`);
      pIdx++;
    }

    const whereClause = conditions.join(' AND ');

    const entries = await sql.raw(`
      SELECT
        u.id AS user_id,
        u.display_name,
        COUNT(s.id)::int AS submission_count,
        SUM(s.payout_amount_cents)::bigint AS total_earnings_cents,
        SUM(s.views_verified)::bigint AS total_views,
        MAX(c.track_title) AS top_track,
        MAX(cpa.track_title) AS campaign_track
      FROM submissions s
      JOIN users u ON u.id = s.creator_id
      JOIN campaigns c ON c.id = s.campaign_id
      LEFT JOIN campaigns cpa ON cpa.id = s.campaign_id
      WHERE ${whereClause}
      GROUP BY u.id, u.display_name
      ORDER BY SUM(s.payout_amount_cents) DESC
      LIMIT $${pIdx}
    `, [...params, limit]);

    // Map to clean response format
    const leaderboard = (entries || []).map((e: any, i: number) => ({
      rank: i + 1,
      user_id: e.user_id,
      display_name: e.display_name || 'Anonymous Creator',
      total_earnings_cents: parseInt(e.total_earnings_cents || '0'),
      total_views: parseInt(e.total_views || '0'),
      campaign_count: parseInt(e.submission_count || '0'),
      track_name: e.campaign_track || e.top_track || '',
      artist_name: '',
    }));

    // Get aggregate stats
    const [stats] = await sql.raw(`
      SELECT
        COALESCE(SUM(s.payout_amount_cents), 0)::bigint AS total_paid_cents,
        COALESCE(SUM(s.views_verified), 0)::bigint AS total_views,
        COUNT(DISTINCT s.creator_id)::int AS unique_creators
      FROM submissions s
      WHERE s.payout_status = 'paid'
    `);

    return NextResponse.json({
      entries: leaderboard,
      stats: {
        total_paid_cents: parseInt(stats?.total_paid_cents || '0'),
        total_views: parseInt(stats?.total_views || '0'),
        unique_creators: stats?.unique_creators || 0,
      },
    });
  } catch (e: any) {
    console.error('Leaderboard error:', e.message);
    return NextResponse.json({ entries: [], stats: { total_paid_cents: 0, total_views: 0, unique_creators: 0 } });
  }
}
