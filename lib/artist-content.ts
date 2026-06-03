/**
 * Selah.fm — AI Artist Content Generator
 * Generates SEO-optimized bios, FAQ sections, and meta descriptions
 * for artist profile pages using DeepSeek.
 */

import sql from '@/lib/db';

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

const BIO_PROMPT = `You are writing SEO content for Selah.fm, a CPM marketplace for music promotion.
Write a short, informative bio for an independent musician. Include their genre, notable facts, and what makes them unique.

Rules:
- 80-150 words maximum
- Natural, factual tone — no hype or marketing language
- Mention genre and style
- Include notable achievements or characteristics
- End with a sentence about how fans can support them on Selah.fm
- No markdown, no JSON wrapping — just plain text
- Never invent details. Only use the facts provided below.`;

const FAQ_PROMPT = `Generate 3 FAQ entries for this artist's Selah.fm profile page.
Each FAQ must be a real question someone searching for this artist would ask.

Return ONLY a JSON array: [{"question":"...","answer":"..."}]

Rules:
- Question 1: Always "How can I support [artist]?" with answer about donating on Selah.fm
- Question 2: Always "How can I make a video for [artist]'s music?" with answer about earning per view
- Question 3: A genre-specific question (e.g., "What genre is [artist]?")
- Keep answers under 50 words each
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

  const [bio, faqRaw] = await Promise.all([
    chat([
      { role: 'system', content: BIO_PROMPT },
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
