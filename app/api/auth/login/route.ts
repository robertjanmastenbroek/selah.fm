import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { ADMIN_EMAILS } from '@/lib/constants';
import bcrypt from 'bcryptjs';
import { trackLogin } from '@/lib/analytics-server';

export async function POST(request: Request) {
  const rl = rateLimit(getRateLimitKey(request), { maxRequests: 10, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: 'Too many attempts. Try again in a minute.' }, { status: 429 });

  try {
    const { email, password, redirect } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const users = await sql`SELECT id, email, display_name, user_type, is_artist, is_creator, password_hash FROM users WHERE email = ${email.trim().toLowerCase()}`;
    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isAdmin = ADMIN_EMAILS.includes(user.email);

    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.display_name,
      type: user.user_type,
      is_artist: user.is_artist,
      is_creator: user.is_creator,
    };

    // Server-side GA tracking (fire and forget)
    trackLogin('email', user.id).catch(() => {});

    // Resolve redirect target: explicit redirect param > admin default > browse fallback
    const redirectTo = redirect || (isAdmin ? '/admin' : '/browse');

    const response = NextResponse.json({ ok: true, redirectTo });

    // Clear old domain-less cookie variant FIRST (from before the auth fix),
    // THEN set the new domain-scoped session cookie — order matters in case
    // NextResponse internally deduplicates same-name cookies by last-write-wins.
    response.cookies.set('session', '', { maxAge: 0, path: '/' });
    setSessionCookie(response, sessionData);
    return response;
  } catch (e: any) {
    console.error('Login error:', e.message);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
