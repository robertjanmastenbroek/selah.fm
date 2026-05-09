import { NextResponse } from 'next/server';
import sql from '@/lib/db';

const crypto = require('crypto');

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'selah-salt').digest('hex');
}

function createSession(user: { email: string; type: string; name: string }): string {
  const payload = Buffer.from(JSON.stringify(user)).toString('base64');
  const sig = crypto.createHmac('sha256', process.env.NEXTAUTH_SECRET || 'selah-secret').update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export async function POST(request: Request) {
  const { email, password, name } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    await sql`
      INSERT INTO users (email, password_hash, user_type, display_name)
      VALUES (${email}, ${hashPassword(password)}, 'creator', ${name || email.split('@')[0]})
    `;

    const session = createSession({ email, type: 'creator', name: name || email.split('@')[0] });
    const res = NextResponse.json({ ok: true });
    res.cookies.set('session', session, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: 'Database error — try again' }, { status: 500 });
  }
}
