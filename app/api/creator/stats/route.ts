/**
 * GET /api/creator/stats
 * Returns creator stats: connected accounts, TikTok follower count,
 * total posts, verified views, and average views per post.
 * Uses cached TikTok user info + DB submission data.
 */
import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const [connections, [submissionStats]] = await Promise.all([
    sql`SELECT platform, platform_username, platform_user_id, avatar_url FROM platform_connections WHERE user_id = ${user.id}`,
    sql`
      SELECT 
        COUNT(*)::int as total_posts,
        COALESCE(SUM(views_verified), 0)::bigint as total_views,
        COALESCE(SUM(payout_amount_cents), 0)::bigint as total_payout
      FROM submissions WHERE creator_id = ${user.id}
    `,
  ]);

  // Get TikTok follower count from stored API call (or fallback)
  let followerCount = 0;
  const tiktok = connections.find((c: any) => c.platform === 'tiktok');
  
  if (tiktok) {
    try {
      // Refresh token if needed
      let token = tiktok.access_token;
      if (tiktok.token_expires_at && new Date(tiktok.token_expires_at) < new Date() && tiktok.refresh_token) {
        const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_key: process.env.TIKTOK_CLIENT_KEY || '',
            client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
            grant_type: 'refresh_token',
            refresh_token: tiktok.refresh_token,
          }),
        });
        const data = await res.json();
        if (data.access_token) {
          token = data.access_token;
        }
      }

      // Fetch user info from TikTok API
      const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,likes_count,video_count,display_name', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        followerCount = parseInt(userData?.data?.user?.follower_count || '0');
      }
    } catch {}
  }

  const totalPosts = submissionStats?.total_posts || 0;
  const totalViews = parseInt(submissionStats?.total_views || '0');
  const avgViews = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0;

  return NextResponse.json({
    connections: connections.length,
    followerCount,
    totalPosts,
    totalViews,
    avgViews,
  });
}
