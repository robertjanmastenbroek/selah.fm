/**
 * GET /api/cron/verify-views
 * Fetches latest video stats for all connected creator accounts.
 * Runs hourly via cron dispatcher.
 */
import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { fetchRecentVideos, refreshToken } from '@/lib/oauth';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';

  const isAuthorized = secret === process.env.CRON_SECRET;
  if (!isAuthorized) {
    try {
      const { getUser } = await import('@/lib/supabase/server');
      const user = await getUser();
      if (!user?.email || (!user.email.endsWith('@selah.fm') && !user.email.endsWith('@gmail.com')))
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let updated = 0;
  let errors = 0;

  // Get all creator connections
  const connections = await sql`
    SELECT id, user_id, platform, platform_user_id, access_token, refresh_token, token_expires_at
    FROM platform_connections
    WHERE role = 'creator'
  `;

  for (const conn of connections) {
    try {
      let token = conn.access_token;

      // Refresh if expired
      if (conn.refresh_token && conn.token_expires_at && new Date(conn.token_expires_at) < new Date()) {
        const refreshed = await refreshToken(conn.platform, conn.refresh_token);
        token = refreshed.accessToken;
        await sql`
          UPDATE platform_connections 
          SET access_token = ${refreshed.accessToken}, refresh_token = ${refreshed.refreshToken || conn.refresh_token}, token_expires_at = ${refreshed.expiresAt.toISOString()}, updated_at = NOW()
          WHERE id = ${conn.id}
        `;
      }

      // Fetch recent videos (last 7 days)
      const since = new Date(Date.now() - 7 * 86400000);
      const videos = await fetchRecentVideos(conn.platform, token, conn.platform_user_id, since);

      for (const video of videos) {
        // Update existing submission or create new
        await sql`
          INSERT INTO submissions (user_id, platform, content_url, title, views_verified, submitted_at, review_status)
          VALUES (${conn.user_id}, ${conn.platform}, ${video.url}, ${video.title}, ${video.viewCount}, ${video.postedAt.toISOString()}, 'approved')
          ON CONFLICT (content_url) DO UPDATE SET views_verified = EXCLUDED.views_verified
        `.catch(() => {});
        updated++;
      }
    } catch (e: any) {
      console.error(`[verify-views] ${conn.platform} user ${conn.user_id}:`, e.message);
      errors++;
    }
  }

  return NextResponse.json({
    ok: true,
    connections_processed: connections.length,
    videos_updated: updated,
    errors,
  });
}
