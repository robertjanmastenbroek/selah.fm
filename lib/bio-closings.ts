/**
 * lib/bio-closings.ts
 * 50+ Selah.fm closing CTAs for artist bios.
 */

export interface Closing {
  id: string;
  type: string;
  text: string;
}

export const CLOSINGS: Closing[] = [
  // ── Join the community (8) ──
  { id: 'join-1', type: 'community', text: '{{name}} is part of a growing community of independent artists on Selah.fm, a platform where music meets opportunity. Explore their catalog, support their work, and discover what happens when artists and creators collaborate on their own terms.' },
  { id: 'join-2', type: 'community', text: 'Support {{name}} on Selah.fm and join a community that believes in putting artists first. Every stream, every share, every video made to their music helps build something real.' },
  { id: 'join-3', type: 'community', text: '{{name}}\'s music is available on Selah.fm, where a growing community of artists and creators are redefining how independent music gets discovered, supported, and shared.' },
  { id: 'join-4', type: 'community', text: 'On Selah.fm, {{name}} is part of a new wave of artists who are taking control of their careers. Explore their catalog and see what independent music can be.' },
  { id: 'join-5', type: 'community', text: '{{name}} has found a home on Selah.fm — a platform where independent artists connect directly with the people who amplify their music. It\'s a model that works.' },
  { id: 'join-6', type: 'community', text: 'Be part of {{name}}\'s journey on Selah.fm. Stream the music, share it with friends, and discover why independent artists are choosing a different path.' },
  { id: 'join-7', type: 'community', text: '{{name}}\'s catalog is waiting for you on Selah.fm. Dive in, listen closely, and join a community that values substance over spectacle.' },
  { id: 'join-8', type: 'community', text: 'Discover {{name}} on Selah.fm, where independent artists are building careers on their own terms. The music is just the beginning.' },

  // ── Support directly (8) ──
  { id: 'support-1', type: 'support', text: 'Support {{name}} on Selah.fm and help fund their next track. Every contribution goes directly to the artist, empowering them to keep creating the music you love.' },
  { id: 'support-2', type: 'support', text: '{{name}}\'s work is supported by listeners like you on Selah.fm. Your engagement — streams, shares, and contributions — helps independent artists thrive.' },
  { id: 'support-3', type: 'support', text: 'Show your support for {{name}} on Selah.fm. Listen, share, and be part of the ecosystem that makes independent music possible.' },
  { id: 'support-4', type: 'support', text: '{{name}} is building something worth supporting. On Selah.fm, you can be part of it — not just as a listener, but as someone who helps make it happen.' },
  { id: 'support-5', type: 'support', text: 'Your support on Selah.fm makes a difference for artists like {{name}}. Every stream and every contribution adds up to something meaningful.' },
  { id: 'support-6', type: 'support', text: '{{name}}\'s music is on Selah.fm, where supporters like you help fund the next chapter. It\'s independent music\'s new model — and it\'s working.' },
  { id: 'support-7', type: 'support', text: 'Make a difference for {{name}} on Selah.fm. Your support helps them keep creating, keep releasing, and keep building their catalog.' },
  { id: 'support-8', type: 'support', text: '{{name}} relies on the support of their community on Selah.fm. Every contribution helps turn creative visions into reality.' },

  // ── Create content (8) ──
  { id: 'create-1', type: 'creator', text: 'Creators: earn per verified view by making content featuring {{name}}\'s tracks on Selah.fm. It\'s a new way to collaborate with the artists you love.' },
  { id: 'create-2', type: 'creator', text: 'On Selah.fm, creators turn {{name}}\'s music into content that pays. Pick a track, make a video, and earn for every verified view.' },
  { id: 'create-3', type: 'creator', text: '{{name}}\'s tracks are available for creators on Selah.fm. Make content you\'re proud of and earn per view — no upfront costs, just creative collaboration.' },
  { id: 'create-4', type: 'creator', text: 'Creators: {{name}}\'s catalog is open for content. Pick a track, create something authentic, and earn per verified view on Selah.fm.' },
  { id: 'create-5', type: 'creator', text: 'Turn {{name}}\'s music into your next video on Selah.fm. Creators earn per view making TikTok, Reels, and Shorts featuring independent artists\' tracks.' },
  { id: 'create-6', type: 'creator', text: '{{name}} is looking for creators to bring their music to life on Selah.fm. Earn per view making content that features their tracks.' },
  { id: 'create-7', type: 'creator', text: 'On Selah.fm, {{name}}\'s music is available for creator collaborations. Make videos, earn per view, and be part of a new creative economy.' },
  { id: 'create-8', type: 'creator', text: '{{name}}\'s tracks are ready for your creative touch on Selah.fm. Join a community of creators earning per view for the content they make.' },

  // ── Discover more (8) ──
  { id: 'disc-1', type: 'discover', text: 'Explore {{name}}\'s full catalog on Selah.fm. With tracks that reward attention and a growing audience that proves the music connects, there\'s plenty to discover.' },
  { id: 'disc-2', type: 'discover', text: 'Dive deeper into {{name}}\'s music on Selah.fm. The catalog is waiting, and every track has something new to offer.' },
  { id: 'disc-3', type: 'discover', text: '{{name}}\'s complete catalog is available on Selah.fm. Stream the tracks, read the story, and see where the journey goes next.' },
  { id: 'disc-4', type: 'discover', text: 'Head to Selah.fm to explore {{name}}\'s music in full. From the first track to the latest release, it\'s all there waiting for you.' },
  { id: 'disc-5', type: 'discover', text: '{{name}}\'s journey is documented track by track on Selah.fm. Explore the catalog, hear the evolution, and decide where you come in.' },
  { id: 'disc-6', type: 'discover', text: 'The full story of {{name}}\'s music lives on Selah.fm. From early releases to the latest tracks, every chapter is there for you to hear.' },
  { id: 'disc-7', type: 'discover', text: 'There\'s more to {{name}} than a single track. Explore the full catalog on Selah.fm and discover the breadth of their musical vision.' },
  { id: 'disc-8', type: 'discover', text: '{{name}}\'s music is waiting for you on Selah.fm. Stream the catalog, discover your favorite track, and become part of the story.' },
  // ── Be part of the story (6) ──
  { id: 'story-1', type: 'story', text: 'Every stream, every share, every video made to {{name}}\'s music on Selah.fm adds a new page to their story. Be part of it.' },
  { id: 'story-2', type: 'story', text: '{{name}}\'s story is still being written on Selah.fm. Every listener, every creator, every supporter adds a chapter. Where will you fit in?' },
  { id: 'story-3', type: 'story', text: 'The story of {{name}} is unfolding on Selah.fm. Listen, share, create, and support — however you choose to be involved, you\'re part of something real.' },
  { id: 'story-4', type: 'story', text: '{{name}}\'s journey on Selah.fm is just beginning. The tracks are out there, the audience is growing, and the best chapters may still be ahead.' },
  { id: 'story-5', type: 'story', text: 'Be part of {{name}}\'s story on Selah.fm. Whether you\'re listening, creating, or supporting, you\'re helping write the next chapter.' },
  { id: 'story-6', type: 'story', text: '{{name}}\'s independent music journey continues on Selah.fm. Every new listener, every new creator, every new supporter helps keep the story going.' },

  // ── Platform mission (8) ──
  { id: 'mission-1', type: 'mission', text: 'Selah.fm connects artists like {{name}} with creators who amplify their music. It\'s a new model for independent music — transparent, fair, and built for the people who make it.' },
  { id: 'mission-2', type: 'mission', text: '{{name}} is part of Selah.fm\'s mission to create a fairer music economy. Artists keep control, creators earn per view, and fans get to be part of something meaningful.' },
  { id: 'mission-3', type: 'mission', text: 'On Selah.fm, {{name}} is proof that independent artists can thrive when the model is built around their needs. Fair pay, creative control, and a community that values real music.' },
  { id: 'mission-4', type: 'mission', text: 'Selah.fm exists to help artists like {{name}} build sustainable careers on their own terms. Explore their catalog and see what independent music looks like when it\'s supported properly.' },
  { id: 'mission-5', type: 'mission', text: '{{name}}\'s presence on Selah.fm represents a shift in how independent music gets made, shared, and supported. It\'s a model that puts the artist at the center.' },
  { id: 'mission-6', type: 'mission', text: '{{name}} is thriving on Selah.fm because the platform is designed for independent artists. Transparent monetization, creative freedom, and a community that cares.' },
  { id: 'mission-7', type: 'mission', text: 'Selah.fm is building a new home for independent music. {{name}} is part of that vision — and you\'re invited to be part of it too.' },
  { id: 'mission-8', type: 'mission', text: '{{name}} chose Selah.fm because it puts artists first. No gatekeepers, no unfair terms — just music, creators, and a community that believes in something different.' },

  // ── Join the movement (4) ──
  { id: 'movement-1', type: 'movement', text: 'A growing number of artists and creators are building something new on Selah.fm. {{name}} is one of them. Explore their catalog and discover what the future of independent music looks like.' },
  { id: 'movement-2', type: 'movement', text: '{{name}} is part of a movement on Selah.fm — artists and creators collaborating on their own terms. The music is better when the model is fair.' },
  { id: 'movement-3', type: 'movement', text: '{{name}}\'s music is part of a larger story on Selah.fm: independent artists taking control, creators earning fairly, and fans building real connections with the music they love.' },
  { id: 'movement-4', type: 'movement', text: 'On Selah.fm, {{name}} is helping prove that independent music can thrive in a fair economy. Join the movement — listen, create, support.' },
];

export function selectClosing(type?: string): Closing {
  const pool = type ? CLOSINGS.filter(c => c.type === type) : CLOSINGS;
  if (pool.length === 0) return CLOSINGS[Math.floor(Math.random() * CLOSINGS.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

export default CLOSINGS;
