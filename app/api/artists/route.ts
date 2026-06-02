import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/artists?genre=electronic&sort=popular&page=1&limit=20&search=name
 * Returns paginated artist list with track counts for browsing.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre') || '';
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'popular';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    const conditions: string[] = ['c.status IN ($1)'];
    const params: any[] = [['active', 'draft']];
    let p = (v: any) => { params.push(v); return params.length; };

    // We need artists that have at least one active campaign
    // Filter by genre on discovered_artists
    if (genre) {
      conditions.push(`da.genres::text ILIKE $${p('%' + genre + '%')}`);
    }

    // Search by artist name
    if (search) {
      conditions.push(`da.artist_name ILIKE $${p('%' + search + '%')}`);
    }

    // Sort order
    let orderBy: string;
    switch (sort) {
      case 'newest':
        orderBy = 'MAX(c.created_at) DESC NULLS LAST';
        break;
      case 'name':
        orderBy = 'da.artist_name ASC';
        break;
      case 'listeners':
        orderBy = 'COALESCE(da.monthly_listeners, 0) DESC NULLS LAST';
        break;
      default: // popular
        orderBy = 'COUNT(DISTINCT c.id) DESC, COALESCE(da.monthly_listeners, 0) DESC NULLS LAST';
    }

    const whereClause = conditions.join(' AND ');
    const limitIdx = p(limit);
    const offsetIdx = p(offset);

    const query = `
      SELECT da.id, da.artist_name, da.genres, da.monthly_listeners,
             ap.slug, ap.spotify_image_url, ap.total_followers,
             COUNT(DISTINCT c.id)::int as track_count,
             COALESCE(SUM(v.total_verified_views::int), 0)::int as total_views,
             COALESCE(SUM(v.approved_submissions::int), 0)::int as total_submissions
      FROM discovered_artists da
      LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
      JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
      JOIN campaigns c ON c.id = cc.campaign_id
      LEFT JOIN campaign_stats v ON v.id = c.id
      WHERE ${whereClause}
      GROUP BY da.id, ap.slug, ap.spotify_image_url, ap.total_followers
      ORDER BY ${orderBy}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const artists = await sql.raw(query, params);

    // Total count
    const [totalRow] = await sql.raw(`
      SELECT COUNT(DISTINCT da.id)::int as total FROM discovered_artists da
      JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
      JOIN campaigns c ON c.id = cc.campaign_id
      WHERE ${genre ? `da.genres::text ILIKE $2 AND ` : ''}c.status IN ($1)
    `, genre ? [['active', 'draft'], `%${genre}%`] : [['active', 'draft']]);
    const total = totalRow?.total || 0;

    return NextResponse.json({
      artists,
      total,
      page,
      limit,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
