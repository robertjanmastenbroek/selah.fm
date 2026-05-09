import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return NextResponse.json({ user: null });

  try {
    const crypto = require('crypto');
    const [payload, sig] = session.split('.');
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
