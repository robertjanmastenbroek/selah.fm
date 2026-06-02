import { NextResponse } from 'next/server';
import { fetchArtistFromSpotify, type SpotifyTrackData } from '@/lib/spotify-artist';
import { getUser } from '@/lib/supabase/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/spotify/import-artist
 * Body: { url: "https://open.spotify.com/artist/...", cpm_rate_cents?: 10 }
 * Creates: artist_profiles + artist_tracks + funding pool campaign
 * Returns: { slug, artist_name, track_count }
 */
export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const spotifyUrl = (body.url || '').trim();
    const cpmRate = Math.max(1, Math.min(10000, parseInt(body.cpm_rate_cents) || 10));

    if (!spotifyUrl) {
      return NextResponse.json({ error: 'Spotify URL is required' }, { status: 400 });
    }

    // Fetch artist data from Spotify
    const result = await fetchArtistFromSpotify(spotifyUrl);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { artist, resolvedFrom } = result;
    if (!artist.name || artist.name.length < 2) {
      return NextResponse.json({ error: 'Invalid artist name from Spotify' }, { status: 400 });
    }

    // Check if artist already exists
    const [existingArtist] = await sql`
      SELECT da.id, da.artist_name, ap.slug FROM discovered_artists da
      LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE da.spotify_id = ${artist.id} OR da.artist_name ILIKE ${artist.name}
      LIMIT 1
    `;

    let artistId: string;
    let slug: string;

    if (existingArtist) {
      // Artist exists — update and merge
      artistId = existingArtist.id;
      slug = existingArtist.slug;

      // Update spotify_id if missing
      await sql`UPDATE discovered_artists SET 
        spotify_id = COALESCE(spotify_id, ${artist.id}),
        social_links = social_links || ${JSON.stringify({ spotify: spotifyUrl })}
      WHERE id = ${artistId}`;

      // Update artist_profiles image if we got a better one
      if (artist.imageUrl) {
        await sql`UPDATE artist_profiles SET spotify_image_url = ${artist.imageUrl} WHERE artist_id = ${artistId}`;
      }
    } else {
      // Create new discovered_artist
      const slugBase = artist.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      slug = slugBase;
      
      const [existingSlug] = await sql`SELECT id FROM artist_profiles WHERE slug = ${slug} LIMIT 1`;
      if (existingSlug) {
        slug = slugBase + '-' + crypto.randomUUID().slice(0, 4);
      }

      const [newArtist] = await sql`
        INSERT INTO discovered_artists (artist_name, spotify_id, genres, followers, social_links, status)
        VALUES (${artist.name}, ${artist.id}, ${JSON.stringify(artist.genres)}, ${artist.followers},
                ${JSON.stringify({ spotify: spotifyUrl })}, 'discovered')
        RETURNING id
      `;
      artistId = newArtist.id;

      // Create artist profile
      await sql`
        INSERT INTO artist_profiles (artist_id, slug, spotify_image_url)
        VALUES (${artistId}, ${slug}, ${artist.imageUrl})
      `;
    }

    // Upsert tracks from Spotify
    for (let i = 0; i < artist.topTracks.length; i++) {
      const track = artist.topTracks[i];
      const [existingTrack] = await sql`
        SELECT id FROM artist_tracks 
        WHERE artist_id = ${artistId} AND (spotify_track_id = ${track.id} OR title ILIKE ${track.name})
        LIMIT 1
      `;

      if (!existingTrack) {
        await sql`
          INSERT INTO artist_tracks (artist_id, title, spotify_url, spotify_track_id, cover_art_url, duration_ms, cpm_rate_cents, sort_order)
          VALUES (${artistId}, ${track.name}, ${track.spotifyUrl}, ${track.id}, ${track.coverArtUrl}, 
                  ${track.durationMs}, ${cpmRate}, ${i + 1})
        `;
      }
    }

    // Ensure at least one funding pool campaign exists
    const [existingPool] = await sql`
      SELECT c.id FROM campaigns c
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      WHERE cc.discovered_artist_id = ${artistId} AND c.status = 'active' AND c.is_artist_pool = true
      LIMIT 1
    `;

    if (!existingPool) {
      const poolSlug = slug + '-pool-' + crypto.randomUUID().slice(0, 4);
      const [pool] = await sql`
        INSERT INTO campaigns (
          artist_id, track_title, title, slug, cpm_rate_cents,
          total_budget_cents, budget_remaining_cents, max_payout_per_submission_cents,
          platforms, is_unclaimed, is_artist_pool, status
        ) VALUES (
          ${user.id},
          ${'Support ' + artist.name},
          ${`${artist.name} — Artist Fund`},
          ${poolSlug},
          ${cpmRate}, 0, 0, 10000,
          ${['tiktok', 'instagram', 'youtube']}, false, true, 'active'
        )
        RETURNING id
      `;

      const claimCode = crypto.randomUUID();
      await sql`
        INSERT INTO campaign_claims (campaign_id, discovered_artist_id, claim_code)
        VALUES (${pool.id}, ${artistId}, ${claimCode})
      `;
    }

    // Count tracks
    const [{ track_count }] = await sql`
      SELECT COUNT(*)::int as track_count FROM artist_tracks WHERE artist_id = ${artistId} AND enabled = true
    `;

    return NextResponse.json({
      success: true,
      slug,
      artist_name: artist.name,
      artist_id: artistId,
      track_count,
      isNew: !existingArtist,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
