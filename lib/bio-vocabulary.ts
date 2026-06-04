/**
 * lib/bio-vocabulary.ts
 * DB-backed word frequency tracker for vocabulary diversity.
 * Persists across all instances — every bio generation contributes to learning.
 * Run decay_bio_vocabulary() periodically (every ~500 bios) for sliding window.
 */

import sql from '@/lib/db';

// Threshold: words appearing this many times are flagged as overused
// With ~1,700 bios, threshold of 50 = ~3% of bios containing the word
const OVERUSE_THRESHOLD = 50;

const STOP_WORDS = new Set([
  'this', 'that', 'with', 'from', 'they', 'them', 'their', 'have', 'been',
  'were', 'what', 'when', 'where', 'which', 'there', 'about', 'would',
  'could', 'should', 'into', 'over', 'also', 'than', 'then', 'each',
  'after', 'other', 'because', 'before', 'between', 'through', 'during',
  'without', 'across', 'around', 'above', 'again', 'under', 'while',
  'where', 'these', 'those', 'being', 'doing', 'having', 'some', 'such',
  'more', 'very', 'just', 'most', 'even', 'much', 'still', 'already',
  'every', 'never', 'always', 'really', 'quite', 'rather',
  // Bio-specific stop words — structural, not meaningful
  'selah', 'music', 'artist', 'track', 'song', 'make', 'made',
  'create', 'sound', 'work', 'way', 'know', 'like', 'feel', 'one',
  'first', 'new', 'also', 'get', 'got', 'see', 'come', 'time',
  'feels', 'something', 'single', 'kind', 'makes', 'here', 'artists',
]);

function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .filter(w => !STOP_WORDS.has(w));
}

/**
 * Record all words from a generated bio into the persistent DB store.
 * Each unique word gets its count incremented.
 */
export async function recordBio(bioText: string): Promise<void> {
  const words = extractWords(bioText);
  if (words.length === 0) return;

  const now = new Date().toISOString();

  // Batch upsert in a single round-trip
  const values = words.map((w, i) =>
    `($${i * 3 + 1}, $${i * 3 + 2}::int, $${i * 3 + 3}::timestamptz)`
  ).join(', ');

  const flatParams: any[] = [];
  for (const w of words) {
    flatParams.push(w, 1, now);
  }

  try {
    await sql.raw(`
      INSERT INTO bio_word_counts (word, count, last_seen_at)
      VALUES ${values}
      ON CONFLICT (word) DO UPDATE SET
        count = bio_word_counts.count + 1,
        last_seen_at = EXCLUDED.last_seen_at
    `, flatParams);
  } catch (e: any) {
    // Table might not exist yet — skip silently
    console.error('[bio-vocab] recordBio error:', e.message);
  }
}

/**
 * Get a set of overused words from the DB store.
 */
export async function getOverusedWords(): Promise<Set<string>> {
  try {
    const rows = await sql.raw(
      'SELECT word FROM bio_word_counts WHERE count >= $1 ORDER BY count DESC',
      [OVERUSE_THRESHOLD]
    );
    return new Set(rows.map((r: any) => r.word));
  } catch (e: any) {
    console.error('[bio-vocab] getOverusedWords error:', e.message);
    return new Set();
  }
}

/**
 * Check if a word is overused.
 */
export async function isOverused(word: string): Promise<boolean> {
  const overused = await getOverusedWords();
  return overused.has(word.toLowerCase());
}

/**
 * Get a comma-separated list of overused words for prompt injection.
 * Returns empty string if nothing is overused.
 */
export async function getBannedWordsList(): Promise<string> {
  const overused = await getOverusedWords();
  if (overused.size === 0) return '';

  const words = Array.from(overused).sort();
  return `Prefer alternatives to these overused words: ${words.slice(0, 30).join(', ')}${words.length > 30 ? ` (and ${words.length - 30} more)` : ''}. Choose fresher, more specific vocabulary.`;
}

/**
 * Get current stats for monitoring dashboard.
 */
export async function getVocabStats(): Promise<{ totalWords: number; uniqueWords: number; overusedCount: number }> {
  try {
    const [stats] = await sql.raw(`
      SELECT
        COUNT(*)::int as unique_words,
        COALESCE(SUM(count), 0)::int as total_words,
        COUNT(CASE WHEN count >= ${OVERUSE_THRESHOLD} THEN 1 END)::int as overused_count
      FROM bio_word_counts
    `);
    return {
      totalWords: stats.total_words,
      uniqueWords: stats.unique_words,
      overusedCount: stats.overused_count,
    };
  } catch {
    return { totalWords: 0, uniqueWords: 0, overusedCount: 0 };
  }
}

/**
 * Decay vocabulary counts (halve all counts) to create a sliding window.
 * Call periodically (e.g., every 500 bios) via cron.
 */
export async function decayVocabulary(): Promise<number> {
  try {
    const [{ removed }] = await sql.raw(`SELECT decay_bio_vocabulary() as removed`);
    return removed;
  } catch (e: any) {
    console.error('[bio-vocab] decay error:', e.message);
    return 0;
  }
}
