import { NextResponse } from 'next/server';

// This explicit route takes priority over the [...nextauth] catch-all
// Uses the same redirect URI that's already in Google Console

function createSession(user: { email: string; name: string; picture: string }) {
  const crypto = require('crypto');
  const payload = Buffer.from(JSON.stringify({ ...user, type: 'creator' })).toString('base64');
  const sig = crypto.createHmac('sha256', process.env.NEXTAUTH_SECRET || 'fallback').update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // If this is a callback from Google (has code or error param), handle it
  if (code || error) {
    if (error) {
      console.error('Google error:', error);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=OAuthCallback`);
    }

    try {
      // Exchange code for tokens
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code!,
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
          grant_type: 'authorization_code',
        }).toString(),
      });

      const tokens = await tokenRes.json();
      if (tokens.error) {
        console.error('Token exchange failed:', tokens);
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=OAuthCallback`);
      }

      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const user = await userRes.json();

      const session = createSession({ email: user.email, name: user.name, picture: user.picture });
      const res = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard`);
      res.cookies.set('session', session, {
        httpOnly: true, secure: true, sameSite: 'lax', path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      return res;
    } catch (e) {
      console.error('OAuth error:', e);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=OAuthCallback`);
    }
  }

  // Otherwise this is NextAuth trying to render signin page — return 404
  return new NextResponse('Not found', { status: 404 });
}
