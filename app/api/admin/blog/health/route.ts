import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

/**
 * GET /api/admin/blog/health
 * 
 * Blog pipeline health check — shows pipeline status, backlog, upcoming posts.
 * Admin-only.
 */
export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  try {
    const [
      [{ count: totalPosts }],
      [{ count: draftPosts }],
      [{ count: scheduledPosts }],
      [{ count: publishedPosts }],
      upcoming,
      recentFailures,
      lastPipelineRun,
    ] = await Promise.all([
      sql`SELECT COUNT(*)::int as count FROM blog_posts`,
      sql`SELECT COUNT(*)::int as count FROM blog_posts WHERE status = 'draft'`,
      sql`SELECT COUNT(*)::int as count FROM blog_posts WHERE status = 'scheduled'`,
      sql`SELECT COUNT(*)::int as count FROM blog_posts WHERE status = 'published'`,
      sql`SELECT id, title, slug, status, publish_at FROM blog_posts WHERE status = 'scheduled' ORDER BY publish_at ASC LIMIT 10`,
      sql`SELECT worker_path, error_message, attempted_at FROM cron_failures WHERE attempted_at > NOW() - INTERVAL '24 hours' ORDER BY attempted_at DESC LIMIT 20`,
      sql`SELECT worker_path, attempted_at FROM cron_failures WHERE worker_path = '/api/cron/blog-pipeline' ORDER BY attempted_at DESC LIMIT 5`,
    ]);

    return NextResponse.json({
      totals: {
        all: totalPosts,
        draft: draftPosts,
        scheduled: scheduledPosts,
        published: publishedPosts,
      },
      upcoming,
      recent_failures_24h: recentFailures,
      last_pipeline_runs: lastPipelineRun,
      pipeline_healthy: recentFailures.length === 0 || recentFailures.every((f: any) => f.worker_path !== '/api/cron/blog-pipeline'),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
