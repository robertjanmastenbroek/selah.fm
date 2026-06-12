/**
 * GET /api/auth/{platform}/callback
 * OAuth callback — validates state, exchanges code, stores connection.
 * Redirects to dashboard on success.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '@/lib/db';
import { exchangeCode, refreshToken, fetchRecentVideos } from '@/lib/oauth';

const VALID_PLATFORMS = ['tiktok', 'youtube', 'instagram'] as const;
type Platform = typeof VALID_PLATFORMS[number];

export async function GET(
  request: Request,
  { params }: { params: { platform: string } }
) {
  const platform = params.platform as Platform;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.redirect(new URL('/dashboard?error=invalid_platform', request.url));
  }
  if (error) {
    return NextResponse.redirect(new URL(`/dashboard?error=${error}&platform=${platform}`, request.url));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard?error=missing_params', request.url));
  }

  // Get user session
  const { getUser } = await import('@/lib/supabase/server');
  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login?redirect=/dashboard', request.url));
  }

  // Validate state (CSRF)
  const cookieStore = cookies();
  const storedState = cookieStore.get(`oauth_state_${platform}`)?.value;
  if (!storedState || !state.startsWith(storedState.split('-')[0])) {
    return NextResponse.redirect(new URL('/dashboard?error=invalid_state', request.url));
  }

  // Extract role from state
  const role = state.includes('-artist') ? 'artist' : 'creator';

  try {
    // Exchange code for tokens
    const tokenData = await exchangeCode(platform, code);

    // Store in DB
    await sql`
      INSERT INTO platform_connections (user_id, platform, role, platform_user_id, platform_username, access_token, refresh_token, token_expires_at, avatar_url)
      VALUES (${user.id}, ${platform}, ${role}, ${tokenData.platformUserId}, ${tokenData.platformUsername}, ${tokenData.accessToken}, ${tokenData.refreshToken || null}, ${tokenData.expiresAt.toISOString()}, ${tokenData.avatarUrl || null})
      ON CONFLICT (user_id, platform) DO UPDATE SET
        platform_user_id = EXCLUDED.platform_user_id,
        platform_username = EXCLUDED.platform_username,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expires_at = EXCLUDED.token_expires_at,
        avatar_url = EXCLUDED.avatar_url,
        role = EXCLUDED.role,
        updated_at = NOW()
    `;

    // If creator: fetch recent videos and create submission records
    if (role === 'creator') {
      try {
        const videos = await fetchRecentVideos(platform, tokenData.accessToken, tokenData.platformUserId);
        for (const video of videos) {
          await sql`
            INSERT INTO submissions (user_id, platform, content_url, title, views_verified, submitted_at, review_status)
            VALUES (${user.id}, ${platform}, ${video.url}, ${video.title}, ${video.viewCount}, ${video.postedAt.toISOString()}, 'approved')
            ON CONFLICT DO NOTHING
          `.catch(() => {}); // Skip duplicates
        }
      } catch {}
    }

    // Clear state cookie
    cookieStore.delete(`oauth_state_${platform}`);

    return NextResponse.redirect(new URL(`/dashboard?connected=${platform}&role=${role}`, request.url));
  } catch (e: any) {
    console.error(`[OAuth] ${platform} callback error:`, e.message);
    return NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(e.message)}`, request.url));
  }
}
