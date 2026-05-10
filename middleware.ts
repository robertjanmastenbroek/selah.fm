import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Admin guard middleware.
 * Does a lightweight session cookie presence check in Edge Runtime.
 * Full admin verification happens server-side in the admin layout via /api/auth/me.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) return NextResponse.next();

  // Quick check: is there a session cookie at all?
  const cookieHeader = request.headers.get('cookie') || '';
  const hasSession = cookieHeader.includes('session=');

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login?redirect=' + encodeURIComponent(pathname), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
