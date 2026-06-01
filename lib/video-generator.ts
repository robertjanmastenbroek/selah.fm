/**
 * Outreach Video Generator — MoneyPrinterTurbo-powered Instagram Reels.
 * 
 * Calls local MPT API (http://localhost:8080) for video generation.
 * MPT handles: AI script → stock footage → voiceover → subtitles → music → MP4.
 * 
 * DeepSeek is used for LLM (script + DM), MPT does the video rendering.
 */

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE = 'https://api.deepseek.com/v1';
const MPT_API = process.env.MPT_API_URL || 'http://localhost:8080';

export interface VideoGenerationInput {
  artistName: string;
  trackName: string;
  genre: string;
  coverArtUrl: string;
  campaignSlug: string;
  instagramHandle: string;
}

export interface VideoGenerationOutput {
  videoUrl: string;
  caption: string;
  dmTemplate: string;
  script: string;
  duration: number;
}

/**
 * Generate outreach video via MoneyPrinterTurbo API.
 * POST /api/v1/videos with video params.
 * Falls back to cover art if MPT is unavailable.
 */
async function callMptApi(script: string, input: VideoGenerationInput): Promise<string | null> {
  try {
    const res = await fetch(`${MPT_API}/api/v1/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_subject: `${input.artistName} — "${input.trackName}" | Selah.fm`,
        video_script: script,
        video_aspect: 'portrait',
        voice_name: 'en-US-EmmaMultilingualNeural',
        bgm_name: 'random',
        font_name: 'STHeitiMedium 黑体-中',
        text_color: '#FFFFFF',
        font_size: 60,
        stroke_color: '#000000',
        stroke_width: 1.5,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (res.ok) {
      const data = await res.json();
      return data.video_url || data.url || null;
    }

    console.warn('[video-gen] MPT API returned', res.status);
  } catch (e: any) {
    console.warn('[video-gen] MPT API unavailable:', e.message);
  }

  console.log('[video-gen] MPT unavailable — falling back to cover art');
  return null;
}

async function generateScript(input: VideoGenerationInput): Promise<string> {
  if (!DEEPSEEK_KEY) {
    return `Independent artist ${input.artistName} just dropped "${input.trackName}". We built a campaign page for it on Selah.fm — creators can make TikToks and Reels with this song and earn per view. The artist pays only for verified views. Link in bio.`;
  }

  try {
    const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You write short, punchy video scripts for music promotion. Return ONLY the script text.' },
          { role: 'user', content: `Write a 15-25 second video script:\nArtist: ${input.artistName}\nTrack: "${input.trackName}"\nHook: "This is [artist] and you need to hear this"\nMiddle: we built a campaign page, creators earn per view\nEnd: zero upfront cost, link in bio. Return ONLY the script.` },
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

function generateCaption(input: VideoGenerationInput): string {
  const cleanGenre = input.genre.replace(/^(bandcamp\s+|reddit\s+|youtube\s+)/i, '');
  return `🎵 "${input.trackName}" by ${input.artistName}

We discovered this track and built a campaign page. Creators make TikToks & Reels with this song and earn per verified view. Artist pays only for results.

👉 https://selah.fm/c/${input.campaignSlug}?utm_source=instagram&utm_medium=reel

#${cleanGenre.replace(/\s+/g, '') || 'independentartist'} #musicpromotion #selahfm @${input.instagramHandle}`;
}

async function generateDMTemplate(input: VideoGenerationInput): Promise<string> {
  const url = `https://selah.fm/c/${input.campaignSlug}?utm_source=instagram&utm_medium=dm`;

  if (!DEEPSEEK_KEY) {
    return `Hey ${input.artistName} — we featured "${input.trackName}" on @selahfm.\n\nAlso built a campaign page: creators make TikToks with your song, earn per view, you pay only for verified views.\n\n👉 ${url}\n\nClaim it whenever. No pressure.\n\n— Robert-Jan (founder, Selah.fm)`;
  }

  try {
    const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are Robert-Jan Mastenbroek, founder of Selah.fm. Write a short, warm Instagram DM to an artist we featured in a reel. Mention their track. Campaign page exists. Creators earn per view. Include URL. Under 120 words. Return ONLY the message.' },
          { role: 'user', content: `Artist: ${input.artistName}\nTrack: "${input.trackName}"\nCampaign: ${url}\nInstagram: @${input.instagramHandle}` },
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

  return `Hey ${input.artistName} — we featured "${input.trackName}" on @selahfm.\n\nAlso built a campaign page: creators make TikToks with your song, earn per view, you pay only for verified views.\n\n👉 ${url}\n\nClaim it whenever. No pressure.\n\n— Robert-Jan (founder, Selah.fm)`;
}

export async function generateOutreachVideo(input: VideoGenerationInput): Promise<VideoGenerationOutput> {
  console.log(`[video-gen] ${input.artistName} — "${input.trackName}"`);

  const script = await generateScript(input);
  const videoUrl = await callMptApi(script, input);
  const caption = generateCaption(input);
  const dmTemplate = await generateDMTemplate(input);

  return {
    videoUrl: videoUrl || input.coverArtUrl || '/images/og-image.jpg',
    caption,
    dmTemplate,
    script,
    duration: 15,
  };
}
