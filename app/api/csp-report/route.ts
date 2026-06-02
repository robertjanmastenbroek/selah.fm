import { NextResponse } from 'next/server';

/**
 * CSP violation report endpoint.
 * Browsers POST violation reports here when Content-Security-Policy-Report-Only detects issues.
 * Logs violations for monitoring — helps tune the CSP before enforcing.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const report = body?.['csp-report'];
    if (report) {
      console.warn('[CSP] Violation:', report['violated-directive'], '—', report['blocked-uri']?.slice(0, 100));
    }
  } catch {
    // Ignore parse errors — browsers send different formats
  }
  return NextResponse.json({ ok: true });
}
