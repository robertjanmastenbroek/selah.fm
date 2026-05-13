/**
 * Multi-channel artist discovery — finds real, active, unsigned artists
 * through channels where they actually promote themselves.
 *
 * Channels (in order of signal quality):
 *   1. Reddit    — r/indiemusic, r/listentothis, r/WeAreTheMusicMakers
 *   2. Bandcamp  — genre scraping (all independent by definition)
 *   3. YouTube   — small-channel music video search
 *
 * Each channel returns raw artist candidates. We then cross-reference
 * with Spotify for authoritative data (follower count, top tracks, cover art).
 *
 * Requires: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET (for cross-reference).
 * Optional: YOUTUBE_API_KEY (for YouTube channel).
 */

// ── Spotify token (shared with outreach.ts — kept here for cross-reference) ──

let spotifyToken: { access_token: string; expires_at: number } | null = null;

async function getSpotifyToken(): Promise<string> {
  if (spotifyToken && Date.now() < spotifyToken.expires_at) {
    return spotifyToken.access_token;
  }
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET required');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Spotify auth failed: ${res.status}`);
  const data = await res.json();
  spotifyToken = { access_token: data.access_token, expires_at: Date.now() + (data.expires_in - 60) * 1000 };
  return spotifyToken.access_token;
}

async function spotifyGet(path: string) {
  const token = await getSpotifyToken();
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '5');
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      return spotifyGet(path);
    }
    throw new Error(`Spotify API ${res.status}: ${path}`);
  }
  return res.json();
}

// ── Shared types ──────────────────────────────────────────────────

export interface RawArtistCandidate {
  artist_name: string;
  track_name?: string;
  source: 'reddit' | 'bandcamp' | 'youtube';
  source_url: string;
  source_detail: string; // subreddit, genre tag, search term
  genres_hint: string[];
  spotify_url?: string;
  youtube_url?: string;
  cover_url?: string;
  social_links: Record<string, string>;
  discovery_meta: Record<string, any>;
}

export interface DiscoveredArtist {
  artist_name: string;
  spotify_id: string;
  genres: string[];
  monthly_listeners: number;
  followers: number;
  social_links: Record<string, string>;
  latest_track_name: string;
  latest_track_spotify_url: string;
  latest_track_cover_url: string;
  latest_release_date: string;
  discovery_source: string;
  ai_signals_detected: number;
  is_ai_artist: boolean;
}

// ── AI detection (spot-check, no Spotify data needed) ─────────────

const AI_DISTRIBUTORS = ['boomy', 'mubert', 'soundful', 'aiva', 'beatoven', 'soundraw', 'loudly', 'evoke'];
const AI_NAME_PATTERNS = [/^lofi\s/i, /^chill\s/i, /study\sbeats/i, /synth\swaves/i, /ambient\s/i, /sleep\s/i, /focus\s/i];

function detectAiSignals(name: string): number {
  let signals = 0;
  if (AI_NAME_PATTERNS.some(p => p.test(name))) signals++;
  if (!name || name.length < 3) signals++;
  return signals;
}

// ── Utility ───────────────────────────────────────────────────────

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

/** Extract the first Spotify track/artist URL from text */
function extractSpotifyUrl(text: string): string | null {
  const m = text.match(/https?:\/\/open\.spotify\.com\/(track|artist|album)\/[a-zA-Z0-9]+/);
  return m ? m[0] : null;
}

function extractYoutubeUrl(text: string): string | null {
  const m = text.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? `https://www.youtube.com/watch?v=${m[1]}` : null;
}

/** Parse "Artist Name — Track Title [Genre]" patterns from Reddit titles */
function parseArtistTrackTitle(title: string): { artist?: string; track?: string } {
  // Pattern 1: Artist — Track
  let m = title.match(/^(.+?)\s*[–—\-]\s*(.+?)(?:\s*[\[\(].*?[\]\)])?\s*$/);
  if (m) return { artist: m[1].trim(), track: m[2].trim() };

  // Pattern 2: "Track" by Artist
  m = title.match(/[""](.+?)[""]\s*(?:by|-)\s*(.+?)(?:\s*[\[\(].*?[\]\)])?\s*$/i);
  if (m) return { artist: m[2].trim(), track: m[1].trim() };

  // Pattern 3: Artist — just a name with genre tag
  m = title.match(/^(.+?)\s*[\[\(](.+?)[\]\)]\s*$/);
  if (m) return { artist: m[1].trim() };

  return {};
}

function extractGenresFromTitle(title: string): string[] {
  const m = title.match(/[\[\(]([^\]\)]+)[\]\)]/g);
  if (!m) return [];
  return m.map(tag => tag.replace(/[\[\]\(\)]/g, '').trim()).filter(g => g.length < 30);
}

// ══════════════════════════════════════════════════════════════════
// CHANNEL 1: REDDIT
// ══════════════════════════════════════════════════════════════════

const REDDIT_SUBREDDITS = [
  'indiemusic',
  'listentothis',
  'WeAreTheMusicMakers',
  'ThisIsOurMusic',
  'music',
  'indie_rock',
  'electronicmusic',
  'hiphopheads',
];

interface RedditPost {
  title: string;
  url: string;
  permalink: string;
  ups: number;
  subreddit: string;
  selftext?: string;
  domain?: string;
  created_utc: number;
}

async function fetchRedditSubreddit(sub: string): Promise<RedditPost[]> {
  try {
    const res = await fetch(
      `https://www.reddit.com/r/${sub}/hot.json?limit=25&t=week`,
      { headers: { 'User-Agent': 'SelahFM/1.0 (music discovery bot)' } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data?.children || []).map((c: any) => ({
      title: c.data.title,
      url: c.data.url,
      permalink: `https://reddit.com${c.data.permalink}`,
      ups: c.data.ups,
      subreddit: c.data.subreddit,
      selftext: c.data.selftext,
      domain: c.data.domain,
      created_utc: c.data.created_utc,
    }));
  } catch {
    return [];
  }
}

async function discoverFromReddit(): Promise<{ candidates: RawArtistCandidate[]; diagnostics: string[] }> {
  const diagnostics: string[] = [];
  const candidates: RawArtistCandidate[] = [];
  const seen = new Set<string>();

  for (const sub of REDDIT_SUBREDDITS) {
    try {
      const posts = await fetchRedditSubreddit(sub);
      diagnostics.push(`  r/${sub}: ${posts.length} posts`);

      for (const post of posts) {
        // Only posts with some engagement
        if (post.ups < 3) continue;

        // Extract Spotify/YouTube links
        const spotifyUrl = extractSpotifyUrl(post.title + ' ' + (post.selftext || '')) || extractSpotifyUrl(post.url);
        const youtubeUrl = extractYoutubeUrl(post.title + ' ' + (post.selftext || '')) || extractYoutubeUrl(post.url);

        // Must have at least one music link
        if (!spotifyUrl && !youtubeUrl) continue;

        // Skip non-music domains
        if (post.domain && ['imgur.com', 'i.redd.it', 'v.redd.it', 'reddit.com'].includes(post.domain) && !spotifyUrl && !youtubeUrl) {
          continue;
        }

        const parsed = parseArtistTrackTitle(post.title);
        const artistName = parsed.artist || post.title.slice(0, 100);
        const genres = extractGenresFromTitle(post.title);

        const key = artistName.toLowerCase().trim();
        if (seen.has(key)) continue;
        seen.add(key);

        if (detectAiSignals(artistName) >= 2) continue;

        candidates.push({
          artist_name: artistName,
          track_name: parsed.track,
          source: 'reddit',
          source_url: post.permalink,
          source_detail: `r/${post.subreddit} — ${post.ups} upvotes`,
          genres_hint: genres,
          spotify_url: spotifyUrl || undefined,
          youtube_url: youtubeUrl || undefined,
          social_links: {},
          discovery_meta: { ups: post.ups, subreddit: post.subreddit, permalink: post.permalink },
        });
      }
    } catch (e: any) {
      diagnostics.push(`  ❌ r/${sub}: ${e.message}`);
    }
    // Be nice to Reddit
    await sleep(500);
  }

  diagnostics.push(`Reddit: ${candidates.length} candidates`);
  return { candidates, diagnostics };
}

// ══════════════════════════════════════════════════════════════════
// CHANNEL 2: BANDCAMP
// ══════════════════════════════════════════════════════════════════

const BANDCAMP_GENRES = [
  'electronic',
  'hiphop-rap',
  'rock',
  'pop',
  'folk',
  'metal',
  'punk',
  'experimental',
  'ambient',
  'indie',
  'alternative',
  'r-b-soul',
  'jazz',
  'country',
];

async function fetchBandcampGenre(genre: string): Promise<RawArtistCandidate[]> {
  try {
    const apiUrl = `https://bandcamp.com/api/discover/3/get_web?g=${encodeURIComponent(genre)}&s=new&p=0&f=digital&t=albums`;
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SelahFM/1.0)' },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const items = (data.items || data.results || []) as any[];

    const candidates: RawArtistCandidate[] = [];
    const seen = new Set<string>();

    for (const item of items) {
      // Bandcamp API format:
      // primary_text = track/album title, secondary_text = artist name
      // art_id = cover art, url_hints.subdomain = band URL
      const artistName = (item.secondary_text || '').trim();
      const trackName = (item.primary_text || '').trim();
      const bandId = item.band_id;
      const artId = item.art_id;
      const subdomain = item.url_hints?.subdomain || '';
      const genreText = item.genre_text || genre;

      if (!artistName) continue;

      const key = artistName.toLowerCase().trim();
      if (seen.has(key)) continue;
      seen.add(key);

      if (detectAiSignals(artistName) >= 2) continue;

      // Build URLs
      const bandUrl = subdomain
        ? `https://${subdomain}.bandcamp.com/`
        : `https://bandcamp.com/`;
      const coverUrl = artId
        ? `https://f4.bcbits.com/img/a${artId}_16.jpg`
        : undefined;

      // Parse title into artist/track
      let displayTrack = trackName;
      if (trackName.includes(' - ')) {
        const parts = trackName.split(' - ');
        if (parts.length >= 2) {
          displayTrack = parts.slice(1).join(' - ').trim();
        }
      }

      candidates.push({
        artist_name: artistName,
        track_name: displayTrack || undefined,
        source: 'bandcamp',
        source_url: bandUrl,
        source_detail: `Bandcamp ${genreText} (new)`,
        genres_hint: [genreText],
        social_links: { bandcamp: bandUrl },
        cover_url: coverUrl,
        discovery_meta: {
          band_id: bandId,
          art_id: artId,
          subdomain,
          genre: genreText,
          publish_date: item.publish_date,
        },
      });
    }

    return candidates;
  } catch {
    return [];
  }
}

async function discoverFromBandcamp(): Promise<{ candidates: RawArtistCandidate[]; diagnostics: string[] }> {
  const diagnostics: string[] = [];
  const allCandidates: RawArtistCandidate[] = [];
  const seen = new Set<string>();

  // Pick 4 random genres per run (avoid hammering Bandcamp)
  const shuffled = [...BANDCAMP_GENRES].sort(() => Math.random() - 0.5);
  const genres = shuffled.slice(0, 4);

  for (const genre of genres) {
    try {
      const candidates = await fetchBandcampGenre(genre);
      diagnostics.push(`  Bandcamp/${genre}: ${candidates.length} candidates`);

      for (const c of candidates) {
        const key = c.artist_name.toLowerCase().trim();
        if (seen.has(key)) continue;
        seen.add(key);
        allCandidates.push(c);
      }
    } catch (e: any) {
      diagnostics.push(`  ❌ Bandcamp/${genre}: ${e.message}`);
    }
    await sleep(800);
  }

  diagnostics.push(`Bandcamp: ${allCandidates.length} candidates`);
  return { candidates: allCandidates, diagnostics };
}

// ══════════════════════════════════════════════════════════════════
// CHANNEL 3: YOUTUBE (small channels)
// ══════════════════════════════════════════════════════════════════

const YOUTUBE_SEARCH_TERMS = [
  'official music video 2025 unsigned',
  'official music video 2025 independent artist',
  'debut music video 2025',
  'original song music video 2025',
  'underground music video 2025',
  'indie music video 2026',
  'unsigned artist music video',
];

async function discoverFromYoutube(): Promise<{ candidates: RawArtistCandidate[]; diagnostics: string[] }> {
  const diagnostics: string[] = [];
  const candidates: RawArtistCandidate[] = [];
  const seen = new Set<string>();
  const ytKey = process.env.YOUTUBE_API_KEY;

  if (!ytKey) {
    diagnostics.push('YouTube: YOUTUBE_API_KEY not set — skipping');
    return { candidates, diagnostics };
  }

  const shuffled = [...YOUTUBE_SEARCH_TERMS].sort(() => Math.random() - 0.5);
  const terms = shuffled.slice(0, 3);

  for (const term of terms) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(term)}&type=video&maxResults=15&order=date&videoDuration=medium&key=${ytKey}`
      );
      if (!res.ok) {
        diagnostics.push(`  ❌ YouTube "${term}": ${res.status}`);
        continue;
      }
      const data = await res.json();
      const items = data.items || [];
      diagnostics.push(`  YouTube "${term}": ${items.length} results`);

      // Get video details for view counts
      const videoIds = items.map((i: any) => i.id.videoId).join(',');
      if (!videoIds) continue;

      const statsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${ytKey}`
      );
      if (!statsRes.ok) continue;
      const statsData = await statsRes.json();

      for (const video of statsData.items || []) {
        const viewCount = parseInt(video.statistics?.viewCount || '0');
        // Target: videos with 100–100K views (small enough to be independent)
        if (viewCount < 100 || viewCount > 100000) continue;

        const title = video.snippet.title;
        const channelTitle = video.snippet.channelTitle;
        const parsed = parseArtistTrackTitle(title);

        // Use channel name as fallback artist name
        const artistName = parsed.artist || channelTitle;
        if (detectAiSignals(artistName) >= 2) continue;

        const genres = extractGenresFromTitle(title);
        const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
        const key = artistName.toLowerCase().trim();
        if (seen.has(key)) continue;
        seen.add(key);

        candidates.push({
          artist_name: artistName,
          track_name: parsed.track || title,
          source: 'youtube',
          source_url: videoUrl,
          source_detail: `YouTube — ${viewCount.toLocaleString()} views`,
          genres_hint: genres,
          youtube_url: videoUrl,
          social_links: {},
          cover_url: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
          discovery_meta: {
            views: viewCount,
            channel_title: channelTitle,
            published_at: video.snippet.publishedAt,
          },
        });
      }
    } catch (e: any) {
      diagnostics.push(`  ❌ YouTube "${term}": ${e.message}`);
    }
    await sleep(600);
  }

  diagnostics.push(`YouTube: ${candidates.length} candidates`);
  return { candidates, diagnostics };
}

// ══════════════════════════════════════════════════════════════════
// CROSS-REFERENCE: Resolve candidates against Spotify
// ══════════════════════════════════════════════════════════════════

async function resolveOnSpotify(candidate: RawArtistCandidate): Promise<DiscoveredArtist | null> {
  try {
    // Search Spotify for the artist by name
    const searchRes = await spotifyGet(
      `/search?q=${encodeURIComponent(candidate.artist_name)}&type=artist&limit=3`
    );

    const artists = searchRes.artists?.items || [];
    if (!artists.length) return null;

    // Pick the best match (first result usually)
    // Cross-check: if we have a Spotify URL from Reddit, match on ID
    let spotifyArtist: any = null;
    if (candidate.spotify_url) {
      const spotifyId = candidate.spotify_url.split('/artist/')[1]?.split('?')[0];
      if (spotifyId) {
        spotifyArtist = artists.find((a: any) => a.id === spotifyId);
      }
    }
    if (!spotifyArtist) spotifyArtist = artists[0];

    const followers = spotifyArtist.followers?.total || 0;

    // Filter: 50–500K followers (indie/emerging range)
    if (followers < 50 || followers > 500000) return null;

    // AI detection on Spotify data
    const aiSignals = detectAiSignals(spotifyArtist.name);
    if (!spotifyArtist.images?.length) aiSignals; // no images is a signal but not disqualifying alone
    if (aiSignals >= 3) return null;

    // Get top tracks
    let topTracks: any[] = [];
    try {
      const ttRes = await spotifyGet(`/artists/${spotifyArtist.id}/top-tracks?market=US`);
      topTracks = ttRes.tracks || [];
    } catch {}

    const latestTrack = topTracks[0];
    const genres = spotifyArtist.genres || [];
    const socialLinks: Record<string, string> = { spotify: spotifyArtist.external_urls?.spotify };
    if (candidate.social_links.bandcamp) socialLinks.bandcamp = candidate.social_links.bandcamp;

    return {
      artist_name: spotifyArtist.name,
      spotify_id: spotifyArtist.id,
      genres,
      monthly_listeners: followers,
      followers,
      social_links: socialLinks,
      latest_track_name: latestTrack?.name || candidate.track_name || '',
      latest_track_spotify_url: latestTrack?.external_urls?.spotify || spotifyArtist.external_urls?.spotify || '',
      latest_track_cover_url: latestTrack?.album?.images?.[0]?.url || spotifyArtist.images?.[0]?.url || '',
      latest_release_date: latestTrack?.album?.release_date || '',
      discovery_source: `${candidate.source} (${candidate.source_detail})`,
      ai_signals_detected: aiSignals,
      is_ai_artist: false,
    };
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════
// MAIN ENTRYPOINT: Aggregate all channels
// ══════════════════════════════════════════════════════════════════

export interface DiscoveryResult {
  artists: DiscoveredArtist[];
  diagnostics: string[];
  channels: {
    reddit: { candidates: number; searched: number };
    bandcamp: { candidates: number; genres: string[] };
    youtube: { candidates: number; terms: string[] };
  };
}

export async function discoverArtists(_query?: string, limit: number = 15): Promise<DiscoveryResult> {
  // _query is accepted for backward compat with old callers but ignored —
  // multi-channel discovery doesn't need keyword search
  const diagnostics: string[] = [];
  diagnostics.push('═══ Multi-channel discovery ═══');

  // Check prerequisites
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    diagnostics.push('❌ SPOTIFY_CLIENT_ID and/or SPOTIFY_CLIENT_SECRET not set');
    return { artists: [], diagnostics, channels: { reddit: { candidates: 0, searched: 0 }, bandcamp: { candidates: 0, genres: [] }, youtube: { candidates: 0, terms: [] } } };
  }

  // ── Run all channels in parallel ──
  const [redditResult, bandcampResult, youtubeResult] = await Promise.all([
    discoverFromReddit(),
    discoverFromBandcamp(),
    discoverFromYoutube(),
  ]);

  diagnostics.push(...redditResult.diagnostics);
  diagnostics.push(...bandcampResult.diagnostics);
  diagnostics.push(...youtubeResult.diagnostics);

  // ── Merge and deduplicate ──
  const allCandidates = [...redditResult.candidates, ...bandcampResult.candidates, ...youtubeResult.candidates];
  const seen = new Set<string>();
  const unique: RawArtistCandidate[] = [];
  for (const c of allCandidates) {
    const key = c.artist_name.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(c);
  }

  diagnostics.push(`\nTotal unique candidates: ${unique.length}`);

  // ── Cross-reference with Spotify (serial — rate limited) ──
  const artists: DiscoveredArtist[] = [];
  let spotifyLookups = 0;
  let spotifyMatches = 0;

  for (const candidate of unique) {
    if (artists.length >= limit) break;

    try {
      spotifyLookups++;
      const resolved = await resolveOnSpotify(candidate);
      if (resolved) {
        artists.push(resolved);
        spotifyMatches++;
        diagnostics.push(`  ✅ ${resolved.artist_name} — ${resolved.followers.toLocaleString()} followers (${candidate.source})`);
      }
    } catch (e: any) {
      diagnostics.push(`  ⚠️  Spotify lookup failed for ${candidate.artist_name}: ${e.message}`);
    }

    // Rate limit: Spotify allows ~180 requests/min for search, be conservative
    if (spotifyLookups % 5 === 0) await sleep(200);
  }

  diagnostics.push(`\nSpotify: ${spotifyMatches} matches from ${spotifyLookups} lookups`);
  diagnostics.push(`✅ Discovered ${artists.length} artists`);

  return {
    artists,
    diagnostics,
    channels: {
      reddit: { candidates: redditResult.candidates.length, searched: REDDIT_SUBREDDITS.length },
      bandcamp: { candidates: bandcampResult.candidates.length, genres: BANDCAMP_GENRES.slice(0, 4) },
      youtube: { candidates: youtubeResult.candidates.length, terms: YOUTUBE_SEARCH_TERMS.slice(0, 3) },
    },
  };
}

// ── Quick direct discovery (single channel, fast path for testing) ──

export async function discoverFromSingleChannel(
  channel: 'reddit' | 'bandcamp' | 'youtube',
  limit: number = 10,
): Promise<DiscoveryResult> {
  let candidates: RawArtistCandidate[] = [];
  let diagnostics: string[] = [];
  let channelInfo = { reddit: { candidates: 0, searched: 0 }, bandcamp: { candidates: 0, genres: [] as string[] }, youtube: { candidates: 0, terms: [] as string[] } };

  if (channel === 'reddit') {
    const result = await discoverFromReddit();
    candidates = result.candidates;
    diagnostics = result.diagnostics;
    channelInfo.reddit = { candidates: candidates.length, searched: REDDIT_SUBREDDITS.length };
  } else if (channel === 'bandcamp') {
    const result = await discoverFromBandcamp();
    candidates = result.candidates;
    diagnostics = result.diagnostics;
    channelInfo.bandcamp = { candidates: candidates.length, genres: BANDCAMP_GENRES };
  } else if (channel === 'youtube') {
    const result = await discoverFromYoutube();
    candidates = result.candidates;
    diagnostics = result.diagnostics;
    channelInfo.youtube = { candidates: candidates.length, terms: YOUTUBE_SEARCH_TERMS };
  }

  // Resolve on Spotify
  const artists: DiscoveredArtist[] = [];
  for (const c of candidates.slice(0, limit * 2)) {
    if (artists.length >= limit) break;
    try {
      const resolved = await resolveOnSpotify(c);
      if (resolved) artists.push(resolved);
    } catch {}
    await sleep(200);
  }

  return { artists, diagnostics, channels: channelInfo };
}
