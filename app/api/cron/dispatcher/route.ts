import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Unified cron dispatcher — one cron entry to rule them all.
 * Railway doesn't support */N or comma-separated hours. This single
 * endpoint dispatches to the correct worker based on the current UTC hour.
 * 
 * Runs every hour at :00. Routes based on hour:
 */
const SCHEDULE: Record<number, { name: string; path: string }[]> = {
  0:  [{ name: 'pipeline', path: '/api/cron/outreach-pipeline?limit=50&audit=80&campaigns=30' }, { name: 'creator-outreach', path: '/api/cron/creator-outreach' }],
  3:  [{ name: 'pipeline', path: '/api/cron/outreach-pipeline?limit=50&audit=80&campaigns=30' }, { name: 'email-outreach', path: '/api/cron/email-outreach' }],
  5:  [{ name: 'creator-discovery', path: '/api/cron/creator-discovery' }],
  6:  [{ name: 'pipeline', path: '/api/cron/outreach-pipeline?limit=50&audit=80&campaigns=30' }, { name: 'creator-outreach', path: '/api/cron/creator-outreach' }],
  8:  [{ name: 'blog-pipeline', path: '/api/cron/blog-pipeline' }],
  9:  [{ name: 'pipeline', path: '/api/cron/outreach-pipeline?limit=50&audit=80&campaigns=30' }, { name: 'email-outreach', path: '/api/cron/email-outreach' }, { name: 'welcome-sequence', path: '/api/cron/welcome-sequence' }],
  10: [{ name: 'outreach-followup', path: '/api/cron/outreach-followup' }, { name: 'blog-publish', path: '/api/cron/blog-publish' }],
  11: [{ name: 'creator-discovery', path: '/api/cron/creator-discovery' }, { name: 'reengage', path: '/api/cron/reengage' }],
  12: [{ name: 'pipeline', path: '/api/cron/outreach-pipeline?limit=50&audit=80&campaigns=30' }, { name: 'creator-outreach', path: '/api/cron/creator-outreach' }],
  15: [{ name: 'pipeline', path: '/api/cron/outreach-pipeline?limit=50&audit=80&campaigns=30' }, { name: 'email-outreach', path: '/api/cron/email-outreach' }],
  17: [{ name: 'creator-discovery', path: '/api/cron/creator-discovery' }],
  18: [{ name: 'pipeline', path: '/api/cron/outreach-pipeline?limit=50&audit=80&campaigns=30' }, { name: 'creator-outreach', path: '/api/cron/creator-outreach' }],
  21: [{ name: 'pipeline', path: '/api/cron/outreach-pipeline?limit=50&audit=80&campaigns=30' }, { name: 'email-outreach', path: '/api/cron/email-outreach' }],
  22: [{ name: 'reaudit-emails', path: '/api/admin/outreach?action=reaudit_emails&limit=100' }],
  23: [{ name: 'creator-discovery', path: '/api/cron/creator-discovery' }],
};

/**
 * GET /api/cron/dispatcher
 * Dispatches to the correct cron worker(s) for the current UTC hour.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  const hour = new Date().getUTCHours();

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const queue = SCHEDULE[hour];
  if (!queue || queue.length === 0) {
    return NextResponse.json({ message: `No crons scheduled for hour ${hour} UTC` });
  }

  const results: Record<string, any> = {};
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://selah.fm';

  for (const job of queue) {
    try {
      const url = `${baseUrl}${job.path}${job.path.includes('?') ? '&' : '?'}secret=${encodeURIComponent(secret)}`;
      const res = await fetch(url, {
        headers: { 'X-Cron-Secret': secret },
        signal: AbortSignal.timeout(120000),
      });
      
      let body: any = {};
      try { body = await res.json(); } catch {}
      
      results[job.name] = {
        status: res.status,
        ok: res.ok,
        summary: body.results || body.message || body.error || 'ok',
      };
    } catch (e: any) {
      results[job.name] = { error: e.message };
    }
  }

  return NextResponse.json({ 
    hour_utc: hour, 
    dispatched: queue.length,
    results 
  });
}
