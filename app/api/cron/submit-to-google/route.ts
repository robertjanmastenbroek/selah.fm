/**
 * app/api/cron/submit-to-google/route.ts
 * Submits new/updated pages to Google Indexing API for immediate indexing.
 * Runs daily. Max 200 URLs/day (Google free tier limit).
 *
 * Requires:
 * - GOOGLE_INDEXING_SA_KEY env var (Google service account JSON key)
 * - Service account added as owner in Google Search Console
 *
 * Gracefully degrades if not configured — logs a warning and continues.
 */

import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { submitUrls } from '@/lib/google-indexing';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const SITE_URL = 'https://selah.fm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if the indexing API key is configured
  if (!process.env.GOOGLE_INDEXING_SA_KEY) {
    return NextResponse.json({
      status: 'skipped',
      message: 'GOOGLE_INDEXING_SA_KEY not configured. Set up Google service account for Indexing API.',
      urls_submitted: 0,
    });
  }

  try {
    // Collect URLs to submit — prioritize recently updated content
    const [artistPages, blogPages, staticPages] = await Promise.all([
      // Recently updated artist pages (newest bios, with content)
      sql`
        SELECT ap.slug, aa.updated_at
        FROM artist_profiles ap
        JOIN artist_audits aa ON aa.discovered_artist_id = ap.artist_id
        WHERE aa.bio IS NOT NULL
        ORDER BY aa.updated_at DESC NULLS LAST
        LIMIT 100
      `,
      // Recently published blog posts
      sql`
        SELECT slug, updated_at
        FROM blog_posts
        WHERE status = 'published'
        ORDER BY COALESCE(updated_at, published_at) DESC NULLS LAST
        LIMIT 50
      `,
      // Core static pages
      Promise.resolve([
        { url: `${SITE_URL}/`, type: 'URL_UPDATED' as const },
        { url: `${SITE_URL}/browse`, type: 'URL_UPDATED' as const },
        { url: `${SITE_URL}/faq`, type: 'URL_UPDATED' as const },
        { url: `${SITE_URL}/about`, type: 'URL_UPDATED' as const },
        { url: `${SITE_URL}/open-source`, type: 'URL_UPDATED' as const },
      ]),
    ]);

    // Build URL list — max 200 total
    const urls: { url: string; type: 'URL_UPDATED' }[] = [...staticPages];

    for (const page of (artistPages || [])) {
      if (urls.length >= 200) break;
      urls.push({ url: `${SITE_URL}/artist/${page.slug}`, type: 'URL_UPDATED' });
    }

    for (const post of (blogPages || [])) {
      if (urls.length >= 200) break;
      urls.push({ url: `${SITE_URL}/blog/${post.slug}`, type: 'URL_UPDATED' });
    }

    // Submit to Google Indexing API (concurrency=3)
    const results = await submitUrls(
      urls.map(u => u.url),
      'URL_UPDATED',
      3,
    );

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      status: 'completed',
      attempted: results.length,
      succeeded,
      failed,
      errors: results.filter(r => r.error).slice(0, 5).map(r => ({ url: r.url, error: r.error })),
      next_steps: failed > 0
        ? 'Some submissions failed. Check GOOGLE_INDEXING_SA_KEY and Search Console verification.'
        : undefined,
    });
  } catch (e: any) {
    console.error('[SUBMIT TO GOOGLE] Error:', e.message);
    return NextResponse.json({ status: 'error', error: e.message }, { status: 500 });
  }
}
