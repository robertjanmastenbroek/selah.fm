/**
 * Outreach Video Generator — produces Instagram Reels for artist outreach.
 * 
 * Backend abstraction: currently uses Shotstack API (cloud render, no GPU).
 * Swap to MoneyPrinterTurbo when Railway Docker is deployed.
 * 
 * Pipeline:
 *   1. DeepSeek generates video script (15-30s narrative)
 *   2. Pexels finds genre-matching stock footage
 *   3. Shotstack renders: footage + text overlay + artist track as BGM
 *   4. Returns video URL + caption + DM template
 */

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE = 'https://api.deepseek.com/v1';
const PEXELS_KEY = process.env.PEXELS_API_KEY;
const SHOTSTACK_KEY = process.env.SHOTSTACK_API_KEY;

export interface VideoGenerationInput {
  artistName: string;
  trackName: string;
  genre: string;
  coverArtUrl: string;
  campaignSlug: string;
  instagramHandle: string;
  trackUrl?: string;  // Background music URL
}

export interface VideoGenerationOutput {
  videoUrl: string;
  caption: string;
  dmTemplate: string;
  script: string;
  duration: number;
}

/**
 * Generate a video script via DeepSeek.
 * Returns a short narrative promoting the artist's track.
 */
async function generateScript(input: VideoGenerationInput): Promise<string> {
  if (!DEEPSEEK_KEY) {
    return `Independent artist ${input.artistName} just dropped "${input.trackName}". We built a campaign page for it on Selah.fm — creators can make TikToks and Reels with this song and earn per view. The artist pays only for verified views. Zero upfront cost. Link in bio.`;
  }

  const prompt = `Write a 15-30 second video script promoting an independent artist's track on Selah.fm.

ARTIST: ${input.artistName}
TRACK: "${input.trackName}"
GENRE: ${input.genre}
INSTAGRAM: @${input.instagramHandle}

RULES:
- 3-4 short sentences, total read time 15-25 seconds
- Hook in first 3 seconds: "This is [artist] and you need to hear this"
- Mention: we built a campaign page, creators earn per view making TikToks, artist pays only for verified views
- End with: "Link in bio" or "Tap the link in our bio"
- Warm, energetic, authentic — not corporate
- NO hashtags, NO emojis (text is for voiceover)
- Return ONLY the script text`;

  try {
    const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You write short, punchy video scripts for music promotion. Return ONLY the script text.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.85,
        max_tokens: 200,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() || '';
    }
  } catch {}

  return `This is ${input.artistName}. Their track "${input.trackName}" deserves way more ears. We built a campaign page on Selah.fm so creators can make TikToks with this song and earn per view. Zero cost for the artist — you only pay for results. Link in bio.`;
}

/**
 * Find genre-matching footage from Pexels.
 * Returns 3-5 video clip URLs for the video composition.
 */
async function findFootage(genre: string): Promise<string[]> {
  const genreQueries: Record<string, string> = {
    electronic: 'neon city night music',
    'hip-hop': 'urban street hip hop',
    rock: 'band live concert',
    indie: 'vintage film nature',
    folk: 'acoustic nature forest',
    metal: 'dark dramatic energy',
    pop: 'colorful vibrant party',
    ambient: 'clouds sunset calm',
    jazz: 'city night jazz club',
    classical: 'orchestra concert hall',
    'r-n-b': 'night lights soul',
    alternative: 'indie aesthetic film',
    punk: 'grunge urban street',
    reggae: 'beach tropical sunset',
    country: 'road trip countryside',
  };

  const query = genreQueries[genre.toLowerCase()] || 'music studio creative';
  const clips: string[] = [];

  try {
    const res = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=5&orientation=portrait&size=medium`,
      { headers: { Authorization: PEXELS_KEY || '' } }
    );
    if (res.ok) {
      const data = await res.json();
      for (const video of (data.videos || []).slice(0, 3)) {
        const file = video.video_files?.find((f: any) => f.width === 1080 || f.height === 1920)
                  || video.video_files?.[0];
        if (file?.link) clips.push(file.link);
      }
    }
  } catch {}

  return clips;
}

/**
 * Generate IG caption for the video post.
 */
async function generateCaption(input: VideoGenerationInput): Promise<string> {
  return `🎵 "${input.trackName}" by ${input.artistName}

We discovered this track and built a campaign page for it. Creators can make TikToks & Reels with this song and earn per verified view.

The artist pays only for results. Zero upfront cost.

👉 https://selah.fm/c/${input.campaignSlug}?utm_source=instagram&utm_medium=reel

#${input.genre.replace(/\s+/g, '')} #independentartist #musicpromotion #selahfm #newmusic @${input.instagramHandle}`;
}

/**
 * Generate DM template for follow-up.
 */
async function generateDMTemplate(input: VideoGenerationInput): Promise<string> {
  if (!DEEPSEEK_KEY) {
    return `Hey ${input.artistName} — we just posted a reel featuring "${input.trackName}" on @selahfm.

Here's the thing: we also built a campaign page for this track. Creators can make TikToks or Reels with your song and earn per view. You only pay for verified views. No upfront cost.

👉 https://selah.fm/c/${input.campaignSlug}?utm_source=instagram&utm_medium=dm

No pressure at all. Just claim it whenever you want.

— Robert-Jan (founder, Selah.fm)`;
  }

  try {
    const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: `You are Robert-Jan Mastenbroek, founder of Selah.fm. Write a short, warm Instagram DM to an artist we just featured in a reel on @selahfm. Mention their track by name. Tell them we built a campaign page. Creators earn per view, artist pays only for verified views. Include the campaign URL. Soft close: no pressure, claim when ready. Sign as — Robert-Jan (founder, Selah.fm). Under 120 words. Return ONLY the message.` },
          { role: 'user', content: `Artist: ${input.artistName}\nTrack: "${input.trackName}"\nCampaign: https://selah.fm/c/${input.campaignSlug}\nInstagram: @${input.instagramHandle}` },
        ],
        temperature: 0.9,
        max_tokens: 300,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() || '';
    }
  } catch {}

  return `Hey ${input.artistName} — we featured "${input.trackName}" in a reel on @selahfm.

Also built a campaign page for it: creators make TikToks with your song, earn per view, you pay only for verified views.

👉 https://selah.fm/c/${input.campaignSlug}

Claim it whenever. No pressure.

— Robert-Jan (founder, Selah.fm)`;
}

/**
 * Render video via Shotstack API.
 * Shotstack is a cloud video rendering service — no GPU needed.
 * $19/mo for 30 videos ($0.63/video after).
 * 
 * If SHOTSTACK_API_KEY is not set, returns a placeholder (cover art + text).
 */
async function renderVideo(script: string, clips: string[], input: VideoGenerationInput): Promise<string | null> {
  if (!SHOTSTACK_KEY) {
    console.warn('[video-gen] No SHOTSTACK_API_KEY — skipping video render, using placeholder');
    // Return the cover art as a fallback "video" (image post)
    return null;
  }

  const campaignUrl = `https://selah.fm/c/${input.campaignSlug}`;

  try {
    const res = await fetch('https://api.shotstack.io/edit/v1/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SHOTSTACK_KEY,
      },
      body: JSON.stringify({
        timeline: {
          soundtrack: input.trackUrl ? { src: input.trackUrl, effect: 'fadeOut' } : undefined,
          background: '#0A0A0A',
          tracks: [
            // Video clips track
            {
              clips: clips.slice(0, 3).map((url, i) => ({
                asset: { type: 'video', src: url },
                start: i * 5,
                length: 5,
                fit: 'crop',
              })),
            },
            // Text overlay track
            {
              clips: [
                {
                  asset: {
                    type: 'html',
                    html: `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%"><p style="color:white;font-family:sans-serif;font-size:48px;text-align:center;padding:40px;text-shadow:2px 2px 8px rgba(0,0,0,0.8)">${script.replace(/"/g, '&quot;')}</p></div>`,
                    width: 1080,
                    height: 1920,
                  },
                  start: 0,
                  length: 15,
                },
              ],
            },
            // Logo watermark
            {
              clips: [
                {
                  asset: {
                    type: 'image',
                    src: 'https://selah.fm/images/selah-nav-logo.png',
                  },
                  start: 13,
                  length: 3,
                  position: 'bottomRight',
                  offset: { x: 0.05, y: 0.05 },
                  scale: 0.3,
                },
              ],
            },
          ],
        },
        output: {
          format: 'mp4',
          resolution: '1080p',
          aspectRatio: '9:16',
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      // Shotstack returns { success: true, response: { id: "..." } }
      // We need to poll for the render to complete
      if (data.response?.id) {
        // Poll for completion (Shotstack renders in 30-90 seconds)
        const renderId = data.response.id;
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 3000));
          const pollRes = await fetch(`https://api.shotstack.io/edit/v1/render/${renderId}`, {
            headers: { 'x-api-key': SHOTSTACK_KEY },
          });
          if (pollRes.ok) {
            const pollData = await pollRes.json();
            if (pollData.response?.status === 'done') {
              return pollData.response.url;
            }
            if (pollData.response?.status === 'failed') {
              console.error('[video-gen] Shotstack render failed:', pollData.response.error);
              return null;
            }
          }
        }
      }
    } else {
      console.error('[video-gen] Shotstack API error:', await res.text());
    }
  } catch (e: any) {
    console.error('[video-gen] Shotstack render error:', e.message);
  }

  return null;
}

/**
 * Main entry point: generate a complete outreach video package.
 * Returns video URL, caption, DM template, and script.
 */
export async function generateOutreachVideo(input: VideoGenerationInput): Promise<VideoGenerationOutput> {
  console.log(`[video-gen] Generating video for ${input.artistName} — "${input.trackName}"`);

  // Step 1: Generate script
  const script = await generateScript(input);
  console.log(`[video-gen] Script: "${script.slice(0, 80)}..."`);

  // Step 2: Find footage
  const clips = await findFootage(input.genre);
  console.log(`[video-gen] Footage clips: ${clips.length}`);

  // Step 3: Render video
  const videoUrl = await renderVideo(script, clips, input);

  // Step 4: Generate caption + DM
  const [caption, dmTemplate] = await Promise.all([
    generateCaption(input),
    generateDMTemplate(input),
  ]);

  return {
    videoUrl: videoUrl || input.coverArtUrl || '/images/og-image.jpg',
    caption,
    dmTemplate,
    script,
    duration: 15, // approximate
  };
}
