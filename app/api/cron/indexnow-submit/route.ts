import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const SITE_URL = 'https://selah.fm';
const MAX_URLS = 10_000;

/**
 * IndexNow submission cron — submits newly published pages for immediate indexing.
 *
 * Collects:
 *   - Blog posts published in the last hour
 *   - New artist pages created in the last 24 hours
 *
 * Submits to our internal /api/indexnow endpoint which forwards to IndexNow API.
 * Max 10,000 URLs per submission (IndexNow hard limit).
 *
 * Recommended schedule: runs at 10:00 UTC (after blog-publish at 09:00)
 * via the dispatcher.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || request.headers.get('authorization')?.replace('Bearer ', '') || '';
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const urls: string[] = [];

  try {
    // ── Blog posts published in the last hour ──────────────
    const blogPosts = await sql`
      SELECT slug FROM blog_posts
      WHERE status = 'published'
        AND published_at > NOW() - INTERVAL '1 hour'
      ORDER BY published_at DESC
      LIMIT 100
    `;

    for (const post of blogPosts) {
      urls.push(`${SITE_URL}/blog/${post.slug}`);
    }

    // ── New artist pages created in the last 24 hours ──────
    const newArtists = await sql`
      SELECT ap.slug
      FROM artist_profiles ap
      JOIN discovered_artists da ON da.id = ap.artist_id
      WHERE da.created_at > NOW() - INTERVAL '24 hours'
        AND EXISTS (SELECT 1 FROM artist_tracks WHERE artist_id = da.id AND enabled = true)
      ORDER BY da.created_at DESC
      LIMIT ${MAX_URLS - urls.length}
    `;

    for (const artist of newArtists) {
      urls.push(`${SITE_URL}/artist/${artist.slug}`);
    }

    if (urls.length === 0) {
      return NextResponse.json({
        submitted: 0,
        message: 'No new pages to submit',
      });
    }

    // ── Submit to IndexNow via internal endpoint ──────────
    const response = await fetch(`${SITE_URL}/api/indexnow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({ urls }),
      signal: AbortSignal.timeout(30_000),
    });

    const result = await response.json();

    return NextResponse.json({
      discovered: {
        blog_posts: blogPosts.length,
        artist_pages: newArtists.length,
        total: urls.length,
      },
      submission: result,
    });
  } catch (e: any) {
    console.error('IndexNow submit cron error:', e.message);
    return NextResponse.json({ error: e.message, urls_discovered: urls.length }, { status: 500 });
  }
}
