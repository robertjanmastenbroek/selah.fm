/**
 * lib/bio-angles.ts
 * 
 * 50+ narrative angles for artist bios.
 * Each angle defines a different "story frame" — the fundamental approach
 * to writing about an artist. The angle determines the bio's structure,
 * tone, and focus.
 * 
 * Selection: before writing a bio, the system scores every angle against
 * the artist's data profile and selects the best match. Different data =
 * different angle = fundamentally unique bio.
 */

export interface Angle {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  /** Which slots this angle prefers */
  structure: string[];
  /** Default tone suggestion */
  tone: string;
}

// ─── Artist data profile used for angle selection ─────────────

export interface ArtistData {
  id: string;
  name: string;
  genres: string[];
  genreCount: number;
  trackCount: number;
  monthlyListeners: number;
  totalStreams: number;
  totalFollowers: number;
  hasCampaigns: boolean;
  campaignCount: number;
  submissionCount: number;
  supporterCount: number;
  hasLocation: boolean;
  locationCity: string;
  locationCountry: string;
  hasSpotifyId: boolean;
  hasImage: boolean;
  /** Days since first track appeared */
  careerDays: number;
  /** Days since most recent track */
  daysSinceLastTrack: number;
  /** Up to 10 track titles for genre inference + bio detail */
  trackTitles: string[];
  /** Enriched metadata from Bandcamp, Wikipedia, YouTube */
  metadata?: any;
}

// ─── Scoring function ────────────────────────────────────────

export interface AngleScore {
  angle: Angle;
  score: number; // 0-100
  reasons: string[];
}

/**
 * Score every angle against the artist's data.
 * Returns sorted array, highest score first.
 */
export function scoreAngles(artist: ArtistData): AngleScore[] {
  return ANGLES.map(angle => {
    const reasons: string[] = [];
    let score = 50; // baseline

    // ── Data availability checks ──

    const hasSubstantialData = artist.totalStreams > 10000 
      || artist.monthlyListeners > 5000 
      || artist.totalFollowers > 5000;

    const hasGoodData = artist.totalStreams > 50000 
      || artist.monthlyListeners > 10000 
      || artist.totalFollowers > 10000;

    const hasExcellentData = artist.totalStreams > 500000 
      || artist.monthlyListeners > 50000 
      || artist.totalFollowers > 100000;

    const hasLongCatalog = artist.trackCount >= 10;
    const hasDecentCatalog = artist.trackCount >= 5;
    const hasFewTracks = artist.trackCount <= 3;
    const hasActiveCampaigns = artist.campaignCount > 0;
    const hasSubmissions = artist.submissionCount > 0;
    const hasSupporters = artist.supporterCount > 0;
    const hasMultipleGenres = artist.genreCount > 1;
    const isNewArtist = artist.careerDays < 180; // < 6 months
    const isRecentlyActive = artist.daysSinceLastTrack < 90;
    const hasLocation = artist.hasLocation && !!artist.locationCity;

    // ── Apply angle-specific scoring ──

    switch (angle.id) {
      // ── Discovery angles (for low-data artists) ──
      case 'discovery':
        if (!hasSubstantialData && !hasLongCatalog) { score += 30; reasons.push('low-data artist'); }
        if (hasFewTracks) { score += 15; reasons.push('few tracks'); }
        break;

      case 'hidden-gem':
        if (!hasSubstantialData && hasDecentCatalog) { score += 25; reasons.push('decent catalog, low numbers'); }
        if (isRecentlyActive) { score += 10; reasons.push('recently active'); }
        break;

      case 'fresh-voice':
        if (isNewArtist) { score += 30; reasons.push('new artist'); }
        if (hasFewTracks) { score += 15; reasons.push('few tracks'); }
        break;

      // ── Achievement angles (for data-rich artists) ──
      case 'slow-build':
        if (hasLongCatalog && !hasGoodData) { score += 25; reasons.push('many tracks, moderate numbers'); }
        if (isRecentlyActive) { score += 10; reasons.push('recently active'); }
        break;

      case 'numbers-dont-lie':
        if (hasExcellentData) { score += 30; reasons.push('excellent data'); }
        if (hasSubmissions) { score += 10; reasons.push('has submissions'); }
        break;

      case 'momentum-builder':
        if (hasGoodData && isRecentlyActive) { score += 25; reasons.push('good data + active'); }
        if (hasSubmissions) { score += 10; break; }

      case 'milestone':
        if (hasExcellentData) { score += 25; reasons.push('excellent data'); }
        if (hasSubmissions) { score += 10; reasons.push('has submissions'); }
        if (hasSupporters) { score += 10; reasons.push('has supporters'); }
        break;

      // ── Catalog angles ──
      case 'craftsman':
        if (hasLongCatalog) { score += 25; reasons.push('many tracks'); }
        if (hasDecentCatalog) { score += 10; reasons.push('decent catalog'); }
        break;

      case 'evolution':
        if (hasLongCatalog) { score += 25; reasons.push('long catalog'); }
        if (!isNewArtist) { score += 10; reasons.push('established artist'); }
        break;

      case 'minimalist':
        if (hasFewTracks) { score += 20; reasons.push('few tracks - quality focus'); }
        if (isNewArtist) { score += 10; reasons.push('new artist'); }
        break;

      case 'maximalist':
        if (hasLongCatalog && hasMultipleGenres) { score += 25; reasons.push('many tracks, many genres'); }
        break;

      case 'genre-explorer':
        if (hasMultipleGenres) { score += 30; reasons.push('multiple genres'); }
        break;

      case 'genre-bender':
        if (hasMultipleGenres && hasDecentCatalog) { score += 25; reasons.push('multiple genres + catalog'); }
        break;

      // ── Community angles ──
      case 'collaborator':
        if (hasActiveCampaigns) { score += 25; reasons.push('has campaigns'); }
        if (hasSubmissions) { score += 10; reasons.push('has submissions'); }
        break;

      case 'community-magnet':
        if (hasSubmissions && hasSupporters) { score += 25; reasons.push('submissions + supporters'); }
        break;

      case 'fan-favorite':
        if (hasSubstantialData && hasSubmissions) { score += 20; }
        if (hasSupporters) { score += 10; }
        break;

      case 'creators-choice':
        if (hasActiveCampaigns && hasSubmissions) { score += 25; reasons.push('campaigns + submissions'); }
        break;

      // ── Genre-specific angles ──
      case 'digital-alchemist':
        if (artist.genres.some(g => g.toLowerCase().includes('electronic') || g.toLowerCase().includes('edm') || g.toLowerCase().includes('ambient'))) {
          score += 30; reasons.push('electronic genre'); }
        break;

      case 'analog-soul':
        if (artist.genres.some(g => g.toLowerCase().includes('folk') || g.toLowerCase().includes('acoustic') || g.toLowerCase().includes('singer'))) {
          score += 30; reasons.push('organic genre'); }
        break;

      case 'groove-merchant':
        if (artist.genres.some(g => g.toLowerCase().includes('funk') || g.toLowerCase().includes('dance') || g.toLowerCase().includes('soul'))) {
          score += 30; reasons.push('rhythmic genre'); }
        break;

      case 'mood-architect':
        if (artist.genres.some(g => g.toLowerCase().includes('ambient') || g.toLowerCase().includes('chill') || g.toLowerCase().includes('lo-fi'))) {
          score += 30; reasons.push('atmospheric genre'); }
        break;

      case 'storyteller':
        if (artist.genres.some(g => g.toLowerCase().includes('hip-hop') || g.toLowerCase().includes('rap') || g.toLowerCase().includes('singer-songwriter'))) {
          score += 25; reasons.push('lyrical genre'); }
        break;

      // ── Location-based angles ──
      case 'local-hero':
        if (hasLocation) { score += 30; reasons.push('has location data'); }
        break;

      case 'global-reach':
        if (hasLocation && hasExcellentData) { score += 20; reasons.push('location + excellent data'); }
        break;

      // ── Journey angles ──
      case 'the-comeback':
        if (!isRecentlyActive && hasLongCatalog) { score += 25; reasons.push('gap in activity + catalog'); }
        break;

      case 'late-bloomer':
        if (!isNewArtist && !hasGoodData) { score += 20; reasons.push('established but not yet breakout'); }
        if (hasDecentCatalog) { score += 10; }
        break;

      case 'diy-story':
        if (hasDecentCatalog && !hasExcellentData) { score += 15; reasons.push('independent trajectory'); }
        if (hasSubmissions) { score += 10; }
        break;

      case 'internet-native':
        if (isNewArtist || isRecentlyActive) { score += 15; }
        if (hasDecentCatalog) { score += 10; }
        break;

      // ── Quality signals ──
      case 'quality-over-quantity':
        if (hasDecentCatalog && !hasLongCatalog) { score += 20; reasons.push('moderate catalog'); }
        if (hasSubstantialData) { score += 10; }
        break;

      // ── Platform-specific angles ──
      case 'selah-success':
        if (hasSubmissions && hasActiveCampaigns) { score += 25; reasons.push('active on platform'); }
        if (hasSupporters) { score += 10; reasons.push('has supporters'); }
        break;

      case 'creator-beloved':
        if (hasSubmissions && hasSupporters) { score += 25; reasons.push('creator engagement'); }
        break;

      // ── Production/process angles ──
      case 'producer-artist':
        if (hasLongCatalog) { score += 15; }
        if (artist.genres.some(g => g.toLowerCase().includes('electronic') || g.toLowerCase().includes('beat'))) { score += 10; }
        break;

      // ── Time/era angles ──
      case 'the-scene':
        if (hasMultipleGenres && hasDecentCatalog) { score += 15; }
        if (hasLocation) { score += 10; }
        break;

      case 'the-experimenter':
        if (hasMultipleGenres) { score += 20; reasons.push('multiple genres'); }
        break;

      // ── Default: applicable to any artist ──
      default:
        score += 5;
        break;
    }

    return { angle, score: Math.min(100, score), reasons };
  }).sort((a, b) => b.score - a.score);
}

/**
 * Select the best angle for an artist.
 * Uses randomness weighted by score to add variety.
 */
export function selectAngle(artist: ArtistData): { angle: Angle; reasons: string[] } {
  const scored = scoreAngles(artist);
  
  // Take top 5 candidates
  const topCandidates = scored.filter(s => s.score >= 50).slice(0, 5);
  
  if (topCandidates.length === 0) {
    // Fallback to first angle
    return { angle: ANGLES[0], reasons: ['fallback - no strong match'] };
  }

  // Weighted random selection from top candidates
  const totalScore = topCandidates.reduce((sum, s) => sum + s.score, 0);
  let random = Math.random() * totalScore;
  
  for (const candidate of topCandidates) {
    random -= candidate.score;
    if (random <= 0) {
      return { angle: candidate.angle, reasons: candidate.reasons };
    }
  }

  return { angle: topCandidates[0].angle, reasons: topCandidates[0].reasons };
}

// ─── 50+ Angle Definitions ───────────────────────────────────

export const ANGLES: Angle[] = [
  // ═══════════════════════════════════════════════════════════
  // CATEGORY: Discovery angles
  // For artists with limited data — focus on potential
  // ═══════════════════════════════════════════════════════════
  {
    id: 'discovery',
    name: 'The Discovery',
    description: 'A hidden talent waiting to be found.',
    category: 'discovery',
    tags: ['low-data', 'encouraging', 'potential'],
    structure: ['opening-hook', 'sound-description', 'why-potential', 'selah-cta'],
    tone: 'profile',
  },
  {
    id: 'hidden-gem',
    name: 'Hidden Gem',
    description: 'Under-discovered but overdelivering.',
    category: 'discovery',
    tags: ['low-data', 'quality-signals', 'underrated'],
    structure: ['opening-contrast', 'sound-description', 'why-quality', 'selah-cta'],
    tone: 'fan',
  },
  {
    id: 'fresh-voice',
    name: 'Fresh Voice',
    description: 'A new sound entering the scene.',
    category: 'discovery',
    tags: ['new-artist', 'fresh', 'emerging'],
    structure: ['opening-scene', 'sound-description', 'why-potential', 'selah-cta'],
    tone: 'profile',
  },
  {
    id: 'one-to-watch',
    name: 'One to Watch',
    description: 'Early days, strong signals.',
    category: 'discovery',
    tags: ['new', 'potential', 'tracking'],
    structure: ['opening-data', 'sound-description', 'why-future', 'selah-cta'],
    tone: 'feature',
  },
  {
    id: 'rising-tide',
    name: 'Rising Tide',
    description: 'Momentum is building organically.',
    category: 'discovery',
    tags: ['growing', 'momentum', 'traction'],
    structure: ['opening-hook', 'journey-growth', 'sound-description', 'why-momentum', 'selah-cta'],
    tone: 'feature',
  },
  {
    id: 'quiet-force',
    name: 'Quiet Force',
    description: 'Making an impact without the noise.',
    category: 'discovery',
    tags: ['subtle', 'quality', 'organic'],
    structure: ['opening-contrast', 'sound-description', 'why-quality', 'selah-cta'],
    tone: 'profile',
  },

  // ═══════════════════════════════════════════════════════════
  // CATEGORY: Achievement angles
  // For artists with measurable success — focus on results
  // ═══════════════════════════════════════════════════════════
  {
    id: 'slow-build',
    name: 'The Slow Build',
    description: 'Patience, persistence, and a growing catalog.',
    category: 'achievement',
    tags: ['growth', 'long-term', 'persistence'],
    structure: ['opening-data', 'journey-growth', 'sound-description', 'why-momentum', 'selah-cta'],
    tone: 'feature',
  },
  {
    id: 'numbers-dont-lie',
    name: 'The Numbers Don\'t Lie',
    description: 'The data shows what the music delivers.',
    category: 'achievement',
    tags: ['data-rich', 'metrics', 'proof'],
    structure: ['opening-data', 'sound-description', 'why-milestones', 'selah-cta'],
    tone: 'data',
  },
  {
    id: 'momentum-builder',
    name: 'Momentum Builder',
    description: 'Every release builds on the last.',
    category: 'achievement',
    tags: ['consistent', 'growing', 'active'],
    structure: ['opening-hook', 'journey-milestone', 'sound-description', 'why-future', 'selah-cta'],
    tone: 'feature',
  },
  {
    id: 'milestone',
    name: 'Milestone Reach',
    description: 'Crossing significant thresholds.',
    category: 'achievement',
    tags: ['milestone', 'celebration', 'achievement'],
    structure: ['opening-data', 'why-milestones', 'journey-growth', 'selah-cta'],
    tone: 'review',
  },
  {
    id: 'breakthrough',
    name: 'The Breakthrough',
    description: 'A moment that changed everything.',
    category: 'achievement',
    tags: ['turning-point', 'growth-spurt', 'catalyst'],
    structure: ['opening-scene', 'journey-breakthrough', 'sound-description', 'why-future', 'selah-cta'],
    tone: 'feature',
  },
  {
    id: 'consistent-craft',
    name: 'Consistent Craft',
    description: 'Year after year, the quality holds.',
    category: 'achievement',
    tags: ['consistent', 'reliable', 'quality'],
    structure: ['opening-hook', 'journey-growth', 'sound-description', 'why-quality', 'selah-cta'],
    tone: 'profile',
  },

  // ═══════════════════════════════════════════════════════════
  // CATEGORY: Catalog angles
  // For artists with many tracks — focus on the body of work
  // ═══════════════════════════════════════════════════════════
  {
    id: 'craftsman',
    name: 'The Craftsman',
    description: 'Every track is meticulously built.',
    category: 'catalog',
    tags: ['detailed', 'quality', 'craft'],
    structure: ['opening-process', 'sound-description', 'journey-craft', 'why-quality', 'selah-cta'],
    tone: 'review',
  },
  {
    id: 'evolution',
    name: 'The Evolution',
    description: 'Their sound has grown across their catalog.',
    category: 'catalog',
    tags: ['growth', 'catalog-depth', 'artistic-development'],
    structure: ['opening-scene', 'journey-evolution', 'sound-description', 'why-future', 'selah-cta'],
    tone: 'feature',
  },
  {
    id: 'minimalist',
    name: 'The Minimalist',
    description: 'Less is more in their world.',
    category: 'catalog',
    tags: ['few-tracks', 'focused', 'quality-over-quantity'],
    structure: ['opening-contrast', 'sound-description', 'why-quality', 'selah-cta'],
    tone: 'critic',
  },
  {
    id: 'maximalist',
    name: 'The Maximalist',
    description: 'Every track is a world of its own.',
    category: 'catalog',
    tags: ['many-tracks', 'varied', 'rich'],
    structure: ['opening-hook', 'sound-description-rich', 'journey-craft', 'why-catalog', 'selah-cta'],
    tone: 'review',
  },
  {
    id: 'genre-explorer',
    name: 'Genre Explorer',
    description: 'Refusing to be boxed in by one sound.',
    category: 'catalog',
    tags: ['multi-genre', 'eclectic', 'versatile'],
    structure: ['opening-contrast', 'sound-description', 'journey-evolution', 'why-catalog', 'selah-cta'],
    tone: 'critic',
  },
  {
    id: 'genre-bender',
    name: 'Genre Bender',
    description: 'Fusing influences into something new.',
    category: 'catalog',
    tags: ['genre-fusion', 'hybrid', 'innovative'],
    structure: ['opening-hook', 'sound-description', 'journey-influences', 'why-catalog', 'selah-cta'],
    tone: 'review',
  },
  {
    id: 'the-archivist',
    name: 'The Archivist',
    description: 'Building a catalog that tells a story.',
    category: 'catalog',
    tags: ['story', 'catalog', 'cohesion'],
    structure: ['opening-scene', 'journey-catalog', 'sound-description', 'why-catalog', 'selah-cta'],
    tone: 'profile',
  },

  // ═══════════════════════════════════════════════════════════
  // CATEGORY: Community angles
  // For artists with platform engagement — focus on connection
  // ═══════════════════════════════════════════════════════════
  {
    id: 'collaborator',
    name: 'The Collaborator',
    description: 'Creators love working with them.',
    category: 'community',
    tags: ['campaigns', 'creator-engagement', 'collaboration'],
    structure: ['opening-hook', 'why-community', 'sound-description', 'selah-cta'],
    tone: 'profile',
  },
  {
    id: 'community-magnet',
    name: 'Community Magnet',
    description: 'Fans and creators rally around their music.',
    category: 'community',
    tags: ['community', 'engagement', 'supporters'],
    structure: ['opening-scene', 'why-community', 'sound-description', 'why-supporters', 'selah-cta'],
    tone: 'fan',
  },
  {
    id: 'fan-favorite',
    name: 'Fan Favorite',
    description: 'Listeners keep coming back.',
    category: 'community',
    tags: ['loyal-fans', 'repeat-engagement', 'popular'],
    structure: ['opening-data', 'why-audience', 'sound-description', 'selah-cta'],
    tone: 'listener',
  },
  {
    id: 'creators-choice',
    name: 'Creator\'s Choice',
    description: 'The artist that creators pick.',
    category: 'community',
    tags: ['creator-favorite', 'campaign-success', 'submissions'],
    structure: ['opening-hook', 'why-community', 'sound-description', 'selah-cta'],
    tone: 'fan',
  },
  {
    id: 'audience-builder',
    name: 'Audience Builder',
    description: 'Growing a following the right way.',
    category: 'community',
    tags: ['growth', 'audience', 'organic'],
    structure: ['opening-data', 'journey-audience', 'sound-description', 'why-future', 'selah-cta'],
    tone: 'feature',
  },

  // ═══════════════════════════════════════════════════════════
  // CATEGORY: Genre-specific angles
  // Triggered by genre data — provides specific sonic framing
  // ═══════════════════════════════════════════════════════════
  {
    id: 'digital-alchemist',
    name: 'Digital Alchemist',
    description: 'Electronic sounds with emotional weight.',
    category: 'genre',
    tags: ['electronic', 'digital', 'synthetic-organic'],
    structure: ['opening-scene', 'sound-description-electronic', 'journey-craft', 'why-quality', 'selah-cta'],
    tone: 'review',
  },
  {
    id: 'analog-soul',
    name: 'Analog Soul',
    description: 'Warm, human, unfiltered.',
    category: 'genre',
    tags: ['acoustic', 'organic', 'warm'],
    structure: ['opening-scene', 'sound-description-organic', 'journey-craft', 'why-quality', 'selah-cta'],
    tone: 'profile',
  },
  {
    id: 'groove-merchant',
    name: 'Groove Merchant',
    description: 'Rhythm is their language.',
    category: 'genre',
    tags: ['rhythmic', 'dance', 'funk'],
    structure: ['opening-hook', 'sound-description-rhythm', 'why-momentum', 'selah-cta'],
    tone: 'fan',
  },
  {
    id: 'mood-architect',
    name: 'Mood Architect',
    description: 'They build atmosphere, not just songs.',
    category: 'genre',
    tags: ['ambient', 'atmospheric', 'mood'],
    structure: ['opening-scene', 'sound-description-atmospheric', 'journey-craft', 'why-quality', 'selah-cta'],
    tone: 'critic',
  },
  {
    id: 'storyteller',
    name: 'The Storyteller',
    description: 'Every track tells a story.',
    category: 'genre',
    tags: ['lyrical', 'narrative', 'hip-hop', 'singer-songwriter'],
    structure: ['opening-scene', 'sound-description', 'journey-story', 'why-quality', 'selah-cta'],
    tone: 'profile',
  },
  {
    id: 'headphone-experience',
    name: 'Headphone Experience',
    description: 'Music that rewards close listening.',
    category: 'genre',
    tags: ['detailed', 'intricate', 'production-focused'],
    structure: ['opening-hook', 'sound-description-rich', 'journey-craft', 'why-quality', 'selah-cta'],
    tone: 'review',
  },

  // ═══════════════════════════════════════════════════════════
  // CATEGORY: Location angles
  // For artists with location data — adds geographic context
  // ═══════════════════════════════════════════════════════════
  {
    id: 'local-hero',
    name: 'Local Hero',
    description: 'Making waves from their city.',
    category: 'location',
    tags: ['local', 'city-pride', 'regional'],
    structure: ['opening-place', 'sound-description', 'why-local', 'selah-cta'],
    tone: 'profile',
  },
  {
    id: 'global-reach',
    name: 'Global Reach',
    description: 'From local roots to international ears.',
    category: 'location',
    tags: ['international', 'global', 'cross-border'],
    structure: ['opening-place', 'journey-growth', 'sound-description', 'why-global', 'selah-cta'],
    tone: 'feature',
  },
  {
    id: 'scene-anchor',
    name: 'Scene Anchor',
    description: 'Part of a thriving musical community.',
    category: 'location',
    tags: ['scene', 'community', 'local-scene'],
    structure: ['opening-place', 'why-scene', 'sound-description', 'selah-cta'],
    tone: 'profile',
  },

  // ═══════════════════════════════════════════════════════════
  // CATEGORY: Journey angles
  // Focus on the artist's story arc
  // ═══════════════════════════════════════════════════════════
  {
    id: 'the-comeback',
    name: 'The Comeback',
    description: 'After time away, they returned with purpose.',
    category: 'journey',
    tags: ['return', 'persistence', 'gap'],
    structure: ['opening-contrast', 'journey-comeback', 'sound-description', 'why-future', 'selah-cta'],
    tone: 'feature',
  },
  {
    id: 'late-bloomer',
    name: 'Late Bloomer',
    description: 'They found their voice on their own timeline.',
    category: 'journey',
    tags: ['later-career', 'self-discovery', 'patience'],
    structure: ['opening-scene', 'journey-discovery', 'sound-description', 'why-quality', 'selah-cta'],
    tone: 'profile',
  },
  {
    id: 'diy-story',
    name: 'The DIY Story',
    description: 'No label, no shortcuts. Just music.',
    category: 'journey',
    tags: ['independent', 'self-made', 'grassroots'],
    structure: ['opening-scene', 'journey-diy', 'sound-description', 'why-independent', 'selah-cta'],
    tone: 'feature',
  },
  {
    id: 'internet-native',
    name: 'Internet Native',
    description: 'Born in the age of streaming.',
    category: 'journey',
    tags: ['digital-native', 'modern', 'streaming-era'],
    structure: ['opening-hook', 'journey-modern', 'sound-description', 'why-future', 'selah-cta'],
    tone: 'fan',
  },
  {
    id: 'from-bedroom',
    name: 'From the Bedroom',
    description: 'Music made in personal spaces.',
    category: 'journey',
    tags: ['bedroom-producer', 'home-studio', 'intimate'],
    structure: ['opening-scene', 'journey-beginning', 'sound-description', 'why-independent', 'selah-cta'],
    tone: 'profile',
  },
  {
    id: 'the-apprenticeship',
    name: 'The Apprenticeship',
    description: 'Years of practice behind every release.',
    category: 'journey',
    tags: ['craft-development', 'practice', 'dedication'],
    structure: ['opening-process', 'journey-craft', 'sound-description', 'why-quality', 'selah-cta'],
    tone: 'critic',
  },
  {
    id: 'second-wind',
    name: 'Second Wind',
    description: 'A new chapter with renewed energy.',
    category: 'journey',
    tags: ['reinvention', 'new-chapter', 'renewed'],
    structure: ['opening-contrast', 'journey-renewal', 'sound-description', 'why-future', 'selah-cta'],
    tone: 'feature',
  },

  // ═══════════════════════════════════════════════════════════
  // CATEGORY: Time/era angles
  // Contextualize the artist in the current moment
  // ═══════════════════════════════════════════════════════════
  {
    id: 'the-scene',
    name: 'The Scene',
    description: 'Part of a new wave of artists.',
    category: 'era',
    tags: ['movement', 'wave', 'generational'],
    structure: ['opening-place', 'why-scene', 'sound-description', 'why-moment', 'selah-cta'],
    tone: 'feature',
  },
  {
    id: 'the-experimenter',
    name: 'The Experimenter',
    description: 'Pushing boundaries without losing the thread.',
    category: 'era',
    tags: ['experimental', 'boundary-pushing', 'innovative'],
    structure: ['opening-contrast', 'sound-description', 'journey-experiment', 'why-quality', 'selah-cta'],
    tone: 'critic',
  },
  {
    id: 'timeless-sound',
    name: 'Timeless Sound',
    description: 'Music that feels like it could be from any era.',
    category: 'era',
    tags: ['classic', 'timeless', 'era-defying'],
    structure: ['opening-contrast', 'sound-description', 'why-quality', 'selah-cta'],
    tone: 'review',
  },

  // ═══════════════════════════════════════════════════════════
  // CATEGORY: Platform angles
  // How the artist uses Selah.fm specifically
  // ═══════════════════════════════════════════════════════════
  {
    id: 'selah-success',
    name: 'Selah.fm Success',
    description: 'Thriving in the creator economy.',
    category: 'platform',
    tags: ['platform-success', 'campaigns', 'creator-economy'],
    structure: ['opening-hook', 'why-community', 'why-platform', 'selah-cta'],
    tone: 'data',
  },
  {
    id: 'creator-beloved',
    name: 'Creator Beloved',
    description: 'The artist that creators choose.',
    category: 'platform',
    tags: ['creator-favorite', 'high-engagement', 'platform-star'],
    structure: ['opening-data', 'why-community', 'sound-description', 'selah-cta'],
    tone: 'fan',
  },
  {
    id: 'platform-native',
    name: 'Platform Native',
    description: 'Built for the modern music economy.',
    category: 'platform',
    tags: ['modern', 'platform-savvy', 'direct-to-fan'],
    structure: ['opening-hook', 'why-platform', 'sound-description', 'selah-cta'],
    tone: 'profile',
  },

  // ═══════════════════════════════════════════════════════════
  // CATEGORY: Mood/Vibe angles
  // Focus on the feeling of the music
  // ═══════════════════════════════════════════════════════════
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Music made in the quiet hours.',
    category: 'mood',
    tags: ['nocturnal', 'atmospheric', 'introspective'],
    structure: ['opening-scene', 'sound-description-atmospheric', 'why-mood', 'selah-cta'],
    tone: 'profile',
  },
  {
    id: 'sunlight-sound',
    name: 'Sunlight Sound',
    description: 'Music that feels like daylight.',
    category: 'mood',
    tags: ['bright', 'uplifting', 'optimistic'],
    structure: ['opening-scene', 'sound-description', 'why-mood', 'selah-cta'],
    tone: 'fan',
  },
  {
    id: 'contemplative',
    name: 'For Contemplation',
    description: 'Music that makes you think.',
    category: 'mood',
    tags: ['thoughtful', 'deep', 'reflective'],
    structure: ['opening-hook', 'sound-description', 'why-mood', 'selah-cta'],
    tone: 'critic',
  },
  {
    id: 'escape',
    name: 'An Escape',
    description: 'Music that takes you somewhere else.',
    category: 'mood',
    tags: ['transportive', 'immersive', 'cinematic'],
    structure: ['opening-scene', 'sound-description-rich', 'why-mood', 'selah-cta'],
    tone: 'listener',
  },

  // ═══════════════════════════════════════════════════════════
  // CATEGORY: Production/process angles
  // Focus on how the music is made
  // ═══════════════════════════════════════════════════════════
  {
    id: 'producer-artist',
    name: 'Producer-Artist',
    description: 'They create their own sonic universe.',
    category: 'production',
    tags: ['self-produced', 'hands-on', 'full-control'],
    structure: ['opening-process', 'journey-craft', 'sound-description', 'why-quality', 'selah-cta'],
    tone: 'review',
  },
  {
    id: 'studio-rat',
    name: 'Studio Rat',
    description: 'Obsessed with getting the sound right.',
    category: 'production',
    tags: ['perfectionist', 'detailed', 'studio-craft'],
    structure: ['opening-process', 'journey-craft', 'sound-description-rich', 'why-quality', 'selah-cta'],
    tone: 'critic',
  },
  {
    id: 'live-wire',
    name: 'Live Wire',
    description: 'Energy that translates from studio to stage.',
    category: 'production',
    tags: ['energetic', 'live-performance', 'dynamic'],
    structure: ['opening-scene', 'sound-description', 'why-energy', 'selah-cta'],
    tone: 'fan',
  },

  // ═══════════════════════════════════════════════════════════
  // CATEGORY: Quality signal angles
  // For artists with strong quality indicators
  // ═══════════════════════════════════════════════════════════
  {
    id: 'quality-over-quantity',
    name: 'Quality Over Quantity',
    description: 'Every release earns its place.',
    category: 'quality',
    tags: ['selective', 'curated', 'high-standard'],
    structure: ['opening-contrast', 'sound-description', 'why-quality', 'selah-cta'],
    tone: 'critic',
  },
  {
    id: 'dark-horse',
    name: 'Dark Horse',
    description: 'Quietly outperforming expectations.',
    category: 'quality',
    tags: ['surprising', 'underestimated', 'over-performing'],
    structure: ['opening-contrast', 'journey-growth', 'sound-description', 'why-milestones', 'selah-cta'],
    tone: 'feature',
  },
  {
    id: 'cult-following',
    name: 'Cult Following',
    description: 'Not for everyone, but unforgettable for those who get it.',
    category: 'quality',
    tags: ['niche', 'dedicated', 'passionate-fans'],
    structure: ['opening-hook', 'why-audience', 'sound-description', 'selah-cta'],
    tone: 'listener',
  },

  // ═══════════════════════════════════════════════════════════
  // CATEGORY: Style angles
  // Focus on musical style and approach
  // ═══════════════════════════════════════════════════════════
  {
    id: 'genre-pure',
    name: 'Pure [Genre]',
    description: 'Straight-ahead, no-frills genre music.',
    category: 'style',
    tags: ['pure-genre', 'traditional', 'straightforward'],
    structure: ['opening-hook', 'sound-description', 'why-craft', 'selah-cta'],
    tone: 'review',
  },
  {
    id: 'fusion',
    name: 'Fusion Found',
    description: 'Where genres meet and something new emerges.',
    category: 'style',
    tags: ['fusion', 'cross-genre', 'hybrid'],
    structure: ['opening-contrast', 'sound-description', 'journey-influences', 'why-innovation', 'selah-cta'],
    tone: 'critic',
  },
  {
    id: 'texture-first',
    name: 'Texture First',
    description: 'Sound design as songwriting.',
    category: 'style',
    tags: ['textural', 'sound-design', 'atmospheric'],
    structure: ['opening-scene', 'sound-description-rich', 'journey-craft', 'why-quality', 'selah-cta'],
    tone: 'critic',
  },
  {
    id: 'songcraft',
    name: 'Songcraft Focus',
    description: 'Melody, lyrics, structure — the fundamentals.',
    category: 'style',
    tags: ['songwriting', 'melody-focused', 'traditional-craft'],
    structure: ['opening-process', 'sound-description', 'why-craft', 'selah-cta'],
    tone: 'review',
  },
];

/**
 * Get angles by category
 */
export function getAnglesByCategory(category: string): Angle[] {
  return ANGLES.filter(a => a.category === category);
}

/**
 * Get a random angle for testing
 */
export function getRandomAngle(): Angle {
  return ANGLES[Math.floor(Math.random() * ANGLES.length)];
}

export default ANGLES;
