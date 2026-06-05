import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * CSRF protection: validates Origin/Referer header on mutation requests.
 * Blocks cross-site request forgery by ensuring the request originated from
 * the app's own origin (selah.fm in prod, localhost in dev).
 */
function csrfProtection(request: NextRequest): NextResponse | null {
  // Only protect mutation methods
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) return null;

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  const allowedOrigins = [
    'https://selah.fm',
    'https://www.selah.fm',
    process.env.NEXT_PUBLIC_URL,
    // Allow local dev
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean) as string[];

  // Check Origin header first (more reliable than Referer)
  if (origin) {
    const isAllowed = allowedOrigins.some(ao => origin === ao || origin.startsWith(ao + '/'));
    if (!isAllowed) {
      return NextResponse.json({ error: 'CSRF validation failed: invalid origin' }, { status: 403 });
    }
    return null; // Origin validated
  }

  // Fall back to Referer header
  if (referer) {
    const isAllowed = allowedOrigins.some(ao => referer.startsWith(ao));
    if (!isAllowed) {
      return NextResponse.json({ error: 'CSRF validation failed: invalid referer' }, { status: 403 });
    }
    return null; // Referer validated
  }

  // No Origin or Referer header on a mutation request — reject
  // (browsers always send Origin on cross-site POST requests)
  return NextResponse.json({ error: 'CSRF validation failed: no origin header on mutation request' }, { status: 403 });
}

export async function middleware(request: NextRequest) {
  // Run CSRF check before anything else
  const csrfResponse = csrfProtection(request);
  if (csrfResponse) return csrfResponse;

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
