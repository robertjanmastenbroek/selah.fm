import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // platform name

  if (!code) {
    return NextResponse.json({ error: 'No auth code' }, { status: 400 });
  }

  // Exchange code for token — platform-specific
  // In production, store refresh token in DB
  console.log(`Connected ${state}: code=${code.substring(0, 10)}...`);

  return NextResponse.redirect(
    `${process.env.NEXTAUTH_URL || 'https://sendmusic-io-production.up.railway.app'}/analytics?connected=${state}`
  );
}
