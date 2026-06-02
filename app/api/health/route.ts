import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Health check endpoint — used by Railway and monitoring tools.
 * Returns database connectivity, last cron activity, and platform stats.
 */
export async function GET() {
  const health: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };

  // Database connectivity
  try {
    const [dbCheck] = await sql`SELECT 1 as ok`;
    health.db = dbCheck?.ok === 1 ? 'connected' : 'error';
  } catch {
    health.db = 'disconnected';
    health.status = 'degraded';
  }

  // Last cron activity (most recent blog post or campaign)
  try {
    const [lastBlog] = await sql`SELECT created_at FROM blog_posts ORDER BY created_at DESC LIMIT 1`;
    const [lastCampaign] = await sql`SELECT created_at FROM campaigns ORDER BY created_at DESC LIMIT 1`;
    const [lastSubmission] = await sql`SELECT created_at FROM submissions ORDER BY created_at DESC LIMIT 1`;

    health.lastActivity = {
      blogPost: lastBlog?.created_at?.toISOString?.() || null,
      campaign: lastCampaign?.created_at?.toISOString?.() || null,
      submission: lastSubmission?.created_at?.toISOString?.() || null,
    };
  } catch {
    health.lastActivity = { error: 'unavailable' };
  }

  // Quick stats
  try {
    const [users] = await sql`SELECT count(*)::int as c FROM users`;
    const [submissions] = await sql`SELECT count(*)::int as c FROM submissions`;
    health.stats = {
      users: users?.c || 0,
      submissions: submissions?.c || 0,
    };
  } catch {
    // non-critical
  }

  const statusCode = health.status === 'degraded' ? 503 : 200;
  return NextResponse.json(health, { status: statusCode });
}
