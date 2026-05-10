import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Google error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=OAuthCallback`);
  }

  // Step 1: No code → redirect to Google
  if (!code) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'GOOGLE_CLIENT_ID not set' }, { status: 500 });
    }
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/oauth/google`;
    const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
    }).toString();
    return NextResponse.redirect(url);
  }

  // Step 2: Got code → exchange for tokens
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/oauth/google`,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokens = await tokenRes.json();
    if (tokens.error) {
      console.error('Token exchange failed:', tokens.error_description || tokens.error);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=OAuthCallback`);
    }

    // Get user info from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userRes.json();
    if (!googleUser.email) {
      console.error('Google returned no email');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=OAuthCallback`);
    }

    // Find or create user in our database
    let isNewUser = false;
    let dbUser: { id: string; user_type: string; display_name: string } | null = null;

    try {
      const existing = await sql`
        SELECT id, user_type, display_name FROM users WHERE email = ${googleUser.email}
      `;

      if (existing.length === 0) {
        isNewUser = true;
        const displayName = googleUser.name || googleUser.email.split('@')[0];
        const result = await sql`
          INSERT INTO users (email, password_hash, user_type, display_name)
          VALUES (${googleUser.email}, 'google-oauth', 'creator', ${displayName})
          RETURNING id
        `;
        dbUser = { id: result[0].id, user_type: 'creator', display_name: displayName };
      } else {
        // Preserve existing user type and name
        dbUser = existing[0];
      }
    } catch (dbErr) {
      console.error('DB insert failed:', dbErr);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=OAuthCallback`);
    }

    if (!dbUser) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=OAuthCallback`);
    }

    // Only send truly new users to onboarding
    const redirectTo = isNewUser ? '/onboarding' : '/browse';
    const res = NextResponse.redirect(`${process.env.NEXTAUTH_URL}${redirectTo}`);
    setSessionCookie(res, {
      id: dbUser.id,
      email: googleUser.email,
      type: dbUser.user_type as 'artist' | 'creator',
      name: dbUser.display_name,
    });
    return res;
  } catch (e) {
    console.error('OAuth error:', e);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=OAuthCallback`);
  }
}