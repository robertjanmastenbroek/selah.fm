import { NextResponse } from 'next/server';
import { fetchArtistFromSpotify } from '@/lib/spotify-artist';
import { getUser } from '@/lib/supabase/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/spotify/artist-lookup
 * Body: { url: "https://open.spotify.com/artist/..." }
 * Returns: { artist: {...}, tracks: [...], exists: boolean }
 * 
 * If the artist already exists in our DB, returns existing data instead.
 * Does NOT auto-create anything — just looks up and returns.
 */
export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const spotifyUrl = (body.url || '').trim();
    if (!spotifyUrl) {
      return NextResponse.json({ error: 'Spotify URL is required' }, { status: 400 });
    }

    // Fetch from Spotify
    const result = await fetchArtistFromSpotify(spotifyUrl);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { artist, resolvedFrom } = result;

    // Check if this artist already exists in our DB (by name or spotify_id)
    const [existingArtist] = await sql`
      SELECT da.id, da.artist_name, ap.slug, ap.spotify_image_url,
             COUNT(at.id)::int as track_count
      FROM discovered_artists da
      LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
      LEFT JOIN artist_tracks at ON at.artist_id = da.id AND at.enabled = true
      WHERE da.spotify_id = ${artist.id}
         OR da.artist_name ILIKE ${artist.name}
      GROUP BY da.id, ap.slug, ap.spotify_image_url
      LIMIT 1
    `;

    return NextResponse.json({
      artist: {
        spotifyId: artist.id,
        name: artist.name,
        imageUrl: artist.imageUrl,
        followers: artist.followers,
        genres: artist.genres,
      },
      tracks: artist.topTracks,
      resolvedFrom,
      exists: !!existingArtist,
      existingProfile: existingArtist ? {
        id: existingArtist.id,
        name: existingArtist.artist_name,
        slug: existingArtist.slug,
        imageUrl: existingArtist.spotify_image_url,
        trackCount: existingArtist.track_count,
      } : null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
