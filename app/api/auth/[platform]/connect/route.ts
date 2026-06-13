/**
 * GET /api/auth/{platform}/connect?role=creator|artist
 * Initiates OAuth flow — generates state, stores it, redirects to platform.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOAuthUrl } from '@/lib/oauth';

const VALID_PLATFORMS = ['tiktok', 'youtube', 'instagram'] as const;
type Platform = typeof VALID_PLATFORMS[number];

export function GET(
  _request: Request,
  { params }: { params: { platform: string } }
) {
  const platform = params.platform as Platform;
  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: `Invalid platform: ${platform}` }, { status: 400 });
  }

  // Role is determined by the callback (reads user's account type from DB)
  const state = `${crypto.randomUUID()}`;

  // Store state in cookie for CSRF validation on callback
  const cookieStore = cookies();
  cookieStore.set(`oauth_state_${platform}`, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  const url = getOAuthUrl(platform, state);
  return NextResponse.redirect(url);
}
