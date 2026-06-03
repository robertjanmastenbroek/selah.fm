import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/artist/bio
 * Generates a 300-800 word bio for the given artist using DeepSeek.
 * Body: { artistId: string } or { artistName: string, genres: string[], tracks?: string[], listeners?: number }
 * Response: { bio: string, word_count: number }
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { artistId, artistName: manualName } = await request.json();

    // Load artist data from DB or use provided data
    let artistName = manualName || '';
    let genres: string[] = [];
    let trackCount = 0;
    let monthlyListeners = 0;
    let totalStreams = 0;
    let totalFollowers = 0;

    if (artistId) {
      const [artist] = await sql`
        SELECT da.artist_name, da.genres, da.monthly_listeners,
               ap.total_streams, ap.total_followers
        FROM discovered_artists da
        LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
        WHERE da.id = ${artistId}
        LIMIT 1
      `;
      if (!artist) {
        return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
      }
      artistName = artist.artist_name;
      genres = Array.isArray(artist.genres) ? artist.genres
        : typeof artist.genres === 'string' ? [artist.genres]
        : [];
      monthlyListeners = artist.monthly_listeners || 0;
      totalStreams = artist.total_streams || 0;
      totalFollowers = artist.total_followers || 0;

      // Count tracks
      const [{ count }] = await sql`
        SELECT COUNT(*)::int FROM artist_tracks WHERE artist_id = ${artistId} AND enabled = true
      `;
      trackCount = count || 0;
    }

    // Build the bio via DeepSeek
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'DeepSeek API key not configured' }, { status: 500 });
    }

    const bio = await generateBio(artistName, genres, trackCount, monthlyListeners, totalStreams, totalFollowers);

    return NextResponse.json({
      bio,
      word_count: bio.split(/\s+/).length,
      artist: artistName,
      genres,
      track_count: trackCount,
      monthly_listeners: monthlyListeners,
    });
  } catch (e: any) {
    console.error('Bio generation error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function generateBio(
  name: string,
  genres: string[],
  trackCount: number,
  monthlyListeners: number,
  totalStreams: number,
  totalFollowers: number
): Promise<string> {
  const genreStr = genres.length > 0 ? genres.join(', ') : 'independent';
  const listenerStr = monthlyListeners > 0
    ? `${monthlyListeners >= 1000 ? (monthlyListeners / 1000).toFixed(1) + 'K' : String(monthlyListeners)}`
    : '';
  const streamStr = totalStreams > 0
    ? `${totalStreams >= 1000000 ? (totalStreams / 1000000).toFixed(1) + 'M' : totalStreams >= 1000 ? (totalStreams / 1000).toFixed(1) + 'K' : String(totalStreams)}`
    : '';
  const followerStr = totalFollowers > 0
    ? `${totalFollowers >= 1000 ? (totalFollowers / 1000).toFixed(1) + 'K' : String(totalFollowers)}`
    : '';

  const depth = monthlyListeners > 50000 ? 'full' : monthlyListeners > 5000 ? 'standard' : 'short';

  const prompt = depth === 'full' ? `Write a 400-800 word Rolling Stone-style mini-feature about the ${genreStr} artist "${name}".
Use the following verified data:
${monthlyListeners > 0 ? `- Monthly listeners: ${listenerStr}` : ''}
${totalStreams > 0 ? `- Total streams: ${streamStr}` : ''}
${totalFollowers > 0 ? `- Total followers: ${followerStr}` : ''}
${trackCount > 0 ? `- Tracks available: ${trackCount}` : ''}

WRITING RULES (critical):
1. OPENING: Start with a scene-setting paragraph. Show the artist in a moment.
2. VOICE: Warm, respectful, enthusiastic. Like a friend introducing you to great music.
3. STRUCTURE:
   - Opening scene (1 paragraph)
   - Who they are and their sound (1-2 paragraphs)
   - Their journey / creative approach (1-2 paragraphs)
   - What's next / why they matter (1 paragraph)
4. FACTS: Only use the data above. Do NOT invent album names, tour dates, or collaborations.
5. TONE: Always positive. This is a compliment, not a critique.
6. QUOTES: Do NOT include fake quotes from the artist. Write in third person.
7. INTERNAL LINKS: Near the end, naturally mention that readers can "support ${name} on Selah.fm"
8. LENGTH: 400-800 words.
9. PARAGRAPHS: 4-6 paragraphs. Vary sentence length. No lists or bullet points.
10. OUTPUT: Return ONLY the article text. No markdown, no headers, no formatting.`
: depth === 'standard' ? `Write a 200-400 word profile of the ${genreStr} artist "${name}".
Use the following verified data:
${monthlyListeners > 0 ? `- Monthly listeners: ${listenerStr}` : ''}
${totalStreams > 0 ? `- Total streams: ${streamStr}` : ''}
${totalFollowers > 0 ? `- Total followers: ${followerStr}` : ''}
${trackCount > 0 ? `- Tracks available: ${trackCount}` : ''}

WRITING RULES (critical):
1. VOICE: Warm and professional. Like a music blogger sharing a discovery.
2. STRUCTURE: Who they are → Their sound → Why they're worth following.
3. FACTS: Only use the data above. Do NOT invent anything.
4. QUOTES: No fake quotes from the artist.
5. TONE: Always positive and complimentary.
6. LENGTH: 200-400 words.
7. OUTPUT: Return ONLY the article text. No formatting, no markdown.`
: `Write a 150-250 word spotlight blurb about the ${genreStr} artist "${name}".
${trackCount > 0 ? `They have ${trackCount} tracks available.` : ''}

WRITING RULES (critical):
1. Keep it short and punchy.
2. Describe their sound and vibe based on their genre.
3. End with a sentence about supporting them on Selah.fm.
4. Do NOT invent facts.
5. OUTPUT: Return ONLY the blurb text. No formatting.`;

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a music journalist for Rolling Stone. Write warm, respectful, enthusiastic mini-features about independent artists. Every article is a compliment the artist would be proud to share.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1500,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  let bio = data.choices?.[0]?.message?.content || '';
  
  // Clean up any markdown or formatting
  bio = bio.replace(/^#+\s*/gm, '').replace(/\*\*/g, '').replace(/^[-*]\s*/gm, '').trim();

  return bio;
}
