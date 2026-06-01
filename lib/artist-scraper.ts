/**
 * Artist Social Scraper — uses crawl4ai for platforms without public APIs.
 * 
 * crawl4ai must be running (Docker on Railway or locally at CRAWL4AI_URL).
 * Falls back gracefully when crawl4ai is unavailable.
 */

const CRAWL4AI_URL = process.env.CRAWL4AI_URL || 'http://localhost:8000';

export interface SocialMetrics {
  platform: string;
  followers: number;
  presence: boolean; // Artist exists on this platform
}

/**
 * Call crawl4ai to scrape a URL and extract structured data.
 */
async function crawl(url: string, selectors?: Record<string, string>): Promise<any> {
  try {
    const res = await fetch(`${CRAWL4AI_URL}/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        urls: [url],
        extract_config: selectors ? { type: 'css', params: { selectors: Object.values(selectors) } } : undefined,
        stealth_mode: true,
        magic: true,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

/**
 * Extract a follower count from text like "1,234 followers" or "12.4K followers".
 */
function parseFollowerCount(text: string): number {
  if (!text) return 0;
  const cleaned = text.replace(/,/g, '').trim();
  
  // Match "12.4K" or "1.2M" format
  const kMatch = cleaned.match(/([\d.]+)\s*K/i);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);
  
  const mMatch = cleaned.match(/([\d.]+)\s*M/i);
  if (mMatch) return Math.round(parseFloat(mMatch[1]) * 1_000_000);
  
  // Plain number
  const numMatch = cleaned.match(/([\d,]+)/);
  if (numMatch) return parseInt(numMatch[1].replace(/,/g, ''), 10);
  
  return 0;
}

/**
 * Scrape Instagram profile for follower count.
 * URL: https://instagram.com/{handle}
 */
export async function scrapeInstagram(handle: string): Promise<SocialMetrics | null> {
  const data = await crawl(`https://www.instagram.com/${handle}/`);
  if (!data?.markdown) return { platform: 'instagram', followers: 0, presence: false };

  // Instagram embeds follower count in meta tags or JSON-LD
  const followerMatch = data.markdown.match(/([\d,.]+[KM]?)\s*followers/i);
  const followers = followerMatch ? parseFollowerCount(followerMatch[1]) : 0;

  return { platform: 'instagram', followers, presence: followers > 0 };
}

/**
 * Scrape TikTok profile for follower count.
 * URL: https://tiktok.com/@{handle}
 */
export async function scrapeTikTok(handle: string): Promise<SocialMetrics | null> {
  const data = await crawl(`https://www.tiktok.com/@${handle}`);
  if (!data?.markdown) return { platform: 'tiktok', followers: 0, presence: false };

  const followerMatch = data.markdown.match(/([\d,.]+[KM]?)\s*Followers/i);
  const followers = followerMatch ? parseFollowerCount(followerMatch[1]) : 0;

  return { platform: 'tiktok', followers, presence: followers > 0 };
}

/**
 * Scrape SoundCloud profile for follower count.
 * URL: https://soundcloud.com/{handle}
 */
export async function scrapeSoundCloud(handle: string): Promise<SocialMetrics | null> {
  const data = await crawl(`https://soundcloud.com/${handle}`);
  if (!data?.markdown) return { platform: 'soundcloud', followers: 0, presence: false };

  const followerMatch = data.markdown.match(/([\d,.]+[KM]?)\s*followers/i);
  const followers = followerMatch ? parseFollowerCount(followerMatch[1]) : 0;

  return { platform: 'soundcloud', followers, presence: followers > 0 };
}

/**
 * Scrape Bandcamp page for fan count.
 * URL: https://{subdomain}.bandcamp.com
 */
export async function scrapeBandcamp(subdomain: string): Promise<SocialMetrics | null> {
  const data = await crawl(`https://${subdomain}.bandcamp.com`);
  if (!data?.markdown) return { platform: 'bandcamp', followers: 0, presence: false };

  const fanMatch = data.markdown.match(/([\d,.]+)\s*fans?/i) || data.markdown.match(/([\d,.]+)\s*followers/i);
  const followers = fanMatch ? parseFollowerCount(fanMatch[1]) : 0;

  return { platform: 'bandcamp', followers, presence: followers > 0 || data.markdown.length > 100 };
}

/**
 * Verify artist presence on a platform via search.
 * Returns true if the artist name appears in search results.
 */
export async function verifyPresence(platform: string, searchUrl: string, artistName: string): Promise<boolean> {
  const url = searchUrl.replace('{name}', encodeURIComponent(artistName));
  const data = await crawl(url);
  if (!data?.markdown) return false;

  // Check if artist name appears in the page content
  return data.markdown.toLowerCase().includes(artistName.toLowerCase());
}

/**
 * Get presence verification URLs for all supported platforms.
 */
export const PRESENCE_CHECKS: Record<string, string> = {
  apple_music: 'https://music.apple.com/search?term={name}',
  amazon_music: 'https://music.amazon.com/search/{name}',
  tidal: 'https://listen.tidal.com/search/{name}',
  pandora: 'https://www.pandora.com/search/{name}/all',
  iheart: 'https://www.iheart.com/search/?q={name}',
  napster: 'https://us.napster.com/search?query={name}',
  anghami: 'https://play.anghami.com/search?q={name}',
  kkbox: 'https://www.kkbox.com/search.php?search={name}',
  netease: 'https://music.163.com/#/search/m/?s={name}',
  qq: 'https://y.qq.com/n/ryqq/search?w={name}',
  yandex: 'https://music.yandex.com/search?text={name}',
  claro: 'https://www.claromusica.com/search/{name}',
  gaana: 'https://gaana.com/search/{name}',
  wynk: 'https://wynk.in/music/search/{name}',
};
