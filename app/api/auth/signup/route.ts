import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// In-memory user store (replace with DB in production)
declare global { var __users: Map<string, {email:string, hash:string, type:string, name:string}> | undefined }
const users = (globalThis.__users = globalThis.__users || new Map());

function hashPassword(password: string): string {
  // Simple hash using Node.js crypto — production should use bcrypt
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password + 'sendmusic-salt').digest('hex');
}

function createSession(user: { email: string; type: string; name: string }): string {
  const crypto = require('crypto');
  const payload = Buffer.from(JSON.stringify(user)).toString('base64');
  const sig = crypto.createHmac('sha256', 'sendmusic-secret').update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export async function POST(request: Request) {
  const { email, password, type, name } = await request.json();
  if (!email || !password || !type) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (users.has(email)) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  users.set(email, {
    email,
    hash: hashPassword(password),
    type,
    name: name || email.split('@')[0],
  });

  const session = createSession({ email, type, name: name || email.split('@')[0] });
  const res = NextResponse.json({ ok: true });
  res.cookies.set('session', session, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' });
  return res;
}
