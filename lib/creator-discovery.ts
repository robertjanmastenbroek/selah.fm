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
  // Load Puppeteer at runtime — not a build dependency
  let puppeteer: any;
  try {
    puppeteer = require('puppeteer-core');
  } catch {
    try { puppeteer = require('puppeteer'); } catch {
      console.log('Creator discovery: puppeteer not available. Install with: npm install puppeteer-core');
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

  // Try @sparticuz/chromium
  try {
    const chromium = require('@sparticuz/chromium');
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
