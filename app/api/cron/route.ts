import { NextResponse } from 'next/server';
import sql from '@/lib/db';

const CRON_SECRET = process.env.CRON_SECRET || '';

// Cron endpoint — runs periodically to update view counts for pending submissions
// Protect with CRON_SECRET to prevent abuse
// Trigger via: curl https://selah.fm/api/cron?secret=YOUR_CRON_SECRET

export async function GET(request: Request) {
  // Auth check
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: string[] = [];
  
  try {
    const subs = await sql`
      SELECT s.id, s.content_url, s.platform, s.views_verified, s.review_status
      FROM submissions s
      WHERE s.review_status IN ('pending', 'approved')
        AND s.content_url NOT LIKE 'direct-hire%'
      LIMIT 50
    `;

    for (const sub of subs) {
      try {
        if (sub.platform === 'youtube') {
          const videoId = extractYtId(sub.content_url);
          if (videoId && process.env.YOUTUBE_API_KEY) {
            const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`;
            const res = await fetch(apiUrl);
            const data = await res.json();
            const views = parseInt(data.items?.[0]?.statistics?.viewCount || '0');
            
            await sql`
              UPDATE submissions 
              SET views_verified = ${views}, views_current = ${views}, updated_at = NOW()
              WHERE id = ${sub.id}
            `;
            results.push(`yt:${sub.id.substring(0,8)} → ${views} views`);
          }
        }
        // TikTok/Instagram remain manual verification for now
      } catch (e: any) {
        results.push(`err:${sub.id.substring(0,8)}: ${e.message}`);
      }
    }

    return NextResponse.json({ 
      checked: subs.length, 
      updated: results.length,
      results: results.slice(0, 20),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function extractYtId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}
