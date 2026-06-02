import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

// ── In-memory rate limiter (100 events per IP per minute) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_EVENTS_PER_MINUTE = 100;
const WINDOW_MS = 60_000;

// Periodic cleanup of expired entries (every 5 minutes)
let lastCleanup = Date.now();
function cleanupRateLimitMap() {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return;
  lastCleanup = now;
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}

function checkRateLimit(ip: string): boolean {
  cleanupRateLimitMap();
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_EVENTS_PER_MINUTE) return false;
  entry.count++;
  return true;
}

/**
 * POST /api/analytics/event
 * 
 * Fire-and-forget analytics event tracking.
 * No auth required — client sends events, we record them asynchronously.
 * 
 * Body: { event: string, path: string, metadata?: any }
 * Returns { ok: true } immediately; DB write happens in background.
 */
export async function POST(request: Request) {
  try {
    // ── Rate limit check ──
    const headersList = headers();
    const forwarded = headersList.get('x-forwarded-for');
    const rawIp = forwarded?.split(',')[0]?.trim()
      || headersList.get('x-real-ip')
      || 'unknown';

    if (!checkRateLimit(rawIp)) {
      return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
    }

    // ── Parse body ──
    let body: { event?: string; path?: string; metadata?: any };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }

    const { event, path, metadata } = body;
    if (!event || !path) {
      return NextResponse.json({ ok: false, error: 'event and path required' }, { status: 400 });
    }

    // ── Prepare data ──
    const ipHash = crypto.createHash('sha256').update(rawIp).digest('hex').slice(0, 32);
    const userAgent = (headersList.get('user-agent') || '').slice(0, 500);
    const metadataJson = JSON.stringify(metadata || {});

    // ── Fire-and-forget DB write (do NOT await) ──
    sql`INSERT INTO analytics_events (event, path, metadata, ip_hash, user_agent)
        VALUES (${event}, ${path}, ${metadataJson}::jsonb, ${ipHash}, ${userAgent})`
      .then(() => {}).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[analytics] event error:', e.message);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
