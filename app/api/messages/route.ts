import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const userId = user.id;
    const { searchParams } = new URL(request.url);

    // If a specific conversation user ID is requested, return messages for that conversation
    const conversationUserId = searchParams.get('userId') || searchParams.get('with');
    if (conversationUserId) {
      const messages = await sql`
        SELECT m.id, m.content, m.created_at, m.read, m.sender_id, m.receiver_id, m.campaign_id
        FROM messages m
        WHERE (m.sender_id = ${userId} AND m.receiver_id = ${conversationUserId})
           OR (m.sender_id = ${conversationUserId} AND m.receiver_id = ${userId})
        ORDER BY m.created_at ASC
        LIMIT 200
      `;
      return NextResponse.json({ messages });
    }

    // Get latest message per conversation + unread count from the other party
    const rows = await sql`
      WITH user_messages AS (
        SELECT
          m.id, m.content, m.created_at, m.read, m.sender_id, m.receiver_id, m.campaign_id,
          CASE WHEN m.sender_id = ${userId} THEN m.receiver_id ELSE m.sender_id END AS other_user_id
        FROM messages m
        WHERE m.sender_id = ${userId} OR m.receiver_id = ${userId}
      ),
      latest_per_other AS (
        SELECT DISTINCT ON (other_user_id)
          other_user_id, id, content, created_at, campaign_id
        FROM user_messages
        ORDER BY other_user_id, created_at DESC
      ),
      unread_counts AS (
        SELECT
          sender_id AS other_user_id,
          COUNT(*)::int AS unread_count
        FROM messages
        WHERE receiver_id = ${userId} AND read = false
        GROUP BY sender_id
      )
      SELECT
        lpo.other_user_id,
        lpo.content AS last_message_content,
        lpo.created_at AS last_message_at,
        lpo.campaign_id,
        COALESCE(uc.unread_count, 0) AS unread_count,
        u.display_name,
        u.profile_image_url
      FROM latest_per_other lpo
      JOIN users u ON u.id = lpo.other_user_id
      LEFT JOIN unread_counts uc ON uc.other_user_id = lpo.other_user_id
      ORDER BY lpo.created_at DESC
    `;

    const conversations = rows
      .filter((r: any) => r.other_user_id !== userId) // exclude self
      .map((r: any) => ({
        other_user: {
          id: r.other_user_id,
          display_name: r.display_name,
          profile_image_url: r.profile_image_url,
        },
        last_message: {
          content: r.last_message_content,
          created_at: r.last_message_at,
        },
        unread_count: r.unread_count,
        campaign_id: r.campaign_id,
      }));

    return NextResponse.json({ conversations });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const body = await request.json();
    const { receiver_id, campaign_id, content } = body;

    if (!receiver_id || !content?.trim()) {
      return NextResponse.json({ error: 'receiver_id and content are required' }, { status: 400 });
    }
    if (content.trim().length > 500) {
      return NextResponse.json({ error: 'Content must be 500 characters or fewer' }, { status: 400 });
    }
    if (user.id === receiver_id) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    // Fetch sender name for notification
    const [senderProfile] = await sql`
      SELECT display_name FROM users WHERE id = ${user.id}
    `;
    const senderName = senderProfile?.display_name || 'Someone';

    const [msg] = await sql`
      INSERT INTO messages (sender_id, receiver_id, campaign_id, content)
      VALUES (${user.id}, ${receiver_id}, ${campaign_id || null}, ${content.trim()})
      RETURNING id, content, created_at
    `;

    // Create notification for receiver (fire-and-forget)
    try {
      await sql`
        INSERT INTO notifications (user_id, type, message, link)
        VALUES (${receiver_id}, 'message', ${'New message from ' + senderName}, ${'/messages?user=' + user.id})
      `;
    } catch (e: any) { console.error('Unhandled error in api/messages/route.ts:', e); } // Notification failure is non-critical

    return NextResponse.json({ message: msg });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const body = await request.json();
    const { sender_id, message_id, content } = body;

    // Edit message content (own messages only, within 24h)
    if (message_id && content) {
      const [msg] = await sql`
        UPDATE messages SET content = ${content.trim()}, edited_at = NOW()
        WHERE id = ${message_id} AND sender_id = ${user.id}
          AND created_at > NOW() - INTERVAL '24 hours'
        RETURNING id, content, created_at, edited_at
      `;
      if (!msg) return NextResponse.json({ error: 'Message not found or too old to edit' }, { status: 400 });
      return NextResponse.json({ message: msg });
    }

    // Mark messages as read
    if (sender_id) {
      await sql`
        UPDATE messages SET read = true
        WHERE receiver_id = ${user.id} AND sender_id = ${sender_id} AND read = false
      `;
      const [countRow] = await sql`
        SELECT COUNT(*)::int AS count
        FROM messages WHERE receiver_id = ${user.id} AND sender_id = ${sender_id} AND read = false
      `;
      return NextResponse.json({ updated: countRow?.count || 0 });
    }

    return NextResponse.json({ error: 'sender_id or message_id+content required' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * DELETE /api/messages?id=MESSAGE_ID
 * Delete own message within 24 hours.
 */
export async function DELETE(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('id');
    if (!messageId) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const [deleted] = await sql`
      DELETE FROM messages
      WHERE id = ${messageId} AND sender_id = ${user.id}
        AND created_at > NOW() - INTERVAL '24 hours'
      RETURNING id
    `;

    if (!deleted) return NextResponse.json({ error: 'Message not found or too old to delete' }, { status: 400 });
    return NextResponse.json({ deleted: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}