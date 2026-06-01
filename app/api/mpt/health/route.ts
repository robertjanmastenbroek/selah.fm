import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mpt/health
 * 
 * Pings MPT API to check if it's reachable from this machine.
 * Called by the dashboard to detect local MPT availability.
 * 
 * Returns { ok: true } if MPT is running at localhost:8080.
 */
export async function GET() {
  try {
    const res = await fetch('http://localhost:8080/docs', { signal: AbortSignal.timeout(3000) });
    if (res.ok || res.status === 301) {
      return NextResponse.json({ ok: true, message: 'MPT is running' });
    }
    return NextResponse.json({ ok: false, message: `MPT returned ${res.status}` });
  } catch {
    return NextResponse.json({ ok: false, message: 'MPT not reachable' });
  }
}
