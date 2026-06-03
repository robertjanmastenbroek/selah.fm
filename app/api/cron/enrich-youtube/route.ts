/**
 * app/api/cron/enrich-youtube/route.ts
 * YouTube enrichment cron.
 * Processes 100 artists/night: scrapes YouTube channel pages for subscribers + views.
 * Store in discovered_artists.metadata JSONB.
 */

import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = new URL(request.url).searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: { artist: string; status: string; subscribers?: number; views?: number }[] = [];

  try {
    // Find 100 artists with YouTube URLs that haven't been enriched
    const artists = await sql`
      SELECT da.id, da.artist_name, da.social_links
      FROM discovered_artists da
      WHERE (da.social_links::text ILIKE '%youtube%' OR da.social_links::text ILIKE '%youtu.be%')
        AND (da.metadata IS NULL OR da.metadata->>'youtube' IS NULL)
      ORDER BY da.monthly_listeners DESC NULLS LAST
      LIMIT 100
    `;

    if (artists.length === 0) {
      return NextResponse.json({ message: 'All YouTube artists already enriched', processed: 0 });
    }

    for (const a of artists) {
      try {
        const url = extractYoutubeUrl(a.social_links);
        if (!url) {
          results.push({ artist: a.artist_name, status: 'no_yt_url' });
          continue;
        }

        const data = await scrapeYoutubeChannel(url);

        const existingMeta = await getExistingMetadata(a.id);
        existingMeta.youtube = data || { searched: true, found: false };

        await sql`
          UPDATE discovered_artists
          SET metadata = ${JSON.stringify(existingMeta)}::jsonb
          WHERE id = ${a.id}
        `;

        if (data) {
          results.push({ artist: a.artist_name, status: 'ok', subscribers: data.subscribers, views: data.total_views });
        } else {
          results.push({ artist: a.artist_name, status: 'not_found' });
        }

        await new Promise(r => setTimeout(r, 300));
      } catch (e: any) {
        results.push({ artist: a.artist_name, status: `error: ${e.message?.slice(0, 50)}` });
      }
    }

    const passed = results.filter(r => r.status === 'ok').length;
    return NextResponse.json({ processed: results.length, passed, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, results }, { status: 500 });
  }
}

function extractYoutubeUrl(socialLinks: any): string | null {
  if (!socialLinks) return null;
  if (typeof socialLinks === 'object') {
    for (const val of Object.values(socialLinks)) {
      if (typeof val === 'string' && (val.includes('youtube.com') || val.includes('youtu.be'))) return val;
    }
  }
  if (typeof socialLinks === 'string' && (socialLinks.includes('youtube.com') || socialLinks.includes('youtu.be'))) {
    return socialLinks;
  }
  return null;
}

async function scrapeYoutubeChannel(url: string): Promise<{ subscribers: number; total_views: number; channel_name: string; description: string } | null> {
  const pageRes = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!pageRes.ok) return null;
  const html = await pageRes.text();

  // YouTube embeds subscriber/view data in several places
  // Method 1: meta tags (reliable for channel pages)
  let subs = 0;
  let views = 0;
  let channelName = '';

  // Try subscriber count from meta tags or embedded data
  const subMatch = html.match(/"subscriberCountText":\s*\{\s*"simpleText":\s*"([^"]+)"/);
  if (subMatch) {
    subs = parseCount(subMatch[1]);
  }

  const viewMatch = html.match(/"totalViewCount"\s*:\s*"(\d+)"/);
  if (viewMatch) {
    views = parseInt(viewMatch[1]);
  }

  // Channel name
  const nameMatch = html.match(/"title"\s*:\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"/);
  if (nameMatch) {
    channelName = nameMatch[1];
  }

  // Fallback: try the canonical or OG title
  if (!channelName) {
    const ogMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
    if (ogMatch) channelName = ogMatch[1].replace(/\s*-\s*YouTube$/, '');
  }

  // If we got subscribers, we have enough data
  if (subs > 0) {
    return { subscribers: subs, total_views: views, channel_name: channelName, description: '' };
  }

  return null;
}

function parseCount(str: string): number {
  str = str.replace(/,/g, '').trim();
  const multipliers: Record<string, number> = { 'K': 1000, 'M': 1000000, 'B': 1000000000 };
  for (const [suffix, mult] of Object.entries(multipliers)) {
    if (str.toUpperCase().includes(suffix)) {
      return Math.round(parseFloat(str) * mult);
    }
  }
  return parseInt(str) || 0;
}

async function getExistingMetadata(artistId: string): Promise<any> {
  const [row] = await sql`
    SELECT metadata FROM discovered_artists WHERE id = ${artistId} LIMIT 1
  `;
  if (row?.metadata && typeof row.metadata === 'object') {
    return { ...row.metadata };
  }
  return {};
}
