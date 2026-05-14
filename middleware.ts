import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession, setSessionCookie, clearSessionCookie } from '@/lib/auth';

/**
 * Auth guard middleware.
 * Protects pages that require authentication: admin, dashboard, review, earnings,
 * settings, analytics, onboarding.
 *
 * Validates the HMAC-signed session cookie (not just presence) and renews it with
 * a fresh 7-day maxAge on every request (sliding expiration). Invalid sessions are
 * cleared so the user sees a clean login page instead of a redirect flash.
 */
const PROTECTED = ['/admin', '/dashboard', '/review', '/earnings', '/settings', '/analytics', '/onboarding'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (!isProtected) return NextResponse.next();

  // Validate session — not just cookie presence, but HMAC signature
  const session = getSession(request);

  if (!session) {
    // Invalid or expired session — clear the cookie and send to login
    const redirect = NextResponse.redirect(
      new URL('/login?redirect=' + encodeURIComponent(pathname), request.url)
    );
    clearSessionCookie(redirect);
    return redirect;
  }

  // Valid session — re-set cookie with fresh 7-day expiry (sliding expiration)
  const res = NextResponse.next();
  setSessionCookie(res, session);
  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/review/:path*', '/earnings/:path*', '/settings/:path*', '/analytics/:path*', '/onboarding/:path*'],
};
