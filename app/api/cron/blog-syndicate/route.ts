import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const REDDIT_SUBREDDITS: Record<string, { name: string; category: string }[]> = {
  music_promotion: [
    { name: 'musicmarketing', category: 'music_promotion' },
    { name: 'WeAreTheMusicMakers', category: 'music_promotion' },
  ],
  creator_income: [
    { name: 'sidehustle', category: 'creator_income' },
    { name: 'contentcreation', category: 'creator_income' },
  ],
  general: [
    { name: 'indiemusic', category: 'general' },
    { name: 'independentmusic', category: 'general' },
  ],
};

function categorizePost(tags: string[], title: string): string {
  const lower = title.toLowerCase();
  if (tags.some(t => ['creator-income', 'creator-earnings', 'cpm'].includes(t)) ||
      lower.includes('earn') || lower.includes('cpm') || lower.includes('creator')) {
    return 'creator_income';
  }
  if (tags.some(t => ['music-promotion', 'promotion', 'marketing'].includes(t)) ||
      lower.includes('promot') || lower.includes('market')) {
    return 'music_promotion';
  }
  return 'general';
}

/**
 * Cron: auto-syndicates newly published blog posts to Reddit.
 * Runs every 2 hours. Posts to 2-3 relevant subreddits per post.
 * Stays below spam threshold: max 3 posts/day total.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check daily limit: max 3 Reddit posts/day
  const [{ count: todayCount }] = await sql`
    SELECT COUNT(*)::int FROM blog_syndication_log
    WHERE platform = 'reddit' AND created_at > CURRENT_DATE
  `;
  if (todayCount >= 3) {
    return NextResponse.json({ posted: 0, message: 'Daily Reddit limit reached (3/day)' });
  }

  // Find recently published posts that haven't been syndicated
  const posts = await sql`
    SELECT id, title, slug, tags, excerpt
    FROM blog_posts
    WHERE status = 'published'
      AND published_at > NOW() - INTERVAL '48 hours'
      AND NOT EXISTS (SELECT 1 FROM blog_syndication_log WHERE blog_post_id = blog_posts.id AND platform = 'reddit')
    ORDER BY published_at DESC
    LIMIT 1
  `;

  if (posts.length === 0) {
    return NextResponse.json({ posted: 0, message: 'No new posts to syndicate' });
  }

  const post = posts[0];
  const category = categorizePost(post.tags || [], post.title);
  const subreddits = REDDIT_SUBREDDITS[category] || REDDIT_SUBREDDITS.general;
  const postUrl = `https://selah.fm/blog/${post.slug}`;
  const maxToday = 3 - todayCount;
  const toPost = subreddits.slice(0, maxToday);

  const posted: { subreddit: string; title: string }[] = [];

  for (const sub of toPost) {
    try {
      // Generate subreddit-appropriate title
      const title = `${post.title}`;
      
      // Post via Reddit API (requires Reddit app credentials)
      if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET && process.env.REDDIT_REFRESH_TOKEN) {
        const accessToken = await getRedditAccessToken();
        if (accessToken) {
          const res = await fetch('https://oauth.reddit.com/api/submit', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'selah.fm:v1.0 (by /u/selahfm)',
            },
            body: new URLSearchParams({
              sr: sub.name,
              title: title.slice(0, 300),
              url: postUrl,
              kind: 'link',
              resubmit: 'false',
            }),
          });

          if (res.ok) {
            posted.push({ subreddit: sub.name, title: title.slice(0, 50) });
            
            await sql`
              INSERT INTO blog_syndication_log (blog_post_id, platform, target, status)
              VALUES (${post.id}, 'reddit', ${'r/' + sub.name}, 'posted')
            `;
          } else {
            const err = await res.text();
            console.error(`Reddit post to r/${sub.name} failed:`, err.slice(0, 200));
            
            await sql`
              INSERT INTO blog_syndication_log (blog_post_id, platform, target, status, error_message)
              VALUES (${post.id}, 'reddit', ${'r/' + sub.name}, 'failed', ${err.slice(0, 500)})
            `;
          }
        }
      }
    } catch (e: any) {
      console.error(`Reddit syndicate error for r/${sub.name}:`, e.message);
    }
  }

  return NextResponse.json({
    posted: posted.length,
    subreddits: posted.map(p => p.subreddit),
    remaining_today: Math.max(0, 3 - todayCount - posted.length),
  });
}

/**
 * Get Reddit OAuth2 access token using refresh token.
 */
async function getRedditAccessToken(): Promise<string | null> {
  try {
    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(
          process.env.REDDIT_CLIENT_ID + ':' + process.env.REDDIT_CLIENT_SECRET
        ).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'selah.fm:v1.0 (by /u/selahfm)',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: process.env.REDDIT_REFRESH_TOKEN || '',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}
