/**
 * lib/bio-descriptors.ts
 * 53 sound description framings organized by type.
 * Describes music without specific genre labels — uses vibe, texture, emotion, craft.
 */

export interface SoundDescriptor {
  id: string;
  type: string;
  text: string;
  followUp?: string;
}

export const DESCRIPTORS: SoundDescriptor[] = [
  // ── Vibe-based (10) ──
  { id: 'vibe-1', type: 'vibe', text: 'a contemplative quality to the music', followUp: 'each track feels like a moment of reflection set to sound' },
  { id: 'vibe-2', type: 'vibe', text: 'an energetic pulse runs through the work', followUp: 'there\'s a forward momentum that carries each track' },
  { id: 'vibe-3', type: 'vibe', text: 'a cinematic sweep gives the music scope', followUp: 'tracks feel like scenes from a larger story' },
  { id: 'vibe-4', type: 'vibe', text: 'a quiet confidence runs through every release', followUp: 'the music doesn\'t try too hard — it simply is' },
  { id: 'vibe-5', type: 'vibe', text: 'an intimate quality draws the listener in', followUp: 'these are songs that feel like they\'re being played just for you' },
  { id: 'vibe-6', type: 'vibe', text: 'a sense of space defines the sound', followUp: 'there\'s room to breathe between the notes' },
  { id: 'vibe-7', type: 'vibe', text: 'a restless creativity drives the music forward', followUp: 'each track explores new ground without losing its center' },
  { id: 'vibe-8', type: 'vibe', text: 'a grounded, earthy quality anchors the sound', followUp: 'the music feels connected to something real' },
  { id: 'vibe-9', type: 'vibe', text: 'a luminous quality runs through the melodies', followUp: 'even the quieter moments feel like they\'re glowing' },
  { id: 'vibe-10', type: 'vibe', text: 'a raw, unfiltered energy courses through the catalog', followUp: 'this is music made without a safety net' },
  // ── Texture-based (8) ──
  { id: 'tex-1', type: 'texture', text: 'the production is layered and detailed', followUp: 'each listen reveals new subtleties in the mix' },
  { id: 'tex-2', type: 'texture', text: 'the arrangements are stripped and honest', followUp: 'nothing is hidden behind production tricks' },
  { id: 'tex-3', type: 'texture', text: 'the sound is warm and immersive', followUp: 'it wraps around you rather than demanding attention' },
  { id: 'tex-4', type: 'texture', text: 'the textures shift and evolve across the catalog', followUp: 'no two tracks feel exactly the same' },
  { id: 'tex-5', type: 'texture', text: 'the production favors atmosphere over polish', followUp: 'imperfections are part of the appeal' },
  { id: 'tex-6', type: 'texture', text: 'the sound design is meticulous', followUp: 'every sonic element serves the song' },
  { id: 'tex-7', type: 'texture', text: 'the music has a handcrafted quality', followUp: 'you can hear the human touch in every track' },
  { id: 'tex-8', type: 'texture', text: 'the mixing creates a sense of depth', followUp: 'instruments occupy their own space in the soundstage' },
  // ── Emotion-based (8) ──
  { id: 'emo-1', type: 'emotion', text: 'melancholy runs beneath the surface', followUp: 'but there\'s always a thread of hope woven through' },
  { id: 'emo-2', type: 'emotion', text: 'there\'s a joyful energy to the music', followUp: 'it\'s impossible to listen without feeling lifted' },
  { id: 'emo-3', type: 'emotion', text: 'a sense of longing pervades the tracks', followUp: 'this is music about what we reach for' },
  { id: 'emo-4', type: 'emotion', text: 'the music carries emotional weight without being heavy', followUp: 'it\'s thoughtful without being somber' },
  { id: 'emo-5', type: 'emotion', text: 'there\'s a nostalgic quality to the sound', followUp: 'it feels familiar even on first listen' },
  { id: 'emo-6', type: 'emotion', text: 'the music is deeply felt without being dramatic', followUp: 'emotion is conveyed through subtlety' },
  { id: 'emo-7', type: 'emotion', text: 'a sense of wonder permeates the work', followUp: 'the music invites exploration and discovery' },
  { id: 'emo-8', type: 'emotion', text: 'there\'s a reflective quality to the songwriting', followUp: 'these are songs that make you pause' },
  // ── Craft-based (8) ──
  { id: 'craft-1', type: 'craft', text: 'the songwriting is meticulous', followUp: 'every element earns its place in the arrangement' },
  { id: 'craft-2', type: 'craft', text: 'the structures are unconventional but satisfying', followUp: 'the music doesn\'t follow predictable patterns' },
  { id: 'craft-3', type: 'craft', text: 'there\'s a clear artistic vision across the catalog', followUp: 'each track feels like part of a larger statement' },
  { id: 'craft-4', type: 'craft', text: 'the production choices are deliberate and effective', followUp: 'every sonic decision serves the song\'s purpose' },
  { id: 'craft-5', type: 'craft', text: 'the arrangements build with patience and purpose', followUp: 'they unfold rather than announce themselves' },
  { id: 'craft-6', type: 'craft', text: 'the songcraft demonstrates a mature understanding of form', followUp: 'these are tracks built by someone who knows the medium' },
  { id: 'craft-7', type: 'craft', text: 'the music balances complexity with accessibility', followUp: 'it rewards attention but welcomes casual listening' },
  { id: 'craft-8', type: 'craft', text: 'the catalog shows a command of dynamics and pacing', followUp: 'there\'s a natural ebb and flow to the work' },
  // ── Listener-focused (6) ──
  { id: 'list-1', type: 'listener', text: 'repeated listens reveal new layers', followUp: 'you hear something different each time' },
  { id: 'list-2', type: 'listener', text: 'the music rewards close attention', followUp: 'but it works just as well in the background' },
  { id: 'list-3', type: 'listener', text: 'each track creates its own world', followUp: 'you don\'t just hear it — you enter it' },
  { id: 'list-4', type: 'listener', text: 'the music stays with you after the track ends', followUp: 'melodies and phrases linger in memory' },
  { id: 'list-5', type: 'listener', text: 'there\'s a transportive quality to the sound', followUp: 'pressing play feels like stepping into another space' },
  { id: 'list-6', type: 'listener', text: 'the music creates its own atmosphere', followUp: 'each track feels like a contained environment' },
  // ── Movement-based (6) ──
  { id: 'mov-1', type: 'movement', text: 'the tracks build and release with intention', followUp: 'there\'s a sense of journey in each arrangement' },
  { id: 'mov-2', type: 'movement', text: 'the music never sits still', followUp: 'even the quieter moments feel forward-moving' },
  { id: 'mov-3', type: 'movement', text: 'there\'s a natural flow to the catalog', followUp: 'tracks transition seamlessly in mood and energy' },
  { id: 'mov-4', type: 'movement', text: 'the dynamics shift throughout each track', followUp: 'quiet and loud moments are balanced with care' },
  { id: 'mov-5', type: 'movement', text: 'the music breathes naturally', followUp: 'there\'s space between the waves of sound' },
  { id: 'mov-6', type: 'movement', text: 'each track follows its own internal logic', followUp: 'the structures feel organic, not imposed' },
  // ── Contrast-based (4) ──
  { id: 'con-1', type: 'contrast', text: 'gentle melodies meet complex rhythms', followUp: 'simplicity and sophistication coexist' },
  { id: 'con-2', type: 'contrast', text: 'digital precision with human warmth', followUp: 'technology serves emotion, not the other way around' },
  { id: 'con-3', type: 'contrast', text: 'intimate lyrics against expansive soundscapes', followUp: 'the personal becomes universal through the production' },
  { id: 'con-4', type: 'contrast', text: 'structured songs that feel spontaneous', followUp: 'there\'s a looseness that keeps things alive' },
  // ── Time-based (3) ──
  { id: 'time-1', type: 'time', text: 'unhurried, patient, unfolding on its own schedule', followUp: 'the music doesn\'t rush to make its point' },
  { id: 'time-2', type: 'time', text: 'timeless in quality, present in emotion', followUp: 'it could have been made in any era' },
  { id: 'time-3', type: 'time', text: 'the pacing of each track feels deliberate', followUp: 'nothing overstays its welcome' },
];

export function selectDescriptors(count: number = 2): SoundDescriptor[] {
  const shuffled = [...DESCRIPTORS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default DESCRIPTORS;
