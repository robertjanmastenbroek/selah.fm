import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');

  const redirectUri = `${process.env.NEXTAUTH_URL || 'https://selah.fm'}/api/connect/callback`;

  switch (platform) {
    // ─── TikTok ──────────────────────────────────────────────────
    case 'tiktok': {
      const clientKey = process.env.TIKTOK_CLIENT_KEY;
      if (!clientKey) {
        return NextResponse.json({ error: 'TikTok not configured. Set TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET.' }, { status: 500 });
      }
      const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=tiktok`;
      return NextResponse.redirect(url);
    }

    // ─── Instagram ───────────────────────────────────────────────
    case 'instagram': {
      const igAppId = process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID;
      if (!igAppId) {
        return NextResponse.json({ error: 'Instagram not configured. Set INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET.' }, { status: 500 });
      }
      const url = `https://api.instagram.com/oauth/authorize?client_id=${igAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile&response_type=code&state=instagram`;
      return NextResponse.redirect(url);
    }

    // ─── YouTube (Google) ────────────────────────────────────────
    case 'youtube': {
      const ytClientId = process.env.YOUTUBE_CLIENT_ID;
      if (!ytClientId) {
        return NextResponse.json({ error: 'YouTube not configured. Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET.' }, { status: 500 });
      }
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${ytClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=https://www.googleapis.com/auth/youtube.readonly&state=youtube&access_type=offline&prompt=consent`;
      return NextResponse.redirect(url);
    }

    // ─── Facebook ────────────────────────────────────────────────
    case 'facebook': {
      const fbAppId = process.env.FACEBOOK_APP_ID || process.env.META_APP_ID;
      if (!fbAppId) {
        return NextResponse.json({ error: 'Facebook not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET.' }, { status: 500 });
      }
      const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=public_profile&state=facebook`;
      return NextResponse.redirect(url);
    }

    default:
      return NextResponse.json({ error: 'Unknown platform. Use: tiktok, instagram, youtube, or facebook.' }, { status: 400 });
  }
}
