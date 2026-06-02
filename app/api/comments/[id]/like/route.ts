import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/comments/[id]/like — Toggle like on a comment
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in to like comments' }, { status: 401 });
    }

    const { rateLimit, getRateLimitKey } = await import('@/lib/rate-limit');
    const rl = rateLimit(getRateLimitKey(request), { maxRequests: 30, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { id: commentId } = params;

    // Check if comment exists
    const [comment] = await sql`SELECT id FROM page_comments WHERE id = ${commentId}`;
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if already liked
    const [existing] = await sql`
      SELECT id FROM comment_likes WHERE comment_id = ${commentId} AND user_id = ${user.id}
    `;

    let liked: boolean;
    if (existing) {
      // Unlike
      await sql`DELETE FROM comment_likes WHERE id = ${existing.id}`;
      await sql`UPDATE page_comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ${commentId}`;
      liked = false;
    } else {
      // Like
      await sql`INSERT INTO comment_likes (comment_id, user_id) VALUES (${commentId}, ${user.id})`;
      await sql`UPDATE page_comments SET likes_count = likes_count + 1 WHERE id = ${commentId}`;
      liked = true;
    }

    const [{ likes_count }] = await sql`SELECT likes_count FROM page_comments WHERE id = ${commentId}`;

    return NextResponse.json({ liked, likes_count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
