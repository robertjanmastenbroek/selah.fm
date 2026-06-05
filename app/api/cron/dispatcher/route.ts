import { NextResponse } from 'next/server';
import sql from '@/lib/db';

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
  8:  [{ path: '/api/cron/blog-pipeline' }, { path: '/api/cron/generate-outreach-videos' }, { path: '/api/cron/refresh-artist-metrics' }],
  9:  [{ path: '/api/cron/email-outreach' }, { path: '/api/cron/welcome-sequence' }, { path: '/api/cron/blog-publish' }],
  10: [{ path: '/api/cron/blog-publish' }, { path: '/api/cron/outreach-followup' }, { path: '/api/cron/indexnow-submit' }],
  11: [{ path: '/api/cron/creator-outreach' }, { path: '/api/cron/reengage' }],
  12: [{ path: '/api/cron/message-notifications' }],
  13: [{ path: '/api/cron/payout-reminder' }],
  14: [{ path: '/api/cron/blog-pipeline' }],
  15: [{ path: '/api/cron/email-outreach' }, { path: '/api/cron/blog-publish' }],
  16: [{ path: '/api/cron/blog-publish' }],
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

  // Parallel execution with concurrency limit — all workers at the same hour are independent
  const BATCH_SIZE = 5;
  for (let i = 0; i < workers.length; i += BATCH_SIZE) {
    const batch = workers.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map(async (w) => {
        const url = w.params 
          ? `${origin}${w.path}?${w.params}&secret=${secret}`
          : `${origin}${w.path}?secret=${secret}`;
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(600000) });
          return { path: w.path, status: res.status, response: await res.json().catch(() => null) };
        } catch (e: any) {
          return { path: w.path, status: 500, error: e.message };
        }
      })
    );
    for (const br of batchResults) {
      if (br.status === 'fulfilled') {
        results.push(br.value);
        // Log failures to cron_failures table
        if (br.value.status >= 400) {
          sql`INSERT INTO cron_failures (worker_path, error_message) VALUES (${br.value.path}, ${br.value.error || `HTTP ${br.value.status}`})`.catch(() => {});
        }
      } else {
        const errMsg = br.reason?.message || 'Batch worker failed';
        results.push({ path: 'unknown', status: 500, error: errMsg });
        sql`INSERT INTO cron_failures (worker_path, error_message) VALUES ('unknown', ${errMsg})`.catch(() => {});
      }
    }
  }

  return NextResponse.json({ utcHour, workers: workers.length, results });
}
