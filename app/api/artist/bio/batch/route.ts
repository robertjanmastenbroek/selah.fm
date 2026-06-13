/**
 * app/api/artist/bio/batch/route.ts
 * Batch bio generation — processes ALL remaining artists in one go.
 * For one-time acceleration of bio coverage. Uses same engine as nightly cron.
 * 
 * Usage: GET /api/artist/bio/batch?secret=CRON_SECRET&limit=500
 * Default limit: 100. Max: 2000 (all remaining).
 */

import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getInternalUrl } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = new URL(request.url).searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = Math.min(
    parseInt(new URL(request.url).searchParams.get('limit') || '100'),
    2000
  );

  const results: { artist: string; status: string }[] = [];
  const start = Date.now();

  try {
    // Find all artists that need bios (prioritize by data richness)
    const artists = await sql`
      SELECT da.id, da.artist_name, da.monthly_listeners
      FROM discovered_artists da
      LEFT JOIN artist_audits aa ON aa.discovered_artist_id = da.id
      WHERE (aa.bio IS NULL OR LENGTH(aa.bio) < 100)
        AND EXISTS (SELECT 1 FROM artist_tracks WHERE artist_id = da.id AND enabled = true)
      ORDER BY da.monthly_listeners DESC NULLS LAST
      LIMIT ${limit}
    `;

    if (artists.length === 0) {
      return NextResponse.json({
        message: 'All artists already have bios',
        processed: 0,
        remaining: 0,
        elapsed_ms: Date.now() - start,
      });
    }

    const siteUrl = getInternalUrl();

    // Process with concurrency of 5 — faster than cron's 3 since this is one-time
    const concurrency = 5;
    
    for (let i = 0; i < artists.length; i += concurrency) {
      const batch = artists.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(async (a: any) => {
          const res = await fetch(`${siteUrl}/api/artist/bio`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-cron-secret': secret,
            },
            body: JSON.stringify({ artistId: a.id }),
            signal: AbortSignal.timeout(60000),
          });
          if (!res.ok) {
            const err = await res.text();
            return { artist: a.artist_name, status: `error: ${err.slice(0, 50)}` };
          }
          return { artist: a.artist_name, status: 'done' };
        })
      );
      
      for (const r of batchResults) {
        if (r.status === 'fulfilled') {
          results.push(r.value);
        } else {
          results.push({ artist: 'unknown', status: `error: ${r.reason?.message?.slice(0, 50)}` });
        }
      }
    }

    const passed = results.filter(r => r.status === 'done').length;
    const failed = results.filter(r => r.status !== 'done').length;

    return NextResponse.json({
      processed: artists.length,
      passed,
      failed,
      remaining: Math.max(0, artists.length - passed),
      elapsed_ms: Date.now() - start,
      results: results.slice(0, 20), // first 20 for preview
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, results }, { status: 500 });
  }
}
