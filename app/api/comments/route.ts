import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/comments?pageType=artist&pageId=X&sort=newest&limit=20&offset=0
 * Returns paginated comments for a page, with threaded replies.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageType = searchParams.get('pageType') || '';
    const pageId = searchParams.get('pageId') || '';
    const parentId = searchParams.get('parentId') || ''; // for loading replies
    const sort = searchParams.get('sort') || 'newest';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!pageType || !pageId) {
      return NextResponse.json({ error: 'pageType and pageId are required' }, { status: 400 });
    }

    const orderClause = sort === 'most_liked'
      ? 'ORDER BY pc.likes_count DESC, pc.created_at DESC'
      : 'ORDER BY pc.created_at DESC';

    const parentCondition = parentId
      ? `AND pc.parent_id = $3::uuid`
      : 'AND pc.parent_id IS NULL';

    const parentParams = parentId
      ? [pageType, pageId, parentId, limit, offset]
      : [pageType, pageId, limit, offset];

    // Fetch comments (top-level or replies)
    const comments = await sql.raw(`
      SELECT pc.id, pc.page_type, pc.page_id, pc.parent_id, pc.user_id, pc.author_name,
             pc.content, pc.likes_count, pc.is_hidden, pc.created_at,
             (SELECT COUNT(*) FROM page_comments replies WHERE replies.parent_id = pc.id) as reply_count
      FROM page_comments pc
      WHERE pc.page_type = $1 AND pc.page_id = $2::uuid AND pc.is_hidden = false ${parentCondition}
      ${orderClause}
      LIMIT $${parentParams.length - 1} OFFSET $${parentParams.length}
    `, parentParams);

    // Fetch total count
    const countCondition = parentId
      ? `AND parent_id = $3::uuid`
      : 'AND parent_id IS NULL';
    const [{ count: total }] = await sql.raw(`
      SELECT COUNT(*)::int FROM page_comments
      WHERE page_type = $1 AND page_id = $2::uuid AND is_hidden = false ${countCondition}
    `, parentId ? [pageType, pageId, parentId] : [pageType, pageId]);

    return NextResponse.json({ comments, total, offset, limit });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/comments — Create a comment
 * Body: { pageType, pageId, content, parentId?, authorName? }
 */
export async function POST(request: Request) {
  try {
    const { rateLimit, getRateLimitKey } = await import('@/lib/rate-limit');
    const rl = await rateLimit(getRateLimitKey(request), { maxRequests: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many comments. Slow down.' }, { status: 429 });
    }

    const body = await request.json();
    const { pageType, pageId, content, parentId, authorName } = body;

    if (!pageType || !pageId || !content?.trim()) {
      return NextResponse.json({ error: 'pageType, pageId, and content are required' }, { status: 400 });
    }
    if (content.trim().length > 1000) {
      return NextResponse.json({ error: 'Comment too long (max 1000 characters)' }, { status: 400 });
    }
    if (!['artist', 'campaign'].includes(pageType)) {
      return NextResponse.json({ error: 'Invalid pageType' }, { status: 400 });
    }

    // Get current user if authenticated
    const { getUser } = await import('@/lib/supabase/server');
    const user = await getUser();
    const userId = user?.id || null;
    const displayName = authorName?.trim() || user?.email?.split('@')[0] || 'Anonymous';

    // If replying, verify parent exists
    if (parentId) {
      const [parent] = await sql`SELECT id FROM page_comments WHERE id = ${parentId} AND page_type = ${pageType}`;
      if (!parent) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }
    }

    const [comment] = await sql`
      INSERT INTO page_comments (page_type, page_id, parent_id, user_id, author_name, content)
      VALUES (${pageType}, ${pageId}, ${parentId || null}, ${userId}, ${displayName}, ${content.trim()})
      RETURNING *
    `;

    // Update denormalized comment count on the artist
    if (pageType === 'artist') {
      await sql`
        UPDATE discovered_artists SET comment_count = (
          SELECT COUNT(*) FROM page_comments WHERE page_type = 'artist' AND page_id = ${pageId}
        ) WHERE id = ${pageId}
      `;
    }

    // Create activity event for artist comments
    if (pageType === 'artist') {
      await sql`
        INSERT INTO activity_events (artist_id, event_type, actor_type, actor_name, actor_id, message, metadata)
        VALUES (${pageId}, 'comment', ${userId ? 'user' : 'anonymous'}, ${displayName}, ${userId},
                ${displayName + ' commented on the page'},
                ${JSON.stringify({ comment_id: comment.id, content: content.trim().slice(0, 100) })})
      `;
    }

    // Notify artist if claimed (fire-and-forget)
    if (pageType === 'artist') {
      sql`
        INSERT INTO notifications (user_id, type, message, link)
        SELECT u.id, 'comment', ${displayName + ' commented on your page'},
               ${'/artist/' + pageId}
        FROM users u
        JOIN discovered_artists da ON da.artist_name ILIKE u.display_name
        WHERE da.id = ${pageId} AND u.id IS NOT NULL
        LIMIT 1
      `.catch(() => {});
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
