import { NextResponse } from 'next/server';
import sql from '@/lib/db';

/**
 * Daily cron: publishes one scheduled blog post per day at 09:00 UTC.
 * Called by external scheduler (Railway cron, Vercel cron, or health check ping).
 * Protects against duplicate publishes.
 */
export async function GET(request: Request) {
  // Simple secret-based auth for cron
  const auth = request.headers.get('authorization') || '';
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [nextPost] = await sql`
      SELECT id, title, slug FROM blog_posts
      WHERE status = 'scheduled' AND publish_at <= NOW()
      ORDER BY publish_at
      LIMIT 1
    `;

    if (!nextPost) {
      return NextResponse.json({ published: false, message: 'No posts ready to publish' });
    }

    await sql`
      UPDATE blog_posts
      SET status = 'published', published_at = NOW(), updated_at = NOW()
      WHERE id = ${nextPost.id}
    `;

    console.log(`Blog post published: "${nextPost.title}" (${nextPost.slug})`);

    return NextResponse.json({
      published: true,
      post: { title: nextPost.title, slug: nextPost.slug },
    });
  } catch (e: any) {
    console.error('Blog cron error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
