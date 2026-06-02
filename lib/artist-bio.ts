/**
 * AI-powered artist bio generator.
 * Uses DeepSeek (already configured) to generate SEO-optimized artist descriptions.
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

async function chat(messages: { role: string; content: string }[], temp: number = 0.7): Promise<string> {
  if (!DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY not configured');
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages, temperature: temp, max_tokens: 800 }),
  });
  if (!res.ok) throw new Error('DeepSeek API error: ' + res.status);
  const data = await res.json();
  return data.choices[0].message.content;
}

export async function generateArtistBio(artistName: string, genres: string[], monthlyListeners: number | null): Promise<string> {
  const genreStr = genres.length > 0 ? genres.join(', ') : 'multiple genres';
  const listenersStr = monthlyListeners ? `${monthlyListeners.toLocaleString()} monthly listeners` : 'a growing audience';

  try {
    const bio = await chat([
      { role: 'system', content: `You write short, punchy SEO-optimized artist bios for Selah.fm. 
Each bio is 80-150 words. Write in third person. Include:
- Who they are (genre, style)
- What's noteworthy about them
- A call to action at the end mentioning Selah.fm

Write naturally. Avoid superlatives like "revolutionary" or "game-changing".
No invented names, places, or stats. Only use the data provided.` },
      { role: 'user', content: `Write a bio for ${artistName}. Genre: ${genreStr}. Audience: ${listenersStr}.` },
    ], 0.7);
    return bio.slice(0, 1000);
  } catch {
    return `${artistName} is a ${genreStr} artist with ${listenersStr}. Support ${artistName} on Selah.fm — make videos, earn per view, and help promote their music.`;
  }
}

export async function generateArtistSEODescription(artistName: string, genres: string[], trackCount: number): Promise<string> {
  const genreStr = genres.slice(0, 2).join(' and ');
  const trackLabel = trackCount === 1 ? '1 track' : `${trackCount} tracks`;

  try {
    const desc = await chat([
      { role: 'system', content: 'Write a compelling 120-155 character meta description for an artist page. Include artist name, genre, and what visitors can do. End with a call to action about Selah.fm.' },
      { role: 'user', content: `Meta description for ${artistName}. ${genreStr} artist with ${trackLabel} available for video promotion. Creators can make content and earn.` },
    ], 0.5);
    return desc.slice(0, 160);
  } catch {
    return `Support ${artistName} on Selah.fm. ${genreStr} artist with ${trackLabel} available. Make videos, earn per view, and donate to support their music.`;
  }
}
