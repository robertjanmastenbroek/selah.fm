import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
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

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const result = await sql`
      INSERT INTO users (email, password_hash, user_type, display_name, verification_token)
      VALUES (${email}, ${hashedPassword}, ${userType}, ${displayName}, ${verificationToken})
      RETURNING id
    `;

    const userId = result[0].id;

    // Send verification email via Resend
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const verifyUrl = `https://selah.fm/login?verify=${verificationToken}`;
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: 'Selah.fm <info@selah.fm>',
          to: [email],
          subject: 'Verify your Selah.fm account',
          html: `<div style="font-family:system-ui,sans-serif;color:#F0F0F0;background:#0D0D0D;padding:24px;border-radius:12px;max-width:480px"><h2 style="color:#5B7FFF">Welcome to Selah.fm, ${displayName}!</h2><p style="color:#A0A0A0">Click the button below to verify your email and get started.</p><a href="${verifyUrl}" style="display:inline-block;margin-top:12px;padding:12px 24px;background:#5B7FFF;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Verify email</a><p style="margin-top:24px;font-size:11px;color:#555">— The Selah.fm team</p></div>`,
        }),
      }).catch(() => {});
    }

    // Track referral as pending — bonus is only awarded on actual deposit
    if (refCode) {
      try {
        const referrer = await sql`SELECT id FROM users WHERE email = ${refCode}`;
        if (referrer.length > 0 && referrer[0].id !== userId) {
          await sql`
            INSERT INTO referrals (referrer_id, referred_email, status)
            VALUES (${referrer[0].id}, ${email}, 'pending')
            ON CONFLICT DO NOTHING
          `;
        }
      } catch (refErr) {
        console.error('Referral tracking failed:', refErr);
      }
    }

    // Signup complete
    // Welcome emails are handled externally via Resend

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