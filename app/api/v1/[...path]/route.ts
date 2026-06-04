/**
 * app/api/v1/[...path]/route.ts
 * Public read-only API v1.
 * No auth required for GET endpoints.
 * Returns JSON for artists, campaigns, tracks, genres.
 */

import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const path = params.path || [];
  const segments = path.map(decodeURIComponent);

  try {
    // /api/v1/artists — list artists
    if (segments[0] === 'artists' && !segments[1]) {
      const { searchParams } = new URL(request.url);
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const offset = parseInt(searchParams.get('offset') || '0');
      const genre = searchParams.get('genre');

      let query = `
        SELECT da.id, da.artist_name, da.genres, da.monthly_listeners,
               ap.slug, ap.spotify_image_url, ap.total_followers
        FROM discovered_artists da
        JOIN artist_profiles ap ON ap.artist_id = da.id
        WHERE EXISTS (SELECT 1 FROM artist_tracks WHERE artist_id = da.id AND enabled = true)
      `;
      const sqlParams: any[] = [];
      if (genre) {
        sqlParams.push(`%${genre}%`);
        query += ` AND da.genres::text ILIKE $${sqlParams.length}`;
      }
      sqlParams.push(limit);
      query += ` ORDER BY da.monthly_listeners DESC NULLS LAST LIMIT $${sqlParams.length}`;
      sqlParams.push(offset);
      query += ` OFFSET $${sqlParams.length}`;

      const artists = await sql.raw(query, sqlParams);
      return NextResponse.json({ artists, count: artists.length });
    }

    // /api/v1/artists/[slug] — single artist
    if (segments[0] === 'artists' && segments[1]) {
      const [artist] = await sql`
        SELECT da.id, da.artist_name, da.genres, da.monthly_listeners,
               ap.slug, ap.spotify_image_url, ap.total_followers, ap.total_streams,
               aa.bio
        FROM discovered_artists da
        JOIN artist_profiles ap ON ap.artist_id = da.id
        LEFT JOIN artist_audits aa ON aa.discovered_artist_id = da.id
        WHERE ap.slug = ${segments[1]}
        LIMIT 1
      `;
      if (!artist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      const tracks = await sql`
        SELECT title, spotify_url, cover_art_url, cpm_rate_cents, created_at
        FROM artist_tracks WHERE artist_id = ${artist.id} AND enabled = true
        ORDER BY created_at DESC
      `;
      return NextResponse.json({ artist, tracks });
    }

    // /api/v1/campaigns — list campaigns
    if (segments[0] === 'campaigns' && !segments[1]) {
      const { searchParams } = new URL(request.url);
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const status = searchParams.get('status') || 'active';

      const campaigns = await sql`
        SELECT c.slug, c.track_title, c.cpm_rate_cents, c.total_budget_cents,
               c.status, c.cover_art_url, c.created_at,
               COALESCE(u.display_name, da.artist_name) as artist_name
        FROM campaigns c
        LEFT JOIN users u ON u.id = c.artist_id
        LEFT JOIN campaign_claims cc ON cc.campaign_id = c.id
        LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id
        WHERE c.status = ${status} AND c.slug IS NOT NULL
        ORDER BY c.created_at DESC LIMIT ${limit}
      `;
      return NextResponse.json({ campaigns });
    }

    // /api/v1/campaigns/[slug] — single campaign
    if (segments[0] === 'campaigns' && segments[1]) {
      const [campaign] = await sql`
        SELECT c.*, COALESCE(u.display_name, da.artist_name) as artist_name,
               ap.slug as artist_slug
        FROM campaigns c
        LEFT JOIN users u ON u.id = c.artist_id
        LEFT JOIN campaign_claims cc ON cc.campaign_id = c.id
        LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id
        LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
        WHERE c.slug = ${segments[1]}
        LIMIT 1
      `;
      if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ campaign });
    }

    // /api/v1/genres — list genres
    if (segments[0] === 'genres' && !segments[1]) {
      const genres = await sql`
        SELECT da.genres, COUNT(*)::int as artist_count
        FROM discovered_artists da
        WHERE da.genres IS NOT NULL AND da.genres != ''
        GROUP BY da.genres
        ORDER BY COUNT(*) DESC
        LIMIT 30
      `;
      return NextResponse.json({ genres });
    }

    // /api/v1/genres/[genre] — artists in genre
    if (segments[0] === 'genres' && segments[1]) {
      const artists = await sql`
        SELECT da.id, da.artist_name, ap.slug, ap.spotify_image_url
        FROM discovered_artists da
        JOIN artist_profiles ap ON ap.artist_id = da.id
        WHERE da.genres::text ILIKE ${'%' + segments[1] + '%'}
        ORDER BY da.monthly_listeners DESC NULLS LAST
        LIMIT 50
      `;
      return NextResponse.json({ genre: segments[1], artists });
    }

    // /api/v1/stats — platform stats
    if (segments[0] === 'stats') {
      const stats = await sql`
        SELECT
          (SELECT COUNT(*)::int FROM discovered_artists) as total_artists,
          (SELECT COUNT(*)::int FROM artist_tracks WHERE enabled = true) as total_tracks,
          (SELECT COUNT(*)::int FROM campaigns WHERE status = 'active') as active_campaigns,
          (SELECT COUNT(*)::int FROM users) as total_users,
          (SELECT COUNT(*)::int FROM submissions) as total_submissions
      `;
      return NextResponse.json({ stats: stats[0] });
    }

    // Unknown endpoint
    return NextResponse.json({ error: 'Not found', available: ['/v1/artists', '/v1/artists/[slug]', '/v1/campaigns', '/v1/campaigns/[slug]', '/v1/genres', '/v1/genres/[genre]', '/v1/stats'] }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
