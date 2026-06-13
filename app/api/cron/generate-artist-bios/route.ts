/**
 * app/api/cron/generate-artist-bios/route.ts
 * Batch bio generation cron — processes 100 artists/night.
 * Runs via the dispatcher at 00:00 UTC.
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

  const results: { artist: string; score: number; words: number; status: string }[] = [];
  const now = Date.now();

  try {
    // Find 100 artists that need bios (prioritize by data richness)
    const artists = await sql`
      SELECT da.id, da.artist_name, da.monthly_listeners
      FROM discovered_artists da
      LEFT JOIN artist_audits aa ON aa.discovered_artist_id = da.id
      WHERE (aa.bio IS NULL OR LENGTH(aa.bio) < 100)
        AND EXISTS (SELECT 1 FROM artist_tracks WHERE artist_id = da.id AND enabled = true)
      ORDER BY da.monthly_listeners DESC NULLS LAST
      LIMIT 100
    `;

    if (artists.length === 0) {
      return NextResponse.json({ message: 'No artists need bios', processed: 0, elapsed: Date.now() - now });
    }

    // Process with concurrency of 3 to avoid rate limiting
    const concurrency = 3;
    const batches = [];
    
    for (let i = 0; i < artists.length; i += concurrency) {
      const batch = artists.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map((a: any) => generateBioForArtist(a.id, a.artist_name))
      );
      
      for (let j = 0; j < batch.length; j++) {
        const r = batchResults[j];
        if (r.status === 'fulfilled') {
          results.push(r.value);
        } else {
          results.push({ artist: batch[j].artist_name, score: 0, words: 0, status: `error: ${r.reason?.message?.slice(0, 50)}` });
        }
      }
    }

    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status !== 'passed').length;

    return NextResponse.json({
      processed: artists.length,
      passed,
      failed,
      results,
      elapsed_ms: Date.now() - now,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, results }, { status: 500 });
  }
}

async function generateBioForArtist(artistId: string, artistName: string): Promise<{ artist: string; score: number; words: number; status: string }> {
  try {
    const res = await fetch(`${getInternalUrl()}/api/artist/bio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET || '',
      },
      body: JSON.stringify({ artistId }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const err = await res.text();
      return { artist: artistName, score: 0, words: 0, status: `http_${res.status}: ${err.slice(0, 50)}` };
    }

    const data = await res.json();
    return {
      artist: artistName,
      score: data.score || 0,
      words: data.word_count || 0,
      status: (data.score || 0) >= 70 ? 'passed' : `low_score_${data.score}`,
    };
  } catch (e: any) {
    return { artist: artistName, score: 0, words: 0, status: `error: ${e.message?.slice(0, 50)}` };
  }
}
