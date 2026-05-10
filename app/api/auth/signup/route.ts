import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import bcrypt from 'bcryptjs';
import { setSessionCookie } from '@/lib/auth';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const BCRYPT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

function validatePassword(password: string): string | null {
  if (!password || password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 128) return 'Password must be under 128 characters.';
  return null; // valid
}

function validateEmail(email: string): string | null {
  if (!email || email.length > 254) return 'Invalid email address.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Invalid email address.';
  return null;
}

export async function POST(request: Request) {
  const rl = rateLimit(getRateLimitKey(request), { maxRequests: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
  }

  const { email, password, name, refCode, type } = await request.json();
  const userType = (type === 'artist') ? 'artist' : 'creator';

  // Validate inputs
  const emailErr = validateEmail(email);
  if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 });

  const passwordErr = validatePassword(password);
  if (passwordErr) return NextResponse.json({ error: passwordErr }, { status: 400 });

  if (!name && !email) {
    return NextResponse.json({ error: 'Display name or email is required.' }, { status: 400 });
  }

  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      // Check if this is a Google OAuth user
      const existingUser = await sql`SELECT password_hash FROM users WHERE email = ${email}`;
      if (existingUser[0]?.password_hash === 'google-oauth') {
        return NextResponse.json({ error: 'This email uses Google sign-in. Please continue with Google instead.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const displayName = name || email.split('@')[0];

    const hashedPassword = await hashPassword(password);

    const result = await sql`
      INSERT INTO users (email, password_hash, user_type, display_name)
      VALUES (${email}, ${hashedPassword}, ${userType}, ${displayName})
      RETURNING id
    `;

    const userId = result[0].id;

    // Process referral if code present
    if (refCode) {
      try {
        const referrer = await sql`SELECT id FROM users WHERE email = ${refCode}`;
        if (referrer.length > 0) {
          const referrerId = referrer[0].id;
          await sql`
            INSERT INTO referrals (referrer_id, referred_email, status)
            VALUES (${referrerId}, ${email}, 'completed')
            ON CONFLICT DO NOTHING
          `;
          await sql`
            UPDATE campaigns 
            SET total_budget_cents = total_budget_cents + 500,
                budget_remaining_cents = budget_remaining_cents + 500,
                updated_at = NOW()
            WHERE artist_id = ${referrerId}
              AND status = 'active'
            LIMIT 1
          `;
        }
      } catch (refErr) {
        console.error('Referral processing failed:', refErr);
      }
    }

    // Send welcome email (non-blocking)
    try {
      const { sendEmail, welcomeEmail } = await import('@/lib/email');
      const { subject, html } = welcomeEmail(displayName);
      sendEmail({ to: email, subject, html });
    } catch {}

    const res = NextResponse.json({ ok: true, redirectTo: '/onboarding' });
    setSessionCookie(res, {
      id: userId,
      email,
      type: userType,
      name: displayName,
    });
    return res;
  } catch (e: any) {
    console.error('Signup error:', e.message);
    return NextResponse.json({ error: 'Database error — try again' }, { status: 500 });
  }
}