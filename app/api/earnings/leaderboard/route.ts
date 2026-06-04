import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/earnings/leaderboard?limit=50&search=name&period=month
 * Public leaderboard with period filters, streaks, and personal rank.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const search = searchParams.get('search') || '';
    const period = searchParams.get('period') || 'all'; // all, month, week

    // Date filter based on period
    let dateFilter = '';
    if (period === 'month') dateFilter = 'AND s.created_at > NOW() - INTERVAL \'30 days\'';
    else if (period === 'week') dateFilter = 'AND s.created_at > NOW() - INTERVAL \'7 days\'';

    const conditions = [`s.review_status = 'approved'`];
    const params: any[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`u.display_name ILIKE $${pIdx}`);
      params.push(`%${search}%`);
      pIdx++;
    }

    const whereClause = conditions.join(' AND ');

    // Main leaderboard query
    const entries = await sql.raw(`
      SELECT
        u.id AS user_id,
        u.display_name,
        u.profile_image_url,
        COUNT(s.id)::int AS submission_count,
        SUM(s.payout_amount_cents)::bigint AS total_earnings_cents,
        SUM(s.views_verified)::bigint AS total_views,
        MAX(c.track_title) AS top_track,
        MAX(da.artist_name) AS artist_name
      FROM submissions s
      JOIN users u ON u.id = s.creator_id
      JOIN campaigns c ON c.id = s.campaign_id
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      JOIN discovered_artists da ON da.id = cc.discovered_artist_id
      WHERE ${whereClause} ${dateFilter}
      GROUP BY u.id, u.display_name, u.profile_image_url
      ORDER BY SUM(s.payout_amount_cents) DESC
      LIMIT $${pIdx}
    `, [...params, limit]);

    // Get authenticated user's rank and stats
    let myRank = null;
    let myCents = 0;
    let myViews = 0;
    let totalCreators = 0;

    try {
      const user = await getUser();
      if (user) {
        const [myStats] = await sql.raw(`
          SELECT
            COUNT(s.id)::int AS submission_count,
            COALESCE(SUM(s.payout_amount_cents), 0)::bigint AS total_earnings_cents,
            COALESCE(SUM(s.views_verified), 0)::bigint AS total_views,
            (SELECT COUNT(DISTINCT s2.creator_id)::int FROM submissions s2 WHERE s2.review_status = 'approved') AS total_creators
          FROM submissions s
          WHERE s.creator_id = $1 AND s.review_status = 'approved'
        `, [user.id]);

        if (myStats) {
          myCents = parseInt(myStats.total_earnings_cents || '0');
          myViews = parseInt(myStats.total_views || '0');
          totalCreators = myStats.total_creators;

          // Calculate rank
          const [rankRow] = await sql.raw(`
            SELECT COUNT(*)::int + 1 AS rank
            FROM (
              SELECT s.creator_id, SUM(s.payout_amount_cents) AS total
              FROM submissions s
              WHERE s.review_status = 'approved'
              GROUP BY s.creator_id
              HAVING SUM(s.payout_amount_cents) > $1
            ) AS above_me
          `, [myCents]);

          myRank = rankRow ? rankRow.rank : null;
        }
      }
    } catch {}

    // Calculate streaks
    const streakData = entries.length > 0 ? await sql.raw(`
      SELECT user_id, MAX(daily.days) AS best_streak
      FROM (
        SELECT
          s.creator_id AS user_id,
          s.created_at::date,
          ROW_NUMBER() OVER (PARTITION BY s.creator_id ORDER BY s.created_at::date) -
            ROW_NUMBER() OVER (PARTITION BY s.creator_id, s.review_status ORDER BY s.created_at::date) AS days
        FROM submissions s
        WHERE s.review_status = 'approved'
      ) daily
      GROUP BY user_id
    `) : [];

    const streaks = new Map(streakData.map((s: any) => [s.user_id, s.best_streak]));

    // Map results
    const leaderboard = (entries || []).map((e: any, i: number) => ({
      rank: i + 1,
      user_id: e.user_id,
      display_name: e.display_name || 'Anonymous Creator',
      profile_image_url: e.profile_image_url || '',
      total_earnings_cents: parseInt(e.total_earnings_cents || '0'),
      total_views: parseInt(e.total_views || '0'),
      submission_count: parseInt(e.submission_count || '0'),
      track_name: e.top_track || '',
      artist_name: e.artist_name || '',
      best_streak: streaks.get(e.user_id) || 0,
    }));

    // Aggregate stats
    const [stats] = await sql.raw(`
      SELECT
        COALESCE(SUM(s.payout_amount_cents), 0)::bigint AS total_paid_cents,
        COALESCE(SUM(s.views_verified), 0)::bigint AS total_views,
        COUNT(DISTINCT s.creator_id)::int AS unique_creators
      FROM submissions s
      WHERE s.review_status = 'approved'
    `);

    return NextResponse.json({
      entries: leaderboard,
      stats: {
        total_paid_cents: parseInt(stats?.total_paid_cents || '0'),
        total_views: parseInt(stats?.total_views || '0'),
        unique_creators: stats?.unique_creators || 0,
      },
      myRank: myRank ? { rank: myRank, total_earnings_cents: myCents, total_views: myViews, total_creators: totalCreators } : null,
    });
  } catch (e: any) {
    console.error('Leaderboard error:', e.message);
    return NextResponse.json({ entries: [], stats: { total_paid_cents: 0, total_views: 0, unique_creators: 0 }, myRank: null });
  }
}
