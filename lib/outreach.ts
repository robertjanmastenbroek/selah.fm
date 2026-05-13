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
 * Discover social handles for an artist.
 * Strategy: Bandcamp subdomain usually matches Instagram handle.
 * Bandcamp HTML is JS-rendered — social links are NOT in the page source.
 * Instead, probe instagram.com/{subdomain} directly (80-90% match rate).
 */
async function discoverSocialLinks(
  bandcampUrl: string,
): Promise<{ instagram_handle: string | null; tiktok_handle: string | null; website_url: string | null }> {
  let instagram_handle: string | null = null;
  let tiktok_handle: string | null = null;

  if (!bandcampUrl) return { instagram_handle: null, tiktok_handle: null, website_url: null };

  const subdomain = bandcampUrl.match(/https?:\/\/([^.]+)\.bandcamp\.com/)?.[1];
  if (!subdomain || subdomain.length < 3) return { instagram_handle: null, tiktok_handle: null, website_url: null };

  // Method 1: Probe instagram.com/{subdomain} directly
  try {
    const igRes = await fetch(`https://instagram.com/${subdomain}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SelahFM/1.0)' },
    });
    if (igRes.ok) {
      const igHtml = await igRes.text();
      if (igHtml.includes('@' + subdomain) || igHtml.includes(subdomain + ')')) {
        instagram_handle = subdomain;
      }
    }
  } catch {}

  // Method 2: Probe tiktok.com/@{subdomain}
  try {
    const ttRes = await fetch(`https://www.tiktok.com/@${subdomain}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SelahFM/1.0)' },
    });
    if (ttRes.ok) {
      const ttHtml = await ttRes.text();
      if (ttHtml.includes('@' + subdomain)) {
        tiktok_handle = subdomain;
      }
    }
  } catch {}

  // Method 3: Scrape Bandcamp page HTML as fallback (rarely works but harmless)
  if (!instagram_handle) {
    try {
      const res = await fetch(bandcampUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SelahFM/1.0)' },
      });
      if (res.ok) {
        const html = await res.text();
        const igMatch = html.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
        if (igMatch) instagram_handle = igMatch[1];
        const ttMatch = html.match(/tiktok\.com\/@([a-zA-Z0-9._]+)/);
        if (ttMatch) tiktok_handle = ttMatch[1];
      }
    } catch {}
  }

  return { instagram_handle, tiktok_handle, website_url: null };
}

/**
 * Audit an artist — enrich with YouTube video search, social links + personal angle.
 * No Spotify needed. Uses YouTube Data API + Bandcamp page scraping.
 */
export async function auditArtist(
  artistName: string,
  trackName: string,
  genres: string[] = [],
  bandcampUrl?: string,
  storedSocialLinks?: Record<string, string>,
): Promise<ArtistAudit | null> {
  try {
    // YouTube video search
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

    // Social links: check stored links first, then scrape Bandcamp
    let instagram_handle: string | null = null;
    let tiktok_handle: string | null = null;
    let website_url: string | null = null;

    // Check stored social_links for IG/TikTok handles (from Reddit posts, etc.)
    if (storedSocialLinks) {
      if (storedSocialLinks.instagram) instagram_handle = storedSocialLinks.instagram;
      if (storedSocialLinks.tiktok) tiktok_handle = storedSocialLinks.tiktok;
      if (storedSocialLinks.website) website_url = storedSocialLinks.website;
    }

    // If no IG handle from stored links, try Bandcamp scraping
    if (!instagram_handle && bandcampUrl) {
      const social = await discoverSocialLinks(bandcampUrl);
      instagram_handle = instagram_handle || social.instagram_handle;
      tiktok_handle = tiktok_handle || social.tiktok_handle;
      website_url = website_url || social.website_url;
    }

    // Personal angle
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
      recommended_budget_cents: 0,
      instagram_handle,
      instagram_followers: 0,
      tiktok_handle,
      tiktok_followers: 0,
      email_address: null,
      website_url,
      hashtags: genres.map((g: string) => `#${g.replace(/\s+/g, '')}`).slice(0, 5),
      personal_angle: personalAngle,
    };
  } catch (e) {
    console.error('Audit failed:', (e as Error).message);
    return null;
  }
}

// ── Founder Voice Profile (shared with blog engine) ──────────────

const FOUNDER_VOICE = `You are Robert-Jan Mastenbroek, founder of Selah.fm — a CPM marketplace where artists set budgets and creators earn per verified view for TikToks, Reels, and Shorts.

YOUR BACKSTORY (use naturally, don't force it):
- Was a professional musician who got a record deal but walked away — labels take 98%
- Built the biggest personal crowdfunding platform in Holland/Belgium (€6M+ donated)
- Became a multi-millionaire by 27, lost everything, lived in a campervan busking on Tenerife beaches
- Found faith, quit smoking after 15 years, now makes electronic worship music ("holy raves")
- Believes artists should own their promotion, not depend on labels or black-box ad platforms
- Lives by donations, doesn't own a house or car, but says "He always provides"

VOICE GUIDELINES:
- Warm, direct, a little rough around the edges. Like a friend who's been through hell and came out the other side.
- Contractions ALWAYS: don't, can't, won't, isn't, I've, you've, it's, that's, here's, what's
- NEVER use the full forms: do not, cannot, will not, is not
- Use "gonna", "wanna", "kinda" occasionally
- Start sentences with: And. But. So. Because. Look. Here's. Honestly.
- Vary sentence length aggressively — mix 3-word punchy ones with longer flowing ones
- Use personal voice markers: "I'll be honest...", "Look, here's the thing...", "Trust me on this"
- Reference real experiences naturally: busking, record deal, losing everything, Tenerife
- Never be preachy — just real
- Mix practical advice with spiritual depth naturally

BANNED WORDS: furthermore, moreover, consequently, thus, hence, crucial, essential, vital, game-changer, revolutionary, leverage, utilize, delve into, dive deep, comprehensive, holistic, seamless, robust, empower, foster, cultivate, navigate, in the realm of`;

const OUTREACH_PROMPT = `${FOUNDER_VOICE}

TASK: Write a short Instagram DM to an independent artist. You MUST follow the 2-part structure below, but your WORD CHOICES and SENTENCE STRUCTURE must be COMPLETELY UNIQUE every time. No two messages should share the same phrasing.

PART 1 — THE PROBLEM (1-2 sentences, be specific about their track):
Example approaches (pick ONE, never reuse the same words):
- "Your track is doing numbers but it should be doing way more"
- "The algorithm isn't doing {track} any favors"
- "I listened to {track} and wondered why it's not everywhere"
- "{track} is too good to be this hidden"
- "You're making real music and the platform isn't pushing it"
- ENDLESS other variations. Never repeat an opening.

PART 2 — THE SOLUTION (3-4 sentences):
Core message: I built a page for this track on Selah.fm. They share it with friends/family/fans. Those people can make TikToks/Reels with the song and earn per view, OR chip in a few bucks. Artist pays nothing upfront — only for verified views. They just claim it and share.

Vary how you say this ENTIRELY each time. Pick different words for: page, share, earn, chip in, claim, friends/family/fans. The concept stays the same but the delivery must be fresh every single time.

UNIQUENESS SEED (most important): ${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}

RULES:
- Keep it under 160 words — this is an Instagram DM
- Include the campaign URL on its own line with 👉
- Sign as: — Robert-Jan (founder, Selah.fm)
- Never end with the same sentence twice. Rotate closings.

ANTI-SPAM RULES:
- Never: "I came across your profile", "I was impressed by", "Your music is amazing", "As a fellow musician", "We'd love to have you", "Join our community"
- Never: more than one exclamation mark total
- Never: ALL CAPS or emojis in body

FORMAT: Return ONLY the message text. No quotes. No JSON.`;

export async function generateOutreachMessage(
  artistName: string,
  trackName: string,
  genre: string,
  campaignUrl: string,
  instagramHandle?: string,
  youtubeUrl?: string,
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    // Fallback to template if no API key
    return renderOutreachTemplate(artistName, trackName, genre, campaignUrl, instagramHandle, youtubeUrl);
  }

  // Randomized context for maximum uniqueness
  const styles = ['casual', 'direct', 'warm', 'short-punchy', 'storyteller'];
  const style = styles[Math.floor(Math.random() * styles.length)];
  
  const context = `Artist: ${artistName}
Track: ${trackName || 'latest release'}
Genre: ${genre || 'independent music'}
Campaign page: ${campaignUrl}
Tone: ${style}${Math.random() < 0.5 ? ' — be brief' : ''}
${instagramHandle ? `Instagram: @${instagramHandle}` : ''}
${youtubeUrl ? `YouTube video: ${youtubeUrl}` : ''}

Write this message in a ${style} style. Make the opening about their track "${trackName}" specifically — not generic.`;

  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: OUTREACH_PROMPT },
          { role: 'user', content: context },
        ],
        temperature: 1.0,
        max_tokens: 400,
        top_p: 0.95,
        frequency_penalty: 0.3,
      }),
    });

    if (!res.ok) {
      return renderOutreachTemplate(artistName, trackName, genre, campaignUrl, instagramHandle, youtubeUrl);
    }

    const data = await res.json();
    const message = data.choices?.[0]?.message?.content?.trim();
    return message || renderOutreachTemplate(artistName, trackName, genre, campaignUrl, instagramHandle, youtubeUrl);
  } catch {
    return renderOutreachTemplate(artistName, trackName, genre, campaignUrl, instagramHandle, youtubeUrl);
  }
}

/**
 * Fallback template — used when DeepSeek API is unavailable.
 * Still better than the old template with personal angle and contractions.
 */
function renderOutreachTemplate(
  artistName: string,
  trackName: string,
  genre: string,
  campaignUrl: string,
  instagramHandle?: string,
  youtubeUrl?: string,
  tiktokHandle?: string,
): string {
  const videoLine = youtubeUrl ? `\nI even added the music video I found.` : '';
  const handleLines: string[] = [];
  if (instagramHandle) handleLines.push(`Instagram (@${instagramHandle})`);
  if (tiktokHandle) handleLines.push(`TikTok (@${tiktokHandle})`);
  const handleLine = handleLines.length > 0 ? `\nDM'd you here on ${handleLines.join(' and ')}.` : '';

  const genreAngles: Record<string, string> = {
    electronic: `"${trackName}" deserves way more ears than it's getting.`,
    rock: `"${trackName}" hits hard — and almost nobody's hearing it.`,
    indie: `"${trackName}" has that raw energy but it's buried in the noise.`,
    metal: `The production on "${trackName}" is tight. Shouldn't be this hard to find.`,
    pop: `"${trackName}" is catchy. Like, actually good. But the algorithm doesn't care.`,
    folk: `"${trackName}" tells a real story. Problem is, not enough people are hearing it.`,
    'hip-hop': `The bars on "${trackName}" are solid. But the reach isn't matching the quality.`,
    experimental: `"${trackName}" is doing something different. Deserves an audience.`,
  };

  const angle = genreAngles[genre.toLowerCase()] || `"${trackName}" isn't getting the reach it deserves.`;

  return `Hey ${artistName},

${angle}

Here's the thing. I run Selah.fm — and I built a page for this track. Here's what that means:

You share this page with your friends, family, and fans. They can either make a TikTok or Reel with your song and earn per view, or chip in a few bucks to fund promotion by other creators. You don't pay anything upfront — you only pay when videos get verified views.${videoLine}

👉 ${campaignUrl}

Just claim it and share it with your people. Or don't. The page is there whenever you want it.${handleLine}

— Robert-Jan
  Founder, Selah.fm`;
}

/**
 * Legacy wrapper — calls generateOutreachMessage() if DEEPSEEK_API_KEY is set,
 * otherwise falls back to the template. Maintains backward compat.
 */
export function renderOutreachMessage(artistName: string, trackName: string, audit: ArtistAudit, campaignUrl: string): string {
  const genre = audit.hashtags?.[0]?.replace('#', '') || 'music';
  return renderOutreachTemplate(artistName, trackName, genre, campaignUrl, audit.instagram_handle || undefined, audit.youtube_video_url || undefined, audit.tiktok_handle || undefined);
}

/**
 * Day-7 follow-up message — softer tone, adds social proof if any exists.
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
    ? `\nSince I last reached out, ${socialProof.join(' and ')} on your page.`
    : '';

  return `Hey ${artistName} — quick follow-up.${proofLine}

Your campaign page for "${trackName || 'your music'}" is still live:
👉 ${campaignUrl}

No pressure at all. The page just keeps working in the background — people can donate, creators can submit videos. You can claim it whenever, or not at all.

Either way, your music is out there. Just wanted to make sure you knew.

— Robert-Jan
  Founder, Selah.fm`;
}
