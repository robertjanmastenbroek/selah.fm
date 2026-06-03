import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 600;

/**
 * Cron dispatcher — single Railway cron entry at 0 * * * * routes to all workers.
 * Railway does not support interval or comma-separated cron hours, and limits entries.
 * This dispatcher solves both: 1 entry → 10 workers.
 */

const WORKERS: Record<number, { path: string; params?: string }[]> = {
  // Outreach pipeline paused — 2,563 unclaimed campaigns with zero activity (ROADMAP #8)
  // 0:  [{ path: '/api/cron/outreach-pipeline', params: 'limit=50&audit=80&campaigns=30' }, { path: '/api/cron/creator-outreach' }],
  0:  [{ path: '/api/cron/generate-artist-bios', params: 'limit=100' }],
  1:  [{ path: '/api/cron/archive-activity' }],
  2:  [{ path: '/api/cron/blog-pipeline' }],
  3:  [{ path: '/api/cron/email-outreach' }],
  4:  [{ path: '/api/cron/blog-syndicate' }],
  5:  [{ path: '/api/cron/creator-discovery' }],
  // 6:  [{ path: '/api/cron/outreach-pipeline', params: 'limit=50&audit=80&campaigns=30' }],
  8:  [{ path: '/api/cron/blog-pipeline' }, { path: '/api/cron/generate-outreach-videos' }, { path: '/api/cron/refresh-artist-metrics' }],
  9:  [{ path: '/api/cron/email-outreach' }, { path: '/api/cron/welcome-sequence' }, { path: '/api/cron/blog-publish' }],
  10: [{ path: '/api/cron/blog-publish' }, { path: '/api/cron/outreach-followup' }],
  11: [{ path: '/api/cron/creator-outreach' }, { path: '/api/cron/reengage' }],
  12: [{ path: '/api/cron/message-notifications' }],
  // 12: [{ path: '/api/cron/outreach-pipeline', params: 'limit=50&audit=80&campaigns=30' }],
  14: [{ path: '/api/cron/blog-pipeline' }],
  15: [{ path: '/api/cron/email-outreach' }, { path: '/api/cron/blog-publish' }],
  17: [{ path: '/api/cron/creator-discovery' }],
  // 18: [{ path: '/api/cron/outreach-pipeline', params: 'limit=50&audit=80&campaigns=30' }],
  20: [{ path: '/api/cron/blog-pipeline' }],
  21: [{ path: '/api/cron/email-outreach' }],
  22: [{ path: '/api/admin/outreach', params: 'action=reaudit_emails&limit=100' }],
  23: [{ path: '/api/cron/creator-outreach' }],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const utcHour = new Date().getUTCHours();
  const workers = WORKERS[utcHour] || [];
  const results: { path: string; status: number; response?: any; error?: string }[] = [];

  const origin = 'https://selah.fm';

  for (const w of workers) {
    const url = w.params 
      ? `${origin}${w.path}?${w.params}&secret=${secret}`
      : `${origin}${w.path}?secret=${secret}`;
    
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(300000) });
      results.push({ path: w.path, status: res.status, response: await res.json().catch(() => null) });
    } catch (e: any) {
      results.push({ path: w.path, status: 500, error: e.message });
    }
  }

  return NextResponse.json({ utcHour, workers: workers.length, results });
}
