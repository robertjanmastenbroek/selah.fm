/**
 * Outbound artist marketing automation pipeline.
 * 
 * FIND → AUDIT → BUILD → OUTREACH → CLAIM → SHARE
 *
 * Requires: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET in environment.
 * Optional: YOUTUBE_API_KEY for music video search.
 */

// ── Spotify API ───────────────────────────────────────────────────

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
  spotifyToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };
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

// ── AI Artist Detection ───────────────────────────────────────────

const AI_DISTRIBUTORS = ['boomy', 'mubert', 'soundful', 'aiva', 'beatoven', 'soundraw', 'loudly', 'evoke'];
const AI_NAME_PATTERNS = [/^lofi\s/i, /^chill\s/i, /study\sbeats/i, /synth\swaves/i, /ambient\s/i, /sleep\s/i, /focus\s/i];

function detectAiSignals(artist: any, albums: any[]): number {
  let signals = 0;

  // 1. Empty/generic bio
  const bio = (artist.genres || []).join(' ') + ' ' + (artist.name || '');
  if (!artist.images?.length || bio.length < 20) signals++;

  // 2. No social links in external_urls
  if (!artist.external_urls?.spotify) signals++;

  // 3. Unnatural release volume (check albums for many tracks same day)
  // We can't check this from the artist endpoint alone — requires album lookup

  // 4. AI distributor check (from album data)
  // Would need to check album labels

  // 5. Generic name patterns
  if (AI_NAME_PATTERNS.some(p => p.test(artist.name || ''))) signals++;

  // 6. No images or abstract images
  if (!artist.images?.length || artist.images.length < 2) signals++;

  return signals;
}

// ── Discovery ─────────────────────────────────────────────────────

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

export async function discoverArtists(_query: string = 'year:2025-2026', limit: number = 20): Promise<{ artists: DiscoveredArtist[], diagnostics: string[] }> {
  const diagnostics: string[] = [];

  // Check credentials
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    diagnostics.push('❌ SPOTIFY_CLIENT_ID and/or SPOTIFY_CLIENT_SECRET not set in environment');
    return { artists: [], diagnostics };
  }
  diagnostics.push('✅ Spotify credentials present');

  let token: string;
  try {
    token = await getSpotifyToken();
    diagnostics.push('✅ Spotify token obtained');
  } catch (e: any) {
    diagnostics.push(`❌ Spotify auth failed: ${e.message}`);
    return { artists: [], diagnostics };
  }

  // Strategy: search by year range (no genre filter — 'genre:' is not a valid Spotify search field)
  // Genre filtering happens after we get artist data.
  // Strategy A: year-filtered search for recent tracks
  // Strategy B: browse new releases endpoint (returns curated fresh tracks)
  const allTracks: any[] = [];
  const seenTrackIds = new Set<string>();

  // ── Strategy A: Year-filtered search ──
  const yearQueries = ['year:2025', 'year:2026', 'year:2024'];
  for (const yq of yearQueries) {
    try {
      const searchRes = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(yq)}&type=track&limit=15`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!searchRes.ok) {
        const errText = await searchRes.text().catch(() => '');
        diagnostics.push(`⚠️  Search "${yq}" failed (${searchRes.status}): ${errText.slice(0, 100)}`);
        continue;
      }

      const data = await searchRes.json();
      const items = data.tracks?.items || [];
      diagnostics.push(`🔍 Search "${yq}" → ${items.length} tracks`);

      for (const t of items) {
        if (!seenTrackIds.has(t.id)) {
          seenTrackIds.add(t.id);
          allTracks.push(t);
        }
      }
    } catch (e: any) {
      diagnostics.push(`⚠️  Search error for "${yq}": ${e.message}`);
    }
  }

  // ── Strategy B: Browse new releases ──
  try {
    const newReleasesRes = await fetch(
      `https://api.spotify.com/v1/browse/new-releases?limit=20`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (newReleasesRes.ok) {
      const newData = await newReleasesRes.json();
      const albums = newData.albums?.items || [];
      diagnostics.push(`🔍 Browse new releases → ${albums.length} albums`);
      for (const album of albums) {
        for (const artist of (album.artists || [])) {
          // Add the album's first track as a representative
          // We'll look up the artist directly
          if (!seenTrackIds.has(artist.id + '-album')) {
            seenTrackIds.add(artist.id + '-album');
            allTracks.push({
              id: artist.id + '-album',
              artists: [artist],
              album: album,
              name: album.name,
              external_urls: album.external_urls,
            });
          }
        }
      }
    } else {
      diagnostics.push(`⚠️  New releases request failed: ${newReleasesRes.status}`);
    }
  } catch (e: any) {
    diagnostics.push(`⚠️  New releases error: ${e.message}`);
  }

  diagnostics.push(`📊 Total unique tracks/albums to check: ${allTracks.length}`);

  if (allTracks.length === 0) {
    diagnostics.push('❌ No tracks found from any genre search');
    return { artists: [], diagnostics };
  }

  const artists: DiscoveredArtist[] = [];
  const seen = new Set<string>();
  let skippedFollowers = 0;
  let skippedAi = 0;
  let artistLookupErrors = 0;

  for (const track of allTracks) {
    for (const artist of track.artists) {
      if (seen.has(artist.id)) continue;
      seen.add(artist.id);

      try {
        const artistData = await spotifyGet(`/artists/${artist.id}`);
        const followers = artistData.followers?.total || 0;

        // Accept artists with 10–500k followers (was 50–200k)
        if (followers < 10 || followers > 500000) {
          skippedFollowers++;
          continue;
        }

        const aiSignals = detectAiSignals(artistData, []);
        if (aiSignals >= 2) {
          skippedAi++;
          continue;
        }

        const topTracks = await spotifyGet(`/artists/${artist.id}/top-tracks?market=US`);
        const latestTrack = topTracks.tracks?.[0];

        const socialLinks: Record<string, string> = {};
        if (artistData.external_urls?.spotify) socialLinks.spotify = artistData.external_urls.spotify;

        diagnostics.push(`  ✅ ${artistData.name} — ${followers.toLocaleString()} followers, genres: ${(artistData.genres || []).slice(0,3).join(', ')}`);

        artists.push({
          artist_name: artistData.name,
          spotify_id: artistData.id,
          genres: artistData.genres || [],
          monthly_listeners: followers,
          followers,
          social_links: socialLinks,
          latest_track_name: latestTrack?.name || '',
          latest_track_spotify_url: latestTrack?.external_urls?.spotify || '',
          latest_track_cover_url: latestTrack?.album?.images?.[0]?.url || '',
          latest_release_date: latestTrack?.album?.release_date || '',
          discovery_source: 'spotify_search',
          ai_signals_detected: aiSignals,
          is_ai_artist: false,
        });

        if (artists.length >= limit) break;
      } catch (e: any) {
        artistLookupErrors++;
        diagnostics.push(`  ⚠️  Artist lookup error for ${artist.id}: ${e.message}`);
      }
    }
    if (artists.length >= limit) break;
  }

  diagnostics.push(`📊 Filtered: ${skippedFollowers} by follower count, ${skippedAi} by AI detection, ${artistLookupErrors} artist lookup errors`);
  diagnostics.push(`✅ Discovered ${artists.length} artists`);

  return { artists, diagnostics };
}

// ── Audit ─────────────────────────────────────────────────────────

export interface ArtistAudit {
  spotify_monthly_listeners: number;
  spotify_track_streams: number;
  youtube_video_url: string | null;
  youtube_video_views: number;
  spotify_embed_url: string;
  artist_bio: string;
  recommended_cpm_cents: number;
  recommended_budget_cents: number;
  instagram_handle: string | null;
  instagram_followers: number;
  tiktok_handle: string | null;
  tiktok_followers: number;
  email_address: string | null;
  website_url: string | null;
  hashtags: string[];
  personal_angle: string;
}

export async function auditArtist(spotifyId: string, trackName: string): Promise<ArtistAudit | null> {
  try {
    const artistData = await spotifyGet(`/artists/${spotifyId}`);
    const topTracks = await spotifyGet(`/artists/${spotifyId}/top-tracks?market=US`);

    const latestTrack = topTracks.tracks?.[0];
    const followers = artistData.followers?.total || 0;
    const genres = artistData.genres || [];
    const bio = artistData.name || '';

    // Try YouTube for music video
    let youtubeUrl: string | null = null;
    let youtubeViews = 0;
    const ytKey = process.env.YOUTUBE_API_KEY;
    if (ytKey && latestTrack) {
      try {
        const query = `${artistData.name} ${latestTrack.name} official music video`;
        const ytRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&key=${ytKey}`
        );
        if (ytRes.ok) {
          const ytData = await ytRes.json();
          if (ytData.items?.[0]) {
            youtubeUrl = `https://www.youtube.com/watch?v=${ytData.items[0].id.videoId}`;
          }
        }
      } catch {}
    }

    // Simple personal angle generation from genres + track name
    const personalAngle = genres.length > 0
      ? `The way the ${genres[0]} production hits in "${latestTrack?.name || trackName}" — that's the moment I knew this deserved more ears.`
      : `"${latestTrack?.name || trackName}" stopped me mid-scroll. This track deserves way more than ${followers.toLocaleString()} listeners.`;

    return {
      spotify_monthly_listeners: followers,
      spotify_track_streams: 0, // Not exposed via public API
      youtube_video_url: youtubeUrl,
      youtube_video_views: youtubeViews,
      spotify_embed_url: latestTrack?.external_urls?.spotify || artistData.external_urls?.spotify || '',
      artist_bio: bio,
      recommended_cpm_cents: 10, // $0.10 default
      recommended_budget_cents: 10000, // $100 default
      instagram_handle: null,
      instagram_followers: 0,
      tiktok_handle: null,
      tiktok_followers: 0,
      email_address: null,
      website_url: null,
      hashtags: genres.map((g: string) => `#${g.replace(/\s+/g, '')}`).slice(0, 5),
      personal_angle: personalAngle,
    };
  } catch (e) {
    console.error('Audit failed:', (e as Error).message);
    return null;
  }
}

// ── Outreach Templates ────────────────────────────────────────────

export function renderOutreachMessage(artistName: string, trackName: string, audit: ArtistAudit, campaignUrl: string): string {
  return `Hey ${artistName},

I've been listening to "${trackName}" — ${audit.personal_angle}

I run Selah.fm — a platform where people make TikToks and Reels with your music. You only pay when their videos get verified views. No upfront cost.

Here's the thing: I already made a campaign page for "${trackName}" with your cover art, the music video, and everything:

👉 ${campaignUrl}

It's ready to share with your people. Friends and family can chip in a few dollars to fund it. Anyone can submit a TikTok — even your cousin with 300 followers. You only pay if their video actually gets views.

Claim it whenever you want (takes 30 seconds). Or don't. The page just sits there until you're ready.

— Robert-Jan
  Founder, Selah.fm
  (former musician who got tired of labels taking 98%)`;
}

/**
 * Day-7 follow-up message — sent if artist hasn't claimed after initial outreach.
 * Softer tone, adds social proof if any exists (donations, submissions).
 */
export function renderFollowUpMessage(
  artistName: string,
  trackName: string,
  campaignUrl: string,
  donationCount: number,
  donationTotal: number,
  submissionCount: number,
): string {
  const socialProof: string[] = [];
  if (donationCount > 0) {
    socialProof.push(`${donationCount} ${donationCount === 1 ? 'person has' : 'people have'} chipped in $${donationTotal.toFixed(0)} to support "${trackName}"`);
  }
  if (submissionCount > 0) {
    socialProof.push(`${submissionCount} ${submissionCount === 1 ? 'creator has' : 'creators have'} submitted videos`);
  }
  const proofLine = socialProof.length > 0
    ? `\nSince last week, ${socialProof.join(' and ')} on your campaign page.`
    : '';

  return `Hey ${artistName} — just a quick follow-up.${proofLine}

Your campaign page for "${trackName}" is still live at:
👉 ${campaignUrl}

No pressure at all. The page just keeps working — people can donate, creators can submit videos, and everything runs automatically. You can claim it whenever you want, or not at all.

Either way, your music is out there getting attention. Wanted to make sure you knew.

— Robert-Jan
  Founder, Selah.fm`;
}
