/**
 * lib/blog-vocabulary.ts
 * DB-backed word & phrase frequency tracker for SEO blog posts.
 * Persists across all posts — every article generation contributes to learning.
 *
 * This is the blog-system parallel of lib/bio-vocabulary.ts.
 * Run decay_blog_vocabulary() periodically (every ~50 posts) for sliding window.
 */

import sql from '@/lib/db';

// Thresholds: how many appearances before a word/phrase is flagged as overused
const WORD_OVERUSE_THRESHOLD = 10;
const PHRASE_OVERUSE_THRESHOLD = 5;

/** Stop-words to exclude from tracking (structural, not meaningful) */
const STOP_WORDS = new Set([
  'this', 'that', 'with', 'from', 'they', 'them', 'their', 'have', 'been',
  'were', 'what', 'when', 'where', 'which', 'there', 'about', 'would',
  'could', 'should', 'into', 'over', 'also', 'than', 'then', 'each',
  'after', 'other', 'because', 'before', 'between', 'through', 'during',
  'without', 'across', 'around', 'above', 'again', 'under', 'while',
  'these', 'those', 'being', 'doing', 'having', 'some', 'such', 'more',
  'very', 'just', 'most', 'even', 'much', 'still', 'already', 'every',
  'never', 'always', 'really', 'quite', 'rather', 'way', 'know', 'like',
  'feel', 'one', 'first', 'new', 'also', 'get', 'got', 'see', 'come',
  'time', 'go', 'make', 'made', 'take', 'think', 'going', 'want', 'say',
  'said', 'use', 'need', 'tell', 'ask', 'told', 'try',
  // Structural blog words — too common to be meaningful
  'post', 'blog', 'read', 'article', 'section', 'content', 'page',
  'check', 'click', 'link', 'share', 'sign', 'subscribe',
  // Platform stop-words that saturate every post
  'selah', 'selahfm', 'music', 'artist', 'creators', 'promotion',
  // Common contractions — these are structural, not vocabulary choices.
  // Banning "don't" or "it's" would hurt the human voice, not help it.
  "don't", "can't", "won't", "isn't", "wasn't", "aren't", "weren't",
  "hasn't", "haven't", "hadn't", "doesn't", "didn't", "couldn't",
  "wouldn't", "shouldn't", "mightn't", "mustn't", "needn't", "daren't",
  "i've", "you've", "we've", "they've", "i'm", "you're", "we're",
  "they're", "i'll", "you'll", "we'll", "they'll", "i'd", "you'd",
  "we'd", "they'd", "it's", "that's", "here's", "there's", "what's",
  "where's", "who's", "how's", "let's", "he's", "she's",
  // Pronouns and common determiners that saturate blog text
  'your', 'youre', 'youll', 'youve', 'youd', 'yours', 'yourself',
  'everyone', 'everybody', 'someone', 'somebody', 'anyone', 'anybody',
  'nobody', 'nothing', 'everything', 'something', 'anything',
  // Generic filler that appears in every post
  'actually', 'basically', 'essentially', 'literally', 'honestly',
  'probably', 'maybe', 'perhaps', 'pretty', 'quite',
]);

/** Extract meaningful words from HTML content (strip tags first) */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ');
}

function extractWords(text: string): string[] {
  const clean = stripHtml(text);
  return clean
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .filter(w => !STOP_WORDS.has(w))
    .filter(w => !/^\d+$/.test(w)); // exclude bare numbers
}

/** Extract 2-3 word phrases (bigrams & trigrams) for pattern detection */
function extractPhrases(text: string): string[] {
  const clean = stripHtml(text);
  const words = clean
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !STOP_WORDS.has(w))
    .filter(w => !/^\d+$/.test(w));

  const phrases: string[] = [];

  // Bigrams
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
  }

  // Trigrams
  for (let i = 0; i < words.length - 2; i++) {
    const tri = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    // Skip if any word is too generic individually
    if (!STOP_WORDS.has(words[i]) || !STOP_WORDS.has(words[i + 1]) || !STOP_WORDS.has(words[i + 2])) {
      phrases.push(tri);
    }
  }

  return phrases;
}

/**
 * Record all words and phrases from a published blog post.
 * Call after every successful article generation.
 */
export async function recordBlogPost(
  contentHtml: string,
  title: string,
  excerpt: string
): Promise<void> {
  // Combine title, excerpt, and main content for vocabulary tracking
  const fullText = `${title} ${excerpt} ${contentHtml}`;

  const words = extractWords(fullText);
  const phrases = extractPhrases(fullText);
  const now = new Date().toISOString();

  // ── Batch upsert words ──────────────────────────────────
  if (words.length > 0) {
    const wordValues = words.map((_, i) =>
      `($${i * 3 + 1}, $${i * 3 + 2}::int, $${i * 3 + 3}::timestamptz)`
    ).join(', ');
    const wordParams: any[] = [];
    for (const w of words) {
      wordParams.push(w, 1, now);
    }

    try {
      await sql.raw(`
        INSERT INTO blog_word_counts (word, count, last_seen_at)
        VALUES ${wordValues}
        ON CONFLICT (word) DO UPDATE SET
          count = blog_word_counts.count + 1,
          last_seen_at = EXCLUDED.last_seen_at
      `, wordParams);
    } catch (e: any) {
      console.error('[blog-vocab] word record error:', e.message);
    }
  }

  // ── Batch upsert phrases ────────────────────────────────
  if (phrases.length > 0) {
    const phraseValues = phrases.map((_, i) =>
      `($${i * 3 + 1}, $${i * 3 + 2}::int, $${i * 3 + 3}::timestamptz)`
    ).join(', ');
    const phraseParams: any[] = [];
    for (const p of phrases) {
      phraseParams.push(p, 1, now);
    }

    try {
      await sql.raw(`
        INSERT INTO blog_phrase_counts (phrase, count, last_seen_at)
        VALUES ${phraseValues}
        ON CONFLICT (phrase) DO UPDATE SET
          count = blog_phrase_counts.count + 1,
          last_seen_at = EXCLUDED.last_seen_at
      `, phraseParams);
    } catch (e: any) {
      console.error('[blog-vocab] phrase record error:', e.message);
    }
  }
}

/**
 * Get a set of overused words from the DB store.
 */
export async function getOverusedWords(): Promise<Set<string>> {
  try {
    const rows = await sql.raw(
      'SELECT word FROM blog_word_counts WHERE count >= $1 ORDER BY count DESC',
      [WORD_OVERUSE_THRESHOLD]
    );
    return new Set(rows.map((r: any) => r.word));
  } catch (e: any) {
    console.error('[blog-vocab] getOverusedWords error:', e.message);
    return new Set();
  }
}

/**
 * Get a set of overused phrases from the DB store.
 */
export async function getOverusedPhrases(): Promise<Set<string>> {
  try {
    const rows = await sql.raw(
      'SELECT phrase FROM blog_phrase_counts WHERE count >= $1 ORDER BY count DESC',
      [PHRASE_OVERUSE_THRESHOLD]
    );
    return new Set(rows.map((r: any) => r.phrase));
  } catch (e: any) {
    console.error('[blog-vocab] getOverusedPhrases error:', e.message);
    return new Set();
  }
}

/**
 * Get a formatted banned-words string for prompt injection.
 * Includes both overused words AND overused phrase patterns.
 */
export async function getBannedWordsList(): Promise<string> {
  const [overusedWords, overusedPhrases] = await Promise.all([
    getOverusedWords(),
    getOverusedPhrases(),
  ]);

  const parts: string[] = [];

  if (overusedWords.size > 0) {
    const words = Array.from(overusedWords).sort();
    parts.push(`AVOID these overused words (they appear too often across our blog): ${words.slice(0, 25).join(', ')}${words.length > 25 ? ` (and ${words.length - 25} more)` : ''}. Choose fresher, more specific vocabulary.`);
  }

  if (overusedPhrases.size > 0) {
    const phrases = Array.from(overusedPhrases).sort();
    parts.push(`AVOID these repeated phrase patterns (AI detectors flag recurring phrasing): "${phrases.slice(0, 10).join('", "')}"${phrases.length > 10 ? ` (and ${phrases.length - 10} more)` : ''}. Vary your phrasing — don't use the same 2-3 word combinations.`);
  }

  return parts.join('\n');
}

/**
 * Get current stats for monitoring/logging.
 */
export async function getVocabStats(): Promise<{
  totalWords: number;
  uniqueWords: number;
  overusedWordCount: number;
  overusedPhraseCount: number;
}> {
  try {
    const [stats] = await sql.raw(`
      SELECT
        (SELECT COUNT(*)::int FROM blog_word_counts) as unique_words,
        (SELECT COALESCE(SUM(count), 0)::int FROM blog_word_counts) as total_words,
        (SELECT COUNT(*)::int FROM blog_word_counts WHERE count >= ${WORD_OVERUSE_THRESHOLD}) as overused_word_count,
        (SELECT COUNT(*)::int FROM blog_phrase_counts WHERE count >= ${PHRASE_OVERUSE_THRESHOLD}) as overused_phrase_count
    `);
    return {
      totalWords: stats.total_words,
      uniqueWords: stats.unique_words,
      overusedWordCount: stats.overused_word_count,
      overusedPhraseCount: stats.overused_phrase_count,
    };
  } catch {
    return { totalWords: 0, uniqueWords: 0, overusedWordCount: 0, overusedPhraseCount: 0 };
  }
}

/**
 * Decay vocabulary counts (halve all) to create a sliding window.
 * Call periodically (every ~50 posts) via cron.
 */
export async function decayVocabulary(): Promise<number> {
  try {
    const [{ removed }] = await sql.raw(`SELECT decay_blog_vocabulary() as removed`);
    return removed;
  } catch (e: any) {
    console.error('[blog-vocab] decay error:', e.message);
    return 0;
  }
}
