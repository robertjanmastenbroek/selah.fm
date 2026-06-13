/**
 * Background blog publisher — runs a setInterval on the server to publish
 * overdue blog posts automatically, without relying on Railway cron.
 * 
 * Imported from the root layout so it starts when the server boots.
 * Uses globalThis to avoid starting multiple intervals across hot reloads.
 */
import sql from '@/lib/db';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Every 5 minutes
const KEY = '__selah_blog_publisher_started';

export function startBlogPublisher(): void {
  if ((globalThis as any)[KEY]) return;
  (globalThis as any)[KEY] = true;

  if (typeof process === 'undefined' || process.env.NODE_ENV === 'development') {
    return;
  }

  console.log('[blog-publisher] Starting background publisher (every 5min)');

  const check = async () => {
    try {
      const readyPosts = await sql`
        SELECT id, title, slug FROM blog_posts
        WHERE status = 'scheduled' AND publish_at <= NOW()
        ORDER BY publish_at
        LIMIT 10
      `;

      if (readyPosts.length === 0) return;

      for (const post of readyPosts) {
        await sql`
          UPDATE blog_posts
          SET status = 'published', published_at = NOW(), updated_at = NOW()
          WHERE id = ${post.id}
        `;
      }

      console.log(`[blog-publisher] Published ${readyPosts.length} overdue post${readyPosts.length !== 1 ? 's' : ''}: ${readyPosts.map((p: any) => p.title?.slice(0, 40)).join(', ')}`);
    } catch (e: any) {
      console.error('[blog-publisher] Check failed:', e?.message?.slice(0, 200));
    }
  };

  check();
  setInterval(check, CHECK_INTERVAL_MS);
}
