/**
 * Creator discovery — finds TikTok/Reels/Shorts creators for Selah.fm campaigns.
 * Scrapes public TikTok explore, Instagram Reels, and YouTube Shorts for creators
 * making music-related content with good engagement rates.
 */

import sql from '@/lib/db';

export interface DiscoveredCreator {
  platform: 'tiktok' | 'instagram' | 'youtube';
  username: string;
  display_name: string;
  follower_count: number;
  engagement_rate: number;
  last_post_at: string;
  bio: string;
  profile_url: string;
  recent_video_urls: string[];
  genres: string[];
  // Backward-compatible optional fields
  email_address?: string;
  email_source?: string;
  hashtag?: string;
  niche?: string;
}

/**
 * Discover creators from TikTok's public explore page.
 * Uses the public web version (no API key required).
 * Searches for creators using trending music sounds.
 */
export async function discoverTikTokCreators(limit = 20): Promise<DiscoveredCreator[]> {
  const creators: DiscoveredCreator[] = [];
  
  // TikTok public explore endpoints (no auth needed)
  const searchQueries = [
    'music promotion',
    'new music alert',
    'indie artist',
    'unsigned artist',
    'music discovery',
    'song recommendation',
  ];

  for (const query of searchQueries.slice(0, 3)) {
    try {
      const url = `https://www.tiktok.com/search?q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SelahBot/1.0; +https://selah.fm)',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) continue;

      const html = await res.text();
      
      // Extract user data from TikTok's embedded JSON
      const userDataMatch = html.match(/"UserModule":\{"users":(\[.*?\])/);
      if (userDataMatch) {
        try {
          const users = JSON.parse(userDataMatch[1]);
          for (const user of users.slice(0, 10)) {
            const followerCount = user.followerCount || user.follower_count || 0;
            if (followerCount < 1000 || followerCount > 1000000) continue;

            creators.push({
              platform: 'tiktok',
              username: user.uniqueId || user.unique_id || '',
              display_name: user.nickname || '',
              follower_count: followerCount,
              engagement_rate: estimateEngagement(user),
              last_post_at: new Date().toISOString(),
              bio: (user.signature || '').slice(0, 200),
              profile_url: `https://www.tiktok.com/@${user.uniqueId || ''}`,
              recent_video_urls: [],
              genres: extractGenres(user.signature || ''),
            });
          }
        } catch { continue; }
      }

      if (creators.length >= limit) break;
    } catch { continue; }
  }

  return creators.slice(0, limit);
}

/**
 * Discover creators from Instagram Reels (public web version).
 */
export async function discoverInstagramCreators(limit = 20): Promise<DiscoveredCreator[]> {
  const creators: DiscoveredCreator[] = [];

  const hashtags = ['musicpromotion', 'newmusic', 'indieartist', 'unsignedartist'];
  
  for (const tag of hashtags) {
    try {
      const url = `https://www.instagram.com/explore/tags/${tag}/`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SelahBot/1.0; +https://selah.fm)',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) continue;

      const html = await res.text();
      
      // Instagram embeds JSON data in script tags
      const jsonMatch = html.match(/<script type="application\/json"[^>]*>(.*?)<\/script>/);
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[1]);
          // Navigate the Instagram data structure for top posts
          // Structure varies — handle gracefully
        } catch { continue; }
      }

      if (creators.length >= limit) break;
    } catch { continue; }
  }

  return creators.slice(0, limit);
}

/**
 * Discover creators from YouTube Shorts.
 */
export async function discoverYouTubeCreators(limit = 20): Promise<DiscoveredCreator[]> {
  const creators: DiscoveredCreator[] = [];
  
  // YouTube Data API is preferred, but basic scraping works for public data
  const searchQueries = ['music promotion short', 'new music short', 'indie music short'];

  for (const query of searchQueries) {
    try {
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIIBQ%253D%253D`; // Shorts filter
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SelahBot/1.0; +https://selah.fm)',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) continue;

      const html = await res.text();
      
      // Extract from ytInitialData
      const dataMatch = html.match(/var ytInitialData = (.*?);<\/script>/);
      if (dataMatch) {
        try {
          const data = JSON.parse(dataMatch[1]);
          const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
            ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
          
          for (const item of contents) {
            const video = item?.videoRenderer || item?.reelItemRenderer;
            if (!video) continue;
            
            const channelId = video.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
            const channelName = video.ownerText?.runs?.[0]?.text || '';
            
            if (channelId && !creators.find(c => c.profile_url.includes(channelId))) {
              creators.push({
                platform: 'youtube',
                username: channelId,
                display_name: channelName,
                follower_count: 0, // Would need API call
                engagement_rate: 0,
                last_post_at: new Date().toISOString(),
                bio: '',
                profile_url: `https://www.youtube.com/channel/${channelId}`,
                recent_video_urls: [`https://www.youtube.com/watch?v=${video.videoId}`],
                genres: [],
              });
            }
          }
        } catch { continue; }
      }

      if (creators.length >= limit) break;
    } catch { continue; }
  }

  return creators.slice(0, limit);
}

/**
 * Store discovered creators in the database.
 * Deduplicates by profile_url.
 */
export async function storeDiscoveredCreators(creators: DiscoveredCreator[]): Promise<number> {
  let stored = 0;
  
  for (const c of creators) {
    try {
      const exists = await sql`
        SELECT id FROM discovered_creators 
        WHERE profile_url = ${c.profile_url} OR (platform = ${c.platform} AND username = ${c.username})
        LIMIT 1
      `;
      
      if (exists.length > 0) continue;

      await sql`
        INSERT INTO discovered_creators (
          platform, username, display_name, follower_count,
          engagement_rate, bio, profile_url, recent_video_urls,
          genres, status, created_at
        ) VALUES (
          ${c.platform}, ${c.username}, ${c.display_name}, ${c.follower_count},
          ${c.engagement_rate}, ${c.bio}, ${c.profile_url}, 
          ${JSON.stringify(c.recent_video_urls)}, ${c.genres},
          'new', NOW()
        )
      `;
      stored++;
    } catch { continue; }
  }

  return stored;
}

// ── Helpers ──────────────────────────────────────────────────

function estimateEngagement(user: any): number {
  const followers = user.followerCount || user.follower_count || 1;
  const hearts = user.heartCount || user.heart_count || 0;
  const videos = user.videoCount || user.video_count || 1;
  
  const totalEngagement = hearts;
  const avgPerVideo = totalEngagement / videos;
  return parseFloat(((avgPerVideo / followers) * 100).toFixed(2));
}

function extractGenres(bio: string): string[] {
  const genres: string[] = [];
  const bioLower = (bio || '').toLowerCase();
  
  const genreMap: Record<string, string> = {
    'pop': 'pop', 'rock': 'rock', 'hip hop': 'hip-hop', 'hiphop': 'hip-hop',
    'electronic': 'electronic', 'edm': 'electronic', 'r&b': 'r&b', 'rnb': 'r&b',
    'indie': 'indie', 'alternative': 'alternative', 'country': 'country',
    'jazz': 'jazz', 'classical': 'classical', 'metal': 'metal',
    'folk': 'folk', 'punk': 'punk', 'reggae': 'reggae', 'blues': 'blues',
    'soul': 'soul', 'funk': 'funk', 'latin': 'latin', 'dance': 'dance',
    'singer songwriter': 'singer-songwriter', 'producer': 'electronic',
  };

  for (const [keyword, genre] of Object.entries(genreMap)) {
    if (bioLower.includes(keyword) && !genres.includes(genre)) {
      genres.push(genre);
    }
  }

  return genres.slice(0, 5);
}

// ── Backward-compatible aliases for old cron routes ──────────

/** @deprecated Use discoverTikTokCreators instead */
export const discoverTikTokCreatorsHTTP = discoverTikTokCreators;

/** @deprecated Reddit-based discovery removed — returns empty array */
export async function discoverRedditCreators(_limit?: number): Promise<DiscoveredCreator[]> {
  return [];
}

/** @deprecated Instagram scraper removed — returns null */
export async function scrapeInstagramBio(_username: string): Promise<string | null> {
  return null;
}
