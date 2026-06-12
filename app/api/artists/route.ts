import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/artists?genre=electronic&sort=popular&page=1&limit=20&search=name
 * Returns paginated artist list with track counts from artist_tracks.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre') || '';
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let p = (v: any, idx?: number) => { 
      if (idx !== undefined) { params[idx] = v; return idx + 1; }
      params.push(v); return params.length; 
    };

    // Show all artists with a profile. Use gradient fallbacks for missing images.
    conditions.push('ap.slug IS NOT NULL');
    if (!search) {
      // Prefer artists with tracks when not searching, but don't exclude trackless artists
      // Remove the Spotify image filter — gradient fallbacks handle missing images
    }

    if (genre) {
      conditions.push(`da.genres::text ILIKE $${p('%' + genre + '%')}`);
    }

    if (search) {
      conditions.push(`da.artist_name ILIKE $${p('%' + search + '%')}`);
    }

    let orderBy: string;
    switch (sort) {
      case 'newest':
        orderBy = 'MAX(at.created_at) DESC NULLS LAST';
        break;
      case 'name':
        orderBy = 'da.artist_name ASC';
        break;
      case 'listeners':
        orderBy = 'COALESCE(da.monthly_listeners, 0) DESC NULLS LAST';
        break;
      default:
        orderBy = 'COUNT(at.id) DESC, COALESCE(da.monthly_listeners, 0) DESC NULLS LAST';
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const limitIdx = p(limit);
    const offsetIdx = p(offset);

    const query = `
      SELECT da.id, da.artist_name, da.genres, da.monthly_listeners,
             ap.slug, ap.spotify_image_url, ap.total_followers,
             COUNT(at.id)::int as track_count
      FROM discovered_artists da
      LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
      LEFT JOIN artist_tracks at ON at.artist_id = da.id AND at.enabled = true
      ${whereClause}
      GROUP BY da.id, ap.slug, ap.spotify_image_url, ap.total_followers
      ORDER BY ${orderBy}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const artists = await sql.raw(query, params);

    // Total count
    const countParams: any[] = [];
    const countConditions: string[] = ['ap.slug IS NOT NULL'];
    let cp = (v: any) => { countParams.push(v); return countParams.length; };
    if (genre) { countConditions.push(`da.genres::text ILIKE $${cp('%' + genre + '%')}`); }
    if (search) { countConditions.push(`da.artist_name ILIKE $${cp('%' + search + '%')}`); }
    const countWhere = countConditions.join(' AND ');

    const [{ total }] = await sql.raw(`
      SELECT COUNT(*)::int as total FROM discovered_artists da
      JOIN artist_profiles ap ON ap.artist_id = da.id
      ${countWhere ? 'WHERE ' + countWhere : ''}
    `, countParams);

    return NextResponse.json({ artists, total: total || 0, page, limit });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
