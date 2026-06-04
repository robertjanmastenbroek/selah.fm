/**
 * app/api/artist/bio/route.ts
 * Composable multi-slot bio generation.
 * Assembles bios from 8 independent slot libraries for ~37B+ unique combinations.
 */

import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';
import { scoreAngles, selectAngle, type ArtistData } from '@/lib/bio-angles';
import { selectTone } from '@/lib/bio-tone';
import { selectOpening } from '@/lib/bio-openings';
import { selectDescriptors } from '@/lib/bio-descriptors';
import { selectJourney } from '@/lib/bio-journeys';
import { selectClosing } from '@/lib/bio-closings';
import { scoreBio, formatScoreSummary } from '@/lib/bio-scorer';
import { recordBio, getBannedWordsList } from '@/lib/bio-vocabulary';

export const dynamic = 'force-dynamic';

// ─── POST /api/artist/bio ───────────────────────────────────

export async function POST(request: Request) {
  // Allow cron with secret header
  const cronSecret = request.headers.get('x-cron-secret');
  const isCron = cronSecret && cronSecret === process.env.CRON_SECRET;
  
  if (!isCron) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { artistId } = await request.json();
    if (!artistId) return NextResponse.json({ error: 'artistId required' }, { status: 400 });

    const artist = await loadArtistData(artistId);
    if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

    // Generate 3 variations, keep best
    const results = await Promise.all(
      [1, 2, 3].map(() => generateBioVariation(artist))
    );

    const best = results.sort((a, b) => b.score.score - a.score.score)[0];

    // Save to DB
    await saveBio(artist.id, best.bio, best.score.score, best.angle.id, best.tone.id);

    // Record words for vocabulary tracking
    recordBio(best.bio);

    return NextResponse.json({
      bio: best.bio,
      score: best.score.score,
      angle: best.angle.name,
      tone: best.tone.name,
      word_count: best.bio.split(/\s+/).filter(w => w.length > 0).length,
      variations_generated: 3,
    });
  } catch (e: any) {
    console.error('Bio generation error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── Bio Generation Engine ──────────────────────────────────

interface BioVariation {
  bio: string;
  score: ReturnType<typeof scoreBio>;
  angle: { id: string; name: string };
  tone: { id: string; name: string };
  components: {
    opening: string;
    descriptors: string[];
    journey: string;
    closing: string;
  };
}

async function generateBioVariation(artist: ArtistData): Promise<BioVariation> {
  // 1. Select angle + tone
  const { angle, reasons } = selectAngle(artist);
  const tone = selectTone(angle.tone);

  // 2. Select opening hook from angle's preferred structure
  const openingStyle = angle.structure.find(s => s.startsWith('opening-'))?.replace('opening-', '') || 'hook';
  const opening = selectOpening(openingStyle);

  // 3. Select 2 descriptors
  const descriptors = selectDescriptors(2);

  // 4. Select journey framing
  const journeyType = angle.structure.find(s => s.startsWith('journey-') || s.startsWith('why-'));
  const journey = selectJourney();

  // 5. Select closing CTA
  const closing = selectClosing();

  // 6. Build data injection context
  const wordContext = buildWordContext(artist);

  // 7. Generate the full bio via AI
  const bio = await generateFullBio(artist, angle, tone, opening, descriptors, journey, closing, wordContext);

  // 8. Score
  const score = scoreBio(bio, artist.name);

  return {
    bio,
    score,
    angle: { id: angle.id, name: angle.name },
    tone: { id: tone.id, name: tone.name },
    components: {
      opening: opening.template,
      descriptors: descriptors.map(d => d.text),
      journey: journey.text,
      closing: closing.text,
    },
  };
}

// ─── AI Generation ─────────────────────────────────────────

async function generateFullBio(
  artist: ArtistData,
  angle: any,
  tone: any,
  opening: any,
  descriptors: any[],
  journey: any,
  closing: any,
  wordContext: string
): Promise<string> {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
  if (!DEEPSEEK_API_KEY) throw new Error('DeepSeek API key not configured');

  const bannedWords = getBannedWordsList();
  const des1 = descriptors[0];
  const des2 = descriptors.length > 1 ? descriptors[1] : null;

  // Inject artist data into templated slots
  const openingText = fillTemplate(opening.template, artist);
  const journeyText = fillTemplate(journey.text, artist);
  const closingText = fillTemplate(closing.text, artist);

  // Build descriptor sentences
  const desSentence1 = `There's ${des1.text} — ${des1.followUp || ''}`;
  const desSentence2 = des2 ? `Meanwhile, ${des2.text} — ${des2.followUp || ''}` : '';

  const prompt = `Write a natural, flowing 3-5 paragraph profile of the independent artist "${artist.name}".

CONTEXT about the artist:
${wordContext}

TONE: ${tone.voice}
${bannedWords ? `\nVOCABULARY RULES:\n${bannedWords}` : ''}

STRUCTURE:
You are given 4 pre-written sections below. INTEGRATE them naturally into a coherent profile. Do NOT paste them verbatim — weave them into your own prose.

Opening: ${openingText}

Sound description: ${desSentence1}. ${desSentence2}

Artist journey: ${journeyText}

Closing: ${closingText}

WRITING RULES:
1. Write transition sentences between the sections so the bio reads as ONE cohesive article, not 4 separate paragraphs.
2. Open with a hook that draws the reader in. End with a natural conclusion.
3. Vary sentence length. Use short sentences for emphasis. Use longer sentences for flow.
4. Do NOT use any of these words: landscape, realm, tapestry, testament, prolific, burgeoning, ever-evolving, journey, sonic, auditory, musical journey.
5. Do NOT include invented quotes from the artist.
6. Do NOT include lists, bullet points, or numbered sections.
7. Mention "${artist.name}" and "Selah.fm" naturally within the text.
8. Never diminish the artist. No "only," "despite," "although" used to qualify their achievements.
9. If the data shows low numbers, focus on quality and potential instead.
10. Write 400-700 words total across 3-5 paragraphs.`;

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are a music journalist writing warm, respectful profiles of independent artists. Every article is a genuine compliment the artist would be proud to share. You write with ${tone.name.toLowerCase()} tone: ${tone.description}`,
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek error: ${response.status} ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  let bio = data.choices?.[0]?.message?.content || '';
  
  // Clean formatting
  bio = bio.replace(/^#+\s*/gm, '').replace(/\*\*/g, '').replace(/^[-*]\s*/gm, '').trim();
  
  return bio;
}

// ─── Helpers ────────────────────────────────────────────────

function buildWordContext(artist: ArtistData): string {
  const parts: string[] = [];

  if (artist.trackCount > 0) parts.push(`${artist.trackCount} tracks`);
  if (artist.totalStreams > 10000) {
    parts.push(`over ${artist.totalStreams >= 1000000 ? (artist.totalStreams / 1000000).toFixed(1) + 'M' : Math.floor(artist.totalStreams / 1000) + 'K'} streams`);
  } else if (artist.totalStreams > 0) {
    parts.push('thousands of streams');
  }
  if (artist.totalFollowers > 100000) {
    parts.push(`over ${Math.floor(artist.totalFollowers / 1000)}K followers`);
  } else if (artist.totalFollowers > 10000) {
    parts.push('thousands of followers');
  } else if (artist.totalFollowers > 1000) {
    parts.push('a growing following');
  }
  if (artist.hasCampaigns) parts.push(`${artist.campaignCount} campaign${artist.campaignCount !== 1 ? 's' : ''} on Selah.fm`);
  if (artist.submissionCount > 0) parts.push(`${artist.submissionCount} creator submission${artist.submissionCount !== 1 ? 's' : ''}`);
  if (artist.hasLocation) parts.push(`location: ${artist.locationCity}${artist.locationCountry ? `, ${artist.locationCountry}` : ''}`);
  if (artist.genres.length > 0) parts.push(`genre: ${artist.genres.slice(0, 3).join(', ')}`);
  // YouTube enrichment data
  if (artist.metadata?.youtube?.subscribers) {
    parts.push(`youtube subscribers: ${artist.metadata.youtube.subscribers >= 1000 ? (artist.metadata.youtube.subscribers / 1000).toFixed(1) + 'K' : artist.metadata.youtube.subscribers}`);
  }
  if (artist.metadata?.youtube?.total_views) {
    parts.push(`youtube total views: ${artist.metadata.youtube.total_views >= 1000000 ? (artist.metadata.youtube.total_views / 1000000).toFixed(1) + 'M' : artist.metadata.youtube.total_views >= 1000 ? (artist.metadata.youtube.total_views / 1000).toFixed(1) + 'K' : artist.metadata.youtube.total_views}`);
  }
  // Wikipedia extract snippet
  if (artist.metadata?.wikipedia?.extract) {
    parts.push(`wikipedia: ${artist.metadata.wikipedia.extract.substring(0, 200)}`);
  }
  if (artist.careerDays > 0) {
    const years = Math.floor(artist.careerDays / 365);
    const months = Math.floor((artist.careerDays % 365) / 30);
    if (years > 0) parts.push(`career: ${years} year${years > 1 ? 's' : ''}${months > 0 ? `, ${months} month${months > 1 ? 's' : ''}` : ''}`);
    else parts.push(`career: ${months} month${months > 1 ? 's' : ''}`);
  }
  if (artist.trackTitles.length > 0) {
    parts.push(`sample tracks: ${artist.trackTitles.slice(0, 5).join(', ')}`);
  }

  return parts.join('\n') || 'Independent musician building their catalog.';
}

function fillTemplate(template: string, artist: ArtistData): string {
  let result = template;
  result = result.replace(/\{\{name\}\}/g, artist.name);
  result = result.replace(/\{\{tracks\}\}/g, String(artist.trackCount));
  result = result.replace(/\{\{streams\}\}/g, artist.totalStreams > 10000
    ? `over ${artist.totalStreams >= 1000000 ? (artist.totalStreams / 1000000).toFixed(1) + 'M' : Math.floor(artist.totalStreams / 1000) + 'K'} streams`
    : 'streams');
  result = result.replace(/\{\{followers\}\}/g, artist.totalFollowers > 10000
    ? `${Math.floor(artist.totalFollowers / 1000)}K followers`
    : 'a growing audience');
  return result;
}

async function loadArtistData(artistId: string): Promise<ArtistData | null> {
  const [artist] = await sql`
    SELECT da.id, da.artist_name, da.genres, da.monthly_listeners,
           ap.total_streams, ap.total_followers, da.metadata
    FROM discovered_artists da
    LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
    WHERE da.id = ${artistId}
    LIMIT 1
  `;
  if (!artist) return null;

  const rawGenres = artist.genres;
  let genres: string[] = [];
  if (Array.isArray(rawGenres)) genres = rawGenres;
  else if (typeof rawGenres === 'string') {
    try { genres = JSON.parse(rawGenres); } catch { genres = [rawGenres]; }
  }

  const [{ count }] = await sql`
    SELECT COUNT(*)::int FROM artist_tracks WHERE artist_id = ${artistId} AND enabled = true
  `;

  // Career timeline — first and most recent track dates
  const [timeline] = await sql`
    SELECT MIN(created_at) as first_track, MAX(created_at) as latest_track
    FROM artist_tracks WHERE artist_id = ${artistId} AND enabled = true
  `;

  let careerDays = 0;
  let daysSinceLastTrack = 365;
  if (timeline?.first_track) {
    careerDays = Math.floor((Date.now() - new Date(timeline.first_track).getTime()) / 86400000);
  }
  if (timeline?.latest_track) {
    daysSinceLastTrack = Math.floor((Date.now() - new Date(timeline.latest_track).getTime()) / 86400000);
  }

  // Location from metadata (Bandcamp or Wikipedia)
  let locationCity = '';
  let locationCountry = '';
  const wiki = artist.metadata?.wikipedia;
  
  // Try Wikipedia first (more authoritative)
  if (wiki?.location && wiki.found !== false) {
    const loc = wiki.location;
    // "American" → country only, "Amsterdam, Netherlands" → city + country
    const nationalityMatch = loc.match(/^(American|British|Canadian|Australian|German|French|Dutch|Swedish|Norwegian|Danish|Japanese|Brazilian|Irish|Scottish|Welsh|Italian|Spanish|Mexican|South African|Nigerian|Ghanaian|Kenyan)$/i);
    if (nationalityMatch) {
      locationCountry = nationalityMatch[1];
    } else {
      const parts = loc.split(',');
      locationCity = parts[0]?.trim() || '';
      locationCountry = parts[1]?.trim() || '';
    }
  }
  
  if (artist.metadata?.location && !locationCity && !locationCountry) {
    const loc = artist.metadata.location;
    if (typeof loc === 'string') {
      // "Amsterdam, Netherlands" format
      const parts = loc.split(',');
      locationCity = parts[0]?.trim() || '';
      locationCountry = parts[1]?.trim() || '';
    } else if (typeof loc === 'object') {
      locationCity = loc.city || '';
      locationCountry = loc.country || loc.countryCode || '';
    }
    // Also check if loc is nested weirdly
    if (!locationCity && typeof loc === 'object') {
      locationCity = String(Object.values(loc)[0] || '');
    }
  }

  // Track titles for genre inference + bio detail
  const trackTitles = await sql`
    SELECT title FROM artist_tracks WHERE artist_id = ${artistId} AND enabled = true
    ORDER BY created_at DESC LIMIT 10
  `;

  // Count campaigns
  const [{ campaign_count }] = await sql`
    SELECT COUNT(*)::int FROM campaign_claims WHERE discovered_artist_id = ${artistId}
  `;

  // Count submissions
  const [{ submission_count }] = await sql`
    SELECT COUNT(*)::int FROM submissions s
    JOIN campaigns c ON c.id = s.campaign_id
    JOIN campaign_claims cc ON cc.campaign_id = c.id
    WHERE cc.discovered_artist_id = ${artistId}
  `;

  return {
    id: artist.id,
    name: artist.artist_name,
    genres,
    genreCount: genres.length,
    trackCount: count || 0,
    monthlyListeners: artist.monthly_listeners || 0,
    totalStreams: artist.total_streams || 0,
    totalFollowers: artist.total_followers || 0,
    hasCampaigns: (campaign_count || 0) > 0,
    campaignCount: campaign_count || 0,
    submissionCount: submission_count || 0,
    supporterCount: 0,
    hasLocation: !!locationCity,
    locationCity,
    locationCountry,
    hasSpotifyId: false,
    hasImage: false,
    careerDays,
    daysSinceLastTrack,
    trackTitles: trackTitles.map((t: any) => t.title),
    metadata: artist.metadata,
  };
}

async function saveBio(artistId: string, bio: string, score: number, angle: string, tone: string): Promise<void> {
  // Check if audit record exists
  const [existing] = await sql`
    SELECT id FROM artist_audits WHERE discovered_artist_id = ${artistId} LIMIT 1
  `;

  if (existing) {
    await sql`
      UPDATE artist_audits SET bio = ${bio}, audited_at = NOW()
      WHERE id = ${existing.id}
    `;
  } else {
    await sql`
      INSERT INTO artist_audits (discovered_artist_id, bio, audited_at)
      VALUES (${artistId}, ${bio}, NOW())
    `;
  }

  // Also store metadata about the generation
  const [artistRow] = await sql`
    SELECT artist_name FROM discovered_artists WHERE id = ${artistId} LIMIT 1
  `;
  const title = 'Profile: ' + (artistRow?.artist_name || 'Unknown Artist');
  await sql`
    INSERT INTO artist_articles (discovered_artist_id, title, body, word_count, status, generated_at)
    VALUES (${artistId}, ${title}, ${bio}, ${bio.split(/\s+/).length}, 'published', NOW())
    ON CONFLICT (discovered_artist_id) DO UPDATE SET body = ${bio}, word_count = ${bio.split(/\s+/).length}, generated_at = NOW()
  `.catch((e: any) => console.error('Async error in api/artist/bio/route.ts:', e));
}
