import { NextResponse } from 'next/server';

// TikTok OAuth config (set in Railway env vars)
const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || '';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');

  const redirectUri = `${process.env.NEXTAUTH_URL || 'https://selah-fm-production.up.railway.app'}/api/connect/callback`;

  switch (platform) {
    case 'tiktok':
      if (!TIKTOK_CLIENT_KEY) {
        return NextResponse.json({ error: 'TikTok not configured' }, { status: 500 });
      }
      const tiktokUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${redirectUri}&state=tiktok`;
      return NextResponse.redirect(tiktokUrl);

    case 'instagram':
      const igAppId = process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID;
      if (!igAppId) return NextResponse.json({ error: 'Instagram not configured' }, { status: 500 });
      const igUrl = `https://api.instagram.com/oauth/authorize?client_id=${igAppId}&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code&state=instagram`;
      return NextResponse.redirect(igUrl);

    case 'youtube':
      const ytClientId = process.env.YOUTUBE_CLIENT_ID;
      if (!ytClientId) return NextResponse.json({ error: 'YouTube not configured' }, { status: 500 });
      const ytUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${ytClientId}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/youtube.readonly&state=youtube&access_type=offline`;
      return NextResponse.redirect(ytUrl);

    default:
      return NextResponse.json({ error: 'Unknown platform' }, { status: 400 });
  }
}
