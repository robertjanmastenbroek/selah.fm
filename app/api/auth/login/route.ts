import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import crypto from 'crypto';
import { setSessionCookie } from '@/lib/auth';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'selah-salt').digest('hex');
}

export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    const rows = await sql`
      SELECT email, password_hash, user_type, display_name
      FROM users
      WHERE email = ${email}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = rows[0];
    if (user.password_hash !== hashPassword(password)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, type: user.user_type });
    setSessionCookie(res, {
      email: user.email,
      type: user.user_type,
      name: user.display_name,
    });
    return res;
  } catch (e: any) {
    console.error('Login error:', e.message);
    return NextResponse.json({ error: 'Authentication error — try again' }, { status: 500 });
  }
}
