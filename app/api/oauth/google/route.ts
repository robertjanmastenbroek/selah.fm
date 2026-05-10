import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import crypto from 'crypto';
import { setSessionCookie } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=google', request.url));
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_URL || 'https://selah.fm'}/api/oauth/google`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL('/login?error=google', request.url));
    }

    const tokens = await tokenRes.json();

    // Fetch user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(new URL('/login?error=google', request.url));
    }

    const profile = await userRes.json();
    const email = profile.email?.toLowerCase();
    const name = profile.name || email?.split('@')[0] || 'User';
    const picture = profile.picture || '';

    if (!email) {
      return NextResponse.redirect(new URL('/login?error=google', request.url));
    }

    // Find or create user
    let user = await sql`SELECT id, email, display_name, type FROM users WHERE email = ${email}`;

    if (user.length === 0) {
      // Create new user
      const result = await sql`
        INSERT INTO users (email, password_hash, display_name, type, email_verified, photo_url)
        VALUES (${email}, 'google-oauth', ${name}, 'creator', true, ${picture})
        RETURNING id, email, display_name, type
      `;
      user = result;

      // Sync to Resend audience
      try {
        const audienceId = process.env.RESEND_AUDIENCE_ID;
        if (audienceId && process.env.RESEND_API_KEY) {
          fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
            body: JSON.stringify({ email, firstName: name, unsubscribed: false }),
          }).catch(() => {});
        }
      } catch {}
    } else {
      user = user;
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    await sql`UPDATE users SET session_token = ${sessionToken} WHERE id = ${user[0].id}`;

    const response = NextResponse.redirect(new URL('/browse', request.url));
    setSessionCookie(response, {
      id: user[0].id,
      email: user[0].email,
      name: user[0].display_name,
      type: user[0].type,
    });
    return response;
  } catch (e: any) {
    console.error('Google OAuth error:', e.message);
    return NextResponse.redirect(new URL('/login?error=google', request.url));
  }
}
