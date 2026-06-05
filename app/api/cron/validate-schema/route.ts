import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const maxDuration = 120;

/**
 * Schema validation cron — checks all page types against Schema.org best practices.
 * Logs errors to cron_failures if any page type has broken schema.
 * Runs weekly.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: { page: string; issues: string[] }[] = [];

  // Check blog posts for schema_markup
  const postsWithoutSchema = await sql`
    SELECT id, title, slug FROM blog_posts
    WHERE status = 'published'
      AND (schema_markup IS NULL OR schema_markup = '{}'::jsonb)
    ORDER BY published_at DESC
    LIMIT 10
  `;
  if (postsWithoutSchema.length > 0) {
    results.push({
      page: 'blog_posts',
      issues: [`${postsWithoutSchema.length} published posts missing schema_markup: ${postsWithoutSchema.map((p: any) => p.title).join(', ')}`],
    });
  }

  // Check blog posts for NewsArticle type in schema
  const postsWithoutNewsArticle = await sql`
    SELECT id, title FROM blog_posts
    WHERE status = 'published'
      AND schema_markup IS NOT NULL
      AND schema_markup::text NOT LIKE '%NewsArticle%'
    ORDER BY published_at DESC
    LIMIT 5
  `;
  if (postsWithoutNewsArticle.length > 0) {
    results.push({
      page: 'blog_schema',
      issues: [`${postsWithoutNewsArticle.length} posts missing NewsArticle type (Google Discover ineligible): ${postsWithoutNewsArticle.map((p: any) => p.title).join(', ')}`],
    });
  }

  // Check blog posts for FAQ schema
  const postsWithoutFaq = await sql`
    SELECT COUNT(*)::int FROM blog_posts
    WHERE status = 'published'
      AND (faq_schema IS NULL OR faq_schema = '[]'::jsonb)
  `;
  if (postsWithoutFaq[0].count > 3) {
    results.push({
      page: 'blog_faq',
      issues: [`${postsWithoutFaq[0].count} published posts missing FAQ schema (People Also Ask eligibility)`],
    });
  }

  // Log failures
  for (const r of results) {
    if (r.issues.length > 0) {
      await sql`
        INSERT INTO cron_failures (worker_path, error_message)
        VALUES ('/api/cron/validate-schema', ${r.issues.join('; ')})
      `;
    }
  }

  return NextResponse.json({
    checked: true,
    results,
    healthy: results.length === 0,
  });
}
