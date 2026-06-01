import { NextResponse } from 'next/server';
import sql from '@/lib/db';

/**
 * GET /api/artists
 * Returns all artists from discovered_artists + registered users.
 * ?search=name — filter by name
 * ?offset=0&limit=50 — pagination
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    let query;
    if (search) {
      query = sql`
        SELECT da.artist_name as display_name, da.latest_track_name, ap.slug, ap.spotify_image_url, ap.total_followers, ap.total_platforms,
               COALESCE(ap.total_followers, 0) as sort_score
        FROM artist_profiles ap
        JOIN discovered_artists da ON da.id = ap.artist_id
        WHERE da.artist_name ILIKE ${'%' + search + '%'}
        ORDER BY ap.total_followers DESC NULLS LAST
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      query = sql`
        SELECT da.artist_name as display_name, da.latest_track_name, ap.slug, ap.spotify_image_url, ap.total_followers, ap.total_platforms,
               COALESCE(ap.total_followers, 0) as sort_score
        FROM artist_profiles ap
        JOIN discovered_artists da ON da.id = ap.artist_id
        ORDER BY ap.total_followers DESC NULLS LAST
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const artists = await query;

    // Count total
    let totalQuery;
    if (search) {
      const [{ count }] = await sql`
        SELECT COUNT(*)::int FROM artist_profiles ap
        JOIN discovered_artists da ON da.id = ap.artist_id
        WHERE da.artist_name ILIKE ${'%' + search + '%'}
      `;
      return NextResponse.json({ artists, total: count, offset, limit });
    } else {
      const [{ count }] = await sql`SELECT COUNT(*)::int FROM artist_profiles`;
      return NextResponse.json({ artists, total: count, offset, limit });
    }
  } catch (e: any) {
    return NextResponse.json({ artists: [], total: 0, error: e.message });
  }
}
