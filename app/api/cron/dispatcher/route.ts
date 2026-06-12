import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 600;

/**
 * Cron dispatcher — single Railway cron entry at 0 * * * * routes to all workers.
 * Railway does not support interval or comma-separated cron hours, and limits entries.
 * This dispatcher solves both: 1 entry → 10 workers.
 */

const WORKERS: Record<number, { path: string; params?: string }[]> = {
  0:  [{ path: '/api/cron/generate-artist-bios', params: 'limit=100' }, { path: '/api/cron/enrich-wikipedia' }],
  1:  [{ path: '/api/cron/archive-activity' }, { path: '/api/cron/scrape-bandcamp' }],
  2:  [{ path: '/api/cron/blog-pipeline' }, { path: '/api/cron/reconcile' }, { path: '/api/cron/extract-colors', params: 'limit=50' }],
  3:  [{ path: '/api/cron/email-outreach' }],
  4:  [{ path: '/api/cron/blog-syndicate' }],
  5:  [{ path: '/api/cron/creator-discovery' }],
  6:  [{ path: '/api/cron/enrich-wikidata', params: 'limit=200' }],
  7:  [{ path: '/api/cron/verify-views' }],
  8:  [{ path: '/api/cron/blog-pipeline' }, { path: '/api/cron/generate-outreach-videos' }, { path: '/api/cron/refresh-artist-metrics' }],
  9:  [{ path: '/api/cron/email-outreach' }, { path: '/api/cron/welcome-sequence' }, { path: '/api/cron/blog-publish' }],
  10: [{ path: '/api/cron/blog-publish' }, { path: '/api/cron/outreach-followup' }, { path: '/api/cron/indexnow-submit' }],
  11: [{ path: '/api/cron/creator-outreach' }, { path: '/api/cron/reengage' }],
  12: [{ path: '/api/cron/message-notifications' }],
  14: [{ path: '/api/cron/blog-pipeline' }],
  15: [{ path: '/api/cron/email-outreach' }, { path: '/api/cron/blog-publish' }],
  17: [{ path: '/api/cron/creator-discovery' }],
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
