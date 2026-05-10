import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import sql from '@/lib/db';

const ADMIN_EMAILS = ['mastenbroekrobertjan@gmail.com'];

export async function adminMiddleware(request: NextRequest) {
  // Check session cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionMatch = cookieHeader.match(/session=([^;]+)/);
  if (!sessionMatch) {
    return NextResponse.redirect(new URL('/login?redirect=/admin', request.url));
  }

  try {
    const crypto = await import('crypto');
    const [payload, sig] = sessionMatch[1].split('.');
    const secret = process.env.NEXTAUTH_SECRET || 'selah-secret';
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (sig !== expected) {
      return NextResponse.redirect(new URL('/login?redirect=/admin', request.url));
    }

    const session = JSON.parse(Buffer.from(payload, 'base64').toString());
    if (!ADMIN_EMAILS.includes(session.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Attach admin status for downstream use
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login?redirect=/admin', request.url));
  }
}

export function isAdminRequest(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionMatch = cookieHeader.match(/session=([^;]+)/);
  if (!sessionMatch) return false;
  try {
    const [payload] = sessionMatch[1].split('.');
    const session = JSON.parse(Buffer.from(payload, 'base64').toString());
    return ADMIN_EMAILS.includes(session.email);
  } catch { return false; }
}
