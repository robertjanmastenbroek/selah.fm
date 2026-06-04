import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { scrapeInstagram, scrapeTikTok, scrapeSoundCloud } from '@/lib/artist-scraper';
import { storeMetrics, updateArtistProfile } from '@/lib/artist-metrics';

export const dynamic = 'force-dynamic';

/**
 * GET /api/crawl/health
 * 
 * Checks if crawl4ai is reachable. Artist card dashboard pings this.
 */
export async function GET() {
  const CRAWL4AI_URL = process.env.CRAWL4AI_URL || 'http://localhost:8000';
  try {
    const res = await fetch(`${CRAWL4AI_URL}/health`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      return NextResponse.json({ ok: true, url: CRAWL4AI_URL, status: 'connected' });
    }
    return NextResponse.json({ ok: false, url: CRAWL4AI_URL, status: `HTTP ${res.status}` });
  } catch (e: any) {
    return NextResponse.json({ ok: false, url: CRAWL4AI_URL, status: e.message });
  }
}

/**
 * POST /api/crawl
 * 
 * Actions:
 *   { action: 'scrape_all', artist_slug } — scrape all platforms for one artist
 *   { action: 'batch', limit } — scrape next N unscraped artists (for cron)
 *   { action: 'health' } — same as GET
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'scrape_all') {
      const { artist_slug } = body;
      if (!artist_slug) return NextResponse.json({ error: 'artist_slug required' }, { status: 400 });

      const [artist] = await sql`
        SELECT da.id, da.artist_name, aa.instagram_handle, aa.tiktok_handle, aa.instagram_followers, aa.tiktok_followers
        FROM artist_profiles ap
        JOIN discovered_artists da ON da.id = ap.artist_id
        LEFT JOIN artist_audits aa ON aa.discovered_artist_id = da.id
        WHERE ap.slug = ${artist_slug} LIMIT 1
      `;
      if (!artist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      const results: any = { artist: artist.artist_name, platforms: {} };

      if (artist.instagram_handle) {
        try {
          const ig = await scrapeInstagram(artist.instagram_handle);
          if (ig && ig.followers > 0) {
            await sql`UPDATE artist_audits SET instagram_followers = ${ig.followers}, updated_at = NOW() WHERE discovered_artist_id = ${artist.id}`;
            await storeMetrics(artist.id, 'instagram', [{ name: 'followers', value: ig.followers, displayName: 'Followers' }]);
            results.platforms.instagram = { followers: ig.followers };
          } else {
            results.platforms.instagram = { error: 'No data found or crawl4ai unavailable' };
          }
        } catch (e: any) { results.platforms.instagram = { error: e.message }; }
      }

      if (artist.tiktok_handle) {
        try {
          const tt = await scrapeTikTok(artist.tiktok_handle);
          if (tt && tt.followers > 0) {
            await sql`UPDATE artist_audits SET tiktok_followers = ${tt.followers}, updated_at = NOW() WHERE discovered_artist_id = ${artist.id}`;
            await storeMetrics(artist.id, 'tiktok', [{ name: 'followers', value: tt.followers, displayName: 'Followers' }]);
            results.platforms.tiktok = { followers: tt.followers };
          } else {
            results.platforms.tiktok = { error: 'No data found or crawl4ai unavailable' };
          }
        } catch (e: any) { results.platforms.tiktok = { error: e.message }; }
      }

      await updateArtistProfile(artist.id);
      return NextResponse.json(results);
    }

    if (action === 'batch') {
      const limit = Math.min(body.limit || 20, 50);
      const artists = await sql`
        SELECT da.id, da.artist_name, aa.instagram_handle, aa.tiktok_handle
        FROM artist_audits aa
        JOIN discovered_artists da ON da.id = aa.discovered_artist_id
        WHERE (
          (aa.instagram_handle IS NOT NULL AND aa.instagram_handle != '' AND (aa.instagram_followers IS NULL OR aa.instagram_followers = 0))
          OR (aa.tiktok_handle IS NOT NULL AND aa.tiktok_handle != '' AND (aa.tiktok_followers IS NULL OR aa.tiktok_followers = 0))
        )
        ORDER BY RANDOM() LIMIT ${limit}
      `;

      const results: any[] = [];
      for (const a of artists) {
        const r: any = { artist: a.artist_name };
        if (a.instagram_handle) {
          try {
            const ig = await scrapeInstagram(a.instagram_handle);
            if (ig && ig.followers > 0) {
              await sql`UPDATE artist_audits SET instagram_followers = ${ig.followers}, updated_at = NOW() WHERE discovered_artist_id = ${a.id}`;
              await storeMetrics(a.id, 'instagram', [{ name: 'followers', value: ig.followers, displayName: 'Followers' }]);
              r.instagram = ig.followers;
            }
          } catch (e: any) { console.error('Unhandled error in api/crawl/route.ts:', e); }
        }
        if (a.tiktok_handle) {
          try {
            const tt = await scrapeTikTok(a.tiktok_handle);
            if (tt && tt.followers > 0) {
              await sql`UPDATE artist_audits SET tiktok_followers = ${tt.followers}, updated_at = NOW() WHERE discovered_artist_id = ${a.id}`;
              await storeMetrics(a.id, 'tiktok', [{ name: 'followers', value: tt.followers, displayName: 'Followers' }]);
              r.tiktok = tt.followers;
            }
          } catch (e: any) { console.error('Unhandled error in api/crawl/route.ts:', e); }
        }
        results.push(r);
        await new Promise(r => setTimeout(r, 2000)); // Rate limit
      }

      return NextResponse.json({ scraped: results.length, results });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
