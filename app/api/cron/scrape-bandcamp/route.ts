/**
 * app/api/cron/scrape-bandcamp/route.ts
 * Bandcamp data enrichment cron.
 * Processes 100 artists/night: scraps location, followers, genre tags.
 * Stores in discovered_artists.metadata JSONB column.
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

  const results: { artist: string; status: string; location?: string; followers?: number }[] = [];

  try {
    // Find 100 artists with Bandcamp URLs that haven't been enriched yet
    const artists = await sql`
      SELECT da.id, da.artist_name, da.social_links
      FROM discovered_artists da
      WHERE da.social_links::text ILIKE '%bandcamp%'
        AND (da.metadata IS NULL OR da.metadata->>'bandcamp_scraped' IS NULL)
      ORDER BY da.monthly_listeners DESC NULLS LAST
      LIMIT 100
    `;

    if (artists.length === 0) {
      return NextResponse.json({ message: 'All Bandcamp artists already scraped', processed: 0 });
    }

    for (const artist of artists) {
      try {
        const bandcampUrl = extractBandcampUrl(artist.social_links);
        if (!bandcampUrl) {
          results.push({ artist: artist.artist_name, status: 'no_bandcamp_url' });
          continue;
        }

        const page = await fetch(bandcampUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SelahBot/1.0)' },
          signal: AbortSignal.timeout(15000),
        });

        if (!page.ok) {
          results.push({ artist: artist.artist_name, status: `http_${page.status}` });
          continue;
        }

        const html = await page.text();

        // Extract location from meta description or page content
        const location = extractLocation(html, artist.artist_name);

        // Extract follower count
        const followers = extractFollowers(html);

        // Extract genre tags from the page
        const genreTags = extractGenreTags(html);

        // Store in metadata
        const metadata: any = { bandcamp_scraped: new Date().toISOString() };
        if (location) metadata.location = location;
        if (followers !== null) metadata.bandcamp_followers = followers;
        if (genreTags.length > 0) metadata.bandcamp_genre_tags = genreTags;

        await sql`
          UPDATE discovered_artists 
          SET metadata = ${JSON.stringify(metadata)}::jsonb
          WHERE id = ${artist.id}
        `;

        results.push({
          artist: artist.artist_name,
          status: 'ok',
          location: location || undefined,
          followers: followers || undefined,
        });

        // Rate limiting: wait 500ms between requests
        await new Promise(r => setTimeout(r, 500));
      } catch (e: any) {
        results.push({ artist: artist.artist_name, status: `error: ${e.message?.slice(0, 50)}` });
      }
    }

    const passed = results.filter(r => r.status === 'ok').length;
    return NextResponse.json({ processed: results.length, passed, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, results }, { status: 500 });
  }
}

function extractBandcampUrl(socialLinks: any): string | null {
  if (!socialLinks) return null;
  
  // social_links could be a JSON object like {"bandcamp": "https://..."} or just a string URL
  if (typeof socialLinks === 'object') {
    const url = socialLinks.bandcamp || socialLinks.url || Object.values(socialLinks)[0];
    if (typeof url === 'string' && url.includes('bandcamp.com')) return url;
  }
  if (typeof socialLinks === 'string') {
    if (socialLinks.includes('bandcamp.com')) return socialLinks;
    try {
      const parsed = JSON.parse(socialLinks);
      return extractBandcampUrl(parsed);
    } catch {}
  }
  return null;
}

function extractLocation(html: string, artistName: string): string | null {
  // 1. Try meta description (most reliable)
  const metaMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i);
  if (metaMatch) {
    const desc = metaMatch[1];
    // Look for "from {city}, {country}" or "{city}, {country}" patterns
    const fromMatch = desc.match(/from\s+([A-Z][^,]+(?:,\s*[A-Z][^,]+)?)/);
    if (fromMatch) return fromMatch[1].trim();
    const locMatch = desc.match(/([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)*,\s*[A-Z]{2})/);
    if (locMatch) return locMatch[1].trim();
  }

  // 2. Try og:description
  const ogMatch = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i);
  if (ogMatch) {
    const desc = ogMatch[1];
    const fromMatch = desc.match(/from\s+([A-Z][^,]+(?:,\s*[A-Z][^,]+)?)/);
    if (fromMatch) return fromMatch[1].trim();
  }

  // 3. Try JSON-LD (bandcamp often embeds structured data)
  const jsonLdMatch = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([^<]+)<\/script>/);
  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      const location = jsonLd.location?.name || jsonLd.contentLocation?.name;
      if (location) return location;
    } catch {}
  }

  return null;
}

function extractFollowers(html: string): number | null {
  // Look for follower count patterns in Bandcamp HTML
  const patterns = [
    /(\d[\d,]*)\s*followers?/i,
    /(\d[\d,]*)\s*fan/i,
    /"followers_count":\s*(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''));
    }
  }

  return null;
}

function extractGenreTags(html: string): string[] {
  const tags: string[] = [];
  // Bandcamp often has genre tags in the page
  const tagPatterns = [
    /<a[^>]+class="[^"]*tag[^"]*"[^>]*>([^<]+)<\/a>/gi,
    /<span[^>]+class="[^"]*genre[^"]*"[^>]*>([^<]+)<\/span>/gi,
    /"genre":\s*"([^"]+)"/gi,
  ];

  for (const pattern of tagPatterns) {
    let m;
    while ((m = pattern.exec(html)) !== null) {
      const tag = m[1].trim();
      if (tag.length > 0 && tag.length < 30) {
        tags.push(tag);
      }
    }
  }

  return [...new Set(tags)].slice(0, 5);
}
