/**
 * Selah.fm — Campaign Defaults Engine
 * Auto-generates sensible campaign requirements when artists don't fill them out.
 * Based on genre, track name, and platform context.
 */

const genreDefaults: Record<string, { vibe: string; content: string }> = {
  electronic: { vibe: 'High-energy', content: 'Use the track as background audio. Show movement, lights, or dance.' },
  edm: { vibe: 'Festival energy', content: 'High-energy content. Crowd shots, lights, drops. Make it feel BIG.' },
  techno: { vibe: 'Dark and driving', content: 'Dark, hypnotic visuals. Minimal, repetitive motion. Warehouse vibes.' },
  house: { vibe: 'Groovy', content: 'Smooth, rhythmic content. Dancing, flowing transitions. Feel-good energy.' },
  pop: { vibe: 'Fun and engaging', content: 'Lip-sync, lifestyle, or dance. Bright, relatable content that pops.' },
  hiphop: { vibe: 'Attitude-driven', content: 'Show your personality. Urban settings, confidence, authentic delivery.' },
  'hip-hop': { vibe: 'Attitude-driven', content: 'Show your personality. Urban settings, confidence, authentic delivery.' },
  rock: { vibe: 'Raw and energetic', content: 'Performance-style shots, gritty visuals, high energy.' },
  indie: { vibe: 'Aesthetic and moody', content: 'Cinematic visuals, warm tones. Storytelling through imagery.' },
  rnb: { vibe: 'Smooth and soulful', content: 'Intimate, warm content. Close-up shots, emotional expression.' },
  'r&b': { vibe: 'Smooth and soulful', content: 'Intimate, warm content. Close-up shots, emotional expression.' },
  jazz: { vibe: 'Classy and smooth', content: 'Elegant visuals. Candlelight, slow motion, sophisticated settings.' },
  classical: { vibe: 'Timeless and elegant', content: 'Cinematic, slow-paced visuals. Grand settings or minimalist beauty.' },
  country: { vibe: 'Down-to-earth', content: 'Outdoor settings, natural light. Authentic, storytelling content.' },
  metal: { vibe: 'Intense and powerful', content: 'Dark, aggressive visuals. Fast cuts, dramatic lighting.' },
  christian: { vibe: 'Uplifting and sincere', content: 'Warm, hopeful visuals. Natural light, genuine emotion.' },
  gospel: { vibe: 'Powerful and soulful', content: 'Expressive, emotional content. Power and passion in every frame.' },
};

const defaultVibe = { vibe: 'Authentic', content: 'Create content that feels natural to your style using this track as background audio.' };

export function generateRequirements(trackTitle: string, genres?: string): string {
  const genreList = (genres || '').toLowerCase().split(',').map(g => g.trim()).filter(Boolean);
  
  // Pick the first matched genre vibe
  let vibe = defaultVibe;
  for (const g of genreList) {
    if (genreDefaults[g]) { vibe = genreDefaults[g]; break; }
  }

  return `${vibe.content} Minimum 15 seconds. Show your face or personality. Make it authentic.`;
}

export function generateHashtags(trackTitle: string, genres?: string): string {
  const tags: string[] = ['#selahfm', '#paidpartner'];
  
  // Add track name words as hashtags (max 3)
  const words = trackTitle
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 3);
  
  for (const w of words) {
    tags.push(`#${w.toLowerCase()}`);
  }

  // Add genre hashtags
  const genreList = (genres || '').toLowerCase().split(',').map(g => g.trim()).filter(Boolean);
  for (const g of genreList.slice(0, 2)) {
    const tag = g.replace(/[^a-z0-9]/g, '');
    if (tag && !tags.some(t => t.includes(tag))) {
      tags.push(`#${tag}music`);
    }
  }

  return tags.join(' ');
}

export function generateCaptionRequirements(artistName?: string): string {
  const tag = artistName ? `Tag @${artistName.replace(/\s+/g, '')} in your caption. ` : '';
  return `${tag}Use this track as background audio.`;
}

export function generateCampaignDefaults(trackTitle: string, genres?: string, artistName?: string) {
  return {
    requirements: generateRequirements(trackTitle, genres),
    hashtags: generateHashtags(trackTitle, genres),
    captionRequirements: generateCaptionRequirements(artistName),
    minVideoLengthSeconds: 15,
    requireFtc: false,
  };
}
