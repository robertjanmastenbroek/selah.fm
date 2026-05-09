import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

declare global { var __users: Map<string, {email:string, hash:string, type:string, name:string}> | undefined }
const users = (globalThis.__users = globalThis.__users || new Map());

function hashPassword(password: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password + 'selah-salt').digest('hex');
}

function createSession(user: { email: string; type: string; name: string }): string {
  const crypto = require('crypto');
  const payload = Buffer.from(JSON.stringify(user)).toString('base64');
  const sig = crypto.createHmac('sha256', 'sendmusic-secret').update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const user = users.get(email);
  if (!user || user.hash !== hashPassword(password)) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const session = createSession({ email: user.email, type: user.type, name: user.name });
  const res = NextResponse.json({ ok: true, type: user.type });
  res.cookies.set('session', session, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' });
  return res;
}
