import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * POST /api/cron/update-views
 * Refresh view counts for a specific submission.
 * YouTube: YouTube Data API (reliable)
 * TikTok: page scraping (best effort)
 * Instagram: not yet supported
 */
export async function POST(request: Request) {
  const body = await request.json();
  const submissionId = body.submissionId;

  if (!submissionId) {
    return NextResponse.json({ error: 'submissionId required' }, { status: 400 });
  }

  try {
    const [sub] = await sql`
      SELECT id, content_url, platform, views_verified, views_current
      FROM submissions WHERE id = ${submissionId}
    `;

    if (!sub) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    let views = 0;

    if (sub.platform === 'youtube') {
      const videoId = extractYtId(sub.content_url);
      if (videoId && process.env.YOUTUBE_API_KEY) {
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        views = parseInt(data.items?.[0]?.statistics?.viewCount || '0');
      }
    } else if (sub.platform === 'tiktok') {
      views = await fetchTikTokViews(sub.content_url);
    }
    // Instagram: fallback to stored value

    if (views > 0) {
      await sql`
        UPDATE submissions
        SET views_verified = ${views}, views_current = ${views}, updated_at = NOW()
        WHERE id = ${sub.id}
      `;
    }

    return NextResponse.json({
      submissionId: sub.id,
      platform: sub.platform,
      previous_views: sub.views_verified || sub.views_current || 0,
      current_views: views,
      updated: views > 0,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * GET /api/cron/update-views?secret=... 
 * Batch update all pending/approved submissions (cron mode)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const subs = await sql`
      SELECT id, content_url, platform
      FROM submissions
      WHERE review_status IN ('pending', 'approved')
        AND content_url NOT LIKE 'direct-hire%'
      LIMIT 50
    `;

    const results: any[] = [];
    let updated = 0;

    for (const sub of subs) {
      let views = 0;

      if (sub.platform === 'youtube') {
        const videoId = extractYtId(sub.content_url);
        if (videoId && process.env.YOUTUBE_API_KEY) {
          const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`;
          const res = await fetch(apiUrl);
          const data = await res.json();
          views = parseInt(data.items?.[0]?.statistics?.viewCount || '0');
        }
      } else if (sub.platform === 'tiktok') {
        views = await fetchTikTokViews(sub.content_url);
      }

      if (views > 0) {
        await sql`
          UPDATE submissions
          SET views_verified = ${views}, views_current = ${views}, updated_at = NOW()
          WHERE id = ${sub.id}
        `;
        updated++;
        results.push({ id: sub.id.substring(0, 8), platform: sub.platform, views });
      }
    }

    return NextResponse.json({ checked: subs.length, updated, results: results.slice(0, 20) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── Helpers ─────────────────────────────────────────────────────

function extractYtId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

async function fetchTikTokViews(url: string): Promise<number> {
  // Handle vm.tiktok.com short URLs — follow redirect to get full URL
  let fullUrl = url;
  if (url.includes('vm.tiktok.com')) {
    try {
      const redirectRes = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
      const location = redirectRes.headers.get('location');
      if (location) fullUrl = location;
    } catch {}
  }

  // Extract video ID from TikTok URL
  const match = fullUrl.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/i);
  if (!match) return 0;
  const videoId = match[1];

  // Try multiple strategies
  const strategies = [
    // Strategy 1: TikTok page with mobile user agent
    async () => {
      const res = await fetch(`https://www.tiktok.com/@i/video/${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return 0;
      const html = await res.text();
      
      // Look for playCount in the page data
      const playMatch = html.match(/"playCount":(\d+)/);
      if (playMatch) return parseInt(playMatch[1]);
      
      // Try diggCount as fallback
      const diggMatch = html.match(/"diggCount":(\d+)/);
      if (diggMatch) return parseInt(diggMatch[1]);
      
      return 0;
    },
    // Strategy 2: Try with desktop user agent
    async () => {
      const res = await fetch(`https://www.tiktok.com/@i/video/${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return 0;
      const html = await res.text();
      const playMatch = html.match(/"playCount":(\d+)/);
      return playMatch ? parseInt(playMatch[1]) : 0;
    },
  ];

  for (const strategy of strategies) {
    try {
      const result = await strategy();
      if (result > 0) return result;
    } catch {}
  }

  return 0;
}
