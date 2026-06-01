/**
 * Artist Metrics Pipeline — fetches cross-platform data for artist cards.
 * 
 * Phase 1: Spotify (public API) + Deezer (public API) ✅
 * Phase 2: YouTube (Data API v3) ✅
 * Phase 3: Instagram, TikTok, SoundCloud, etc. (crawl4ai) — pending Railway deploy
 */

import sql from '@/lib/db';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

let spotifyToken: { token: string; expires: number } | null = null;

async function getSpotifyToken(): Promise<string | null> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) return null;
  if (spotifyToken && Date.now() < spotifyToken.expires) return spotifyToken.token;
  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64') },
      body: 'grant_type=client_credentials',
    });
    if (res.ok) {
      const data = await res.json();
      spotifyToken = { token: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
      return spotifyToken.token;
    }
  } catch {}
  return null;
}

export interface ArtistMetrics {
  platform: string;
  metrics: { name: string; value: number; displayName: string }[];
  imageUrl?: string;
  spotifyId?: string;
}

export async function fetchSpotifyMetrics(artistName: string, trackName?: string): Promise<ArtistMetrics | null> {
  // First try the API for the Spotify ID + profile image
  const token = await getSpotifyToken();
  let spotifyId: string | undefined;
  let imageUrl: string | undefined;

  if (token) {
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=3`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        const items = data.artists?.items || [];
        const exact = items.find((a: any) => a.name.toLowerCase() === artistName.toLowerCase());
        const pick = exact || items[0];
        if (pick) {
          spotifyId = pick.id;
          imageUrl = pick.images?.[0]?.url;
        }
      }
    } catch {}
  }

  if (!spotifyId) return null;

  // Scrape the public Spotify page for real listener/stream counts
  try {
    const pageRes = await fetch(`https://open.spotify.com/artist/${spotifyId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    });
    if (!pageRes.ok) return null;
    const html = await pageRes.text();

    // Monthly listeners: <div data-testid="monthly-listeners-label">683,041 monthly listeners</div>
    const listenerMatch = html.match(/data-testid="monthly-listeners-label"[^>]*>([\d,]+) monthly listeners/);
    const monthlyListeners = listenerMatch ? parseInt(listenerMatch[1].replace(/,/g, '')) : 0;

    // Sum track stream counts from the page
    let totalStreams = 0;
    const streamMatches = html.matchAll(/<span[^>]*>([\d,]+)<\/span>/g);
    for (const m of streamMatches) {
      const n = parseInt(m[1].replace(/,/g, ''));
      if (n > 1000) totalStreams += n;
    }

    return {
      platform: 'spotify',
      imageUrl,
      metrics: [
        { name: 'monthly_listeners', value: monthlyListeners, displayName: 'Monthly Listeners' },
        { name: 'total_streams', value: totalStreams, displayName: 'Total Streams' },
      ],
      spotifyId,
    };
  } catch { return null; }
}



/**
 * Scrape Instagram public profile for follower count.
 * Instagram renders follower count in <meta name="description"> tags server-side.
 * Example: <meta content="696 Followers, 1,041 Following, 131 Posts" name="description">
 */
export async function fetchInstagramMetrics(handle: string): Promise<ArtistMetrics | null> {
  try {
    const res = await fetch(`https://www.instagram.com/${handle}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // <meta content="696 Followers, 1,041 Following, 131 Posts" name="description">
    const match = html.match(/<meta[^>]+content="([\d,.KMBkmb]+) Followers[^"]*"[^>]+name="description"/i)
               || html.match(/<meta[^>]+name="description"[^>]+content="([\d,.KMBkmb]+) Followers[^"]*"/i);
    if (!match) return null;

    const raw = match[1].replace(/,/g, '');
    let followers = 0;
    if (raw.toUpperCase().endsWith('K')) followers = Math.round(parseFloat(raw) * 1000);
    else if (raw.toUpperCase().endsWith('M')) followers = Math.round(parseFloat(raw) * 1_000_000);
    else followers = parseInt(raw) || 0;

    return followers > 0 ? {
      platform: 'instagram',
      metrics: [{ name: 'followers', value: followers, displayName: 'Followers' }],
    } : null;
  } catch { return null; }
}

// Also add basic TikTok scraper using the page meta
export async function fetchTikTokMetrics(handle: string): Promise<ArtistMetrics | null> {
  try {
    const res = await fetch(`https://www.tiktok.com/@${handle}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Try meta description: "dannyvera 19 Followers, 229 Following"
    const match = html.match(/<meta[^>]+name="description"[^>]+content="[^"]*?([\d,.KMBkmb]+) Followers/i);
    if (!match) return null;

    const raw = match[1].replace(/,/g, '');
    let followers = 0;
    if (raw.toUpperCase().endsWith('K')) followers = Math.round(parseFloat(raw) * 1000);
    else if (raw.toUpperCase().endsWith('M')) followers = Math.round(parseFloat(raw) * 1_000_000);
    else followers = parseInt(raw) || 0;

    // TikTok logged-out pages show the bot's own follower count (wrong data).
    // Only return if it looks like a real count (>100 followers)
    return followers > 100 ? {
      platform: 'tiktok',
      metrics: [{ name: 'followers', value: followers, displayName: 'Followers' }],
    } : null;
  } catch { return null; }
}

export async function fetchDeezerMetrics(artistName: string): Promise<ArtistMetrics | null> {
  try {
    const res = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName)}&limit=1`);
    if (!res.ok) return null;
    const data = await res.json();
    const artist = data.data?.[0];
    if (!artist) return null;
    return { platform: 'deezer', metrics: [{ name: 'fans', value: artist.nb_fan || 0, displayName: 'Fans' }] };
  } catch { return null; }
}

export async function fetchYouTubeMetrics(artistName: string): Promise<ArtistMetrics | null> {
  if (!YOUTUBE_API_KEY) return null;
  try {
    // Search for the artist's channel
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(artistName + ' music')}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const channelId = searchData.items?.[0]?.id?.channelId;
    if (!channelId) return null;

    // Get channel statistics
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
    );
    if (!statsRes.ok) return null;
    const statsData = await statsRes.json();
    const stats = statsData.items?.[0]?.statistics;
    if (!stats) return null;

    return {
      platform: 'youtube',
      metrics: [
        { name: 'subscribers', value: parseInt(stats.subscriberCount || '0'), displayName: 'Subscribers' },
        { name: 'total_views', value: parseInt(stats.viewCount || '0'), displayName: 'Total Views' },
      ],
    };
  } catch { return null; }
}

export async function storeMetrics(artistId: string, platform: string, metrics: { name: string; value: number; displayName: string }[]) {
  for (const m of metrics) {
    const [prev] = await sql`SELECT value FROM artist_metrics WHERE artist_id = ${artistId} AND platform = ${platform} AND metric_name = ${m.name} ORDER BY recorded_at DESC LIMIT 1`;
    const previousValue = prev?.value || null;
    const changePct = previousValue && previousValue > 0 ? Math.round(((m.value - previousValue) / previousValue) * 1000) / 10 : null;
    await sql`INSERT INTO artist_metrics (artist_id, platform, metric_name, value, previous_value, change_pct) VALUES (${artistId}, ${platform}, ${m.name}, ${m.value}, ${previousValue}, ${changePct})`;
  }
}

export async function updateArtistProfile(artistId: string, spotifyImageUrl?: string, spotifyId?: string) {
  const [{ count }] = await sql`SELECT COUNT(DISTINCT platform)::int as count FROM artist_metrics WHERE artist_id = ${artistId}`;
  const latest = await sql`
    SELECT metric_name, value FROM artist_metrics WHERE artist_id = ${artistId}
    AND (platform, metric_name, recorded_at) IN (
      SELECT platform, metric_name, MAX(recorded_at) FROM artist_metrics WHERE artist_id = ${artistId} GROUP BY platform, metric_name
    )
  `;
  let totalFollowers = 0, totalStreams = 0;
  for (const m of latest) {
    if (['followers','subscribers','fans'].includes(m.metric_name)) totalFollowers += m.value || 0;
    if (['total_views','streams','plays'].includes(m.metric_name)) totalStreams += m.value || 0;
  }
  await sql`
    UPDATE artist_profiles SET
      spotify_image_url = COALESCE(${spotifyImageUrl}, spotify_image_url),
      total_followers = ${totalFollowers},
      total_streams = ${totalStreams},
      total_platforms = ${count},
      last_refreshed_at = NOW()
    WHERE artist_id = ${artistId}
  `;
}

export async function refreshArtistMetrics(artistId: string, artistName: string, trackName?: string): Promise<number> {
  let updated = 0;

  const [spotify, deezer, youtube, instagram, tiktok] = await Promise.all([
    fetchSpotifyMetrics(artistName, trackName),
    fetchDeezerMetrics(artistName),
    fetchYouTubeMetrics(artistName),
    Promise.resolve(null), // instagram — called separately with handle
    Promise.resolve(null), // tiktok — called separately with handle
  ]);

  if (spotify?.metrics) { await storeMetrics(artistId, 'spotify', spotify.metrics); updated++; }
  if (deezer?.metrics) { await storeMetrics(artistId, 'deezer', deezer.metrics); updated++; }
  if (youtube?.metrics) { await storeMetrics(artistId, 'youtube', youtube.metrics); updated++; }

  await updateArtistProfile(artistId, spotify?.imageUrl, spotify?.spotifyId);
  return updated;
}

export async function getArtistCardData(artistId: string) {
  const [profile] = await sql`SELECT * FROM artist_profiles WHERE artist_id = ${artistId}`;
  if (!profile) return null;
  const metrics = await sql`
    SELECT DISTINCT ON (platform, metric_name) platform, metric_name, value, change_pct, recorded_at
    FROM artist_metrics WHERE artist_id = ${artistId} ORDER BY platform, metric_name, recorded_at DESC
  `;
  const byPlatform: Record<string, any[]> = {};
  for (const m of metrics) { if (!byPlatform[m.platform]) byPlatform[m.platform] = []; byPlatform[m.platform].push(m); }
  return { profile, metrics: byPlatform };
}