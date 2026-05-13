/**
 * Outbound artist marketing automation pipeline.
 * 
 * FIND → AUDIT → BUILD → OUTREACH → CLAIM → SHARE
 *
 * Requires: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET in environment.
 * Optional: YOUTUBE_API_KEY for music video search.
 */

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

/**
 * Audit an artist — enrich with YouTube video search + generate personal angle.
 * No Spotify needed. Uses YouTube Data API if YOUTUBE_API_KEY is set.
 */
export async function auditArtist(artistName: string, trackName: string, genres: string[] = []): Promise<ArtistAudit | null> {
  try {
    // Try YouTube for music video
    let youtubeUrl: string | null = null;
    let youtubeViews = 0;
    const ytKey = process.env.YOUTUBE_API_KEY;
    if (ytKey) {
      try {
        const query = `${artistName} ${trackName || ''} official music video`;
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

    // Generate personal angle from genre + track name
    const genreText = genres.length > 0 ? genres[0] : 'music';
    const personalAngle = trackName
      ? `The way "${trackName}" hits — that's the moment I knew ${artistName} deserves way more ears.`
      : `"${artistName}" caught my attention on Bandcamp. This artist deserves way more ears.`;

    return {
      spotify_monthly_listeners: 0,
      spotify_track_streams: 0,
      youtube_video_url: youtubeUrl,
      youtube_video_views: youtubeViews,
      spotify_embed_url: '',
      artist_bio: artistName,
      recommended_cpm_cents: 10,
      recommended_budget_cents: 10000,
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
  const videoLine = audit.youtube_video_url
    ? `\nI even found your music video on YouTube. Added that too.`
    : '';

  return `Hey ${artistName},

${audit.personal_angle}

I run Selah.fm — a platform where people make TikToks and Reels with your music. You only pay when their videos get verified views. No upfront cost.

Here's the thing: I already made a campaign page for "${trackName || 'your music'}" with your cover art and everything:${videoLine}

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
    socialProof.push(`${donationCount} ${donationCount === 1 ? 'person has' : 'people have'} chipped in $${donationTotal.toFixed(0)}`);
  }
  if (submissionCount > 0) {
    socialProof.push(`${submissionCount} ${submissionCount === 1 ? 'creator has' : 'creators have'} submitted videos`);
  }
  const proofLine = socialProof.length > 0
    ? `\nSince last week, ${socialProof.join(' and ')} on your campaign page.`
    : '';

  return `Hey ${artistName} — just a quick follow-up.${proofLine}

Your campaign page for "${trackName || 'your music'}" is still live at:
👉 ${campaignUrl}

No pressure at all. The page just keeps working — people can donate, creators can submit videos, and everything runs automatically. You can claim it whenever you want, or not at all.

Either way, your music is out there getting attention. Wanted to make sure you knew.

— Robert-Jan
  Founder, Selah.fm`;
}
