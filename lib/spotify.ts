/**
 * Selah.fm — Spotify Artist Data Fetcher
 * Uses Spotify Web API (client credentials) to fetch artist monthly listeners.
 * Requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in env.
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

function extractSpotifyId(url: string): { type: 'track' | 'artist'; id: string } | null {
  // track: https://open.spotify.com/track/ID
  // artist: https://open.spotify.com/artist/ID
  const m = url.match(/spotify\.com\/(track|artist)\/([a-zA-Z0-9]+)/);
  if (m) return { type: m[1] as 'track' | 'artist', id: m[2] };
  return null;
}

export async function getArtistMonthlyListeners(spotifyUrl: string): Promise<number | null> {
  const extracted = extractSpotifyId(spotifyUrl);
  if (!extracted) return null;

  const token = await getToken();
  if (!token) return null;

  try {
    let artistId = extracted.id;
    
    // If it's a track URL, get the artist from the track
    if (extracted.type === 'track') {
      const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${extracted.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const trackData = await trackRes.json();
      artistId = trackData.artists?.[0]?.id;
      if (!artistId) return null;
    }

    // Fetch artist data with followers
    const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const artistData = await artistRes.json();
    
    return artistData.followers?.total || null;
  } catch {
    return null;
  }
}

export async function getArtistSocialProof(spotifyUrl?: string): Promise<{
  monthlyListeners: number | null;
  spotifyArtistName: string | null;
}> {
  if (!spotifyUrl) return { monthlyListeners: null, spotifyArtistName: null };

  try {
    const extracted = extractSpotifyId(spotifyUrl);
    if (!extracted) return { monthlyListeners: null, spotifyArtistName: null };

    const token = await getToken();
    if (!token) return { monthlyListeners: null, spotifyArtistName: null };

    let artistId = extracted.id;
    if (extracted.type === 'track') {
      const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${extracted.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const trackData = await trackRes.json();
      artistId = trackData.artists?.[0]?.id;
    }

    if (!artistId) return { monthlyListeners: null, spotifyArtistName: null };

    const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const artistData = await artistRes.json();

    return {
      monthlyListeners: artistData.followers?.total || null,
      spotifyArtistName: artistData.name || null,
    };
  } catch {
    return { monthlyListeners: null, spotifyArtistName: null };
  }
}
