import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Blog publish cron — publishes scheduled posts when they're due.
 * Called by dispatcher at 09:00, 10:00, and 15:00 UTC.
 * Publishes up to 2 posts per run to clear backlog quickly.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Auth: accept query param (dispatcher style) or headers
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || request.headers.get('authorization')?.replace('Bearer ', '') || '';
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

      // ── Post-publish validation: verify URL returns 200 ──────
      const postUrl = `https://selah.fm/blog/${post.slug}`;
      try {
        const headRes = await fetch(postUrl, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
        if (!headRes.ok) {
          console.error(`[blog-publish] Post ${post.slug} returned ${headRes.status} after publish`);
        }
      } catch (e: any) {
        console.error(`[blog-publish] Post validation failed for ${post.slug}:`, e.message);
      }

      // ── Auto-post to social media (fire-and-forget) ──────────
      const tweetText = `${post.title}\n\n${postUrl}\n\n#musicpromotion #indiemusic #musicians`;
      
      if (process.env.X_BEARER_TOKEN) {
        fetch('https://api.x.com/2/tweets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: tweetText.slice(0, 280) }),
        }).catch(e => console.error('[blog-publish] X post failed:', e.message));
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
