import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

// Admin emails — must match lib/constants.ts
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

// Session secret (must match what lib/auth.ts uses)
function getSecret(): string {
  if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET;
  // In dev: any secret works as long as it matches the auth module's auto-gen
  // This won't match across restarts — admin access requires NEXTAUTH_SECRET in production
  return 'selah-secret';
}

function parseSessionCookie(cookieValue: string): { email: string } | null {
  try {
    const [payload, sig] = cookieValue.split('.');
    if (!payload || !sig) return null;

    const expected = crypto
      .createHmac('sha256', getSecret())
      .update(payload)
      .digest('hex');

    if (sig !== expected) return null;
    const user = JSON.parse(Buffer.from(payload, 'base64').toString());
    return user?.email ? { email: user.email } : null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard admin routes
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/session=([^;]+)/);
  if (!match) {
    return NextResponse.redirect(new URL('/login?redirect=' + encodeURIComponent(pathname), request.url));
  }

  const session = parseSessionCookie(match[1]);
  if (!session) {
    return NextResponse.redirect(new URL('/login?redirect=' + encodeURIComponent(pathname), request.url));
  }

  if (!ADMIN_EMAILS.includes(session.email)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
