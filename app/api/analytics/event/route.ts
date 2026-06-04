import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import sql from '@/lib/db';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/analytics/event
 *
 * Fire-and-forget analytics event tracking with session/user/referrer data.
 * No auth required. Returns immediately; DB write is async.
 *
 * Body: {
 *   event: string ('page_view' | 'cta_click' | 'signup_start' | 'signup_complete' | 'campaign_join_click' | etc)
 *   path: string (current page path)
 *   metadata?: object (extra context like { cta: 'earn_creator', campaign_id: '...' })
 *   session_id?: string (generated client-side, groups user flows)
 *   referrer?: string (document.referrer)
 *   utm_source?: string
 *   utm_medium?: string
 *   utm_campaign?: string
 *   user_id?: string (from /api/auth/me if authenticated)
 * }
 */
export async function POST(request: Request) {
  try {
    const headersList = headers();
    const forwarded = headersList.get('x-forwarded-for');
    const rawIp = forwarded?.split(',')[0]?.trim()
      || headersList.get('x-real-ip')
      || 'unknown';

    // DB-backed rate limit (scales across instances)
    const rl = await rateLimit(getRateLimitKey(request), { maxRequests: 200, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
    }

    let body: any;
    try { body = await request.json(); } catch {
      return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }

    const { event, path, metadata, session_id, referrer, utm_source, utm_medium, utm_campaign, user_id } = body;
    if (!event || !path) {
      return NextResponse.json({ ok: false, error: 'event and path required' }, { status: 400 });
    }

    const ipHash = crypto.createHash('sha256').update(rawIp).digest('hex').slice(0, 32);
    const userAgent = (headersList.get('user-agent') || '').slice(0, 500);
    const metadataJson = JSON.stringify(metadata || {});

    // Fire-and-forget
    sql`
      INSERT INTO analytics_events (event, path, metadata, ip_hash, user_agent, session_id, referrer, utm_source, utm_medium, utm_campaign, user_id)
      VALUES (${event}, ${path}, ${metadataJson}::jsonb, ${ipHash}, ${userAgent}, ${session_id || null}, ${referrer || null}, ${utm_source || null}, ${utm_medium || null}, ${utm_campaign || null}, ${user_id || null})
    `.then(() => {}).catch((e: any) => console.error('Async error in api/analytics/event/route.ts:', e));

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[analytics] event error:', e.message);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
