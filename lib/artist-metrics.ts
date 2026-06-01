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
  const token = await getSpotifyToken();
  if (!token) { console.log('[spotify] No token — SPOTIFY_CLIENT_ID/SECRET not set?'); return null; }

  try {
    // Step 1: Search for the artist to find their Spotify ID
    const queries = trackName ? [artistName, `${artistName} ${trackName}`] : [artistName];
    let bestId: string | null = null;
    let bestImage: string | null = null;
    let bestName = '';

    for (const q of queries) {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=artist&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const items = data.artists?.items || [];
      if (items.length === 0) continue;

      const sorted = [...items].sort((a: any, b: any) => (b.followers?.total || 0) - (a.followers?.total || 0));
      bestId = sorted[0].id;
      bestImage = sorted[0].images?.[0]?.url || null;
      bestName = sorted[0].name;
      break;
    }

    if (!bestId) return null;

    // Step 2: Get full artist details (more reliable follower count)
    const artistRes = await fetch(
      `https://api.spotify.com/v1/artists/${bestId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!artistRes.ok) return null;
    const artist = await artistRes.json();

    console.log('[spotify] Artist endpoint:', artist.name, '| followers:', artist.followers?.total, '| popularity:', artist.popularity);

    return {
      platform: 'spotify',
      imageUrl: artist.images?.[0]?.url || bestImage,
      metrics: [
        { name: 'followers', value: artist.followers?.total || 0, displayName: 'Followers' },
      ],
      spotifyId: bestId,
    };
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

  const [spotify, deezer, youtube] = await Promise.all([
    fetchSpotifyMetrics(artistName, trackName),
    fetchDeezerMetrics(artistName),
    fetchYouTubeMetrics(artistName),
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