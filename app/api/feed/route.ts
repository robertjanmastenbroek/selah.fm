import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/feed?limit=20
 * Returns chronological feed of activity from followed users.
 * Requires authentication.
 * Uses a single UNION query to avoid N+1.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  try {
    // Single UNION query: submissions + campaigns from followed artists
    const feed = await sql`
      WITH followed AS (
        SELECT discovered_artist_id FROM artist_follows WHERE user_id = ${user.id}
      ),
      feed_items AS (
        SELECT 
          s.id, 'submission' as type,
          c.track_title,
          da.artist_name,
          ap.slug as artist_slug,
          s.views_verified::text as metric,
          s.platform as detail,
          s.created_at
        FROM submissions s
        JOIN campaigns c ON c.id = s.campaign_id
        JOIN campaign_claims cc ON cc.campaign_id = c.id
        JOIN discovered_artists da ON da.id = cc.discovered_artist_id
        JOIN artist_profiles ap ON ap.artist_id = da.id
        WHERE cc.discovered_artist_id IN (SELECT discovered_artist_id FROM followed)
          AND s.review_status = 'approved'
        UNION ALL
        SELECT 
          c.id, 'campaign' as type,
          c.track_title,
          COALESCE(da.artist_name, u.display_name),
          ap.slug,
          c.total_budget_cents::text as metric,
          c.status as detail,
          c.created_at
        FROM campaigns c
        JOIN users u ON u.id = c.artist_id
        JOIN campaign_claims cc ON cc.campaign_id = c.id
        JOIN discovered_artists da ON da.id = cc.discovered_artist_id
        JOIN artist_profiles ap ON ap.artist_id = da.id
        WHERE cc.discovered_artist_id IN (SELECT discovered_artist_id FROM followed)
          AND c.status = 'active'
      )
      SELECT * FROM feed_items
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    // Get follower count
    const [{ count }] = await sql`
      SELECT COUNT(*)::int as count FROM artist_follows WHERE user_id = ${user.id}
    `;

    return NextResponse.json({
      feed,
      following: count || 0,
    });
  } catch (e: any) {
    console.error('Feed error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
