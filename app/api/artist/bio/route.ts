import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/artist/bio
 * Generates a 350-900 word bio for the given artist using DeepSeek V4 Flash.
 * Body: { artistId: string }
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { artistId } = await request.json();
    if (!artistId) return NextResponse.json({ error: 'artistId required' }, { status: 400 });

    // Load artist data from DB
    const [artist] = await sql`
      SELECT da.artist_name, da.genres, da.monthly_listeners,
             ap.total_streams, ap.total_followers, ap.spotify_image_url
      FROM discovered_artists da
      LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE da.id = ${artistId}
      LIMIT 1
    `;
    if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

    const name = artist.artist_name;
    
    // Parse genres safely
    const rawGenres = artist.genres;
    let genres: string[] = [];
    if (Array.isArray(rawGenres)) genres = rawGenres;
    else if (typeof rawGenres === 'string') {
      try { genres = JSON.parse(rawGenres); }
      catch { genres = [rawGenres]; }
    }

    // Gather all available data
    const monthlyListeners = artist.monthly_listeners || 0;
    const totalStreams = artist.total_streams || 0;
    const totalFollowers = artist.total_followers || 0;

    // Count tracks
    const [{ count }] = await sql`
      SELECT COUNT(*)::int FROM artist_tracks WHERE artist_id = ${artistId} AND enabled = true
    `;
    const trackCount = count || 0;

    // Generate bio
    const bio = await generateBio(name, genres, trackCount, monthlyListeners, totalStreams, totalFollowers);

    return NextResponse.json({
      bio,
      word_count: bio.split(/\s+/).length,
      artist: name,
      genres_used: genres,
      track_count: trackCount,
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
  // Round numbers — never use exact counts
  const streamStr = totalStreams >= 1000000
    ? `over ${(totalStreams / 1000000).toFixed(1)} million streams`
    : totalStreams >= 100000
      ? `over ${Math.floor(totalStreams / 1000)}K streams`
      : totalStreams >= 50000
        ? `tens of thousands of streams`
        : totalStreams >= 10000
          ? `thousands of streams`
          : '';

  const followerStr = totalFollowers >= 100000
    ? `over ${(totalFollowers / 1000).toFixed(0)}K followers`
    : totalFollowers >= 10000
      ? `thousands of followers`
      : totalFollowers >= 1000
        ? `a growing following`
        : '';

  const listenerStr = monthlyListeners >= 100000
    ? `over ${(monthlyListeners / 1000).toFixed(0)}K monthly listeners`
    : monthlyListeners >= 10000
      ? `thousands of monthly listeners`
      : monthlyListeners >= 1000
        ? `a growing listener base`
        : '';

  const trackStr = trackCount > 0
    ? `${trackCount} tracks`
    : 'music';

  // Build a keyword-rich first sentence
  const genreStr = genres.length > 0 ? genres.join(', ') : '';
  const keywordPhrase = genreStr
    ? `${name} is a ${genreStr} artist`
    : `${name} is a musical artist`;

  // Determine depth tier based on data confidence
  const hasSubstantialData = totalStreams > 10000 || monthlyListeners > 5000 || totalFollowers > 5000;
  const depth = hasSubstantialData ? 'full' : 'short';

  // Keywords to target
  const keywords = [
    `${name} music`,
    genreStr ? `${name} ${genreStr}` : null,
    `listen to ${name}`,
    genreStr ? `${genreStr} artist ${new Date().getFullYear()}` : `independent artist ${new Date().getFullYear()}`,
    genreStr ? `new ${genreStr} music` : null,
  ].filter(Boolean).join(', ');

  const dataSection = [
    trackStr,
    streamStr,
    followerStr,
    listenerStr,
  ].filter(Boolean).join('\n');

  const basePrompt = `Write a ${depth === 'full' ? '500-800' : '250-400'} word profile of ${keywordPhrase}.

VERIFIED DATA (use cautiously):
${dataSection || 'Limited data available — write generally about their music.'}
Tracks: ${trackCount}

DATA INTEGRITY RULES (MANDATORY):
1. Only use the data listed above. Do NOT invent any numbers, album names, tour dates, or collaborations.
2. Round all numbers: write "over 150K streams" not exact counts.
3. If data is limited, write generally about their music and creative journey.
4. NEVER write specific follower counts, stream counts, or listener counts below 10K.
   Instead say "a growing audience" or "a dedicated following."
5. If genre wasn't provided above, do NOT guess a specific genre.
   Say "their music" or "their sound" instead of "their rock sound."
6. NEVER include fake quotes from the artist. Write in third person only.
7. Never diminish: no "only," "despite," "but" before positive statements.

KEYWORD STRATEGY:
Naturally include these keywords in the first 150 words: ${keywords}

STRUCTURE:
- Paragraph 1: Opening — who they are, their sound. Include primary keywords.
- Paragraph 2: Their music — describe the vibe and craft. Be warm but specific only with real data.
- Paragraph 3: What makes them worth discovering.
- Paragraph 4: Connection to Selah.fm — "Support ${name} on Selah.fm and earn per view creating content featuring their tracks."
- End naturally. No abrupt sign-offs.

TONE: Warm, respectful, enthusiastic. Like a knowledgeable friend introducing you to great music. Always positive — this is a compliment the artist would be proud to share.`;

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
          content: 'You are a music journalist writing warm, respectful profiles of independent artists. Every article is a genuine compliment the artist would be proud to share. You never invent facts.',
        },
        { role: 'user', content: basePrompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek error: ${response.status} ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  let bio = data.choices?.[0]?.message?.content || '';
  bio = bio.replace(/^#+\s*/gm, '').replace(/\*\*/g, '').replace(/^[-*]\s*/gm, '').trim();
  return bio;
}
