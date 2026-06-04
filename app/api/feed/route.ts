import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/feed?limit=20
 * Returns chronological feed of activity from followed users.
 * Requires authentication.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  try {
    // Get followed artist IDs
    const follows = await sql`
      SELECT discovered_artist_id FROM artist_follows WHERE user_id = ${user.id}
    `;
    const followedIds = follows.map((f: any) => f.discovered_artist_id);

    if (followedIds.length === 0) {
      return NextResponse.json({ feed: [], following: 0 });
    }

    // Get recent submissions from followed artists
    const submissions = await sql`
      SELECT 
        s.id, 'submission' as type,
        c.track_title,
        da.artist_name,
        ap.slug as artist_slug,
        s.views_verified,
        s.platform,
        s.created_at
      FROM submissions s
      JOIN campaigns c ON c.id = s.campaign_id
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      JOIN discovered_artists da ON da.id = cc.discovered_artist_id
      JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE cc.discovered_artist_id = ANY(${followedIds})
        AND s.review_status = 'approved'
      ORDER BY s.created_at DESC
      LIMIT ${limit}
    `;

    // Get new campaigns from followed artists
    const campaigns = await sql`
      SELECT 
        c.id, 'campaign' as type,
        c.track_title as title,
        COALESCE(da.artist_name, u.display_name) as artist_name,
        ap.slug as artist_slug,
        c.total_budget_cents,
        c.created_at
      FROM campaigns c
      JOIN users u ON u.id = c.artist_id
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      JOIN discovered_artists da ON da.id = cc.discovered_artist_id
      JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE cc.discovered_artist_id = ANY(${followedIds})
        AND c.status = 'active'
      ORDER BY c.created_at DESC
      LIMIT ${limit}
    `;

    // Merge and sort by created_at DESC
    const feed = [...submissions, ...campaigns]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    return NextResponse.json({
      feed,
      following: followedIds.length,
    });
  } catch (e: any) {
    console.error('Feed error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
