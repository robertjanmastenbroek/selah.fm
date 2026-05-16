/**
 * Streaming link enrichment — finds exact Spotify/Apple Music/YouTube links.
 * 
 * Strategy:
 * 1. Use existing data (latest_track_spotify_url, youtube_video_url, social_links.bandcamp)
 * 2. Fall back to Spotify Search API (client credentials)
 * 3. Fall back to generated search URLs as last resort
 */

import sql from '@/lib/db';

export interface StreamingLinks {
  spotify: string | null;
  appleMusic: string | null;
  youtube: string | null;
  bandcamp: string | null;
  soundcloud: string | null;
}

/**
 * Resolve exact streaming links for an artist + track.
 * Checks existing data first, then uses APIs.
 */
export async function resolveStreamingLinks(
  artistName: string,
  trackName: string,
  existingData: {
    spotifyUrl?: string | null;
    youtubeUrl?: string | null;
    bandcampUrl?: string | null;
  } = {},
): Promise<StreamingLinks> {
  const query = encodeURIComponent(`${artistName} ${trackName}`);

  // Bandcamp — direct from social_links
  const bandcamp = existingData.bandcampUrl || null;

  // YouTube — existing or search
  const youtube = existingData.youtubeUrl 
    || `https://www.youtube.com/results?search_query=${query}`;

  // Spotify — existing direct link or API search or search URL
  let spotify = existingData.spotifyUrl || null;
  if (!spotify) {
    spotify = await searchSpotify(artistName, trackName);
  }
  if (!spotify) {
    spotify = `https://open.spotify.com/search/${query}`;
  }

  // Apple Music — search API or generate search URL
  let appleMusic = await searchAppleMusic(artistName, trackName);
  if (!appleMusic) {
    appleMusic = `https://music.apple.com/search?term=${query}`;
  }

  // SoundCloud — oEmbed or search
  const soundcloud = `https://soundcloud.com/search?q=${query}`;

  return { spotify, appleMusic, youtube, bandcamp, soundcloud };
}

/**
 * Search Spotify for an exact track link.
 * Uses client credentials flow.
 */
async function searchSpotify(artistName: string, trackName: string): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    // Get access token
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenRes.ok) return null;
    const { access_token } = await tokenRes.json();

    // Search for track
    const q = encodeURIComponent(`artist:${artistName} track:${trackName}`);
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${q}&type=track&limit=1`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );

    if (!searchRes.ok) return null;
    const data = await searchRes.json();
    const track = data.tracks?.items?.[0];
    return track?.external_urls?.spotify || null;
  } catch {
    return null;
  }
}

/**
 * Search Apple Music for an exact track link.
 * Uses the public search API (no auth required for basic search).
 */
async function searchAppleMusic(artistName: string, trackName: string): Promise<string | null> {
  try {
    const term = encodeURIComponent(`${artistName} ${trackName}`);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=1`,
    );

    if (!res.ok) return null;
    const data = await res.json();
    const track = data.results?.[0];
    return track?.trackViewUrl || null;
  } catch {
    return null;
  }
}

/**
 * Enrich streaming links for a list of campaigns.
 * Updates the campaigns table with resolved links.
 */
export async function enrichCampaignStreamingLinks(campaignIds: string[]): Promise<number> {
  let enriched = 0;

  for (const campaignId of campaignIds) {
    try {
      const [campaign] = await sql`
        SELECT c.id, c.track_title, 
               COALESCE(u.display_name, da.artist_name) as artist_name,
               da.social_links, da.latest_track_spotify_url,
               c.youtube_video_url
        FROM campaigns c
        LEFT JOIN campaign_claims cc ON cc.campaign_id = c.id
        LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id
        LEFT JOIN users u ON u.id = c.artist_id
        WHERE c.id = ${campaignId}::uuid
      `;

      if (!campaign) continue;

      const socialLinks = typeof campaign.social_links === 'string'
        ? JSON.parse(campaign.social_links)
        : (campaign.social_links || {});

      const links = await resolveStreamingLinks(
        campaign.artist_name || campaign.track_title,
        campaign.track_title,
        {
          spotifyUrl: campaign.latest_track_spotify_url,
          youtubeUrl: campaign.youtube_video_url,
          bandcampUrl: socialLinks.bandcamp,
        },
      );

      // Store in social_links on discovered_artists
      await sql`
        UPDATE discovered_artists
        SET social_links = social_links || ${JSON.stringify({
          spotify: links.spotify,
          apple_music: links.appleMusic,
          youtube: links.youtube,
          bandcamp: links.bandcamp || (socialLinks.bandcamp || null),
          soundcloud: links.soundcloud,
        })}::jsonb
        WHERE id = (SELECT discovered_artist_id FROM campaign_claims WHERE campaign_id = ${campaignId}::uuid LIMIT 1)
      `;

      enriched++;
    } catch {}
  }

  return enriched;
}
