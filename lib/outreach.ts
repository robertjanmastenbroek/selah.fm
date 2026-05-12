/**
 * Outbound artist marketing automation pipeline.
 * 
 * FIND → AUDIT → BUILD → OUTREACH → CLAIM → SHARE
 *
 * Requires: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET in environment.
 * Optional: YOUTUBE_API_KEY for music video search.
 */

// ── Spotify API ───────────────────────────────────────────────────

let spotifyToken: { access_token: string; expires_at: number } | null = null;

async function getSpotifyToken(): Promise<string> {
  if (spotifyToken && Date.now() < spotifyToken.expires_at) {
    return spotifyToken.access_token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET required');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error(`Spotify auth failed: ${res.status}`);
  const data = await res.json();
  spotifyToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };
  return spotifyToken.access_token;
}

async function spotifyGet(path: string) {
  const token = await getSpotifyToken();
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '5');
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      return spotifyGet(path);
    }
    throw new Error(`Spotify API ${res.status}: ${path}`);
  }
  return res.json();
}

// ── AI Artist Detection ───────────────────────────────────────────

const AI_DISTRIBUTORS = ['boomy', 'mubert', 'soundful', 'aiva', 'beatoven', 'soundraw', 'loudly', 'evoke'];
const AI_NAME_PATTERNS = [/^lofi\s/i, /^chill\s/i, /study\sbeats/i, /synth\swaves/i, /ambient\s/i, /sleep\s/i, /focus\s/i];

function detectAiSignals(artist: any, _albums: any[]): number {
  let signals = 0;

  // 1. No profile images at all (real artists always have at least 1)
  if (!artist.images?.length) signals++;

  // 2. Generic AI name patterns (e.g. "Lofi Study Beats")
  if (AI_NAME_PATTERNS.some(p => p.test(artist.name || ''))) signals++;

  // 3. Empty genres + no bio (Spotify returns empty genres for AI-generated artists)
  const hasGenres = (artist.genres || []).length > 0;
  const hasBio = (artist.name || '').length > 3;
  if (!hasGenres && !hasBio) signals++;

  // 4. No followers at all (0 followers = likely fake or newly created AI account)
  if ((artist.followers?.total || 0) === 0) signals++;

  return signals;
}

// ── Discovery (delegated to multi-channel module) ──────────────────
// Spotify search was unreliable for finding unsigned artists.
// Now: Reddit + Bandcamp + YouTube → cross-reference with Spotify.
export { discoverArtists, type DiscoveredArtist, type DiscoveryResult } from './discovery';

// ── Audit ─────────────────────────────────────────────────────────

export interface ArtistAudit {
  spotify_monthly_listeners: number;
  spotify_track_streams: number;
  youtube_video_url: string | null;
  youtube_video_views: number;
  spotify_embed_url: string;
  artist_bio: string;
  recommended_cpm_cents: number;
  recommended_budget_cents: number;
  instagram_handle: string | null;
  instagram_followers: number;
  tiktok_handle: string | null;
  tiktok_followers: number;
  email_address: string | null;
  website_url: string | null;
  hashtags: string[];
  personal_angle: string;
}

export async function auditArtist(spotifyId: string, trackName: string): Promise<ArtistAudit | null> {
  try {
    const artistData = await spotifyGet(`/artists/${spotifyId}`);
    const topTracks = await spotifyGet(`/artists/${spotifyId}/top-tracks?market=US`);

    const latestTrack = topTracks.tracks?.[0];
    const followers = artistData.followers?.total || 0;
    const genres = artistData.genres || [];
    const bio = artistData.name || '';

    // Try YouTube for music video
    let youtubeUrl: string | null = null;
    let youtubeViews = 0;
    const ytKey = process.env.YOUTUBE_API_KEY;
    if (ytKey && latestTrack) {
      try {
        const query = `${artistData.name} ${latestTrack.name} official music video`;
        const ytRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&key=${ytKey}`
        );
        if (ytRes.ok) {
          const ytData = await ytRes.json();
          if (ytData.items?.[0]) {
            youtubeUrl = `https://www.youtube.com/watch?v=${ytData.items[0].id.videoId}`;
          }
        }
      } catch {}
    }

    // Simple personal angle generation from genres + track name
    const personalAngle = genres.length > 0
      ? `The way the ${genres[0]} production hits in "${latestTrack?.name || trackName}" — that's the moment I knew this deserved more ears.`
      : `"${latestTrack?.name || trackName}" stopped me mid-scroll. This track deserves way more than ${followers.toLocaleString()} listeners.`;

    return {
      spotify_monthly_listeners: followers,
      spotify_track_streams: 0, // Not exposed via public API
      youtube_video_url: youtubeUrl,
      youtube_video_views: youtubeViews,
      spotify_embed_url: latestTrack?.external_urls?.spotify || artistData.external_urls?.spotify || '',
      artist_bio: bio,
      recommended_cpm_cents: 10, // $0.10 default
      recommended_budget_cents: 10000, // $100 default
      instagram_handle: null,
      instagram_followers: 0,
      tiktok_handle: null,
      tiktok_followers: 0,
      email_address: null,
      website_url: null,
      hashtags: genres.map((g: string) => `#${g.replace(/\s+/g, '')}`).slice(0, 5),
      personal_angle: personalAngle,
    };
  } catch (e) {
    console.error('Audit failed:', (e as Error).message);
    return null;
  }
}

// ── Outreach Templates ────────────────────────────────────────────

export function renderOutreachMessage(artistName: string, trackName: string, audit: ArtistAudit, campaignUrl: string): string {
  return `Hey ${artistName},

I've been listening to "${trackName}" — ${audit.personal_angle}

I run Selah.fm — a platform where people make TikToks and Reels with your music. You only pay when their videos get verified views. No upfront cost.

Here's the thing: I already made a campaign page for "${trackName}" with your cover art, the music video, and everything:

👉 ${campaignUrl}

It's ready to share with your people. Friends and family can chip in a few dollars to fund it. Anyone can submit a TikTok — even your cousin with 300 followers. You only pay if their video actually gets views.

Claim it whenever you want (takes 30 seconds). Or don't. The page just sits there until you're ready.

— Robert-Jan
  Founder, Selah.fm
  (former musician who got tired of labels taking 98%)`;
}

/**
 * Day-7 follow-up message — sent if artist hasn't claimed after initial outreach.
 * Softer tone, adds social proof if any exists (donations, submissions).
 */
export function renderFollowUpMessage(
  artistName: string,
  trackName: string,
  campaignUrl: string,
  donationCount: number,
  donationTotal: number,
  submissionCount: number,
): string {
  const socialProof: string[] = [];
  if (donationCount > 0) {
    socialProof.push(`${donationCount} ${donationCount === 1 ? 'person has' : 'people have'} chipped in $${donationTotal.toFixed(0)} to support "${trackName}"`);
  }
  if (submissionCount > 0) {
    socialProof.push(`${submissionCount} ${submissionCount === 1 ? 'creator has' : 'creators have'} submitted videos`);
  }
  const proofLine = socialProof.length > 0
    ? `\nSince last week, ${socialProof.join(' and ')} on your campaign page.`
    : '';

  return `Hey ${artistName} — just a quick follow-up.${proofLine}

Your campaign page for "${trackName}" is still live at:
👉 ${campaignUrl}

No pressure at all. The page just keeps working — people can donate, creators can submit videos, and everything runs automatically. You can claim it whenever you want, or not at all.

Either way, your music is out there getting attention. Wanted to make sure you knew.

— Robert-Jan
  Founder, Selah.fm`;
}
