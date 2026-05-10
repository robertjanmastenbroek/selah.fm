import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import crypto from 'crypto';
import { setSessionCookie } from '@/lib/auth';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const rl = rateLimit(getRateLimitKey(request), { maxRequests: 10, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: 'Too many attempts. Try again in a minute.' }, { status: 429 });

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const users = await sql`SELECT id, email, display_name, type, password_hash FROM users WHERE email = ${email.trim().toLowerCase()}`;
    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    await sql`UPDATE users SET session_token = ${sessionToken} WHERE id = ${user.id}`;

    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.display_name,
      type: user.type,
    };

    const response = NextResponse.json({ ok: true, redirectTo: '/browse' });
    setSessionCookie(response, sessionData, sessionToken);
    return response;
  } catch (e: any) {
    console.error('Login error:', e.message);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
