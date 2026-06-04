/**
 * Selah.fm — AI Artist Content Generator
 * Generates SEO-optimized bios, FAQ sections, and meta descriptions
 * for artist profile pages using DeepSeek.
 */

import sql from '@/lib/db';
import { getOverusedWords } from '@/lib/bio-vocabulary';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE = 'https://api.deepseek.com/v1';

async function chat(messages: { role: string; content: string }[], options: { temperature?: number; max_tokens?: number } = {}) {
  if (!DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY not configured');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 800,
      }),
    });
    if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${(await res.text()).slice(0,200)}`);
    return (await res.json()).choices[0].message.content;
  } finally { clearTimeout(timeout); }
}

const BIO_PROMPT_BASE = `You are writing SEO content for Selah.fm, a CPM music promotion marketplace.
Write a short HTML-formatted bio for an independent musician. This is a community-created support page — the artist has NOT necessarily claimed or endorsed it.

CRITICAL — ONLY use the exact facts provided. Never invent details, never claim the artist "chose" or "joined" Selah.fm. Be honest if facts are limited. Never invent achievements or milestones.

Structure:
<h1>About [Artist Name]</h1>
<p>Opening paragraph with available information about the artist</p>
<h2>Musical Style</h2>  
<p>What is known about their sound and genre (skip section if no facts provided)</p>
<h2>Support on Selah.fm</h2>
<p>This page was created by the Selah.fm community to support the artist. If you're the artist, you can claim this page. Fans can donate or make videos.</p>

Rules:
- 60-120 words total. If very few facts, 30-50 words.
- Natural, HONEST tone — no AI giveaways
- Vary your opening. Do NOT start with "In a world where", "There's something refreshing about", "In an era where", "When it comes to"
- Use concrete, specific language. Avoid vague descriptors like "captivating", "mesmerizing", "haunting"
- Max 2 <strong>bold</strong> terms total
- Never use: "Furthermore", "Moreover", "In conclusion", "chose", "partnered", "testament", "delve", "myriad", "burgeoning", "sonic tapestry"
- Return ONLY valid HTML — no markdown, no code fences
- NEVER invent details. Only use the facts provided below.`;

/**
 * Build the BIO_PROMPT, dynamically including overused words to avoid.
 */
export async function buildBioPrompt(): Promise<string> {
  const overusedWarning = await getOverusedWords();
  if (overusedWarning) {
    return BIO_PROMPT_BASE + `

${overusedWarning}`;
  }
  return BIO_PROMPT_BASE;
}

const FAQ_PROMPT = `Generate 2 FAQ entries for this artist's Selah.fm community support page.
Each FAQ must be a real question someone searching for this artist would ask.

Return ONLY a JSON array: [{"question":"...","answer":"..."}]

Rules:
- Question 1: "How can I support [artist]?" with answer about donating on Selah.fm
- Question 2: A genre-specific question (e.g., "What genre is [artist]?")
- Keep answers under 40 words each
- Be honest — don't claim the artist chose the platform
- Return ONLY valid JSON, no other text`;

/**
 * Generate SEO bio for a single artist.
 */
export async function generateArtistBio(
  artistName: string,
  genres: string[],
  monthlyListeners: number,
  trackCount: number,
  existingBio: string
): Promise<{ bio: string; faq: { question: string; answer: string }[] }> {
  const facts = [
    `Artist: ${artistName}`,
    genres.length > 0 ? `Genre: ${genres.join(', ')}` : '',
    monthlyListeners > 0 ? `Monthly listeners: ${monthlyListeners.toLocaleString()}` : '',
    trackCount > 0 ? `Tracks available: ${trackCount}` : '',
    existingBio ? `Existing bio: ${existingBio.slice(0, 200)}` : '',
  ].filter(Boolean).join('\n');

  const bioPrompt = await buildBioPrompt();
  const [bio, faqRaw] = await Promise.all([
    chat([
      { role: 'system', content: bioPrompt },
      { role: 'user', content: `Write a bio for this artist:\n\n${facts}` },
    ], { max_tokens: 500, temperature: 0.7 }),

    chat([
      { role: 'system', content: FAQ_PROMPT },
      { role: 'user', content: `Generate FAQ for this artist:\n\n${facts}` },
    ], { max_tokens: 500, temperature: 0.5 }),
  ]);

  let faq: { question: string; answer: string }[] = [];
  try {
    const match = faqRaw.match(/\[[\s\S]*\]/);
    if (match) faq = JSON.parse(match[0]).slice(0, 3);
  } catch { /* fallback */ }

  return {
    bio: bio?.trim()?.slice(0, 500) || existingBio || '',
    faq: faq.length >= 2 ? faq : [],
  };
}

/**
 * Batch generate bios for artists without them.
 * Returns count of artists processed.
 */
export async function batchGenerateBios(limit = 50): Promise<{ processed: number; errors: number }> {
  // Find artists without bios or with thin content
  const artists = await sql`
    SELECT da.id, da.artist_name, da.genres, da.monthly_listeners,
           COALESCE(aa.bio, '') as existing_bio,
           (SELECT COUNT(*)::int FROM artist_tracks at WHERE at.artist_id = da.id AND at.enabled = true) as track_count
    FROM discovered_artists da
    LEFT JOIN artist_audits aa ON aa.discovered_artist_id = da.id
    WHERE (aa.bio IS NULL OR aa.bio = '' OR LENGTH(aa.bio) < 80)
      AND EXISTS (SELECT 1 FROM artist_tracks at2 WHERE at2.artist_id = da.id AND at2.enabled = true)
    ORDER BY da.monthly_listeners DESC NULLS LAST
    LIMIT ${limit}
  `;

  let processed = 0, errors = 0;

  for (const artist of artists) {
    try {
      const genres: string[] = (() => {
        try {
          if (Array.isArray(artist.genres)) return artist.genres;
          if (typeof artist.genres === 'string') return JSON.parse(artist.genres);
        } catch { return []; }
        return [];
      })();

      const { bio, faq } = await generateArtistBio(
        artist.artist_name,
        genres,
        artist.monthly_listeners || 0,
        artist.track_count || 0,
        artist.existing_bio || ''
      );

      if (bio && bio.length > 80) {
        // Update artist_audits bio
        const [existing] = await sql`
          SELECT id FROM artist_audits WHERE discovered_artist_id = ${artist.id} LIMIT 1
        `;
        if (existing) {
          await sql`UPDATE artist_audits SET bio = ${bio} WHERE id = ${existing.id}`;
        } else {
          await sql`INSERT INTO artist_audits (discovered_artist_id, artist_bio) VALUES (${artist.id}, ${bio})`;
        }
        processed++;
      }
    } catch {
      errors++;
    }
  }

  return { processed, errors };
}

/**
 * Generate a full SEO description for artist page metadata.
 */
export function generateMetaDescription(
  artistName: string,
  trackCount: number,
  genres: string[]
): string {
  const genreStr = genres.slice(0, 2).join(' and ');
  const trackStr = trackCount === 1 ? '1 track' : `${trackCount} tracks`;
  const parts = [`Support ${artistName} on Selah.fm. ${trackStr} available.`];
  if (genreStr) parts.push(`${genreStr} artist.`);
  parts.push('Donate, make videos, and earn per view.');
  return parts.join(' ').slice(0, 160);
}
