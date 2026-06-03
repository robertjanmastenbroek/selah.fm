/**
 * lib/bio-scorer.ts
 * Quality scoring for generated bios.
 * Each bio is scored 0-100. Bios below 70 are regenerated.
 */

export interface BioScore {
  score: number;      // 0-100
  passed: boolean;    // score >= 70
  checks: ScoreCheck[];
}

interface ScoreCheck {
  name: string;
  passed: boolean;
  points: number;
  maxPoints: number;
  detail?: string;
}

export function scoreBio(bio: string, artistName: string): BioScore {
  const checks: ScoreCheck[] = [];
  
  // 1. Word count (10 points)
  const words = bio.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  checks.push({
    name: 'word-count',
    passed: wordCount >= 250,
    points: wordCount >= 400 ? 10 : wordCount >= 250 ? 7 : wordCount >= 150 ? 4 : 1,
    maxPoints: 10,
    detail: `${wordCount} words (need 250+)`,
  });
  
  // 2. Artist name in first 150 words (15 points)
  const first150 = words.slice(0, 150).join(' ');
  const nameInFirst = first150.toLowerCase().includes(artistName.toLowerCase());
  checks.push({
    name: 'name-in-opening',
    passed: nameInFirst,
    points: nameInFirst ? 15 : 0,
    maxPoints: 15,
    detail: nameInFirst ? 'Present' : 'Missing from first 150 words',
  });
  
  // 3. Artist name somewhere in bio (5 points)
  const nameAnywhere = bio.toLowerCase().includes(artistName.toLowerCase());
  checks.push({
    name: 'name-present',
    passed: nameAnywhere,
    points: nameAnywhere ? 5 : 0,
    maxPoints: 5,
    detail: nameAnywhere ? 'Present' : 'Missing entirely',
  });
  
  // 4. Selah.fm mentioned (10 points)
  const hasSelah = bio.toLowerCase().includes('selah.fm') || bio.toLowerCase().includes('selah');
  checks.push({
    name: 'selah-mention',
    passed: hasSelah,
    points: hasSelah ? 10 : 0,
    maxPoints: 10,
  });
  
  // 5. Sentence variety (10 points)
  const sentences = bio.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  const shortSentences = sentenceLengths.filter(l => l <= 8).length;
  const longSentences = sentenceLengths.filter(l => l >= 25).length;
  const hasVariety = shortSentences >= 1 && longSentences >= 1;
  checks.push({
    name: 'sentence-variety',
    passed: hasVariety,
    points: hasVariety ? 10 : shortSentences >= 1 || longSentences >= 1 ? 5 : 2,
    maxPoints: 10,
    detail: `${shortSentences} short, ${longSentences} long sentences`,
  });
  
  // 6. No diminishing language (10 points)
  const diminishingWords = ['only', 'despite', 'but', 'however', 'although', 'merely', 'barely'];
  const foundDiminishing = diminishingWords.filter(w => {
    const regex = new RegExp(`\\b${w}\\b`, 'gi');
    return regex.test(bio);
  });
  checks.push({
    name: 'no-diminishing-language',
    passed: foundDiminishing.length === 0,
    points: foundDiminishing.length === 0 ? 10 : Math.max(0, 10 - foundDiminishing.length * 3),
    maxPoints: 10,
    detail: foundDiminishing.length > 0 ? `Found: ${foundDiminishing.join(', ')}` : 'Clean',
  });
  
  // 7. Paragraph count (10 points)
  const paragraphs = bio.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paraCount = paragraphs.length;
  checks.push({
    name: 'paragraph-count',
    passed: paraCount >= 3,
    points: paraCount >= 5 ? 10 : paraCount >= 3 ? 7 : paraCount >= 2 ? 4 : 1,
    maxPoints: 10,
    detail: `${paraCount} paragraphs (need 3+)`,
  });
  
  // 8. Paragraph length variety (10 points)
  const paraLengths = paragraphs.map(p => p.split(/\s+/).length);
  const hasParaVariety = paraLengths.length >= 2 && 
    Math.max(...paraLengths) - Math.min(...paraLengths) > 30;
  checks.push({
    name: 'paragraph-length-variety',
    passed: hasParaVariety,
    points: hasParaVariety ? 10 : paraCount >= 2 ? 5 : 1,
    maxPoints: 10,
    detail: hasParaVariety ? 'Good variety' : 'Paragraphs too similar in length',
  });
  
  // 9. No numbered lists or bullet points (10 points)
  const hasBullets = /^[-*]\s|\d+\.\s/.test(bio);
  checks.push({
    name: 'no-bullets',
    passed: !hasBullets,
    points: hasBullets ? 0 : 10,
    maxPoints: 10,
    detail: hasBullets ? 'Contains lists' : 'Clean prose',
  });
  
  // 10. Unique content — no generic phrases (10 points)
  const genericPatterns = [
    /in a world/i, /in the ever-evolving/i, /in today's/i, /in this day and age/i,
    /musical landscape/i, /realm of music/i, /testament to/i, /musical journey/i,
    /burgeoning/i, /tapestry/i, /sonic tapestry/i, /hit the scene/i, /making waves/i,
    /breath of fresh air/i, /one to watch/i,
  ];
  const genericMatches = genericPatterns.filter(p => p.test(bio));
  checks.push({
    name: 'no-generic-phrases',
    passed: genericMatches.length === 0,
    points: genericMatches.length === 0 ? 10 : Math.max(0, 10 - genericMatches.length * 3),
    maxPoints: 10,
    detail: genericMatches.length > 0 ? `Found: ${genericMatches.length} generic phrases` : 'Original',
  });
  
  const totalScore = Math.round(checks.reduce((sum, c) => sum + c.points, 0));
  
  return {
    score: totalScore,
    passed: totalScore >= 70,
    checks,
  };
}

/**
 * Get a formatted summary of the score for logging.
 */
export function formatScoreSummary(bioScore: BioScore, indent: string = ''): string {
  const lines: string[] = [];
  lines.push(`${indent}Score: ${bioScore.score}/100 [${bioScore.passed ? 'PASS' : 'FAIL'}]`);
  for (const check of bioScore.checks) {
    const icon = check.passed ? '✅' : '❌';
    lines.push(`${indent}  ${icon} ${check.name}: ${check.points}/${check.maxPoints}${check.detail ? ` — ${check.detail}` : ''}`);
  }
  return lines.join('\n');
}
