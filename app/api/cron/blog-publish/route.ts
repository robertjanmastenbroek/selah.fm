import { NextResponse } from 'next/server';
import sql from '@/lib/db';

/**
 * Daily cron: publishes one scheduled blog post per day at 09:00 UTC.
 * Called by external scheduler (Railway cron, Vercel cron, or health check ping).
 * Protects against duplicate publishes.
 */
export async function GET(request: Request) {
  // Auth via X-Cron-Secret header or Authorization: Bearer
  const secret = request.headers.get('X-Cron-Secret') || request.headers.get('authorization')?.replace('Bearer ', '') || '';
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const readyPosts = await sql`
      SELECT id, title, slug FROM blog_posts
      WHERE status = 'scheduled' AND publish_at <= NOW()
      ORDER BY publish_at
      LIMIT 2
    `;

    if (readyPosts.length === 0) {
      return NextResponse.json({ published: false, message: 'No posts ready to publish' });
    }

    const published: { title: string; slug: string }[] = [];

    for (const post of readyPosts) {
      await sql`
        UPDATE blog_posts
        SET status = 'published', published_at = NOW(), updated_at = NOW()
        WHERE id = ${post.id}
      `;

      // ── Auto-post to social media (fire-and-forget) ──────────
      const postUrl = `https://selah.fm/blog/${post.slug}`;
      const tweetText = `${post.title}\n\n${postUrl}\n\n#musicpromotion #indiemusic #musicians`;
      
      if (process.env.X_BEARER_TOKEN) {
        fetch('https://api.x.com/2/tweets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: tweetText.slice(0, 280) }),
        }).catch(() => {});
      }

      console.log(`Blog post published: "${post.title}" (${post.slug})`);
      published.push({ title: post.title, slug: post.slug });
    }

    return NextResponse.json({
      published: true,
      count: published.length,
      posts: published,
    });
  } catch (e: any) {
    console.error('Blog cron error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
