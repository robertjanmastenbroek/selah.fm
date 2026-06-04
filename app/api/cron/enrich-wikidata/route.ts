/**
 * app/api/cron/enrich-wikidata/route.ts
 * Wikidata enrichment cron.
 * Processes 100 artists/night: searches Wikidata API for artist Q-numbers and Wikipedia URLs.
 * Stores results in discovered_artists.wikipedia_url and wikidata_id columns + metadata.
 *
 * Uses the SQL function public.enrich_wikidata_batch() which calls Wikidata API via http extension.
 */

import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = new URL(request.url).searchParams.get('secret');
  const limitParam = new URL(request.url).searchParams.get('limit');
  const limit = Math.min(Math.max(parseInt(limitParam || '100', 10) || 100, 1), 500);

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Call the SQL batch enrichment function
    const results = await sql`
      SELECT * FROM public.enrich_wikidata_batch(p_limit => ${limit}::integer)
    `;

    const found = results.filter((r: any) => r.found).length;
    const notFound = results.filter((r: any) => !r.found).length;

    // Summary
    return NextResponse.json({
      processed: results.length,
      found,
      not_found: notFound,
      remaining: await countRemaining(),
      results: results.map((r: any) => ({
        artist_name: r.artist_name,
        wikidata_id: r.wikidata_id,
        wikipedia_url: r.wikipedia_url,
        found: r.found,
      })),
    });
  } catch (e: any) {
    console.error('[ENRICH WIKIDATA] Batch error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function countRemaining(): Promise<number> {
  try {
    const [row] = await sql`
      SELECT COUNT(*)::int as remaining
      FROM discovered_artists
      WHERE wikidata_id IS NULL
        AND wikipedia_url IS NULL
        AND status != 'duplicate'
    `;
    return row?.remaining || 0;
  } catch {
    return -1;
  }
}
