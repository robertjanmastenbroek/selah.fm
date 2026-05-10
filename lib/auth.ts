import crypto from 'crypto';

const SESSION_SECRET = process.env.NEXTAUTH_SECRET || 'selah-secret';

export interface SessionUser {
  email: string;
  type: 'artist' | 'creator';
  name: string;
}

/**
 * Extract and verify session from request cookies.
 * Uses Next.js cookies() API (reliable on Railway/reverse-proxy setups),
 * falling back to raw cookie header parsing.
 * Returns the user payload if valid, null otherwise.
 */
export function getSession(request: Request): SessionUser | null {
  let sessionCookie: string | undefined;

  // Primary: Next.js cookies() API — handles forwarded headers correctly on Railway
  try {
    const { cookies } = require('next/headers') as typeof import('next/headers');
    sessionCookie = cookies().get('session')?.value;
  } catch {
    // cookies() throws outside of Next.js request context — fall through
  }

  // Fallback: raw cookie header (works everywhere but may miss cookies on some proxies)
  if (!sessionCookie) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/session=([^;]+)/);
    sessionCookie = match ? match[1] : undefined;
  }

  if (!sessionCookie) return null;

  try {
    const [payload, sig] = sessionCookie.split('.');
    const expected = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('hex');

    if (sig !== expected) return null;

    return JSON.parse(Buffer.from(payload, 'base64').toString());
  } catch {
    return null;
  }
}

/**
 * Create a signed session cookie value.
 */
export function createSessionCookie(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString('base64');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('hex');
  return `${payload}.${sig}`;
}

/**
 * Set session cookie on a NextResponse.
 */
export function setSessionCookie(res: NextResponse, user: SessionUser): void {
  res.cookies.set('session', createSessionCookie(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Clear session cookie.
 */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set('session', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
}

// Re-export NextResponse for convenience
import { NextResponse } from 'next/server';
export { NextResponse };
