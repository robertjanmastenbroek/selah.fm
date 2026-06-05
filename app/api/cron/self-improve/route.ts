import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const maxDuration = 60;

/**
 * Self-improvement loop — analyzes blog post performance and adjusts
 * question sourcing weights to prioritize high-performing topics.
 * 
 * Runs weekly.
 * Only adjusts weights after minimum data threshold is met.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const log: string[] = [];

  // Step 1: Check if we have enough data
  const [{ count: pageViewCount }] = await sql`
    SELECT COUNT(*)::int FROM analytics_events
    WHERE event = 'page_view' AND path LIKE '/blog/%'
      AND created_at > NOW() - INTERVAL '30 days'
  `;

  if (pageViewCount < 100) {
    return NextResponse.json({
      adjusted: false,
      message: `Need 100+ page views to start optimizing (currently ${pageViewCount})`,
      page_views_30d: pageViewCount,
    });
  }

  log.push(`Analyzing ${pageViewCount} blog page views`);

  // Step 2: Find top-performing blog posts by page views
  const topPosts = await sql`
    SELECT 
      ae.path,
      bp.id as post_id,
      bp.title,
      bp.tags,
      bp.primary_keyword,
      COUNT(*)::int as views
    FROM analytics_events ae
    JOIN blog_posts bp ON bp.slug = REPLACE(ae.path, '/blog/', '')
    WHERE ae.event = 'page_view'
      AND ae.path LIKE '/blog/%'
      AND ae.created_at > NOW() - INTERVAL '30 days'
    GROUP BY ae.path, bp.id, bp.title, bp.tags, bp.primary_keyword
    ORDER BY views DESC
    LIMIT 20
  `;

  // If we have posts with views, categorize them
  const categoryPerformance: Record<string, { views: number; posts: number }> = {};
  
  for (const post of topPosts) {
    const tags: string[] = post.tags || [];
    const categories = [
      ...tags,
      post.primary_keyword || '',
    ].filter(Boolean);

    for (const cat of categories) {
      if (!categoryPerformance[cat]) {
        categoryPerformance[cat] = { views: 0, posts: 0 };
      }
      categoryPerformance[cat].views += post.views;
      categoryPerformance[cat].posts += 1;
    }
  }

  // Step 3: Store performance data for the question sourcing system
  // This data gets picked up by /api/cron/source-questions to adjust weights
  const sorted = Object.entries(categoryPerformance)
    .sort((a, b) => b[1].views - a[1].views)
    .slice(0, 20);

  for (const [category, perf] of sorted) {
    log.push(`  ${category}: ${perf.views} views across ${perf.posts} posts`);
  }

  // Store in a blog_analytics table for the sourcing system
  await sql`
    INSERT INTO blog_analytics (data_type, data, collected_at)
    VALUES ('category_performance', ${JSON.stringify(sorted)}, NOW())
  `;

  return NextResponse.json({
    adjusted: true,
    total_page_views_30d: pageViewCount,
    top_categories: sorted.length,
    categories: sorted.slice(0, 10),
    log,
  });
}
