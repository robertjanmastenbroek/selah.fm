/**
 * Reddit question sourcer — fetches questions from music/creator subreddits
 * and adds them to the batch for blog generation.
 * 
 * Uses Reddit's public JSON API (no auth required for reads).
 * Subreddits are split 50/50 between artist promotion and creator monetization.
 */
import sql from '@/lib/db';

const ARTIST_SUBREDDITS = [
  'musicmarketing', 'WeAreTheMusicMakers', 'indiemusic', 'musicpromotion',
  'independentmusic', 'MusicInTheMaking', 'musicians', 'makinghiphop',
  'bedroomproducers', 'Songwriting',
];

const CREATOR_SUBREDDITS = [
  'TikTokMarketing', 'TikTokTips', 'content_marketing', 'PartneredYoutube',
  'smallbusiness', 'socialmedia', 'digital_marketing', 'AffiliateMarket',
  'NewTubers', 'SocialMediaMarketing',
];

interface RedditPost {
  title: string;
  selftext: string;
  subreddit: string;
  score: number;
  num_comments: number;
  url: string;
  created_utc: number;
}

/** Fetch hot posts from a subreddit using Reddit's public JSON endpoint */
async function fetchSubredditPosts(subreddit: string, limit = 25): Promise<RedditPost[]> {
  try {
    const res = await fetch(`https://www.reddit.com/r/${subreddit}/hot/.json?limit=${limit}`, {
      headers: {
        'User-Agent': 'selah.fm:v1.0 (by /u/selah_fm)',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const posts = data?.data?.children || [];
    return posts
      .map((p: any) => p?.data)
      .filter((p: any) => p && !p.stickied && p.title && p.title.length > 10 && p.title.length < 300 && !p.over_18)
      .map((p: any) => ({
        title: p.title,
        selftext: (p.selftext || '').slice(0, 500),
        subreddit: p.subreddit,
        score: p.score || 0,
        num_comments: p.num_comments || 0,
        url: `https://reddit.com${p.permalink}`,
        created_utc: p.created_utc || 0,
      }));
  } catch {
    return [];
  }
}

/** Check if a question text looks like a genuine question (not a statement, not too short) */
function isQuestion(text: string): boolean {
  const clean = text.trim();
  if (clean.length < 15 || clean.length > 300) return false;
  // Must contain a question mark or start with a question word
  const hasQuestionMark = clean.includes('?');
  const startsWithQuestionWord = /^(how|what|why|when|where|which|who|can|do|does|is|are|should|could|would|will|has|have|does anyone|anyone|any tips|any advice|best way)/i.test(clean);
  // Filter out statements, announcements, spam
  const isStatement = /^(i\s|my\s|we\s|this\s|check\s|here's\s|just\s|made\s|finally\s)/i.test(clean);
  return (hasQuestionMark || startsWithQuestionWord) && !isStatement;
}

/** Categorize a question as artist or creator focused */
function categorizeQuestion(title: string, subreddit: string): 'artist' | 'creator' | 'other' {
  const lower = title.toLowerCase();
  const artistKeywords = ['song', 'music', 'album', 'track', 'release', 'spotify', 'stream', 'band', 'gig', 'tour',
    'record', 'label', 'promote my', 'my music', 'my song', 'my band', 'indie',
    'royalties', 'distribut', 'playlist', 'producer', 'beat', 'recording',
  ];
  const creatorKeywords = ['tiktok', 'instagram', 'youtube', 'video', 'content', 'follower', 'view', 'monetiz',
    'creator', 'influencer', 'brand deal', 'sponsor', 'affiliate', 'reel', 'short',
    'engagement', 'algorithm', 'viral', 'earn', 'income', 'money', 'paid', 'revenue',
    'cpm', 'payout', 'freelance', 'gig', 'side hustle',
  ];

  const artistScore = artistKeywords.filter(k => lower.includes(k)).length;
  const creatorScore = creatorKeywords.filter(k => lower.includes(k)).length;

  if (artistScore > creatorScore && artistScore >= 2) return 'artist';
  if (creatorScore > artistScore && creatorScore >= 2) return 'creator';
  
  // Check subreddit as tiebreaker
  if (ARTIST_SUBREDDITS.includes(subreddit)) return 'artist';
  if (CREATOR_SUBREDDITS.includes(subreddit)) return 'creator';
  
  return 'other';
}

/** Deduplicate against existing questions */
async function deduplicate(questions: string[]): Promise<string[]> {
  const unique: string[] = [];
  for (const q of questions) {
    const normalized = q.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    const existing = await sql`
      SELECT 1 FROM used_questions WHERE normalized_text = ${normalized} LIMIT 1
    `;
    if (existing.length === 0) {
      unique.push(q);
    }
  }
  return unique;
}

/** Clean up question text — remove [meta] tags, leading junk */
function cleanQuestion(text: string): string {
  return text
    .replace(/^\[[\w\s]+\]\s*/i, '') // Remove [Meta], [Discussion], etc.
    .replace(/^(ELI5|CMV|PSA|MRW|TIFU|AITA)\s*:\s*/i, '') // Remove common prefixes
    .trim();
}

/** Normalize question text for used_questions dedup table */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

// ── Main entry point ─────────────────────────────────────

export async function sourceRedditQuestions(targetCount: number = 500): Promise<{
  sourced: number;
  artistQuestions: number;
  creatorQuestions: number;
  errors: string[];
}> {
  const allSubreddits = [...ARTIST_SUBREDDITS, ...CREATOR_SUBREDDITS];
  const postsPerSub = Math.ceil(targetCount / allSubreddits.length) + 10;
  let artistQuestions: string[] = [];
  let creatorQuestions: string[] = [];
  const errors: string[] = [];

  // Fetch posts from all subreddits
  const results = await Promise.allSettled(
    allSubreddits.map(sub => fetchSubredditPosts(sub, postsPerSub))
  );

  results.forEach((result, i) => {
    const sub = allSubreddits[i];
    if (result.status === 'rejected') {
      errors.push(`${sub}: ${result.reason?.message || 'fetch failed'}`);
      return;
    }
    const posts = result.value;
    for (const post of posts) {
      const cleaned = cleanQuestion(post.title);
      if (!isQuestion(cleaned)) continue;
      
      const category = categorizeQuestion(cleaned, post.subreddit);
      if (category === 'artist' && artistQuestions.length < targetCount / 2) {
        artistQuestions.push(cleaned);
      } else if (category === 'creator' && creatorQuestions.length < targetCount / 2) {
        creatorQuestions.push(cleaned);
      }
    }
  });

  // Deduplicate against existing questions
  const allNew = [...artistQuestions, ...creatorQuestions];
  const unique = await deduplicate(allNew);

  // Re-split into artist/creator
  const finalArtist = unique.filter(q => categorizeQuestion(q, '') === 'artist').slice(0, Math.floor(targetCount / 2));
  const finalCreator = unique.filter(q => categorizeQuestion(q, '') === 'creator').slice(0, Math.ceil(targetCount / 2));
  
  // Get the active batch
  const [batch] = await sql`
    SELECT id FROM batches WHERE status NOT IN ('completed', 'archived') ORDER BY created_at DESC LIMIT 1
  `;

  if (!batch) {
    return { sourced: 0, artistQuestions: 0, creatorQuestions: 0, errors: ['No active batch found'] };
  }

  // Insert into batch_questions
  let sourced = 0;
  for (const q of [...finalArtist, ...finalCreator]) {
    const category = categorizeQuestion(q, '') === 'artist' ? 'music_promotion' : 'creator_monetization';
    try {
      await sql`
        INSERT INTO batch_questions (batch_id, raw_question, category)
        VALUES (${batch.id}, ${q}, ${category})
        ON CONFLICT DO NOTHING
      `;
      sourced++;
    } catch {}
  }

  // Mark as used so they don't get re-sourced
  for (const q of [...finalArtist, ...finalCreator]) {
    const normalized = normalizeText(q);
    await sql`
      INSERT INTO used_questions (question_text, normalized_text, status, source)
      VALUES (${q.slice(0, 500)}, ${normalized}, 'sourced', 'reddit')
      ON CONFLICT (normalized_text) DO NOTHING
    `.catch(() => {});
  }

  return {
    sourced,
    artistQuestions: finalArtist.length,
    creatorQuestions: finalCreator.length,
    errors: errors.slice(0, 10),
  };
}
