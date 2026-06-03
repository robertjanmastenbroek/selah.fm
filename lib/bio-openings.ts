/**
 * lib/bio-openings.ts
 * 65+ opening hook templates organized by style.
 * Each opening produces different text when artist data is injected.
 */

export interface OpeningHook {
  id: string;
  style: string;
  template: string;
  toneHint: string;
}

export const OPENINGS: OpeningHook[] = [
  // ── Scene-setting (10) ──
  { id: 'scene-1', style: 'scene-setting', template: 'The first time you hear {{name}}, something shifts. Not dramatically — but perceptibly. There\'s a quality in the sound that suggests you\'ve stumbled onto something real.', toneHint: 'profile' },
  { id: 'scene-2', style: 'scene-setting', template: 'There\'s a moment in every listener\'s journey when a new artist enters the frame and changes what you thought you knew. {{name}} is one of those artists.', toneHint: 'feature' },
  { id: 'scene-3', style: 'scene-setting', template: 'Some music arrives quietly. It doesn\'t announce itself with fanfare or demand your attention. {{name}}\'s catalog works the same way — revealing itself gradually, rewarding those who listen closely.', toneHint: 'profile' },
  { id: 'scene-4', style: 'scene-setting', template: 'Picture this: you\'re scrolling, not looking for anything in particular, and a track stops you mid-scroll. That\'s the {{name}} effect. Their music has a way of cutting through the noise.', toneHint: 'fan' },
  { id: 'scene-5', style: 'scene-setting', template: 'It starts with a single track. Then another. Before you know it, you\'ve listened to the entire catalog and you\'re wondering why you hadn\'t heard of {{name}} sooner.', toneHint: 'listener' },
  { id: 'scene-6', style: 'scene-setting', template: '{{name}} makes music that feels like a discovery — not in the algorithmic sense, but in the way you stumble onto something that feels like it was made just for you.', toneHint: 'profile' },
  { id: 'scene-7', style: 'scene-setting', template: 'The best musical discoveries often happen by accident. A random playlist, a friend\'s recommendation, a late-night deep dive. However you find {{name}}, you\'ll remember where you were.', toneHint: 'listener' },
  { id: 'scene-8', style: 'scene-setting', template: 'There are artists you listen to, and then there are artists you *hear*. {{name}} falls into the second category — their music demands presence, not just playback.', toneHint: 'review' },
  { id: 'scene-9', style: 'scene-setting', template: 'Every so often, an artist emerges whose music feels less like a product and more like a conversation. {{name}} is having that conversation, and more people are starting to listen.', toneHint: 'feature' },
  { id: 'scene-10', style: 'scene-setting', template: 'Close your eyes and press play on any {{name}} track. Within seconds, you\'ll understand why their audience is growing. The music creates its own atmosphere.', toneHint: 'listener' },

  // ── Direct statement (10) ──
  { id: 'direct-1', style: 'direct-statement', template: '{{name}} makes music that doesn\'t rush. In an environment built for speed, their catalog offers something increasingly rare: patience as a creative choice.', toneHint: 'critic' },
  { id: 'direct-2', style: 'direct-statement', template: '{{name}} is proof that independent artists don\'t need a label to build something worth paying attention to.', toneHint: 'profile' },
  { id: 'direct-3', style: 'direct-statement', template: 'Here\'s what you need to know about {{name}}: their music rewards attention. Every listen reveals something the first pass missed.', toneHint: 'review' },
  { id: 'direct-4', style: 'direct-statement', template: '{{name}} is building something from the ground up. No shortcuts, no formulas — just music made with intention.', toneHint: 'feature' },
  { id: 'direct-5', style: 'direct-statement', template: '{{name}} doesn\'t chase trends. Their catalog suggests an artist who trusts their instincts and lets the work find its audience.', toneHint: 'profile' },
  { id: 'direct-6', style: 'direct-statement', template: 'If you\'ve been searching for music that feels handcrafted rather than manufactured, {{name}} is exactly what you\'re looking for.', toneHint: 'fan' },
  { id: 'direct-7', style: 'direct-statement', template: '{{name}} represents something that\'s becoming increasingly rare in music: an artist with a clear vision and the patience to execute it.', toneHint: 'critic' },
  { id: 'direct-8', style: 'direct-statement', template: '{{name}} proves that you don\'t need millions of streams to make music that matters — you just need to mean it.', toneHint: 'profile' },
  { id: 'direct-9', style: 'direct-statement', template: '{{name}}\'s music operates on its own terms. It\'s not trying to fit into a playlist or please an algorithm. It\'s simply being itself.', toneHint: 'review' },
  { id: 'direct-10', style: 'direct-statement', template: 'The thing about {{name}} is that their music stays with you. Long after the track ends, parts of it linger — a melody, a phrase, a feeling.', toneHint: 'listener' },

  // ── Question (5) ──
  { id: 'question-1', style: 'question', template: 'What does it take for an independent artist to break through in a world of infinite content? Ask {{name}} — they\'re figuring it out, one track at a time.', toneHint: 'feature' },
  { id: 'question-2', style: 'question', template: 'When was the last time a new artist stopped you mid-scroll? For many listeners, {{name}} was the answer.', toneHint: 'fan' },
  { id: 'question-3', style: 'question', template: 'What makes a track worth a second listen? For fans of {{name}}, the answer comes naturally — the layers, the craft, the feeling that there\'s more to uncover.', toneHint: 'review' },
  { id: 'question-4', style: 'question', template: 'How does an independent artist build a following without a label\'s backing? {{name}}\'s approach offers a compelling case study.', toneHint: 'data' },
  { id: 'question-5', style: 'question', template: 'What happens when an artist trusts their instincts completely? You get the catalog that {{name}} has been building.', toneHint: 'profile' },

  // ── Data-led (5) ──
  { id: 'data-1', style: 'data-led', template: '{{streams}}. {{tracks}} tracks. {{followers}}. These are the numbers behind {{name}}\'s journey so far — but they only tell part of the story.', toneHint: 'data' },
  { id: 'data-2', style: 'data-led', template: '{{streams}} across {{tracks}} tracks. {{name}} has been quietly building a catalog that\'s starting to get the attention it deserves.', toneHint: 'data' },
  { id: 'data-3', style: 'data-led', template: 'The numbers paint a clear picture: {{name}} is gaining traction. {{streams}} and counting, with a catalog of {{tracks}} tracks that keeps growing.', toneHint: 'data' },
  { id: 'data-4', style: 'data-led', template: '{{streams}}. {{tracks}} releases. {{followers}}. {{name}}\'s trajectory suggests an artist whose best work is still ahead of them.', toneHint: 'feature' },
  { id: 'data-5', style: 'data-led', template: '{{tracks}} tracks into their journey, {{name}} has accumulated {{streams}} and {{followers}}. But the music tells the real story.', toneHint: 'profile' },

  // ── Comparative (5) ──
  { id: 'comp-1', style: 'comparative', template: 'If you\'ve been following independent music, you\'ve likely heard whispers about {{name}}. The buzz is earned.', toneHint: 'feature' },
  { id: 'comp-2', style: 'comparative', template: 'Comparing {{name}} to other artists in their space misses the point. Their sound is their own — built from influences but shaped by instinct.', toneHint: 'critic' },
  { id: 'comp-3', style: 'comparative', template: 'In a field crowded with artists vying for attention, {{name}} stands out by not vying at all. Their music does the work.', toneHint: 'profile' },
  { id: 'comp-4', style: 'comparative', template: 'Fans of thoughtful, well-crafted music will find a lot to love in {{name}}\'s catalog. This is songwriting that respects the listener.', toneHint: 'review' },
  { id: 'comp-5', style: 'comparative', template: 'What sets {{name}} apart isn\'t just the music — it\'s the approach. Every release feels considered, not rushed.', toneHint: 'review' },

  // ── Metaphorical (5) ──
  { id: 'meta-1', style: 'metaphorical', template: 'Think of {{name}}\'s catalog as a photo album. Each track captures a different moment, a different light, a different angle of the same artistic vision.', toneHint: 'profile' },
  { id: 'meta-2', style: 'metaphorical', template: 'If {{name}}\'s music were a place, it would be a room with good acoustics — warm, intimate, where every detail is audible.', toneHint: 'listener' },
  { id: 'meta-3', style: 'metaphorical', template: '{{name}}\'s discography reads like a map of creative growth. Each track marks a point on the journey, charting terrain that\'s constantly evolving.', toneHint: 'feature' },
  { id: 'meta-4', style: 'metaphorical', template: 'There\'s an architectural quality to {{name}}\'s music. Every element is placed with intention, each track a structure built to last.', toneHint: 'critic' },
  { id: 'meta-5', style: 'metaphorical', template: 'Listening to {{name}} is like flipping through a sketchbook. Not everything is finished, but everything is honest.', toneHint: 'listener' },

  // ── Process-focused (5) ──
  { id: 'process-1', style: 'process-focused', template: 'The way {{name}} builds a track says a lot about their approach. Each release feels carefully constructed, with attention to the details that elevate a song.', toneHint: 'review' },
  { id: 'process-2', style: 'process-focused', template: 'Behind every {{name}} track is a process that prioritizes feel over formula. The result is music that breathes naturally.', toneHint: 'critic' },
  { id: 'process-3', style: 'process-focused', template: '{{name}} approaches songwriting like a craft to be honed. Each release shows growth, each track refines their voice.', toneHint: 'profile' },
  { id: 'process-4', style: 'process-focused', template: 'There\'s a deliberate quality to {{name}}\'s work. These aren\'t songs that happened by accident — they\'re built with care.', toneHint: 'review' },
  { id: 'process-5', style: 'process-focused', template: '{{name}} seems to understand that the best music comes from a place of patience. Their catalog demonstrates what happens when an artist takes the time to get it right.', toneHint: 'feature' },

  // ── Time-based (5) ──
  { id: 'time-1', style: 'time-based', template: '{{name}} has been building their catalog steadily, releasing music that documents their evolution as an artist and the growth of their sound.', toneHint: 'feature' },
  { id: 'time-2', style: 'time-based', template: 'With each new release, {{name}} adds another chapter to a growing body of work. The story so far is compelling — and far from over.', toneHint: 'profile' },
  { id: 'time-3', style: 'time-based', template: '{{tracks}} tracks into their journey, {{name}} has established a sound that\'s recognizable across their catalog — a sign of an artist finding their voice.', toneHint: 'review' },
  { id: 'time-4', style: 'time-based', template: 'From their earliest releases to their most recent, {{name}}\'s catalog tells the story of an artist coming into their own.', toneHint: 'feature' },
  { id: 'time-5', style: 'time-based', template: '{{name}} has been quietly releasing music, building a catalog that rewards those who\'ve been paying attention since the beginning.', toneHint: 'profile' },

  // ── Audience-focused (5) ──
  { id: 'aud-1', style: 'audience-focused', template: 'The people listening to {{name}} know something. They\'ve found an artist whose music speaks to them directly, without filters or intermediaries.', toneHint: 'fan' },
  { id: 'aud-2', style: 'audience-focused', template: '{{name}}\'s audience is growing for a reason. Word-of-mouth has a way of finding music that resonates, and this catalog resonates.', toneHint: 'listener' },
  { id: 'aud-3', style: 'audience-focused', template: 'More and more listeners are discovering {{name}}. The numbers are nice, but what\'s more telling is how people talk about the music.', toneHint: 'fan' },
  { id: 'aud-4', style: 'audience-focused', template: '{{name}} is building an audience the old-fashioned way: one track at a time. No shortcuts, just consistent quality that people want to share.', toneHint: 'data' },
  { id: 'aud-5', style: 'audience-focused', template: 'The growing audience around {{name}} isn\'t a fluke. It\'s the result of music that connects — and people who want to talk about it.', toneHint: 'fan' },

  // ── Contrast (5) ──
  { id: 'contrast-1', style: 'contrast', template: 'In an era of 15-second attention spans, {{name}} is asking for your full focus. The reward for giving it is music that stays with you.', toneHint: 'critic' },
  { id: 'contrast-2', style: 'contrast', template: 'While algorithms push for more content, faster, {{name}} takes the opposite approach: fewer tracks, each one carefully considered.', toneHint: 'review' },
  { id: 'contrast-3', style: 'contrast', template: 'In a landscape of endless collaboration and cross-promotion, {{name}} is building something alone — and it\'s working.', toneHint: 'profile' },
  { id: 'contrast-4', style: 'contrast', template: '{{name}} isn\'t trying to go viral. They\'re trying to last. There\'s a difference, and their catalog makes it clear.', toneHint: 'feature' },
  { id: 'contrast-5', style: 'contrast', template: 'Where many artists spread themselves thin across platforms and features, {{name}} stays focused on one thing: the music itself.', toneHint: 'critic' },

  // ── Quote-like (5) ──
  { id: 'quote-1', style: 'quote-like', template: 'Some music asks to be heard. {{name}}\'s music asks to be felt. There\'s a difference, and it\'s the difference between listening and experiencing.', toneHint: 'listener' },
  { id: 'quote-2', style: 'quote-like', template: 'Every track {{name}} releases carries a quiet confidence. This is music made by someone who knows exactly what they want to say.', toneHint: 'profile' },
  { id: 'quote-3', style: 'quote-like', template: '{{name}} makes the kind of music that makes you want to tell someone about it. That\'s the highest compliment any artist can earn.', toneHint: 'fan' },
  { id: 'quote-4', style: 'quote-like', template: 'There\'s a line in music between "good" and "worth returning to." {{name}} lives on the right side of that line.', toneHint: 'review' },
  { id: 'quote-5', style: 'quote-like', template: 'The best music creates its own context. {{name}}\'s catalog doesn\'t need explaining — it needs listening.', toneHint: 'listener' },

  // ── Place-based (5) ──
  { id: 'place-1', style: 'place-based', template: 'From their creative space, {{name}} has been crafting a sound that feels both personal and universal. The music travels well.', toneHint: 'profile' },
  { id: 'place-2', style: 'place-based', template: 'Great music can come from anywhere. {{name}} proves that geographic location has nothing to do with artistic vision.', toneHint: 'feature' },
  { id: 'place-3', style: 'place-based', template: '{{name}} is proof that you don\'t need to be in a major music hub to make major music. The work speaks for itself.', toneHint: 'profile' },

  // ── Opening-data hybrid (3) ──
  { id: 'hybrid-1', style: 'data-scene', template: 'Over {{streams}} across {{tracks}} tracks — that\'s the current tally for {{name}}. But behind those numbers is a catalog built track by track.', toneHint: 'data' },
  { id: 'hybrid-2', style: 'data-scene', template: '{{name}} has been building something real. {{tracks}} tracks, {{followers}}, and counting. The growth is steady because the quality is consistent.', toneHint: 'data' },
  { id: 'hybrid-3', style: 'data-scene', template: '{{streams}} can\'t be accidental. {{name}}\'s music is connecting with listeners, and the catalog keeps expanding.', toneHint: 'data' },
];

/**
 * Get openings by style.
 */
export function getOpeningsByStyle(style: string): OpeningHook[] {
  return OPENINGS.filter(o => o.style === style);
}

/**
 * Select a random opening, optionally filtered by preferred style.
 */
export function selectOpening(preferredStyle?: string): OpeningHook {
  const pool = preferredStyle ? getOpeningsByStyle(preferredStyle) : OPENINGS;
  if (pool.length === 0) return OPENINGS[Math.floor(Math.random() * OPENINGS.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

export default OPENINGS;
