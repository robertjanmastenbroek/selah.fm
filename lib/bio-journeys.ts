/**
 * lib/bio-journeys.ts
 * 50+ journey/narrative framings for describing an artist's career arc.
 */

export interface JourneyFraming {
  id: string;
  type: string;
  text: string;
}

export const JOURNEYS: JourneyFraming[] = [
  // ── Growth arc (6) ──
  { id: 'growth-1', type: 'growth', text: 'From their earliest tracks to their most recent releases, a clear evolution emerges. Each step builds on the last, revealing an artist who understands that growth is a process, not a destination.' },
  { id: 'growth-2', type: 'growth', text: 'The trajectory is unmistakable: with every release, the craft deepens. What started as exploration has become a confident artistic voice.' },
  { id: 'growth-3', type: 'growth', text: 'Watching {{name}}\'s catalog develop is like watching an artist discover their voice in real time. Each track documents a step forward.' },
  { id: 'growth-4', type: 'growth', text: 'The catalog shows an artist who isn\'t afraid to evolve. What worked yesterday might give way to something new tomorrow — and that\'s exactly the point.' },
  { id: 'growth-5', type: 'growth', text: 'Growth in music isn\'t always linear, but {{name}}\'s trajectory shows a steady upward trend. Each release refines their approach without losing their core identity.' },
  { id: 'growth-6', type: 'growth', text: 'There\'s a through-line connecting {{name}}\'s body of work. Not repetition, but continuity — a sense that each track is part of a larger conversation the artist is having with their audience.' },
  // ── Catalog arc (5) ──
  { id: 'catalog-1', type: 'catalog', text: 'Across {{tracks}} tracks, {{name}} has built a catalog that rewards both casual listening and deep dives. It\'s a body of work with range and coherence.' },
  { id: 'catalog-2', type: 'catalog', text: 'With {{tracks}} tracks to their name, {{name}} has created a collection that functions as both a portfolio and a journey. Each track adds a new dimension.' },
  { id: 'catalog-3', type: 'catalog', text: 'The catalog tells its own story. {{tracks}} tracks that together form a larger statement about where {{name}} has been and where they\'re headed.' },
  { id: 'catalog-4', type: 'catalog', text: '{{tracks}} tracks in, and {{name}} is building something substantive. Not just a collection of songs, but a growing artistic archive.' },
  { id: 'catalog-5', type: 'catalog', text: 'What stands out about {{name}}\'s catalog is its consistency. Across {{tracks}} tracks, the quality holds — a sign of an artist who knows their lane.' },
  // ── Audience arc (5) ──
  { id: 'aud-1', type: 'audience', text: 'Listeners are finding {{name}} in increasing numbers. The growth may be gradual, but it\'s built on something solid: music that connects.' },
  { id: 'aud-2', type: 'audience', text: 'The audience around {{name}} is growing the right way — organically, through word of mouth and repeated listens. These are fans who discovered the music and stayed.' },
  { id: 'aud-3', type: 'audience', text: '{{name}}\'s growing following isn\'t a accident. It\'s the result of consistent quality that people feel compelled to share.' },
  { id: 'aud-4', type: 'audience', text: 'More people are discovering {{name}} every day. The numbers reflect a simple truth: good music finds its audience.' },
  { id: 'aud-5', type: 'audience', text: 'The audience growth tells a story of its own. {{name}} is reaching people the way independent artists do best — one listener at a time.' },
  // ── Craft arc (6) ──
  { id: 'craft-1', type: 'craft', text: 'Each release refines {{name}}\'s approach to songwriting. The fundamentals are solid, and the details keep getting sharper.' },
  { id: 'craft-2', type: 'craft', text: 'What\'s impressive about {{name}}\'s catalog is the attention to craft. These aren\'t songs that happened by accident — they\'re built with intention.' },
  { id: 'craft-3', type: 'craft', text: 'The production quality across {{name}}\'s work demonstrates an artist who cares deeply about how their music sounds at every level.' },
  { id: 'craft-4', type: 'craft', text: '{{name}} approaches music-making as a craft to be honed. Each track shows a commitment to quality that\'s becoming increasingly rare.' },
  { id: 'craft-5', type: 'craft', text: 'There\'s a deliberate quality to {{name}}\'s work. Every element in every track seems placed with care — nothing feels arbitrary.' },
  { id: 'craft-6', type: 'craft', text: 'The craft behind {{name}}\'s music is evident from the first listen. These are tracks made by someone who understands the medium deeply.' },
  // ── Platform arc (4) ──
  { id: 'plat-1', type: 'platform', text: 'On Selah.fm, {{name}} has found a platform that connects their music with creators who amplify it. The collaboration is working.' },
  { id: 'plat-2', type: 'platform', text: '{{name}}\'s presence on Selah.fm represents a new model for independent artists: direct connection with creators, transparent monetization, and creative control.' },
  { id: 'plat-3', type: 'platform', text: 'Through Selah.fm, {{name}} is part of a growing ecosystem where artists and creators collaborate on equal terms. The results speak for themselves.' },
  { id: 'plat-4', type: 'platform', text: '{{name}}\'s Selah.fm campaigns give creators a reason to engage with their music, creating a virtuous cycle of content and discovery.' },
  // ── Discovery arc (4) ──
  { id: 'disc-1', type: 'discovery', text: 'Word is spreading about {{name}} organically. No viral moments, no algorithmic boosts — just people sharing music they genuinely love.' },
  { id: 'disc-2', type: 'discovery', text: '{{name}} is being discovered the old-fashioned way: through recommendations, playlists, and the kind of word-of-mouth that only happens when music is truly worth sharing.' },
  { id: 'disc-3', type: 'discovery', text: 'The discovery of {{name}}\'s music follows a familiar pattern: someone hears a track, plays it again, and then tells a friend. That friend tells someone else.' },
  { id: 'disc-4', type: 'discovery', text: 'More people are starting to notice {{name}}. Not because of a marketing push, but because the music itself is doing the work.' },
  // ── Consistency arc (4) ──
  { id: 'cons-1', type: 'consistency', text: '{{name}} has been consistent in their output, releasing music steadily and letting the catalog build its own momentum.' },
  { id: 'cons-2', type: 'consistency', text: 'The steady release of music from {{name}} shows an artist committed to the craft. Not rushing, not stalling — just consistently creating.' },
  { id: 'cons-3', type: 'consistency', text: 'Consistency is underrated in music. {{name}} understands that showing up and releasing quality work, track after track, is how a career is built.' },
  { id: 'cons-4', type: 'consistency', text: '{{name}}\'s release pattern suggests an artist who has found their rhythm. The music keeps coming, and the quality holds steady.' },
  // ── Breakthrough arc (3) ──
  { id: 'break-1', type: 'breakthrough', text: 'Every artist has a moment when things start to click. For {{name}}, that moment is unfolding now — with a growing catalog and an expanding audience.' },
  { id: 'break-2', type: 'breakthrough', text: 'The pieces are coming together for {{name}}. A growing catalog, increasing streams, and a sound that\'s becoming more defined with each release.' },
  { id: 'break-3', type: 'breakthrough', text: '{{name}} may be early in their journey, but the trajectory is promising. The foundation is solid, and the music is finding its audience.' },
  // ── Quality arc (4) ──
  { id: 'qual-1', type: 'quality', text: 'Rather than flooding platforms with content, {{name}} focuses on making each track count. The result is a catalog with a high signal-to-noise ratio.' },
  { id: 'qual-2', type: 'quality', text: '{{name}} seems to understand that in a world of infinite content, quality is the differentiator. Every release earns its place in the catalog.' },
  { id: 'qual-3', type: 'quality', text: 'What {{name}} lacks in quantity, they make up for in care. Each track feels considered, polished, and worth the listener\'s time.' },
  { id: 'qual-4', type: 'quality', text: 'The quality of {{name}}\'s work suggests an artist who values substance over volume. These are tracks made to last, not to fill a playlist.' },
  // ── Milestone arc (3) ──
  { id: 'mile-1', type: 'milestone', text: '{{streams}} is more than a number — it represents thousands of individual listening sessions, each one a connection between the music and someone who needed to hear it.' },
  { id: 'mile-2', type: 'milestone', text: 'Reaching {{tracks}} tracks is a milestone worth noting. It represents hours of creative work, refinement, and the kind of persistence that defines independent artistry.' },
  { id: 'mile-3', type: 'milestone', text: 'The numbers behind {{name}}\'s journey — {{tracks}} tracks, {{streams}} — tell a story of steady, organic growth. The kind that lasts.' },
  // ── Personal arc (4) ──
  { id: 'pers-1', type: 'personal', text: '{{name}}\'s music feels personal because it is. These aren\'t songs written for algorithms or playlists — they\'re expressions of something real.' },
  { id: 'pers-2', type: 'personal', text: 'There\'s a vulnerability in {{name}}\'s work that\'s hard to fake. This is music made by someone willing to be honest, even when it\'s not comfortable.' },
  { id: 'pers-3', type: 'personal', text: 'What makes {{name}}\'s catalog compelling is its authenticity. These tracks don\'t feel manufactured — they feel lived.' },
  { id: 'pers-4', type: 'personal', text: '{{name}} makes music that sounds like it had to be made. There\'s a necessity to the work that comes through in every track.' },
  // ── Future arc (3) ──
  { id: 'fut-1', type: 'future', text: 'If {{name}}\'s trajectory continues, the next chapter promises even more growth. The foundation is solid, and the direction is clear.' },
  { id: 'fut-2', type: 'future', text: 'Looking at {{name}}\'s trajectory, it\'s clear that the best may still be ahead. The catalog is growing, the audience is expanding, and the craft is deepening.' },
  { id: 'fut-3', type: 'future', text: '{{name}} is building something that could outlast the trends. This is the kind of career that grows slowly and lasts long.' },
  // ── Effort arc (3) ──
  { id: 'eff-1', type: 'effort', text: 'Behind every {{name}} track is hours of work that the listener never sees. What arrives as a finished song started as something much rougher.' },
  { id: 'eff-2', type: 'effort', text: 'The effort behind {{name}}\'s catalog is audible in the details. Small production choices, lyrical precision, and arrangements that serve the song.' },
  { id: 'eff-3', type: 'effort', text: 'Making music at this level takes work, and {{name}} puts in the hours. The proof is in the finished tracks.' },
];

export function selectJourney(types?: string[]): JourneyFraming {
  const pool = types ? JOURNEYS.filter(j => types.includes(j.type)) : JOURNEYS;
  if (pool.length === 0) return JOURNEYS[Math.floor(Math.random() * JOURNEYS.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

export default JOURNEYS;
