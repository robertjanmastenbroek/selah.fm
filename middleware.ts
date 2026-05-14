import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * Auth guard middleware.
 * Protects pages that require authentication: admin, dashboard, review, earnings,
 * settings, analytics, onboarding.
 *
 * Validates the HMAC-signed session cookie using the NextRequest cookies API
 * (which works in Edge Runtime, unlike next/headers cookies()).
 */
// Admin auth is now handled by the server component (app/admin/layout.tsx) — 
// removed from middleware protection to avoid double cookie-reading issues.
const PROTECTED = ['/dashboard', '/review', '/earnings', '/settings', '/analytics', '/onboarding'];

function parseCookieInEdge(cookieValue: string) {
  try {
    const parts = cookieValue.split('.');
    if (parts.length !== 2) return null;
    const [payload, sig] = parts;
    if (!payload || !sig) return null;

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) return null;

    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (sig !== expected) return null;

    const user = JSON.parse(Buffer.from(payload, 'base64').toString());
    if (!user.email || !user.type || !user.name) return null;
    return user;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (!isProtected) return NextResponse.next();

  // Validate session cookie using Edge-compatible NextRequest.cookies
  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie?.value) {
    return NextResponse.redirect(new URL('/login?redirect=' + encodeURIComponent(pathname), request.url));
  }

  const session = parseCookieInEdge(sessionCookie.value);
  if (!session) {
    // Invalid cookie — clear both variants (with and without domain)
    const redirect = NextResponse.redirect(new URL('/login?redirect=' + encodeURIComponent(pathname), request.url));
    redirect.cookies.set('session', '', { maxAge: 0, path: '/' });
    redirect.cookies.set('session', '', { maxAge: 0, path: '/', domain: '.selah.fm' });
    return redirect;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/review/:path*', '/earnings/:path*', '/settings/:path*', '/analytics/:path*', '/onboarding/:path*'],
};
