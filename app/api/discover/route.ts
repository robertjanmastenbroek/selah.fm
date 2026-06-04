import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/discover?limit=20
 * Returns trending submissions — most-viewed approved submissions from last 7 days.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  try {
    const submissions = await sql`
      SELECT 
        s.id,
        s.views_verified,
        s.platform,
        s.created_at,
        at.title as track_title,
        at.cover_art_url,
        da.artist_name,
        ap.slug as artist_slug,
        at.id as track_id
      FROM submissions s
      JOIN campaigns c ON c.id = s.campaign_id
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      JOIN discovered_artists da ON da.id = cc.discovered_artist_id
      JOIN artist_profiles ap ON ap.artist_id = da.id
      LEFT JOIN artist_tracks at ON at.artist_id = ap.id
      WHERE s.review_status = 'approved'
        AND s.created_at > NOW() - INTERVAL '7 days'
      ORDER BY s.views_verified DESC NULLS LAST
      LIMIT ${limit}
    `;

    return NextResponse.json({ submissions });
  } catch (e: any) {
    console.error('Discover error:', e.message);
    return NextResponse.json({ submissions: [] });
  }
}
