import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/discover?limit=20
 * Returns trending submissions — most-viewed approved submissions from last 7 days.
 */
export async function GET(request: Request) {
  const { rateLimit, getRateLimitKey } = await import('@/lib/rate-limit');
  const rl = await rateLimit(getRateLimitKey(request), { maxRequests: 30, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  try {
    const submissions = await sql`
      SELECT 
        s.id,
        s.views_verified,
        s.platform,
        s.created_at,
        c.track_title,
        c.cover_art_url,
        COALESCE(da.artist_name, u.display_name) as artist_name,
        ap.slug as artist_slug,
        c.slug as campaign_slug,
        c.id as campaign_id
      FROM submissions s
      JOIN campaigns c ON c.id = s.campaign_id
      LEFT JOIN users u ON u.id = c.artist_id
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      JOIN discovered_artists da ON da.id = cc.discovered_artist_id
      JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE s.review_status = 'approved'
        AND s.created_at > NOW() - INTERVAL '30 days'
      ORDER BY s.views_verified DESC NULLS LAST
      LIMIT ${limit}
    `;

    const response = NextResponse.json({ submissions });
    // Cache for 60s — trending data is updated every few hours
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;
  } catch (e: any) {
    console.error('Discover error:', e.message);
    return NextResponse.json({ error: 'Failed to load trending submissions' }, { status: 500 });
  }
}
