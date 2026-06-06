/**
 * /api/tracks — Browse all tracks with pagination, search, genre filter
 * Returns tracks with artist info, cover art, and track details.
 */
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || searchParams.get('q') || '';
    const genre = searchParams.get('genre') || '';
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'));
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const sort = searchParams.get('sort') || 'popular';

    // Build WHERE conditions
    const conditions: string[] = ['at.enabled = true'];
    const params: any[] = [];
    let p = (v: any) => { params.push(v); return params.length; };

    if (search) {
      conditions.push(`(at.title ILIKE '%' || $${p(search)} || '%' OR da.artist_name ILIKE '%' || $${p(search)} || '%')`);
    }

    if (genre) {
      conditions.push(`(da.genres::text ILIKE '%' || $${p(genre)} || '%')`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sort
    let orderClause = 'at.created_at DESC';
    if (sort === 'popular') orderClause = 'da.monthly_listeners DESC NULLS LAST, at.created_at DESC';
    else if (sort === 'name') orderClause = 'at.title ASC';
    else if (sort === 'newest') orderClause = 'at.created_at DESC';

    const limitIdx = p(limit);
    const offsetIdx = p(offset);

    const tracks = await sql.raw(`
      SELECT at.id, at.title, at.cover_art_url, at.cpm_rate_cents, at.created_at,
             da.id as artist_id, da.artist_name, da.genres, da.monthly_listeners,
             ap.slug as artist_slug, ap.spotify_image_url as artist_image,
             ap.total_followers
      FROM artist_tracks at
      JOIN discovered_artists da ON da.id = at.artist_id
      LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
      ${whereClause}
      ORDER BY ${orderClause}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `, params);

    const [countResult] = await sql.raw(`
      SELECT COUNT(*)::int as total
      FROM artist_tracks at
      JOIN discovered_artists da ON da.id = at.artist_id
      ${whereClause}
    `, params);

    const response = NextResponse.json({
      tracks,
      total: countResult?.total || 0,
      offset,
      limit,
    });

    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e.message, tracks: [], total: 0 }, { status: 500 });
  }
}
