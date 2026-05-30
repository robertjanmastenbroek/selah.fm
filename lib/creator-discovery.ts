/**
 * Creator Discovery — TikTok + Instagram creator email scraping.
 * 
 * Two modes:
 * 1. Local dev: Uses puppeteer-core (must be installed separately)
 * 2. Production: Returns empty until puppeteer-core is available
 * 
 * Lightweight — no native dependencies required at build time.
 * The heavy Puppeteer/Chromium packages are loaded at runtime only.
 */

// ── Hashtags to search ──────────────────────────────────────────

const TIKTOK_HASHTAGS = [
  'contentcreator', 'ugccreator', 'smallcreator', 'musictok',
  'earnmoneyonline', 'contentcreatortips', 'sidehustle', 'creatoreconomy',
  'newcreator', 'microinfluencer', 'branddeal', 'ugccontent',
];

// ── Types ───────────────────────────────────────────────────────

export interface DiscoveredCreator {
  username: string;
  platform: 'tiktok' | 'instagram';
  display_name?: string;
  bio?: string;
  follower_count?: number;
  niche?: string;
  profile_url?: string;
  email_address?: string;
  email_source?: string;
  hashtag?: string;
}

// ── Helpers ─────────────────────────────────────────────────────

function parseFollowerCount(text: string): number {
  if (!text) return 0;
  const cleaned = text.replace(/,/g, '').trim();
  if (cleaned.endsWith('K'))
    return Math.round(parseFloat(cleaned.replace('K', '')) * 1000);
  if (cleaned.endsWith('M'))
    return Math.round(parseFloat(cleaned.replace('M', '')) * 1000000);
  return parseInt(cleaned) || 0;
}

// ── Main discovery (loads heavy deps at runtime) ────────────────

/**
 * Scrape TikTok hashtag pages for creator profiles.
 * Loads puppeteer-core and Chromium at runtime — not bundled at build time.
 * Returns empty array if dependencies aren't available (e.g. Railway without Chromium).
 */
export async function discoverTikTokCreators(limit: number = 50): Promise<DiscoveredCreator[]> {
  // Load Puppeteer at runtime — try dynamic import first (ESM), then require (CJS)
  let puppeteer: any;
  try {
    const mod = await import('puppeteer-core');
    puppeteer = mod.default || mod;
  } catch {
    try { puppeteer = require('puppeteer-core'); } catch {
      console.log('Creator discovery: puppeteer-core not available.');
      return [];
    }
  }

  // Set up launch options — try system Chrome, then @sparticuz/chromium
  const launchOptions: Record<string, any> = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
    ],
  };

  // Try @sparticuz/chromium (ESM package)
  try {
    const chromium = (await import('@sparticuz/chromium')).default || (await import('@sparticuz/chromium'));
    if (typeof chromium.executablePath === 'function') {
      launchOptions.executablePath = await chromium.executablePath();
      launchOptions.args = chromium.args || launchOptions.args;
    }
  } catch {}

  // Try system Chrome
  if (!launchOptions.executablePath) {
    const paths = [
      process.env.CHROME_PATH,
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/nix/var/nix/profiles/default/bin/chromium',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ].filter(Boolean);
    for (const p of paths) {
      try { require('fs').accessSync(p!, require('fs').constants.X_OK); launchOptions.executablePath = p; break; } catch {}
    }
  }

  // Fallback: let puppeteer use its bundled browser (if available)
  const browser = await puppeteer.launch(launchOptions);
  const allCreators = new Map<string, DiscoveredCreator>();

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    const tags = [...TIKTOK_HASHTAGS].sort(() => Math.random() - 0.5);

    for (const tag of tags) {
      if (allCreators.size >= limit) break;

      try {
        await page.goto(`https://www.tiktok.com/tag/${tag}`, {
          waitUntil: 'networkidle2',
          timeout: 20000,
        });
        await new Promise(r => setTimeout(r, 2000));

        const usernames: string[] = await page.evaluate(() => {
          const links = document.querySelectorAll('a[href*="/@"]');
          const names = new Set<string>();
          links.forEach(a => {
            const match = a.getAttribute('href')?.match(/@([a-zA-Z0-9._]+)/);
            if (match) names.add(match[1]);
          });
          return [...names];
        });

        let scraped = 0;
        for (const username of usernames) {
          if (allCreators.size >= limit) break;
          if (allCreators.has(username)) continue;
          if (scraped >= 15) break;

          try {
            await page.goto(`https://www.tiktok.com/@${username}`, {
              waitUntil: 'networkidle2',
              timeout: 10000,
            });
            await new Promise(r => setTimeout(r, 1000));

            const profile = await page.evaluate(() => {
              const bioEl = document.querySelector('[data-e2e="user-bio"]');
              const bio = bioEl?.textContent?.trim() || '';
              const nameEl = document.querySelector('[data-e2e="user-title"]');
              const displayName = nameEl?.textContent?.trim() || '';
              const followersEl = document.querySelector('[data-e2e="followers-count"]');
              const followers = followersEl?.textContent?.trim() || '';

              const emailMatch = bio.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
              const email = emailMatch ? emailMatch[1].toLowerCase() : null;

              return { bio, displayName, followers, email };
            });

            if (profile.bio || profile.displayName) {
              const creator: DiscoveredCreator = {
                username,
                platform: 'tiktok',
                display_name: profile.displayName || username,
                bio: profile.bio,
                follower_count: parseFollowerCount(profile.followers),
                profile_url: `https://www.tiktok.com/@${username}`,
                hashtag: tag,
              };

              if (profile.email) {
                creator.email_address = profile.email;
                creator.email_source = 'tiktok_bio';
              }

              allCreators.set(username, creator);
              scraped++;
            }
          } catch {}

          await new Promise(r => setTimeout(r, 1500));
        }
      } catch (e: any) {
        console.error(`Hashtag ${tag} error:`, e.message);
      }

      await new Promise(r => setTimeout(r, 2000));
    }
  } finally {
    await browser.close();
  }

  return [...allCreators.values()];
}

// ── Reddit-based creator discovery ──────────────────────────────

const CREATOR_SUBREDDITS = [
  'UGCcreators', 'contentcreators', 'influencermarketing',
  'TikTokCreators', 'CreatorAdvice', 'smallinfluencers',
  'SocialMediaMarketing', 'Creator',
];

/**
 * Discover content creators via Reddit — reliable, no API key needed.
 * Searches creator subreddits for people promoting their content creation services.
 * Extracts TikTok/Instagram handles and any emails in their profiles/posts.
 */
export async function discoverRedditCreators(limit: number = 50): Promise<DiscoveredCreator[]> {
  const creators = new Map<string, DiscoveredCreator>();
  
  const subs = [...CREATOR_SUBREDDITS].sort(() => Math.random() - 0.5);
  
  for (const sub of subs) {
    if (creators.size >= limit) break;
    
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=25&t=week`, {
        headers: { 'User-Agent': 'SelahFM/1.0 (creator discovery)' },
        signal: AbortSignal.timeout(10000),
      });
      
      if (!res.ok) continue;
      const data = await res.json();
      const posts = (data.data?.children || []).map((c: any) => ({
        title: c.data.title,
        selftext: c.data.selftext || '',
        author: c.data.author,
        permalink: `https://reddit.com${c.data.permalink}`,
        flair: c.data.link_flair_text || '',
      }));
      
      for (const post of posts) {
        if (creators.size >= limit) break;
        
        const text = (post.title + ' ' + post.selftext + ' ' + post.flair).toLowerCase();
        
        // Look for TikTok/Instagram handles
        const tiktokMatch = text.match(/(?:tiktok|tt)\s*[:@]\s*@?([a-zA-Z0-9._]{3,30})/i) 
          || text.match(/@([a-zA-Z0-9._]{3,30})\s*(?:on|at)\s*(?:tiktok|tt)/i);
        const igMatch = text.match(/(?:instagram|ig)\s*[:@]\s*@?([a-zA-Z0-9._]{3,30})/i)
          || text.match(/@([a-zA-Z0-9._]{3,30})\s*(?:on|at)\s*(?:instagram|ig)/i);
        
        if (!tiktokMatch && !igMatch) continue;
        
        // Extract email from text
        const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        const email = emailMatch ? emailMatch[1].toLowerCase() : null;
        
        // Determine platform and username
        const platform: 'tiktok' | 'instagram' = tiktokMatch ? 'tiktok' : 'instagram';
        const username = (tiktokMatch || igMatch)?.[1]?.toLowerCase() || '';
        const handle = platform === 'tiktok' ? `@${username}` : `@${username}`;
        
        // Skip bots, mods, deleted
        if (username === 'automoderator' || username === 'deleted' || username.length < 3) continue;
        if (creators.has(username)) continue;
        
        // Extract follower count mentions
        const followerMatch = text.match(/(\d+[kKmM]?)\s*(?:followers|fans|follows)/i);
        let followerCount = 0;
        if (followerMatch) {
          const f = followerMatch[1].toUpperCase();
          if (f.endsWith('K')) followerCount = Math.round(parseFloat(f) * 1000);
          else if (f.endsWith('M')) followerCount = Math.round(parseFloat(f) * 1000000);
          else followerCount = parseInt(f) || 0;
        }
        
        // Extract niche from flair or text
        const nicheMatch = text.match(/(?:niche|focus|specialize)[:\s]+([^.]+)/i);
        const niche = nicheMatch ? nicheMatch[1].trim().slice(0, 50) : '';
        
        const profileUrl = platform === 'tiktok' 
          ? `https://www.tiktok.com/@${username}`
          : `https://www.instagram.com/${username}/`;
        
        const creator: DiscoveredCreator = {
          username,
          platform,
          display_name: post.author !== '[deleted]' ? post.author : handle,
          bio: post.selftext?.slice(0, 200) || '',
          follower_count: followerCount,
          profile_url: profileUrl,
          niche,
          hashtag: `reddit_r_${sub}`,
        };
        
        if (email) {
          creator.email_address = email;
          creator.email_source = 'reddit_post';
        }
        
        creators.set(username, creator);
      }
    } catch (e: any) {
      console.error(`Reddit r/${sub} error:`, e.message);
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  return [...creators.values()];
}

/**
 * Lightweight TikTok profile scraper — extracts embedded JSON data.
 * No browser required. Uses TikTok's internal page data.
 */
export async function scrapeTikTokProfileHTTP(username: string): Promise<{
  bio: string;
  displayName: string;
  followers: number;
  email: string | null;
} | null> {
  try {
    const res = await fetch(`https://www.tiktok.com/@${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) return null;
    const html = await res.text();

    // Extract embedded JSON data (TikTok's __UNIVERSAL_DATA_FOR_REHYDRATION__)
    const jsonMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([^<]+)<\/script>/);
    if (!jsonMatch) return null;

    const data = JSON.parse(jsonMatch[1]);
    const userModule = data?.__DEFAULT_SCOPE__?.['webapp.user-detail'];
    if (!userModule) return null;

    const userInfo = userModule.userInfo;
    const user = userInfo?.user;
    const stats = userInfo?.stats;

    if (!user) return null;

    const bio = user.signature || '';
    const displayName = user.nickname || username;
    const followers = stats?.followerCount || 0;

    // Extract email from bio
    const emailMatch = bio.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const email = emailMatch ? emailMatch[1].toLowerCase() : null;

    return { bio, displayName, followers, email };
  } catch {
    return null;
  }
}

/**
 * Discover TikTok creators via HTTP (no Puppeteer).
 * Uses TikTok's unofficial API + embedded data approach.
 */
export async function discoverTikTokCreatorsHTTP(limit: number = 50): Promise<DiscoveredCreator[]> {
  const tags = [...TIKTOK_HASHTAGS].sort(() => Math.random() - 0.5);
  const allCreators = new Map<string, DiscoveredCreator>();

  for (const tag of tags) {
    if (allCreators.size >= limit) break;

    try {
      // TikTok tag page — extract usernames from embedded data
      const res = await fetch(`https://www.tiktok.com/tag/${tag}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) continue;
      const html = await res.text();

      // Extract unique usernames from the page
      const usernameMatches = html.match(/@"([a-zA-Z0-9._]+)"/g) || [];
      const usernames = [...new Set(usernameMatches.map(m => m.replace(/@"|"/g, '')))];

      let scraped = 0;
      for (const username of usernames) {
        if (allCreators.size >= limit) break;
        if (allCreators.has(username)) continue;
        if (scraped >= 10) break;

        const profile = await scrapeTikTokProfileHTTP(username);
        if (!profile) continue;

        if (profile.bio || profile.displayName) {
          const creator: DiscoveredCreator = {
            username,
            platform: 'tiktok',
            display_name: profile.displayName,
            bio: profile.bio,
            follower_count: profile.followers,
            profile_url: `https://www.tiktok.com/@${username}`,
            hashtag: tag,
          };

          if (profile.email) {
            creator.email_address = profile.email;
            creator.email_source = 'tiktok_bio_http';
          }

          allCreators.set(username, creator);
          scraped++;
        }

        // Rate limit between profile fetches
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (e: any) {
      console.error(`HTTP hashtag ${tag} error:`, e.message);
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  return [...allCreators.values()];
}

/**
 * Scrape Instagram profile bio for email.
 */
export async function scrapeInstagramBio(username: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const html = await res.text();
    const text = html.replace(/<[^>]*>/g, ' ');
    const emails = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);

    if (emails) {
      const valid = [...new Set(emails)].filter(
        e => !e.includes('instagram') && e.length < 50
      );
      return valid[0]?.toLowerCase() || null;
    }
    return null;
  } catch {
    return null;
  }
}
