/**
 * lib/blog-scorer.ts
 * Quality & anti-detection scorer for SEO blog posts.
 * Each post is scored 0-100. Posts below 60 are flagged for review.
 *
 * Parallel to lib/bio-scorer.ts — applies the same quality-gate pattern
 * to the blog system so we never publish low-quality or detectable content.
 */

export interface BlogScore {
  score: number;      // 0-100
  passed: boolean;    // score >= 60
  checks: ScoreCheck[];
}

interface ScoreCheck {
  name: string;
  passed: boolean;
  points: number;
  maxPoints: number;
  detail?: string;
}

/** Hardcoded AI-detection giveaway phrases — same as the ARTICLE_PROMPT banned list */
const BANNED_PHRASES = [
  /(?:\b|\W)Furthermore(?:\b|\W)/gi, /(?:\b|\W)Moreover(?:\b|\W)/gi,
  /(?:\b|\W)Consequently(?:\b|\W)/gi, /(?:\b|\W)Thus(?:\b|\W)/gi,
  /(?:\b|\W)Hence(?:\b|\W)/gi, /(?:\b|\W)Therefore(?:\b|\W)/gi,
  /in conclusion/gi, /to summarize/gi, /in summary/gi,
  /it is important to note/gi, /it is worth mentioning/gi, /it should be noted/gi,
  /(?:\b|\W)crucial(?:\b|\W)/gi, /(?:\b|\W)essential(?:\b|\W)/gi,
  /(?:\b|\W)vital(?:\b|\W)/gi, /(?:\b|\W)paramount(?:\b|\W)/gi,
  /(?:\b|\W)imperative(?:\b|\W)/gi,
  /delve into/gi, /dive deep into/gi, /explore the nuances/gi,
  /a tapestry of/gi, /a myriad of/gi, /a plethora of/gi,
  /game-changer/gi, /revolutionary/gi, /cutting-edge/gi,
  /not only.*but also/gi,
  /in today's fast-paced world/gi, /in the modern era/gi, /in recent years/gi,
  /(?:\b|\W)leverage(?:\b|\W)/gi, /(?:\b|\W)utilize(?:\b|\W)/gi,
  /(?:\b|\W)optimize(?:\b|\W)/gi, /(?:\b|\W)maximize(?:\b|\W)/gi,
  /(?:\b|\W)robust(?:\b|\W)/gi, /(?:\b|\W)seamless(?:\b|\W)/gi,
  /(?:\b|\W)comprehensive(?:\b|\W)/gi, /(?:\b|\W)holistic(?:\b|\W)/gi,
  /(?:\b|\W)foster(?:\b|\W)/gi, /(?:\b|\W)cultivate(?:\b|\W)/gi,
  /(?:\b|\W)empower(?:\b|\W)/gi, /(?:\b|\W)enable(?:\b|\W)/gi,
  /navigate the complexities/gi, /in the realm of/gi, /in the landscape of/gi,
  /(?:\b|\W)additionally(?:\b|\W)/gi,
];

/** Generic filler phrases that signal AI-written content */
const GENERIC_PHRASES = [
  /in a world/i, /in the ever-evolving/i, /in this day and age/i,
  /musical landscape/i, /realm of music/i, /testament to/i,
  /musical journey/i, /burgeoning/i, /sonic tapestry/i,
  /hit the scene/i, /making waves/i, /breath of fresh air/i,
  /one to watch/i, /stands as a testament/i, /at the end of the day/i,
  /when it comes to/i, /in the world of/i, /it goes without saying/i,
  /needless to say/i, /last but not least/i, /think outside the box/i,
];

/** Voice markers that show human authorship */
const VOICE_MARKERS = [
  "i'll be honest", "here's the thing", "i learned this the hard way",
  "trust me on this", "you know what i mean", "here's what i wish",
  "i'm not gonna", "this might sound crazy", "i remember sitting",
  "honestly?", "i was wrong about", "nobody talks about this",
  "can i be real", "i still struggle with", "here's a story i don't tell",
];

/** Contraction set for human-language ratio check */
const CONTRACTION_PATTERNS = [
  /\bdon't\b/gi, /\bcan't\b/gi, /\bwon't\b/gi, /\b isn't\b/gi,
  /\bwasn't\b/gi, /\bi've\b/gi, /\byou've\b/gi, /\bthey've\b/gi,
  /\bwe're\b/gi, /\bi'm\b/gi, /\bit's\b/gi, /\bthat's\b/gi,
  /\bhere's\b/gi, /\bthere's\b/gi, /\bwhat's\b/gi, /\bdidn't\b/gi,
  /\bdoesn't\b/gi, /\bhaven't\b/gi, /\bhasn't\b/gi, /\bcouldn't\b/gi,
  /\bwouldn't\b/gi, /\bshouldn't\b/gi, /\bgonna\b/gi, /\bwanna\b/gi,
  /\bkinda\b/gi, /\beit's\b/gi,
];

export function scoreBlogPost(
  title: string,
  contentHtml: string,
  excerpt: string,
  faqSchema?: { question: string; answer: string }[]
): BlogScore {
  const checks: ScoreCheck[] = [];
  const fullText = `${title} ${excerpt} ${contentHtml}`;
  const textLower = fullText.toLowerCase();

  // Strip HTML for text analysis
  const plainText = contentHtml.replace(/<[^>]*>/g, ' ');
  const words = plainText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // ── 1. Word count (10 points) ────────────────────────────
  checks.push({
    name: 'word-count',
    passed: wordCount >= 1000,
    points: wordCount >= 1500 ? 10 : wordCount >= 1000 ? 7 : wordCount >= 700 ? 4 : 1,
    maxPoints: 10,
    detail: `${wordCount} words (target 1,200+)`,
  });

  // ── 2. Sentence length variety — burstiness (10 points) ──
  const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(w => w.length > 0).length);
  const shortSentences = sentenceLengths.filter(l => l <= 6).length;
  const longSentences = sentenceLengths.filter(l => l >= 25).length;
  const mediumUniform = sentenceLengths.filter(l => l > 6 && l < 25);

  // Check for 3+ consecutive medium-length sentences (uniformity flag)
  let uniformRuns = 0;
  let currentRun = 0;
  for (const len of sentenceLengths) {
    if (len > 6 && len < 20) {
      currentRun++;
      if (currentRun >= 3) uniformRuns++;
    } else {
      currentRun = 0;
    }
  }

  const hasBurstiness = shortSentences >= 2 && longSentences >= 1;
  const noUniformRuns = uniformRuns === 0;
  checks.push({
    name: 'sentence-variety',
    passed: hasBurstiness && uniformRuns <= 1,
    points: hasBurstiness && noUniformRuns ? 10
      : hasBurstiness ? 7
      : shortSentences >= 1 || longSentences >= 1 ? 4 : 1,
    maxPoints: 10,
    detail: `${shortSentences} short (≤6w), ${longSentences} long (≥25w), ${uniformRuns} uniformity runs`,
  });

  // ── 3. Banned word / AI-giveaway phrase detection (15 points) ──
  let bannedMatchCount = 0;
  const foundBanned: string[] = [];
  for (const pattern of BANNED_PHRASES) {
    const matches = fullText.match(pattern);
    if (matches) {
      bannedMatchCount += matches.length;
      foundBanned.push(matches[0].trim());
    }
  }

  // Deduplicate
  const uniqueBanned = [...new Set(foundBanned.map(s => s.toLowerCase()))];

  checks.push({
    name: 'no-ai-giveaway-phrases',
    passed: bannedMatchCount === 0,
    points: bannedMatchCount === 0 ? 15
      : Math.max(0, 15 - uniqueBanned.length * 4),
    maxPoints: 15,
    detail: bannedMatchCount > 0
      ? `Found ${uniqueBanned.length} banned patterns: ${uniqueBanned.slice(0, 5).join(', ')}${uniqueBanned.length > 5 ? ` +${uniqueBanned.length - 5} more` : ''}`
      : 'Clean',
  });

  // ── 4. Generic filler phrases (10 points) ────────────────
  let genericCount = 0;
  const foundGeneric: string[] = [];
  for (const pattern of GENERIC_PHRASES) {
    const matches = fullText.match(pattern);
    if (matches) {
      genericCount += matches.length;
      foundGeneric.push(matches[0].trim());
    }
  }
  const uniqueGeneric = [...new Set(foundGeneric.map(s => s.toLowerCase()))];

  checks.push({
    name: 'no-generic-phrases',
    passed: genericCount === 0,
    points: genericCount === 0 ? 10 : Math.max(0, 10 - uniqueGeneric.length * 3),
    maxPoints: 10,
    detail: genericCount > 0 ? `Found: ${uniqueGeneric.slice(0, 4).join(', ')}` : 'Original',
  });

  // ── 5. Personal voice markers (10 points) ────────────────
  let voiceMarkerCount = 0;
  for (const marker of VOICE_MARKERS) {
    if (textLower.includes(marker)) voiceMarkerCount++;
  }

  checks.push({
    name: 'personal-voice-markers',
    passed: voiceMarkerCount >= 3,
    points: Math.min(10, voiceMarkerCount * 2),
    maxPoints: 10,
    detail: `${voiceMarkerCount} voice markers (need 3+)`,
  });

  // ── 6. Contraction ratio (10 points) ─────────────────────
  let contractionCount = 0;
  for (const pattern of CONTRACTION_PATTERNS) {
    const matches = fullText.match(pattern);
    if (matches) contractionCount += matches.length;
  }

  // Target: at least 1 contraction per 100 words
  const contractionRatio = wordCount > 0 ? contractionCount / (wordCount / 100) : 0;
  checks.push({
    name: 'contraction-usage',
    passed: contractionRatio >= 1.0,
    points: contractionRatio >= 2.0 ? 10 : contractionRatio >= 1.0 ? 7 : contractionRatio >= 0.5 ? 4 : 1,
    maxPoints: 10,
    detail: `${contractionCount} contractions (${contractionRatio.toFixed(1)} per 100 words, need ≥1.0)`,
  });

  // ── 7. Paragraph variety (10 points) ─────────────────────
  const paragraphs = plainText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paraCount = paragraphs.length;
  const paraSentenceCounts = paragraphs.map(p =>
    p.split(/[.!?]+/).filter(s => s.trim().length > 0).length
  );

  const oneSentenceParas = paraSentenceCounts.filter(c => c === 1).length;
  const longParas = paraSentenceCounts.filter(c => c >= 5).length;
  const hasParaVariety = oneSentenceParas >= 2 && longParas >= 1;

  checks.push({
    name: 'paragraph-variety',
    passed: hasParaVariety && paraCount >= 5,
    points: hasParaVariety && paraCount >= 5 ? 10
      : paraCount >= 3 ? 6
      : paraCount >= 2 ? 3 : 1,
    maxPoints: 10,
    detail: `${paraCount} paragraphs (${oneSentenceParas} short, ${longParas} long)`,
  });

  // ── 8. FAQ section present (5 points) ────────────────────
  const hasFaq = (faqSchema && faqSchema.length >= 2) || contentHtml.includes('<h2>FAQ</h2>') || contentHtml.includes('<h2>faq</h2>');
  checks.push({
    name: 'faq-section',
    passed: hasFaq,
    points: hasFaq ? 5 : 0,
    maxPoints: 5,
  });

  // ── 9. Key Takeaways section present (5 points) ──────────
  const hasKeyTakeaways = contentHtml.includes('Key Takeaways') || contentHtml.includes('key takeaways');
  checks.push({
    name: 'key-takeaways',
    passed: hasKeyTakeaways,
    points: hasKeyTakeaways ? 5 : 0,
    maxPoints: 5,
  });

  // ── 10. No numbered lists/bullets in main prose (5 points) ──
  // (HTML lists from <ul>/<li> are fine — this checks for markdown-style bullets)
  const hasMarkdownBullets = /^[-*]\s|\d+\.\s/m.test(plainText);
  checks.push({
    name: 'no-markdown-bullets',
    passed: !hasMarkdownBullets,
    points: hasMarkdownBullets ? 0 : 5,
    maxPoints: 5,
    detail: hasMarkdownBullets ? 'Contains raw markdown bullets' : 'Clean HTML structure',
  });

  // ── 11. Keyword in title (5 points) ──────────────────────
  // Quick check: title should contain meaningful keyword-related words
  const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 4);
  const contentHasKeyword = titleWords.some(w => plainText.toLowerCase().includes(w));
  checks.push({
    name: 'keyword-in-content',
    passed: contentHasKeyword,
    points: contentHasKeyword ? 5 : 0,
    maxPoints: 5,
    detail: contentHasKeyword ? 'Title keywords appear in content' : 'Title keywords missing from content',
  });

  // ── 12. Sentence fragment bonus (5 points) ────────────────
  // Detect sentence fragments by looking for sentences under 4 words
  const fragments = sentences.filter(s => {
    const wc = s.split(/\s+/).filter(w => w.length > 0).length;
    return wc >= 2 && wc <= 4;
  });
  const fragmentCount = fragments.length;
  checks.push({
    name: 'sentence-fragments',
    passed: fragmentCount >= 3,
    points: Math.min(5, fragmentCount),
    maxPoints: 5,
    detail: `${fragmentCount} fragments (need 3+ for natural rhythm)`,
  });

  // ── 13. Emotional variation (5 points) ────────────────────
  // Look for emotional shift markers
  const emotionMarkers = [
    /\bhonestly?\b/gi, /\bfrustrat(?:ed|ing)\b/gi, /\bexcit(?:ed|ing)\b/gi,
    /\bscared\b/gi, /\bscary\b/gi, /\bfired up\b/gi, /\bcalm\b/gi,
    /\bworry\b/gi, /\bhop(?:e|ing|eful)\b/gi, /\bgrateful\b/gi,
    /\btough\b/gi, /\bhardest\b/gi, /\bbeautiful\b/gi,
    /\bsucked\b/gi, /\bamazing\b/gi, /\bterrify(?:ing|ied)\b/gi,
    /\bstrugg(?:le|led|ling)\b/gi, /\bwonderful\b/gi,
    /\bpainful\b/gi, /\bmagic\b/gi, /\bchaos\b/gi,
  ];
  let emotionCount = 0;
  for (const pattern of emotionMarkers) {
    if (pattern.test(fullText)) emotionCount++;
  }

  checks.push({
    name: 'emotional-variation',
    passed: emotionCount >= 5,
    points: Math.min(5, Math.floor(emotionCount / 2)),
    maxPoints: 5,
    detail: `${emotionCount} emotional markers (need 5+ for natural variation)`,
  });

  // ── Compute total ──────────────────────────────────────────
  const totalScore = Math.min(100, Math.round(checks.reduce((sum, c) => sum + c.points, 0)));

  return {
    score: totalScore,
    passed: totalScore >= 60,
    checks,
  };
}

/**
 * Get a formatted summary of the blog score for logging.
 */
export function formatScoreSummary(blogScore: BlogScore, indent: string = ''): string {
  const lines: string[] = [];
  lines.push(`${indent}Score: ${blogScore.score}/100 [${blogScore.passed ? 'PASS' : 'FLAGGED'}]`);
  for (const check of blogScore.checks) {
    const icon = check.passed ? '✅' : check.points > 0 ? '⚠️' : '❌';
    lines.push(`${indent}  ${icon} ${check.name}: ${check.points}/${check.maxPoints}${check.detail ? ` — ${check.detail}` : ''}`);
  }
  return lines.join('\n');
}
