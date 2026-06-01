/**
 * Artist Metrics Pipeline — fetches cross-platform data for artist cards.
 * Phase 1: Spotify (public API) + Deezer (public API).
 * Phase 2+: YouTube, SoundCloud, Instagram, TikTok, etc.
 */

import sql from '@/lib/db';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

let spotifyToken: { token: string; expires: number } | null = null;

async function getSpotifyToken(): Promise<string | null> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) return null;
  if (spotifyToken && Date.now() < spotifyToken.expires) return spotifyToken.token;

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
      },
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
}

/**
 * Fetch Spotify artist data by name search.
 * Returns monthly listeners, followers, popularity, and artist image.
 */
export async function fetchSpotifyMetrics(artistName: string): Promise<ArtistMetrics | null> {
  const token = await getSpotifyToken();
  if (!token) return null;

  try {
    // Search for artist
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const artist = searchData.artists?.items?.[0];
    if (!artist) return null;

    return {
      platform: 'spotify',
      imageUrl: artist.images?.[0]?.url || artist.images?.[1]?.url,
      metrics: [
        { name: 'monthly_listeners', value: artist.followers?.total || 0, displayName: 'Monthly Listeners' },
        { name: 'followers', value: artist.followers?.total || 0, displayName: 'Followers' },
        { name: 'popularity', value: artist.popularity || 0, displayName: 'Popularity' },
      ],
    };
  } catch {
    return null;
  }
}

/**
 * Fetch Deezer artist data by name search (public API, no auth).
 * Returns fan count.
 */
export async function fetchDeezerMetrics(artistName: string): Promise<ArtistMetrics | null> {
  try {
    const res = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName)}&limit=1`);
    if (!res.ok) return null;

    const data = await res.json();
    const artist = data.data?.[0];
    if (!artist) return null;

    return {
      platform: 'deezer',
      metrics: [
        { name: 'fans', value: artist.nb_fan || 0, displayName: 'Fans' },
      ],
    };
  } catch {
    return null;
  }
}

/**
 * Store metrics for an artist. Calculates change from previous recording.
 */
export async function storeMetrics(artistId: string, platform: string, metrics: { name: string; value: number; displayName: string }[]) {
  for (const m of metrics) {
    // Get previous value
    const [prev] = await sql`
      SELECT value FROM artist_metrics
      WHERE artist_id = ${artistId} AND platform = ${platform} AND metric_name = ${m.name}
      ORDER BY recorded_at DESC LIMIT 1
    `;

    const previousValue = prev?.value || null;
    const changePct = previousValue && previousValue > 0
      ? Math.round(((m.value - previousValue) / previousValue) * 1000) / 10
      : null;

    await sql`
      INSERT INTO artist_metrics (artist_id, platform, metric_name, value, previous_value, change_pct)
      VALUES (${artistId}, ${platform}, ${m.name}, ${m.value}, ${previousValue}, ${changePct})
    `;
  }
}

/**
 * Update artist profile with summary data.
 */
export async function updateArtistProfile(artistId: string, spotifyImageUrl?: string, totalFollowers?: number) {
  await sql`
    UPDATE artist_profiles 
    SET spotify_image_url = COALESCE(${spotifyImageUrl}, spotify_image_url),
        total_followers = COALESCE(${totalFollowers}, total_followers),
        total_platforms = (SELECT COUNT(DISTINCT platform) FROM artist_metrics WHERE artist_id = ${artistId}),
        last_refreshed_at = NOW()
    WHERE artist_id = ${artistId}
  `;
}

/**
 * Fetch and store all metrics for a single artist.
 */
export async function refreshArtistMetrics(artistId: string, artistName: string): Promise<number> {
  let platformsUpdated = 0;

  // Spotify
  const spotify = await fetchSpotifyMetrics(artistName);
  if (spotify) {
    await storeMetrics(artistId, 'spotify', spotify.metrics);
    const totalFollowers = spotify.metrics.find(m => m.name === 'followers')?.value;
    await updateArtistProfile(artistId, spotify.imageUrl, totalFollowers);
    platformsUpdated++;
  }

  // Deezer
  const deezer = await fetchDeezerMetrics(artistName);
  if (deezer) {
    await storeMetrics(artistId, 'deezer', deezer.metrics);
    platformsUpdated++;
  }

  return platformsUpdated;
}

/**
 * Get the latest metrics for an artist (for display on the card).
 */
export async function getArtistCardData(artistId: string) {
  const [profile] = await sql`SELECT * FROM artist_profiles WHERE artist_id = ${artistId}`;
  if (!profile) return null;

  const metrics = await sql`
    SELECT DISTINCT ON (platform, metric_name) platform, metric_name, value, change_pct, recorded_at
    FROM artist_metrics
    WHERE artist_id = ${artistId}
    ORDER BY platform, metric_name, recorded_at DESC
  `;

  // Organize by platform
  const byPlatform: Record<string, any[]> = {};
  for (const m of metrics) {
    if (!byPlatform[m.platform]) byPlatform[m.platform] = [];
    byPlatform[m.platform].push(m);
  }

  return { profile, metrics: byPlatform };
}
