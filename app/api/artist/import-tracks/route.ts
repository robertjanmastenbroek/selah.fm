import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/artist/import-tracks
 * Accepts a Spotify/Bandcamp/Deezer/Apple Music link.
 * Scrapes tracks and creates campaigns for the current artist.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { url } = await request.json();
    if (!url?.trim()) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    // Find the claimed artist profile for this user
    const [artist] = await sql`
      SELECT da.id, da.artist_name
      FROM artist_profiles ap
      JOIN discovered_artists da ON da.id = ap.artist_id
      WHERE ap.claimed_by_user_id = ${user.id}
      LIMIT 1
    `;
    if (!artist) {
      return NextResponse.json({ error: 'No claimed artist profile found. Create one first.' }, { status: 400 });
    }

    const lowerUrl = url.toLowerCase().trim();
    let tracks: { title: string; url: string; coverArt: string }[] = [];

    // ─── Spotify ─────────────────────────────────────────
    if (lowerUrl.includes('spotify.com')) {
      // No API needed — scrape the page for the artist name, then use iTunes search
      // Spotify pages have OG meta tags with the artist name even without JS
      const pageRes = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SelahBot/1.0)' },
        signal: AbortSignal.timeout(10000),
      });

      let artistName = '';
      if (pageRes.ok) {
        const html = await pageRes.text();
        // Extract from og:title or twitter:title meta tag
        const ogMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
        const twitterMatch = html.match(/<meta[^>]+name="twitter:title"[^>]+content="([^"]+)"/i);
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        artistName = ogMatch?.[1] || twitterMatch?.[1] || titleMatch?.[1] || '';
        // Clean up: remove "| Spotify" suffix
        artistName = artistName.replace(/\s*\|\s*Spotify.*$/i, '').trim();
      }

      // Fallback to the claimed artist name if page scrape didn't work
      if (!artistName) {
        const [artistInfo] = await sql`
          SELECT artist_name FROM discovered_artists da
          JOIN artist_profiles ap ON ap.artist_id = da.id
          WHERE ap.claimed_by_user_id = ${user.id}
          LIMIT 1
        `;
        artistName = artistInfo?.artist_name || '';
      }

      if (!artistName) {
        return NextResponse.json({ error: 'Could not determine artist name from the link.' }, { status: 400 });
      }

      // Search iTunes by the extracted artist name
      const itunesRes = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=song&limit=15&media=music`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (itunesRes.ok) {
        const itunesData = await itunesRes.json();
        const nameLower = artistName.toLowerCase();
        tracks = (itunesData.results || [])
          .filter((t: any) => t.artistName?.toLowerCase() === nameLower)
          .map((t: any) => ({
            title: t.trackName || t.trackCensoredName || '',
            url: t.trackViewUrl || '',
            coverArt: t.artworkUrl100?.replace('100x100bb', '300x300bb') || '',
          }));
      }
      if (tracks.length === 0) {
        return NextResponse.json({ error: `No tracks found for "${artistName}" on iTunes. Try a Bandcamp link.` }, { status: 404 });
      }

    // ─── Bandcamp ────────────────────────────────────────
    } else if (lowerUrl.includes('bandcamp.com')) {
      // Scrape the Bandcamp page for track info
      const pageRes = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SelahBot/1.0)' },
        signal: AbortSignal.timeout(15000),
      });
      if (!pageRes.ok) return NextResponse.json({ error: 'Failed to fetch Bandcamp page' }, { status: 502 });
      const html = await pageRes.text();

      // Parse track listing from Bandcamp HTML
      // Bandcamp embeds track data in a JSON-LD script or data-track attributes
      const trackRegex = /<div class="track-title">([^<]+)<\/div>/g;
      const urlRegex = /<a[^>]+href="(\/[^"]+)"[^>]*class="[^"]*title[^"]*"[^>]*>/g;
      const coverRegex = /<a[^>]+class="[^"]*thumb[^"]*"[^>]+href="([^"]+)"/g;

      const titles: string[] = [];
      let m;
      while ((m = trackRegex.exec(html)) !== null) titles.push(m[1].trim());

      const urls: string[] = [];
      while ((m = urlRegex.exec(html)) !== null) urls.push(m[1]);

      const covers: string[] = [];
      while ((m = coverRegex.exec(html)) !== null) covers.push(m[1]);

      // Try JSON-LD first (more reliable)
      const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([^<]+)<\/script>/);
      if (jsonLdMatch) {
        try {
          const jsonLd = JSON.parse(jsonLdMatch[1]);
          const items = jsonLd.track?.itemListElement || jsonLd.itemListElement || [];
          if (items.length > 0) {
            tracks = items.map((item: any) => ({
              title: item.item?.name || item.name || '',
              url: item.item?.url || item.url || '',
              coverArt: jsonLd.image || '',
            }));
          }
        } catch {}
      }

      // Fallback to regex parsing if JSON-LD didn't work
      if (tracks.length === 0) {
        // Use album title as track source
        const albumTitleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/);
        const albumTitle = albumTitleMatch?.[1] || 'Album';
        const coverMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/);
        const coverArt = coverMatch?.[1] || '';

        if (titles.length > 0) {
          tracks = titles.map((title, i) => ({
            title,
            url: urls[i] ? `https://${new URL(url).hostname}${urls[i]}` : url,
            coverArt: coverArt,
          }));
        } else {
          // Minimal fallback: just use the album/artist as one track
          tracks = [{ title: albumTitle, url, coverArt }];
        }
      }

    // ─── Deezer ──────────────────────────────────────────
    } else if (lowerUrl.includes('deezer.com')) {
      const artistMatch = url.match(/deezer\.com\/(?:en\/)?artist\/(\d+)/);
      if (!artistMatch) {
        return NextResponse.json({ error: 'Could not extract Deezer artist ID. Use: deezer.com/artist/ID' }, { status: 400 });
      }
      const deezerId = artistMatch[1];

      const artistRes = await fetch(`https://api.deezer.com/artist/${deezerId}`);
      if (!artistRes.ok) return NextResponse.json({ error: 'Deezer artist not found' }, { status: 404 });
      const artistData = await artistRes.json();

      const topRes = await fetch(`https://api.deezer.com/artist/${deezerId}/top?limit=20`);
      if (topRes.ok) {
        const topData = await topRes.json();
        tracks = (topData.data || []).map((t: any) => ({
          title: t.title,
          url: t.link || '',
          coverArt: t.album?.cover_big || t.album?.cover || '',
        }));
      }

    // ─── Apple Music ─────────────────────────────────────
    } else if (lowerUrl.includes('music.apple.com') || lowerUrl.includes('itunes.apple.com')) {
      // Apple Music doesn't have a public API, so return instructions
      return NextResponse.json({
        error: null,
        tracks: [],
        message: 'Apple Music import isn\'t available yet. Try a Spotify or Bandcamp link.',
      });

    } else {
      return NextResponse.json({
        error: null,
        tracks: [],
        message: 'Unsupported platform. Try a Spotify, Bandcamp, or Deezer link.',
      });
    }

    if (tracks.length === 0) {
      return NextResponse.json({ error: 'No tracks found at this URL' }, { status: 404 });
    }

    // Cap at 20 tracks to prevent overload
    const importTracks = tracks.slice(0, 20);

    // Create artist_tracks + campaigns for each imported track
    const created: { title: string; slug: string }[] = [];
    const skipped: string[] = [];

    for (const t of importTracks) {
      // Check if this track already exists (by title OR by URL)
      const [existingTrack] = await sql`
        SELECT id FROM artist_tracks
        WHERE artist_id = ${artist.id}
          AND (title ILIKE ${t.title} OR spotify_url = ${t.url})
        LIMIT 1
      `;

      if (existingTrack) {
        skipped.push(t.title);
        continue;
      }

      // Insert into artist_tracks
      const [newTrack] = await sql`
        INSERT INTO artist_tracks (artist_id, title, spotify_url, cover_art_url, cpm_rate_cents, enabled, sort_order)
        VALUES (${artist.id}, ${t.title}, ${t.url || null}, ${t.coverArt || null}, 10, true, 
          (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM artist_tracks WHERE artist_id = ${artist.id}))
        RETURNING id
      `;

      // Create a campaign for this track in 'draft' status (needs funding)
      const slugBase = t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
      const campaignSlug = await generateSlug(slugBase, artist.id);

      const [campaign] = await sql`
        INSERT INTO campaigns (track_title, track_url, cover_art_url, cpm_rate_cents, total_budget_cents, budget_remaining_cents, status, slug, artist_id)
        VALUES (${t.title}, ${t.url || null}, ${t.coverArt || null}, 10, 0, 0, 'draft', ${campaignSlug}, ${artist.id})
        RETURNING id, slug
      `;

      // Link via campaign_claims
      await sql`
        INSERT INTO campaign_claims (campaign_id, claim_code, discovered_artist_id, status)
        VALUES (${campaign.id}, ${campaignSlug + '-' + artist.id.slice(0, 6)}, ${artist.id}, 'active')
      `;

      created.push({ title: t.title, slug: campaign.slug });
    }

    return NextResponse.json({
      ok: true,
      imported: created.length,
      skipped: skipped.length,
      tracks: created,
      message: `Imported ${created.length} track${created.length !== 1 ? 's' : ''}${skipped.length > 0 ? ` (${skipped.length} already existed)` : ''}. Fund each campaign to activate.`,
    });
  } catch (e: any) {
    console.error('Import tracks error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function generateSlug(base: string, artistId: string): Promise<string> {
  const [existing] = await sql`
    SELECT slug FROM campaigns WHERE slug = ${base} LIMIT 1
  `;
  return existing ? base + '-' + artistId.slice(0, 4) : base;
}
