import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import bcrypt from 'bcryptjs';
import { setSessionCookie } from '@/lib/auth';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function POST(request: Request) {
  const rl = rateLimit(getRateLimitKey(request), { maxRequests: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
  }

  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    const rows = await sql`
      SELECT id, email, password_hash, user_type, display_name
      FROM users
      WHERE email = ${email}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = rows[0];

    // Check if this user signed up via Google OAuth
    if (user.password_hash === 'google-oauth') {
      return NextResponse.json({
        error: 'This account uses Google sign-in. Please continue with Google.'
      }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const redirectTo = user.user_type === 'artist' ? '/dashboard' : '/browse';
    const res = NextResponse.json({ ok: true, type: user.user_type, redirectTo });
    setSessionCookie(res, {
      id: user.id,
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