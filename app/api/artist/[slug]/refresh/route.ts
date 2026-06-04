import { NextResponse } from 'next/server';
import { refreshArtistMetrics, getArtistCardData, storeMetrics, updateArtistProfile } from '@/lib/artist-metrics';
import { fetchInstagramMetrics, fetchTikTokMetrics } from '@/lib/artist-metrics';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CRAWL4AI = process.env.CRAWL4AI_URL || 'http://localhost:8000';

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const [artist] = await sql`
      SELECT da.id, da.artist_name, da.latest_track_name FROM artist_profiles ap
      JOIN discovered_artists da ON da.id = ap.artist_id
      WHERE ap.slug = ${params.slug} LIMIT 1
    `;
    if (!artist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // 1. Refresh API-based metrics (Spotify, Deezer, YouTube)
    await refreshArtistMetrics(artist.id, artist.artist_name, artist.latest_track_name);

    // 2. Spotify followers via crawl4ai (API doesn't return follower counts with client credentials)
    try {
      const [da] = await sql`SELECT spotify_id FROM discovered_artists WHERE id = ${artist.id}`;
      if (da?.spotify_id) {
        const res = await fetch(`${CRAWL4AI}/crawl`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            urls: [`https://open.spotify.com/artist/${da.spotify_id}`],
            stealth_mode: true,
          }),
          signal: AbortSignal.timeout(15000),
        });
        if (res.ok) {
          const crawlData = await res.json();
          const text = JSON.stringify(crawlData).toLowerCase();
          // Spotify pages show: "1,234,567 monthly listeners" and "12,345 followers"
          const match = text.match(/([\d,.]+)\s*followers/);
          if (match) {
            const n = parseInt(match[1].replace(/[,\.]/g, ''));
            if (n > 0) {
              await storeMetrics(artist.id, 'spotify', [{ name: 'followers', value: n, displayName: 'Followers' }]);
            }
          }
        }
      }
    } catch (e: any) { console.error('Unhandled error in api/artist/[slug]/refresh/route.ts:', e); }

    // 3. Scrape Instagram/TikTok followers (on-demand, only if never scraped)
    const [audit] = await sql`
      SELECT instagram_handle, instagram_followers, tiktok_handle, tiktok_followers
      FROM artist_audits WHERE discovered_artist_id = ${artist.id} LIMIT 1
    `;
    if (audit) {
      if (audit.instagram_handle && !audit.instagram_followers) {
        try {
          const ig = await fetchInstagramMetrics(audit.instagram_handle);
          if (ig && ig.metrics && ig.metrics[0] && ig.metrics[0].value > 0) {
            await sql`UPDATE artist_audits SET instagram_followers = ${ig.metrics[0].value} WHERE discovered_artist_id = ${artist.id}`;
            await storeMetrics(artist.id, 'instagram', ig.metrics);
          }
        } catch (e: any) { console.error('Unhandled error in api/artist/[slug]/refresh/route.ts:', e); }
      }
      if (audit.tiktok_handle && !audit.tiktok_followers) {
        try {
          const tt = await fetchTikTokMetrics(audit.tiktok_handle);
          if (tt && tt.metrics && tt.metrics[0] && tt.metrics[0].value > 0) {
            await sql`UPDATE artist_audits SET tiktok_followers = ${tt.metrics[0].value} WHERE discovered_artist_id = ${artist.id}`;
            await storeMetrics(artist.id, 'tiktok', tt.metrics);
          }
        } catch (e: any) { console.error('Unhandled error in api/artist/[slug]/refresh/route.ts:', e); }
      }
    }

    await updateArtistProfile(artist.id);
    const result = await getArtistCardData(artist.id);
    return NextResponse.json({ ...result, cached: false });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
