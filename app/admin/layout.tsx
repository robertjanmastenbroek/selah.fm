import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'crypto';
import { ADMIN_EMAILS } from '@/lib/constants';
import AdminLayoutClient from './AdminLayoutClient';

// Force dynamic rendering — cookies must be read on every request
export const dynamic = 'force-dynamic';

/**
 * Admin layout — server component.
 * Reads the session cookie server-side and passes isAdmin + email as props
 * to the client component. Uses both cookies() and raw Cookie header as
 * fallback to handle domain-scoped cookies on Railway's proxy.
 */

function parseSessionCookie(cookieValue: string) {
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

/** Extract session cookie value from raw Cookie header string */
function getSessionFromRawHeader(rawCookie: string): string | undefined {
  const match = rawCookie.match(/(?:^|;\s*)session=([^;]+)/);
  return match ? match[1] : undefined;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Attempt 1: cookies() from next/headers (standard approach)
  let sessionValue: string | undefined;
  try {
    sessionValue = cookies().get('session')?.value;
  } catch {
    // cookies() can throw in some contexts
  }

  // Attempt 2: raw Cookie header (more reliable on Railway's proxy)
  if (!sessionValue) {
    try {
      const rawCookie = headers().get('cookie') || '';
      sessionValue = getSessionFromRawHeader(rawCookie);
    } catch {
      // headers() can throw in some contexts
    }
  }

  if (!sessionValue) {
    redirect('/login?redirect=/admin');
  }

  const session = parseSessionCookie(sessionValue);
  if (!session) {
    redirect('/login?redirect=/admin');
  }

  const isAdmin = ADMIN_EMAILS.some(
    (a) => a.toLowerCase() === (session.email || '').toLowerCase()
  );

  return (
    <AdminLayoutClient isAdmin={isAdmin} email={session.email || ''}>
      {children}
    </AdminLayoutClient>
  );
}
