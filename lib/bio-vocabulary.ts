/**
 * lib/bio-vocabulary.ts
 * Sliding frequency window tracker for vocabulary diversity.
 * Tracks word usage across the last N bios.
 * Words appearing too frequently are flagged for avoidance.
 */

const WINDOW_SIZE = 200;
const MAX_FREQUENCY = 3; // Max appearances in window before flagging

interface VocabEntry {
  word: string;
  bioIndex: number;
}

let wordHistory: VocabEntry[] = [];
let bioCount = 0;

/**
 * Record all words from a generated bio.
 * Shifts the sliding window — entries older than WINDOW_SIZE are dropped.
 */
export function recordBio(bioText: string): void {
  const words = extractWords(bioText);
  const currentBioIndex = bioCount++;
  
  for (const word of words) {
    wordHistory.push({ word, bioIndex: currentBioIndex });
  }
  
  // Remove entries outside the window
  const cutoff = currentBioIndex - WINDOW_SIZE;
  wordHistory = wordHistory.filter(e => e.bioIndex > cutoff);
}

/**
 * Get a set of overused words that should be avoided in the next bio.
 */
export function getOverusedWords(): Set<string> {
  const freq = new Map<string, number>();
  
  for (const entry of wordHistory) {
    freq.set(entry.word, (freq.get(entry.word) || 0) + 1);
  }
  
  const overused = new Set<string>();
  for (const [word, count] of freq) {
    if (count >= MAX_FREQUENCY) {
      overused.add(word);
    }
  }
  
  return overused;
}

/**
 * Check if a word is overused.
 */
export function isOverused(word: string): boolean {
  return getOverusedWords().has(word.toLowerCase());
}

/**
 * Get a comma-separated list of overused words for prompt injection.
 */
export function getBannedWordsList(): string {
  const overused = getOverusedWords();
  if (overused.size === 0) return '';
  
  const words = Array.from(overused).sort();
  return `Do NOT use these words: ${words.slice(0, 30).join(', ')}${words.length > 30 ? `, and ${words.length - 30} more` : ''}.`;
}

/**
 * Get current stats for monitoring.
 */
export function getVocabStats(): { totalWords: number; uniqueWords: number; overusedCount: number; windowSize: number } {
  const unique = new Set(wordHistory.map(e => e.word));
  return {
    totalWords: wordHistory.length,
    uniqueWords: unique.size,
    overusedCount: getOverusedWords().size,
    windowSize: WINDOW_SIZE,
  };
}

/**
 * Reset state (for testing).
 */
export function reset(): void {
  wordHistory = [];
  bioCount = 0;
}

function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3) // skip short words (the, and, for)
    .filter(w => !STOP_WORDS.has(w));
}

const STOP_WORDS = new Set([
  'this', 'that', 'with', 'from', 'they', 'them', 'their', 'have', 'been',
  'were', 'what', 'when', 'where', 'which', 'there', 'about', 'would',
  'could', 'should', 'into', 'over', 'also', 'than', 'then', 'each',
  'after', 'other', 'because', 'before', 'between', 'through', 'during',
  'without', 'across', 'around', 'above', 'again', 'under', 'while',
  'where', 'these', 'those', 'being', 'doing', 'having', 'some', 'such',
  'more', 'very', 'just', 'most', 'even', 'much', 'still', 'already',
  'every', 'never', 'always', 'really', 'quite', 'rather',
]);
