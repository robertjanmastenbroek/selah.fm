import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = getSession(new Request('http://localhost', {
    headers: { cookie: '' },
  }));

  // Use cookies() for server component compatibility
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  
  if (!sessionCookie) return NextResponse.json({ user: null });

  try {
    const crypto = await import('crypto');
    const [payload, sig] = sessionCookie.split('.');
    const expected = crypto
      .createHmac('sha256', process.env.NEXTAUTH_SECRET || 'selah-secret')
      .update(payload)
      .digest('hex');

    if (sig !== expected) return NextResponse.json({ user: null });

    const user = JSON.parse(Buffer.from(payload, 'base64').toString());
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
