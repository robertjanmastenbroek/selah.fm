import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'crypto';
import { ADMIN_EMAILS } from '@/lib/constants';
import AdminLayoutClient from './AdminLayoutClient';

/**
 * Admin layout — server component.
 * Reads the session cookie server-side (where it's reliably available)
 * and passes isAdmin + email as props to the client component.
 * No client-side fetch to /api/auth/me needed.
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Read session cookie server-side — this runs at request time on the server
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    redirect('/login?redirect=/admin');
  }

  const session = parseSessionCookie(sessionCookie);
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
