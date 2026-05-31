import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * SEO backfill — adds schema markup, meta descriptions, and fixes publish_at
 * for existing blog posts.
 * 
 * GET /api/cron/seo-backfill?secret=CRON_SECRET
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const results = { schema_added: 0, meta_added: 0, publish_fixed: 0, internal_links: 0 };

  try {
    const posts = await sql`
      SELECT id, title, slug, content_html, excerpt, meta_description, schema_markup, publish_at, published_at, tags
      FROM blog_posts WHERE status = 'published'
      ORDER BY created_at
    `;

    for (const post of posts) {
      // ── 1. Meta description ──────────────────────────────
      if (!post.meta_description || post.meta_description === '') {
        const desc = post.excerpt 
          ? post.excerpt.slice(0, 155).trim() + (post.excerpt.length > 155 ? '…' : '')
          : `${post.title}. Learn more about music promotion, creator earnings, and getting your music heard on Selah.fm.`.slice(0, 155);
        
        await sql`UPDATE blog_posts SET meta_description = ${desc} WHERE id = ${post.id}`;
        results.meta_added++;
      }

      // ── 2. Schema markup (JSON-LD Article + BreadcrumbList) ─
      if (!post.schema_markup || post.schema_markup === 'null') {
        const schema = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.meta_description || post.excerpt || post.title,
          datePublished: post.published_at || post.publish_at || new Date().toISOString(),
          dateModified: new Date().toISOString(),
          author: {
            '@type': 'Person',
            name: 'Robert-Jan Mastenbroek',
            url: 'https://robertjanmastenbroek.com',
          },
          publisher: {
            '@type': 'Organization',
            name: 'Selah.fm',
            logo: {
              '@type': 'ImageObject',
              url: 'https://selah.fm/images/selah-nav-logo.png',
            },
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://selah.fm/blog/${post.slug}`,
          },
        };

        await sql`
          UPDATE blog_posts SET schema_markup = ${JSON.stringify(schema)} WHERE id = ${post.id}
        `;
        results.schema_added++;
      }

      // ── 3. Fix publish_at ────────────────────────────────
      if (!post.publish_at && post.published_at) {
        await sql`
          UPDATE blog_posts SET publish_at = published_at WHERE id = ${post.id}
        `;
        results.publish_fixed++;
      }
    }

    return NextResponse.json({ results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, results }, { status: 500 });
  }
}
