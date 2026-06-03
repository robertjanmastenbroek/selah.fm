/**
 * app/api/cron/enrich-wikipedia/route.ts
 * Wikipedia enrichment cron.
 * Processes 100 artists/night: looks up artist on Wikipedia, extracts summary + infobox data.
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

  const results: { artist: string; status: string; found?: boolean; data?: any }[] = [];

  try {
    // Find 100 artists without Wikipedia data, prioritize by monthly listeners
    const artists = await sql`
      SELECT da.id, da.artist_name
      FROM discovered_artists da
      WHERE da.metadata IS NULL 
         OR da.metadata->>'wikipedia' IS NULL
      ORDER BY da.monthly_listeners DESC NULLS LAST
      LIMIT 100
    `;

    if (artists.length === 0) {
      return NextResponse.json({ message: 'All artists have Wikipedia data', processed: 0 });
    }

    for (const a of artists) {
      try {
        const wikiData = await searchWikipedia(a.artist_name);
        
        if (wikiData) {
          // Store in metadata JSONB
          const existingMeta = await getExistingMetadata(a.id);
          existingMeta.wikipedia = wikiData;
          
          await sql`
            UPDATE discovered_artists
            SET metadata = ${JSON.stringify(existingMeta)}::jsonb
            WHERE id = ${a.id}
          `;

          results.push({ artist: a.artist_name, status: 'found', found: true, data: { extract_len: wikiData.extract?.length || 0, has_infobox: !!wikiData.infobox } });
        } else {
          // Mark as not found so we don't keep searching
          const existingMeta = await getExistingMetadata(a.id);
          existingMeta.wikipedia = { searched: true, found: false };
          
          await sql`
            UPDATE discovered_artists
            SET metadata = ${JSON.stringify(existingMeta)}::jsonb
            WHERE id = ${a.id}
          `;

          results.push({ artist: a.artist_name, status: 'not_found' });
        }

        // Rate limit: 200ms between requests (respectful to Wikipedia)
        await new Promise(r => setTimeout(r, 200));
      } catch (e: any) {
        results.push({ artist: a.artist_name, status: `error: ${e.message?.slice(0, 50)}` });
      }
    }

    const found = results.filter(r => r.status === 'found').length;
    return NextResponse.json({ processed: results.length, found, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, results }, { status: 500 });
  }
}

async function searchWikipedia(name: string): Promise<any | null> {
  // Step 1: Search for the artist
  const searchRes = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name + ' musician')}&format=json&srlimit=3`,
    { signal: AbortSignal.timeout(10000) }
  );
  if (!searchRes.ok) return null;

  const searchData = await searchRes.json();
  const results = searchData.query?.search || [];
  if (results.length === 0) return null;

  // Try the first result — check it's related to the artist
  const bestMatch = results[0];
  const bestName = bestMatch.title.toLowerCase();
  const queryName = name.toLowerCase();

  // Accept match if title contains query name or vice versa
  if (!bestName.includes(queryName) && !queryName.includes(bestName)) {
    return null;
  }

  // Step 2: Get page summary + extract
  const pageRes = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestMatch.title)}`,
    { signal: AbortSignal.timeout(10000) }
  );
  if (!pageRes.ok) return null;

  const pageData = await pageRes.json();
  if (pageData.type === 'disambiguation' || pageData.missing) return null;

  // Step 3: Get infobox data from raw page HTML (Wikipedia API doesn't have structured infobox)
  // Use action=parse to get the infobox
  const parseRes = await fetch(
    `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(bestMatch.title)}&prop=text&section=0&format=json`,
    { signal: AbortSignal.timeout(10000) }
  );

  const infobox: any = {};
  if (parseRes.ok) {
    const parseData = await parseRes.json();
    const html = parseData.parse?.text?.['*'] || '';
    
    // Extract infobox fields from HTML
    const infoboxTable = html.match(/<table[^>]*class="[^"]*infobox[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
    if (infoboxTable) {
      const rows = infoboxTable[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
      for (const row of rows.slice(0, 10)) {
        const header = row.match(/<th[^>]*>([\s\S]*?)<\/th>/i);
        const value = row.match(/<td[^>]*>([\s\S]*?)<\/td>/i);
        if (header && value) {
          const key = header[1].replace(/<[^>]*>/g, '').trim();
          const val = value[1].replace(/<[^>]*>/g, '').trim();
          if (key && val && ['Origin', 'Genres', 'Years active', 'Labels', 'Members', 'Website', 'Associated acts'].includes(key)) {
            infobox[key] = val;
          }
        }
      }
    }
  }

  // Extract location from extract or infobox
  const location = extractLocation(pageData.extract || '', infobox);

  return {
    title: pageData.title,
    description: pageData.description || null,
    extract: pageData.extract ? pageData.extract.split('\n')[0] : null,
    extract_word_count: pageData.extract?.split(/\s+/).length || 0,
    thumbnail: pageData.thumbnail?.source || null,
    infobox,
    location,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(pageData.title)}`,
    searched_at: new Date().toISOString(),
    found: true,
  };
}

function extractLocation(extract: string, infobox: any): string | null {
  // Try infobox first
  if (infobox.Origin) return infobox.Origin.replace(/<[^>]*>/g, '').trim();
  
  // Try extract: "are an American band from..." or "is a German singer..."
  const nationalityMatch = extract.match(/\b(American|British|Canadian|Australian|German|French|Dutch|Swedish|Norwegian|Danish|Japanese|Brazilian|Irish|Scottish|Welsh|Italian|Spanish|Mexican|South\s*African|Nigerian|Ghanaian|Kenyan)\s+(?:musician|singer|songwriter|band|rapper|producer|artist|composer|DJ|drummer|guitarist|pianist)\b/i);
  if (nationalityMatch) return nationalityMatch[1];

  return null;
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
