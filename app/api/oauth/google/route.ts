import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';
import { trackSignUp, trackLogin } from '@/lib/analytics-server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://selah.fm';

  // No code = user clicked "Continue with Google" — redirect them to Google's consent screen
  if (!code) {
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID || '');
    googleAuthUrl.searchParams.set('redirect_uri', `${baseUrl}/api/oauth/google`);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'consent');
    return NextResponse.redirect(googleAuthUrl);
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
      const errBody = await tokenRes.text();
      console.error('Google token exchange failed:', tokenRes.status, errBody.slice(0, 200));
      return NextResponse.redirect(new URL('/login?error=google', baseUrl));
    }

    const tokens = await tokenRes.json();

    // Fetch user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      const errBody = await userRes.text();
      console.error('Google userinfo fetch failed:', userRes.status, errBody.slice(0, 200));
      return NextResponse.redirect(new URL('/login?error=google', baseUrl));
    }

    const profile = await userRes.json();
    const email = profile.email?.toLowerCase();
    const name = profile.name || email?.split('@')[0] || 'User';
    const picture = profile.picture || '';

    if (!email) {
      return NextResponse.redirect(new URL('/login?error=google', baseUrl));
    }

    // Find or create user
    let user = await sql`SELECT id, email, display_name, user_type, is_artist, is_creator, profile_image_url FROM users WHERE email = ${email}`;

    if (user.length === 0) {
      // Create new user — everyone gets both roles by default
      const result = await sql`
        INSERT INTO users (email, password_hash, display_name, user_type, is_artist, is_creator, email_verified, profile_image_url)
        VALUES (${email}, 'google-oauth', ${name}, 'creator', true, true, true, ${picture})
        RETURNING id, email, display_name, user_type, is_artist, is_creator
      `;
      user = result;

      // Server-side GA tracking for new signup
      trackSignUp('google', user[0].id).catch(() => {});

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
      // Existing user: auto-import Google profile picture if they don't have one yet
      if (picture && !user[0].profile_image_url) {
        await sql`UPDATE users SET profile_image_url = ${picture}, updated_at = NOW() WHERE id = ${user[0].id}`;
      }
      // Server-side GA tracking for returning user login
      trackLogin('google', user[0].id).catch(() => {});
    }

    // Session is stateless (HMAC cookie) — no DB token needed
    const response = NextResponse.redirect(new URL('/browse', baseUrl));
    // Clear old cookie variant (no domain) so it doesn't conflict
    response.cookies.set('session', '', { maxAge: 0, path: '/' });
    setSessionCookie(response, {
      id: user[0].id,
      email: user[0].email,
      name: user[0].display_name,
      type: user[0].user_type,
      is_artist: user[0].is_artist,
      is_creator: user[0].is_creator,
    });
    return response;
  } catch (e: any) {
    console.error('Google OAuth error:', e.message);
    return NextResponse.redirect(new URL('/login?error=google', baseUrl));
  }
}
