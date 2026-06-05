import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

/**
 * OAuth callback — handles code exchange for TikTok, Instagram, YouTube, Facebook.
 * Fetches the user's handle/profile and saves it to their Selah.fm profile.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // platform name
  const error = searchParams.get('error');

  if (error) {
    console.error(`${state} OAuth error:`, searchParams.get('error_description'));
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'https://selah.fm'}/onboarding?error=${state}_denied`);
  }

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  // Get current user from session
  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'https://selah.fm'}/login`);
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://selah.fm';
  const redirectUri = `${baseUrl}/api/connect/callback`;

  let handle: string | null = null;

  try {
    switch (state) {
      // ─── TikTok ────────────────────────────────────────────────
      case 'tiktok': {
        const clientKey = process.env.TIKTOK_CLIENT_KEY;
        const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
        if (!clientKey || !clientSecret) {
          return NextResponse.redirect(`${baseUrl}/onboarding?error=tiktok_not_configured`);
        }
        const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_key: clientKey,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
          }).toString(),
        });
        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=display_name,username', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const userData = await userRes.json();
          handle = userData?.data?.user?.username || userData?.data?.user?.display_name || null;
        }
        break;
      }

      // ─── Instagram (via Facebook Graph API) ────────────────────
      case 'instagram': {
        const igAppId = process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID;
        const igAppSecret = process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET;
        if (!igAppId || !igAppSecret) {
          return NextResponse.redirect(`${baseUrl}/onboarding?error=instagram_not_configured`);
        }
        // Exchange for short-lived token
        const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: igAppId,
            client_secret: igAppSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
          }).toString(),
        });
        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          // Get user profile
          const userRes = await fetch(
            `https://graph.instagram.com/me?fields=username&access_token=${tokenData.access_token}`
          );
          const userData = await userRes.json();
          handle = userData?.username || null;
        }
        break;
      }

      // ─── YouTube (Google) ──────────────────────────────────────
      case 'youtube': {
        const ytClientId = process.env.YOUTUBE_CLIENT_ID;
        const ytClientSecret = process.env.YOUTUBE_CLIENT_SECRET;
        if (!ytClientId || !ytClientSecret) {
          return NextResponse.redirect(`${baseUrl}/onboarding?error=youtube_not_configured`);
        }
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: ytClientId,
            client_secret: ytClientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
          }).toString(),
        });
        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          const channelRes = await fetch(
            'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
            { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
          );
          const channelData = await channelRes.json();
          handle = channelData?.items?.[0]?.snippet?.title || null;
        }
        break;
      }

      // ─── Facebook ──────────────────────────────────────────────
      case 'facebook': {
        const fbAppId = process.env.FACEBOOK_APP_ID || process.env.META_APP_ID;
        const fbAppSecret = process.env.FACEBOOK_APP_SECRET || process.env.META_APP_SECRET;
        if (!fbAppId || !fbAppSecret) {
          return NextResponse.redirect(`${baseUrl}/onboarding?error=facebook_not_configured`);
        }
        const tokenRes = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          // Facebook uses GET with query params
        });
        // Facebook exchange via POST
        const fbTokenRes = await fetch(
          `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${fbAppSecret}&code=${code}`
        );
        const fbTokenData = await fbTokenRes.json();
        if (fbTokenData.access_token) {
          const fbUserRes = await fetch(
            `https://graph.facebook.com/me?fields=name&access_token=${fbTokenData.access_token}`
          );
          const fbUserData = await fbUserRes.json();
          handle = fbUserData?.name || null;
        }
        break;
      }
    }
  } catch (e: any) {
    console.error(`${state} token exchange failed:`, e.message);
    return NextResponse.redirect(`${baseUrl}/onboarding?error=${state}_failed`);
  }

  // Save the handle to the user's profile
  if (handle) {
    try {
      const formattedHandle = handle.startsWith('@') ? handle : '@' + handle;
      if (state === 'tiktok') {
        await sql`UPDATE users SET tiktok_handle = ${formattedHandle}, updated_at = NOW() WHERE id = ${user.id}`;
      } else if (state === 'instagram') {
        await sql`UPDATE users SET instagram_handle = ${formattedHandle}, updated_at = NOW() WHERE id = ${user.id}`;
      } else if (state === 'youtube') {
        await sql`UPDATE users SET youtube_handle = ${formattedHandle}, updated_at = NOW() WHERE id = ${user.id}`;
      } else if (state === 'facebook') {
        await sql`UPDATE users SET facebook_handle = ${formattedHandle}, updated_at = NOW() WHERE id = ${user.id}`;
      }
    } catch (dbErr) {
      console.error('Failed to save handle:', dbErr);
    }
  }

  // Redirect back to onboarding with success
  return NextResponse.redirect(`${baseUrl}/onboarding?connected=${state}`);
}
