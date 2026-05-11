import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Auth guard middleware.
 * Protects pages that require authentication: admin, dashboard, review, earnings,
 * settings, analytics, onboarding.
 * Lightweight session cookie presence check in Edge Runtime.
 */
const PROTECTED = ['/admin', '/dashboard', '/review', '/earnings', '/settings', '/analytics', '/onboarding'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (!isProtected) return NextResponse.next();

  // Quick check: is there a session cookie at all?
  const cookieHeader = request.headers.get('cookie') || '';
  const hasSession = cookieHeader.includes('session=');

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login?redirect=' + encodeURIComponent(pathname), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/review/:path*', '/earnings/:path*', '/settings/:path*', '/analytics/:path*', '/onboarding/:path*'],
};
