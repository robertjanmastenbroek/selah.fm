import { NextResponse } from 'next/server';

/**
 * Temporary debug endpoint — shows all cookies and headers the server receives.
 * REMOVE after diagnosing the session cookie issue.
 */
export async function GET(request: Request) {
  const rawCookie = request.headers.get('cookie') || '(empty)';
  
  // Parse individual session cookie from raw header
  const match = rawCookie.match(/(?:^|;\s*)session=([^;]+)/);
  const sessionValue = match ? match[1].substring(0, 30) + '...' : '(not found)';

  return NextResponse.json({
    rawCookieHeader: rawCookie.substring(0, 500),
    sessionCookieFound: !!match,
    sessionValuePreview: sessionValue,
    allHeaders: Object.fromEntries(request.headers.entries()),
  });
}
