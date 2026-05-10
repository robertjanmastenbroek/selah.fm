import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import crypto from 'crypto';
import { setSessionCookie } from '@/lib/auth';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'selah-salt').digest('hex');
}

export async function POST(request: Request) {
  const rl = rateLimit(getRateLimitKey(request), { maxRequests: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
  }

  const { email, password, name, refCode, type } = await request.json();
  const userType = (type === 'artist') ? 'artist' : 'creator';
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
      VALUES (${email}, ${hashPassword(password)}, ${userType}, ${name || email.split('@')[0]})
    `;

    // Process referral if code present
    if (refCode) {
      try {
        // refCode is the referrer's user email
        const referrer = await sql`SELECT id FROM users WHERE email = ${refCode}`;
        if (referrer.length > 0) {
          const referrerId = referrer[0].id;
          
          // Create referral record
          await sql`
            INSERT INTO referrals (referrer_id, referred_email, status)
            VALUES (${referrerId}, ${email}, 'completed')
            ON CONFLICT DO NOTHING
          `;

          // Add $5 bonus to referrer's first active campaign
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
      const { subject, html } = welcomeEmail(name || email.split('@')[0]);
      sendEmail({ to: email, subject, html });
    } catch {}

    const res = NextResponse.json({ ok: true, redirectTo: '/onboarding' });
    setSessionCookie(res, {
      email,
      type: userType,
      name: name || email.split('@')[0],
    });
    return res;
  } catch (e: any) {
    console.error('Signup error:', e.message);
    return NextResponse.json({ error: 'Database error — try again' }, { status: 500 });
  }
}
