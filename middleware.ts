import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { routing } from './i18n/routing';

/**
 * CSRF protection: validates Origin/Referer header on mutation requests.
 */
function csrfProtection(request: NextRequest): NextResponse | null {
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) return null;

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  const allowedOrigins = [
    'https://selah.fm',
    'https://www.selah.fm',
    process.env.NEXT_PUBLIC_URL,
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean) as string[];

  if (origin) {
    const isAllowed = allowedOrigins.some(ao => origin === ao || origin.startsWith(ao + '/'));
    if (!isAllowed) {
      return NextResponse.json({ error: 'CSRF validation failed: invalid origin' }, { status: 403 });
    }
    return null;
  }

  if (referer) {
    const isAllowed = allowedOrigins.some(ao => referer.startsWith(ao));
    if (!isAllowed) {
      return NextResponse.json({ error: 'CSRF validation failed: invalid referer' }, { status: 403 });
    }
    return null;
  }

  return NextResponse.json({ error: 'CSRF validation failed: no origin header on mutation request' }, { status: 403 });
}

// Create the i18n middleware for locale detection
const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // 1. CSRF check
  const csrfResponse = csrfProtection(request);
  if (csrfResponse) return csrfResponse;

  // 2. Locale detection + redirect (next-intl handles Accept-Language + cookie)
  const intlResponse = intlMiddleware(request);
  if (intlResponse) return intlResponse;

  // 3. Supabase session
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // i18n: match all locale-prefixed paths
    '/(en|nl|es|de|fr)/:path*',
  ],
};
