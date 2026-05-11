import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import crypto from 'crypto';
import { setSessionCookie } from '@/lib/auth';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';
import { trackSignUp } from '@/lib/analytics-server';

export async function POST(request: Request) {
  const rl = rateLimit(getRateLimitKey(request), { maxRequests: 5, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: 'Too many signup attempts. Try again in a minute.' }, { status: 429 });

  try {
    const { email, password, name, type, refCode } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const validTypes = ['artist', 'creator'];
    const userType = validTypes.includes(type) ? type : 'creator';
    // Everyone gets both roles by default — can create campaigns AND submit to them
    const isArtist = true;
    const isCreator = true;

    // Check for existing user
    const existing = await sql`SELECT id FROM users WHERE email = ${trimmedEmail}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const result = await sql`
      INSERT INTO users (email, password_hash, display_name, user_type, is_artist, is_creator, email_verified, verification_token)
      VALUES (${trimmedEmail}, ${hashedPassword}, ${name.trim().slice(0, 100)}, ${userType}, ${isArtist}, ${isCreator}, false, ${verificationToken})
      RETURNING id, email, display_name, user_type, is_artist, is_creator
    `;

    const user = result[0];

    // Server-side GA tracking (fire and forget)
    trackSignUp('email', user.id).catch(() => {});

    // Process referral
    if (refCode) {
      try {
        const referrer = await sql`SELECT id FROM users WHERE email = ${refCode}`;
        if (referrer.length > 0 && referrer[0].id !== user.id) {
          await sql`
            INSERT INTO referrals (referrer_id, referred_email, status)
            VALUES (${referrer[0].id}, ${trimmedEmail}, 'pending')
            ON CONFLICT DO NOTHING
          `;
        }
      } catch {}
    }

    // Send verification email
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        const verifyUrl = `https://selah.fm/login?verify=${verificationToken}`;
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: 'Selah.fm <info@selah.fm>',
            to: [trimmedEmail],
            subject: 'Verify your Selah.fm account',
            html: `<div style="font-family:system-ui,sans-serif;color:#F0F0F0;background:#0D0D0D;padding:24px;border-radius:12px;max-width:480px"><h2 style="color:#5B7FFF">Welcome to Selah.fm, ${name.trim()}!</h2><p style="color:#A0A0A0">Click below to verify your email address and start using the platform.</p><a href="${verifyUrl}" style="display:inline-block;margin-top:12px;padding:12px 24px;background:#5B7FFF;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Verify email</a><p style="margin-top:24px;font-size:11px;color:#555">If you didn't create this account, ignore this email.</p></div>`,
          }),
        }).catch(() => {});
      }
    } catch {}

    // Session is stateless (HMAC cookie) — no DB token needed
    const redirectTo = userType === 'artist' ? '/onboarding' : '/browse';
    const response = NextResponse.json({ ok: true, type: userType, redirectTo });
    setSessionCookie(response, { id: user.id, email: user.email, name: user.display_name, type: user.user_type, is_artist: user.is_artist, is_creator: user.is_creator });
    return response;
  } catch (e: any) {
    console.error('Signup error:', e.message);
    return NextResponse.json({ error: 'Signup failed. Please try again.' }, { status: 500 });
  }
}
