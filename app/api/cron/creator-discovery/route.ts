import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { discoverTikTokCreators, discoverTikTokCreatorsHTTP } from '@/lib/creator-discovery';

export const dynamic = 'force-dynamic';
export const maxDuration = 600; // 10 minutes for Puppeteer scraping

/**
 * Automated creator discovery cron.
 * Scrapes TikTok hashtag pages for creator profiles with emails in bio.
 * Stores discovered creators in discovered_creators table.
 * 
 * GET /api/cron/creator-discovery
 * Optional: ?secret=CRON_SECRET for auth
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const log: string[] = [];
  const results = { discovered: 0, with_email: 0, stored: 0, skipped: 0 };

  try {
    const limit = parseInt(searchParams.get('limit') || '50');
    log.push(`Discovering up to ${limit} TikTok creators...`);

    // Try Puppeteer first, fall back to HTTP scraping
    let creators = await discoverTikTokCreators(limit);
    if (creators.length === 0) {
      log.push('Puppeteer returned 0 — falling back to HTTP scraping...');
      creators = await discoverTikTokCreatorsHTTP(limit);
      log.push(`HTTP fallback: ${creators.length} profiles scraped`);
    }
    results.discovered = creators.length;
    results.with_email = creators.filter(c => c.email_address).length;
    log.push(`Scraped ${creators.length} profiles, ${results.with_email} with email`);

    for (const c of creators) {
      // Skip if already in DB
      const [existing] = await sql`
        SELECT id FROM discovered_creators WHERE username = ${c.username} AND platform = ${c.platform}
      `;
      if (existing) {
        results.skipped++;
        continue;
      }

      const emailConfidence = c.email_address ? 'medium' : 'low';

      await sql`
        INSERT INTO discovered_creators (username, platform, display_name, bio, follower_count, profile_url, email_address, email_source, email_confidence, discovery_hashtag, status)
        VALUES (${c.username}, ${c.platform}, ${c.display_name}, ${c.bio}, ${c.follower_count}, ${c.profile_url}, ${c.email_address || null}, ${c.email_source || null}, ${emailConfidence}, ${c.hashtag || null}, 'discovered')
        ON CONFLICT DO NOTHING
      `;

      results.stored++;
      log.push(`  ✅ ${c.username} (${c.platform})${c.email_address ? ' 📧' : ''}`);
    }

    log.push(`\nDiscovery complete: ${results.discovered} scraped, ${results.stored} new, ${results.skipped} duplicates`);

    return NextResponse.json({ results, log });
  } catch (e: any) {
    log.push(`Creator discovery crashed: ${e.message}`);
    return NextResponse.json({ error: e.message, results, log }, { status: 500 });
  }
}
