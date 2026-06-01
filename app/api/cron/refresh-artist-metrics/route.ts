import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { searchSpotify, searchDeezer, storeMetrics, updateArtistProfile } from '@/lib/artist-metrics';

export const dynamic = 'force-dynamic';
export const maxDuration = 600;

/**
 * GET /api/cron/refresh-artist-metrics
 * 
 * Refreshes cross-platform metrics for 20 artists per run.
 * Cycles through the full catalog over time.
 * Called by Railway cron at 04:00 UTC.
 * 
 * ?secret=CRON_SECRET for auth
 * ?limit=N to control batch size (default 20)
 * ?force=true to bypass last_refreshed_at check
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = parseInt(searchParams.get('limit') || '20');
  const force = searchParams.get('force') === 'true';
  const results: any[] = [];

  try {
    const query = force
      ? sql`SELECT da.id, da.artist_name FROM discovered_artists da JOIN artist_profiles ap ON ap.artist_id = da.id ORDER BY ap.last_refreshed_at ASC NULLS FIRST LIMIT ${limit}`
      : sql`SELECT da.id, da.artist_name FROM discovered_artists da JOIN artist_profiles ap ON ap.artist_id = da.id WHERE ap.last_refreshed_at IS NULL OR ap.last_refreshed_at < NOW() - INTERVAL '7 days' ORDER BY ap.last_refreshed_at ASC NULLS FIRST LIMIT ${limit}`;

    const artists = await query;

    for (const artist of artists) {
      try {
        const platformsUpdated = await refreshArtistMetrics(artist.id, artist.artist_name);
        results.push({ artist: artist.artist_name, platforms: platformsUpdated });
      } catch (e: any) {
        results.push({ artist: artist.artist_name, error: e.message });
      }
      await new Promise(r => setTimeout(r, 500)); // Rate limit between artists
    }

    return NextResponse.json({
      refreshed: results.filter(r => !r.error).length,
      errors: results.filter(r => r.error).length,
      results,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
