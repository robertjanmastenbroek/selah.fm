import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { receiverId, content, campaignId } = await request.json();
    if (!receiverId || !content?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const senderId = session.id;
    if (senderId === receiverId) return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });

    const msg = await sql`
      INSERT INTO messages (sender_id, receiver_id, campaign_id, content)
      VALUES (${senderId}, ${receiverId}, ${campaignId || null}, ${content.trim()})
      RETURNING *
    `;

    return NextResponse.json(msg[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const userId = session.id;

    const { searchParams } = new URL(request.url, 'https://selah.fm');
    const conversationId = searchParams.get('userId');

    if (conversationId) {
      // Get messages for a specific conversation
      const messages = await sql`
        SELECT m.*, s.display_name as sender_name, r.display_name as receiver_name
        FROM messages m
        JOIN users s ON s.id = m.sender_id
        JOIN users r ON r.id = m.receiver_id
        WHERE (m.sender_id = ${userId} AND m.receiver_id = ${conversationId})
           OR (m.sender_id = ${conversationId} AND m.receiver_id = ${userId})
        ORDER BY m.created_at ASC
        LIMIT 100
      `;
      return NextResponse.json(messages);
    }

    // Get all conversations (latest message per conversation)
    const conversations = await sql`
      SELECT DISTINCT ON (LEAST(m.sender_id, m.receiver_id), GREATEST(m.sender_id, m.receiver_id))
        m.id, m.content, m.created_at, m.read,
        m.sender_id, m.receiver_id,
        CASE WHEN m.sender_id = ${userId} THEN r.display_name ELSE s.display_name END as other_name,
        CASE WHEN m.sender_id = ${userId} THEN r.id ELSE s.id END as other_id,
        CASE WHEN m.sender_id = ${userId} THEN r.profile_image_url ELSE s.profile_image_url END as other_avatar,
        (SELECT COUNT(*) FROM messages m2 WHERE m2.receiver_id = ${userId} AND m2.read = false AND m2.sender_id = CASE WHEN m.sender_id = ${userId} THEN m.receiver_id ELSE m.sender_id END) as unread
      FROM messages m
      JOIN users s ON s.id = m.sender_id
      JOIN users r ON r.id = m.receiver_id
      WHERE m.sender_id = ${userId} OR m.receiver_id = ${userId}
      ORDER BY LEAST(m.sender_id, m.receiver_id), GREATEST(m.sender_id, m.receiver_id), m.created_at DESC
    `;

    return NextResponse.json(conversations);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { markReadFrom } = await request.json();
    const userId = session.id;

    await sql`
      UPDATE messages SET read = true
      WHERE receiver_id = ${userId} AND sender_id = ${markReadFrom} AND read = false
    `;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
