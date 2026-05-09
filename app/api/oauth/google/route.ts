import { NextResponse } from 'next/server';

function createSession(user: { email: string; name: string; picture: string }) {
  const crypto = require('crypto');
  const payload = Buffer.from(JSON.stringify(user)).toString('base64');
  const sig = crypto.createHmac('sha256', process.env.NEXTAUTH_SECRET || 'fallback').update(payload).digest('hex');
  return `${payload}.${sig}`;
}

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
    console.log('Redirecting to Google:', url.substring(0, 150));
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

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const user = await userRes.json();

    console.log('Google login success:', user.email);

    // Create session
    const session = createSession({ email: user.email, name: user.name, picture: user.picture });
    const res = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/browse`);
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
