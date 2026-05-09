import { NextResponse } from 'next/server';

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

  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=OAuthCallback`);
  }

  if (!code) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 });
    }

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/google-auth`;
    const googleUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
    }).toString();

    return NextResponse.redirect(googleUrl);
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/google-auth`,
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
