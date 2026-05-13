/**
 * Multi-channel artist discovery — Spotify-free.
 * Finds real, active, unsigned artists through channels where they promote themselves.
 *
 * Channels:
 *   1. Bandcamp API  — all independent by definition, full artist/track/cover data
 *   2. Reddit        — music subreddits (self-promotion posts with links)
 *   3. YouTube       — small-channel music video search
 *
 * No Spotify credentials needed. No rate limits on discovery channels.
 */

// ── Shared types ──────────────────────────────────────────────────

export interface RawArtistCandidate {
  artist_name: string;
  track_name?: string;
  source: 'reddit' | 'bandcamp' | 'youtube';
  source_url: string;
  source_detail: string;
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

// ── AI detection ──────────────────────────────────────────────────

const AI_NAME_PATTERNS = [/^lofi\s/i, /^chill\s/i, /study\sbeats/i, /synth\swaves/i, /ambient\s/i, /sleep\s/i, /focus\s/i];

function detectAiSignals(name: string): number {
  let signals = 0;
  if (AI_NAME_PATTERNS.some(p => p.test(name))) signals++;
  if (!name || name.length < 3) signals++;
  return signals;
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function extractSpotifyUrl(text: string): string | null {
  const m = text.match(/https?:\/\/open\.spotify\.com\/(track|artist|album)\/[a-zA-Z0-9]+/);
  return m ? m[0] : null;
}

function extractYoutubeUrl(text: string): string | null {
  const m = text.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? `https://www.youtube.com/watch?v=${m[1]}` : null;
}

function parseArtistTrackTitle(title: string): { artist?: string; track?: string } {
  let m = title.match(/^(.+?)\s*[–—\-]\s*(.+?)(?:\s*[\[\(].*?[\]\)])?\s*$/);
  if (m) return { artist: m[1].trim(), track: m[2].trim() };
  m = title.match(/[""](.+?)[""]\s*(?:by|-)\s*(.+?)(?:\s*[\[\(].*?[\]\)])?\s*$/i);
  if (m) return { artist: m[2].trim(), track: m[1].trim() };
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
// CHANNEL 1: REDDIT (music subreddits)
// ══════════════════════════════════════════════════════════════════

const REDDIT_SUBREDDITS = ['indiemusic', 'listentothis', 'WeAreTheMusicMakers', 'ThisIsOurMusic', 'music', 'indie_rock', 'electronicmusic', 'hiphopheads'];

async function fetchRedditSubreddit(sub: string): Promise<any[]> {
  try {
    const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=25&t=week`, {
      headers: { 'User-Agent': 'SelahFM/1.0 (music discovery bot)' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data?.children || []).map((c: any) => ({
      title: c.data.title, url: c.data.url,
      permalink: `https://reddit.com${c.data.permalink}`,
      ups: c.data.ups, subreddit: c.data.subreddit,
      selftext: c.data.selftext, domain: c.data.domain,
    }));
  } catch { return []; }
}

async function discoverFromReddit(): Promise<{ candidates: RawArtistCandidate[]; diagnostics: string[] }> {
  const diagnostics: string[] = [];
  const candidates: RawArtistCandidate[] = [];
  const seen = new Set<string>();

  for (const sub of REDDIT_SUBREDDITS) {
    try {
      const posts = await fetchRedditSubreddit(sub);
      let added = 0;
      for (const post of posts) {
        if (post.ups < 3) continue;
        const spotifyUrl = extractSpotifyUrl(post.title + ' ' + (post.selftext || '')) || extractSpotifyUrl(post.url);
        const youtubeUrl = extractYoutubeUrl(post.title + ' ' + (post.selftext || '')) || extractYoutubeUrl(post.url);
        if (!spotifyUrl && !youtubeUrl) continue;
        if (post.domain && ['imgur.com', 'i.redd.it', 'v.redd.it'].includes(post.domain) && !spotifyUrl && !youtubeUrl) continue;

        const parsed = parseArtistTrackTitle(post.title);
        const artistName = parsed.artist || post.title.slice(0, 100);
        const key = artistName.toLowerCase().trim();
        if (seen.has(key) || detectAiSignals(artistName) >= 2) continue;
        seen.add(key);

        candidates.push({
          artist_name: artistName, track_name: parsed.track, source: 'reddit',
          source_url: post.permalink, source_detail: `r/${post.subreddit}`,
          genres_hint: extractGenresFromTitle(post.title),
          spotify_url: spotifyUrl || undefined, youtube_url: youtubeUrl || undefined,
          social_links: {}, discovery_meta: { ups: post.ups, subreddit: post.subreddit },
        });
        added++;
      }
      diagnostics.push(`  r/${sub}: ${posts.length} posts, ${added} candidates`);
    } catch (e: any) { diagnostics.push(`  ❌ r/${sub}: ${e.message}`); }
    await sleep(500);
  }
  diagnostics.push(`Reddit: ${candidates.length} candidates`);
  return { candidates, diagnostics };
}

// ══════════════════════════════════════════════════════════════════
// CHANNEL 2: BANDCAMP (API-based, all independent)
// ══════════════════════════════════════════════════════════════════

const BANDCAMP_GENRES = ['electronic', 'hiphop-rap', 'rock', 'pop', 'folk', 'metal', 'punk', 'experimental', 'ambient', 'indie', 'alternative', 'r-b-soul', 'jazz', 'country'];

async function fetchBandcampGenre(genre: string): Promise<RawArtistCandidate[]> {
  try {
    const res = await fetch(`https://bandcamp.com/api/discover/3/get_web?g=${encodeURIComponent(genre)}&s=new&p=0&f=digital&t=albums`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SelahFM/1.0)' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = (data.items || []) as any[];
    const candidates: RawArtistCandidate[] = [];
    const seen = new Set<string>();

    for (const item of items) {
      const artistName = (item.secondary_text || '').trim();
      if (!artistName || detectAiSignals(artistName) >= 2) continue;
      const key = artistName.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const trackName = (item.primary_text || '').trim();
      const subdomain = item.url_hints?.subdomain || '';
      const bandUrl = subdomain ? `https://${subdomain}.bandcamp.com/` : '';
      const coverUrl = item.art_id ? `https://f4.bcbits.com/img/a${item.art_id}_16.jpg` : undefined;
      const genreText = item.genre_text || genre;

      let displayTrack = trackName;
      if (trackName.includes(' - ')) {
        const parts = trackName.split(' - ');
        if (parts.length >= 2) displayTrack = parts.slice(1).join(' - ').trim();
      }

      candidates.push({
        artist_name: artistName, track_name: displayTrack || undefined, source: 'bandcamp',
        source_url: bandUrl, source_detail: `Bandcamp ${genreText}`,
        genres_hint: [genreText], social_links: { bandcamp: bandUrl },
        cover_url: coverUrl, discovery_meta: { band_id: item.band_id, art_id: item.art_id, subdomain, genre: genreText },
      });
    }
    return candidates;
  } catch { return []; }
}

async function discoverFromBandcamp(): Promise<{ candidates: RawArtistCandidate[]; diagnostics: string[] }> {
  const diagnostics: string[] = [];
  const allCandidates: RawArtistCandidate[] = [];
  const seen = new Set<string>();
  const shuffled = [...BANDCAMP_GENRES].sort(() => Math.random() - 0.5);
  const genres = shuffled.slice(0, 6);

  for (const genre of genres) {
    try {
      const candidates = await fetchBandcampGenre(genre);
      diagnostics.push(`  Bandcamp/${genre}: ${candidates.length} candidates`);
      for (const c of candidates) {
        const key = c.artist_name.toLowerCase().trim();
        if (seen.has(key)) continue;
        seen.add(key); allCandidates.push(c);
      }
    } catch (e: any) { diagnostics.push(`  ❌ Bandcamp/${genre}: ${e.message}`); }
    await sleep(500);
  }
  diagnostics.push(`Bandcamp: ${allCandidates.length} candidates`);
  return { candidates: allCandidates, diagnostics };
}

// ══════════════════════════════════════════════════════════════════
// CHANNEL 3: YOUTUBE (small channels, needs YOUTUBE_API_KEY)
// ══════════════════════════════════════════════════════════════════

const YOUTUBE_SEARCH_TERMS = ['official music video 2025 unsigned', 'debut music video 2025', 'underground music video 2025', 'indie music video 2026'];

async function discoverFromYoutube(): Promise<{ candidates: RawArtistCandidate[]; diagnostics: string[] }> {
  const diagnostics: string[] = [];
  const candidates: RawArtistCandidate[] = [];
  const seen = new Set<string>();
  const ytKey = process.env.YOUTUBE_API_KEY;
  if (!ytKey) { diagnostics.push('YouTube: YOUTUBE_API_KEY not set — skipping'); return { candidates, diagnostics }; }

  const shuffled = [...YOUTUBE_SEARCH_TERMS].sort(() => Math.random() - 0.5);
  for (const term of shuffled.slice(0, 2)) {
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(term)}&type=video&maxResults=10&order=date&videoDuration=medium&key=${ytKey}`);
      if (!res.ok) { diagnostics.push(`  ❌ YouTube "${term}": ${res.status}`); continue; }
      const data = await res.json();
      const items = data.items || [];
      const videoIds = items.map((i: any) => i.id.videoId).join(',');
      if (!videoIds) continue;

      const statsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${ytKey}`);
      if (!statsRes.ok) continue;
      const statsData = await statsRes.json();

      for (const video of statsData.items || []) {
        const viewCount = parseInt(video.statistics?.viewCount || '0');
        if (viewCount < 100 || viewCount > 100000) continue;
        const parsed = parseArtistTrackTitle(video.snippet.title);
        const artistName = parsed.artist || video.snippet.channelTitle;
        if (detectAiSignals(artistName) >= 2) continue;
        const key = artistName.toLowerCase().trim();
        if (seen.has(key)) continue;
        seen.add(key);

        candidates.push({
          artist_name: artistName, track_name: parsed.track || video.snippet.title, source: 'youtube',
          source_url: `https://www.youtube.com/watch?v=${video.id}`,
          source_detail: `YouTube — ${viewCount.toLocaleString()} views`,
          genres_hint: extractGenresFromTitle(video.snippet.title),
          youtube_url: `https://www.youtube.com/watch?v=${video.id}`,
          social_links: {},
          cover_url: video.snippet.thumbnails?.medium?.url,
          discovery_meta: { views: viewCount, channel_title: video.snippet.channelTitle },
        });
      }
      diagnostics.push(`  YouTube "${term}": ${items.length} results, ${candidates.filter(c => c.source === 'youtube').length} candidates`);
    } catch (e: any) { diagnostics.push(`  ❌ YouTube "${term}": ${e.message}`); }
    await sleep(500);
  }
  diagnostics.push(`YouTube: ${candidates.length} candidates`);
  return { candidates, diagnostics };
}

// ══════════════════════════════════════════════════════════════════
// MAIN ENTRYPOINT
// ══════════════════════════════════════════════════════════════════

export interface DiscoveryResult {
  artists: DiscoveredArtist[];
  diagnostics: string[];
  channels: {
    reddit: { candidates: number };
    bandcamp: { candidates: number };
    youtube: { candidates: number };
  };
}

export async function discoverArtists(limit: number = 15): Promise<DiscoveryResult> {
  const diagnostics: string[] = [];
  diagnostics.push('═══ Multi-channel discovery (Spotify-free) ═══');

  const [redditResult, bandcampResult, youtubeResult] = await Promise.all([
    discoverFromReddit(), discoverFromBandcamp(), discoverFromYoutube(),
  ]);

  diagnostics.push(...redditResult.diagnostics);
  diagnostics.push(...bandcampResult.diagnostics);
  diagnostics.push(...youtubeResult.diagnostics);

  const allCandidates = [...redditResult.candidates, ...bandcampResult.candidates, ...youtubeResult.candidates];
  const seen = new Set<string>();
  const unique: RawArtistCandidate[] = [];
  for (const c of allCandidates) {
    const key = c.artist_name.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key); unique.push(c);
  }
  diagnostics.push(`\nTotal unique candidates: ${unique.length}`);

  // Return candidates directly as DiscoveredArtist (no Spotify enrichment)
  const artists: DiscoveredArtist[] = [];
  for (const candidate of unique) {
    if (artists.length >= limit) break;
    artists.push({
      artist_name: candidate.artist_name,
      spotify_id: '',
      genres: candidate.genres_hint,
      monthly_listeners: 0,
      followers: 0,
      social_links: candidate.social_links,
      latest_track_name: candidate.track_name || '',
      latest_track_spotify_url: candidate.spotify_url || '',
      latest_track_cover_url: candidate.cover_url || '',
      latest_release_date: '',
      discovery_source: `${candidate.source} (${candidate.source_detail})`,
      ai_signals_detected: 0,
      is_ai_artist: false,
    });
    diagnostics.push(`  📋 ${candidate.artist_name} (${candidate.source})`);
  }

  diagnostics.push(`✅ Discovered ${artists.length} artists`);
  return {
    artists, diagnostics,
    channels: {
      reddit: { candidates: redditResult.candidates.length },
      bandcamp: { candidates: bandcampResult.candidates.length },
      youtube: { candidates: youtubeResult.candidates.length },
    },
  };
}
