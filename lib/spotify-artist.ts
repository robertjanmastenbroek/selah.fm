/**
 * Selah.fm — Spotify Artist Profile Fetcher
 * Fetches full artist data + top tracks from Spotify Web API.
 * Used for the artist onboarding flow (paste URL → auto-generate profile).
 */

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';

let cachedToken: { token: string; expires: number } | null = null;

async function getToken(): Promise<string | null> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) return null;
  if (cachedToken && Date.now() < cachedToken.expires) return cachedToken.token;
  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
      },
      body: 'grant_type=client_credentials',
    });
    const data = await res.json();
    if (data.access_token) {
      cachedToken = { token: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
      return data.access_token;
    }
  } catch {}
  return null;
}

function extractSpotifyArtistId(url: string): string | null {
  // Match: open.spotify.com/artist/ID
  const m = url.match(/spotify\.com\/artist\/([a-zA-Z0-9]+)/);
  if (m) return m[1];
  // Match: open.spotify.com/track/ID → will resolve via API
  const t = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (t) return t[1]; // caller handles track→artist resolution
  return null;
}

export interface SpotifyArtistData {
  id: string;
  name: string;
  imageUrl: string | null;
  followers: number;
  genres: string[];
  topTracks: SpotifyTrackData[];
}

export interface SpotifyTrackData {
  id: string;
  name: string;
  spotifyUrl: string;
  coverArtUrl: string | null;
  durationMs: number;
  popularity: number;
}

/**
 * Fetch full artist data from a Spotify artist URL.
 * Handles both artist/ID and track/ID URLs.
 */
export async function fetchArtistFromSpotify(spotifyUrl: string): Promise<{
  artist: SpotifyArtistData;
  resolvedFrom: 'artist' | 'track';
} | { error: string }> {
  const token = await getToken();
  if (!token) return { error: 'Spotify API not configured. Set SPOTIFY_CLIENT_SECRET.' };

  const id = extractSpotifyArtistId(spotifyUrl);
  if (!id) return { error: 'Invalid Spotify URL. Should be something like: https://open.spotify.com/artist/...' };

  try {
    let artistId = id;
    let resolvedFrom: 'artist' | 'track' = 'artist';

    // If it's a track URL, resolve to artist
    if (spotifyUrl.includes('/track/')) {
      resolvedFrom = 'track';
      const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!trackRes.ok) return { error: 'Track not found on Spotify' };
      const trackData = await trackRes.json();
      artistId = trackData.artists?.[0]?.id;
      if (!artistId) return { error: 'Could not find artist for this track' };
    }

    // Fetch artist details
    const [artistRes, tracksRes] = await Promise.all([
      fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (!artistRes.ok) return { error: 'Artist not found on Spotify' };

    const artistData = await artistRes.json();
    const tracksData = await tracksRes.json();

    const imageUrl = artistData.images?.[0]?.url || null;

    const topTracks: SpotifyTrackData[] = (tracksData.tracks || [])
      .slice(0, 10)
      .map((t: any) => ({
        id: t.id,
        name: t.name,
        spotifyUrl: t.external_urls?.spotify || `https://open.spotify.com/track/${t.id}`,
        coverArtUrl: t.album?.images?.[0]?.url || imageUrl,
        durationMs: t.duration_ms || 0,
        popularity: t.popularity || 0,
      }));

    return {
      artist: {
        id: artistData.id,
        name: artistData.name,
        imageUrl,
        followers: artistData.followers?.total || 0,
        genres: artistData.genres || [],
        topTracks,
      },
      resolvedFrom,
    };
  } catch {
    return { error: 'Failed to fetch data from Spotify. Check the URL and try again.' };
  }
}

/**
 * Extract Spotify track ID from URL (for per-track artwork).
 */
export function extractTrackId(url: string): string | null {
  const m = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  return m ? m[1] : null;
}
