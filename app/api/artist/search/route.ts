import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { searchSpotify, searchDeezer, storeMetrics, updateArtistProfile } from '@/lib/artist-metrics';

export const dynamic = 'force-dynamic';

/**
 * GET /api/artist/search?q=artist+name
 * 
 * Searches for artists in our database.
 * If not found and ?generate=true, searches Spotify + Deezer live
 * and creates a card on-demand.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const generate = searchParams.get('generate') === 'true';

  if (!q || q.length < 2) {
    return NextResponse.json({ artists: [] });
  }

  try {
    // Search our DB
    const existing = await sql`
      SELECT da.artist_name, ap.slug, ap.spotify_image_url, ap.total_followers, ap.total_platforms
      FROM artist_profiles ap
      JOIN discovered_artists da ON da.id = ap.artist_id
      WHERE da.artist_name ILIKE ${'%' + q + '%'}
      ORDER BY ap.total_followers DESC NULLS LAST
      LIMIT 10
    `;

    if (existing.length > 0) {
      return NextResponse.json({ artists: existing, source: 'database' });
    }

    // Not found in DB — try live search if generate=true
    if (generate) {
      // Search Spotify
      const spotify = await searchSpotify(q);
      if (spotify) {
        // Artist exists on Spotify — create a card
        const slug = q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const artistId = crypto.randomUUID();
        
        // Store as discovered artist
        await sql`
          INSERT INTO discovered_artists (id, artist_name, status, discovery_source)
          VALUES (${artistId}, ${q}, 'discovered', 'artist_card_search')
          ON CONFLICT DO NOTHING
        `;
        
        // Create profile
        await sql`
          INSERT INTO artist_profiles (artist_id, slug, spotify_image_url, created_at)
          VALUES (${artistId}, ${slug}, ${spotify.imageUrl}, NOW())
        `;
        
        // Store Spotify metrics
        if (spotify.metrics) {
          await storeMetrics(artistId, 'spotify', spotify.metrics);
        }
        await updateArtistProfile(artistId, spotify.imageUrl);
        
        // Also try Deezer
        const deezer = await fetchDeezerMetrics(q);
        if (deezer?.metrics) {
          await storeMetrics(artistId, 'deezer', deezer.metrics);
          await updateArtistProfile(artistId);
        }
        
        return NextResponse.json({
          artists: [{ artist_name: q, slug, spotify_image_url: spotify.imageUrl, total_followers: spotify.metrics?.[0]?.value || 0, total_platforms: deezer ? 2 : 1 }],
          source: 'live_generated',
        });
      }
      
      // Try Deezer only
      const deezer = await searchDeezer(q);
      if (deezer?.metrics) {
        const slug = q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const artistId = crypto.randomUUID();
        
        await sql`INSERT INTO discovered_artists (id, artist_name, status, discovery_source) VALUES (${artistId}, ${q}, 'discovered', 'artist_card_search') ON CONFLICT DO NOTHING`;
        await sql`INSERT INTO artist_profiles (artist_id, slug, created_at) VALUES (${artistId}, ${slug}, NOW())`;
        if (deezer.metrics) await storeMetrics(artistId, 'deezer', deezer.metrics);
        
        return NextResponse.json({
          artists: [{ artist_name: q, slug, total_platforms: 1 }],
          source: 'live_generated_deezer',
        });
      }
    }

    return NextResponse.json({ artists: [], source: 'not_found' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
