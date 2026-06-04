import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/artist-page-direct?slug=rony-rex-dcb016
 * Runs the EXACT same queries as the artist page and returns errors.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || 'rony-rex-dcb016';

  const results: any = {};

  try {
    const [artist] = await sql`
      SELECT da.id, da.artist_name, da.genres, da.monthly_listeners, da.followers,
             da.social_links, da.latest_track_name, da.latest_track_cover_url,
             da.instagram_handle, da.tiktok_handle, da.spotify_id,
             da.comment_count,
             ap.slug as profile_slug, ap.spotify_image_url, ap.total_followers,
             ap.total_streams, ap.total_platforms,
             ''::text as bio
      FROM discovered_artists da
      LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE ap.slug = ${slug}
      LIMIT 1
    `;
    if (!artist) {
      results.query1 = 'no artist found';
      return NextResponse.json(results);
    }
    results.query1 = { artist: artist.artist_name };
  } catch (e: any) {
    results.query1 = { error: e.message };
  }

  return NextResponse.json(results);
}
