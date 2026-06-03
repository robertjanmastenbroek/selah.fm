/**
 * lib/bio-tone.ts
 * 8 distinct tones for artist bios.
 * The tone determines voice, sentence structure, vocabulary, and emotional register.
 */

export interface Tone {
  id: string;
  name: string;
  description: string;
  voice: string;
  sentenceLength: 'short' | 'mixed' | 'long';
  vocabulary: string[];
  emotionalRange: string;
  systemPrompt: string; // extra instructions for the AI
}

export const TONES: Tone[] = [
  {
    id: 'profile',
    name: 'Profile',
    description: 'Warm, informative, professional.',
    voice: 'Knowledgeable friend introducing you to great music.',
    sentenceLength: 'mixed',
    vocabulary: ['craft', 'sound', 'style', 'build', 'create'],
    emotionalRange: 'Warm to enthusiastic',
    systemPrompt: 'Write in a warm, professional tone. Like a music blogger who genuinely loves discovering new artists. Be informative but accessible. Avoid hype or exaggeration.',
  },
  {
    id: 'review',
    name: 'Review',
    description: 'Analytical, specific, balanced.',
    voice: 'Music critic with an ear for quality.',
    sentenceLength: 'long',
    vocabulary: ['texture', 'arrangement', 'composition', 'layer', 'nuance'],
    emotionalRange: 'Analytical to impressed',
    systemPrompt: 'Write in an analytical tone. Focus on the craft and quality of the music. Be specific about what works and why. Maintain credibility — praise feels earned when it\'s specific.',
  },
  {
    id: 'feature',
    name: 'Feature',
    description: 'Narrative, story-driven, engaging.',
    voice: 'Rolling Stone journalist telling a story.',
    sentenceLength: 'mixed',
    vocabulary: ['story', 'journey', 'path', 'chapter', 'moment'],
    emotionalRange: 'Curious to inspired',
    systemPrompt: 'Write in a narrative feature style. Tell the artist\'s story. Use scene-setting and vivid details. Make the reader feel like they\'re discovering the artist alongside you.',
  },
  {
    id: 'data',
    name: 'Data',
    description: 'Confident, direct, numbers-forward.',
    voice: 'Industry analyst with proof.',
    sentenceLength: 'short',
    vocabulary: ['streams', 'growth', 'audience', 'metrics', 'milestone'],
    emotionalRange: 'Factual to celebratory',
    systemPrompt: 'Write in a confident, data-aware tone. Use the numbers to tell the story. Be direct and punchy. Let the data speak — don\'t over-explain. Short sentences. Clear claims.',
  },
  {
    id: 'listener',
    name: 'Listener',
    description: 'Emotional, evocative, experience-focused.',
    voice: 'A fan describing how the music feels.',
    sentenceLength: 'long',
    vocabulary: ['feel', 'hit', 'stay', 'resonate', 'haunt'],
    emotionalRange: 'Reflective to moved',
    systemPrompt: 'Write from the listener\'s perspective. Focus on how the music feels to experience. Use emotional language. Describe the impact, not just the sound. Make the reader curious to hear it.',
  },
  {
    id: 'fan',
    name: 'Fan',
    description: 'Passionate, enthusiastic, community-driven.',
    voice: 'A dedicated fan sharing their discovery.',
    sentenceLength: 'short',
    vocabulary: ['love', 'discover', 'share', 'community', 'excited'],
    emotionalRange: 'Excited to passionate',
    systemPrompt: 'Write with genuine enthusiasm. Like a fan who just discovered something great and can\'t wait to share it. Be warm and energetic. Use exclamation marks sparingly — let the enthusiasm come through in word choice.',
  },
  {
    id: 'journalist',
    name: 'Journalist',
    description: 'Objective, balanced, informed.',
    voice: 'A music journalist reporting facts.',
    sentenceLength: 'mixed',
    vocabulary: ['released', 'produced', 'collaborated', 'performed', 'recorded'],
    emotionalRange: 'Neutral to appreciative',
    systemPrompt: 'Write in a journalistic tone. Report the facts clearly. Be objective but not cold. Include context about their career trajectory. Let the reader form their own opinion — present the information without over-selling.',
  },
  {
    id: 'critic',
    name: 'Critic',
    description: 'Discerning, thoughtful, quality-focused.',
    voice: 'A curator with high standards.',
    sentenceLength: 'long',
    vocabulary: ['refined', 'distinctive', 'polished', 'sophisticated', 'mature'],
    emotionalRange: 'Thoughtful to impressed',
    systemPrompt: 'Write with a discerning critical voice. Praise what deserves praise — specifically. Avoid generic compliments. Focus on what makes this artist stand out from the crowd. Quality signals only.',
  },
];

export function selectTone(preferred: string, fallback: string = 'profile'): Tone {
  const tone = TONES.find(t => t.id === preferred);
  if (tone) return tone;
  return TONES.find(t => t.id === fallback) || TONES[0];
}

export default TONES;
