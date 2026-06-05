import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const userId = session.id;

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    // Bundle message notifications by sender (link field contains sender ID)
    let notifs;
    if (unreadOnly) {
      notifs = await sql`
        SELECT id, type, message, read, link, metadata, created_at
        FROM notifications
        WHERE user_id = ${userId} AND read = false
        ORDER BY created_at DESC
        LIMIT 200
      `;
    } else {
      notifs = await sql`
        SELECT id, type, message, read, link, metadata, created_at
        FROM notifications
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 200
      `;
    }

    // Bundle messages from same sender into single notifications
    const bundled: any[] = [];
    const messageGroups = new Map<string, { count: number; latest: any }>();

    for (const n of notifs) {
      if (n.type === 'message' && n.link?.startsWith('/messages?user=')) {
        const senderId = n.link.replace('/messages?user=', '');
        const key = `message:${senderId}`;
        if (!messageGroups.has(key)) {
          messageGroups.set(key, { count: 0, latest: n });
        }
        const group = messageGroups.get(key)!;
        group.count++;
        if (new Date(n.created_at) > new Date(group.latest.created_at)) {
          group.latest = n;
        }
      } else {
        bundled.push(n);
      }
    }

    // Add bundled messages with sender info
    for (const [key, group] of messageGroups) {
      const senderId = key.replace('message:', '');
      let senderName = 'Someone';
      let senderAvatar = '';
      try {
        const [sender] = await sql`SELECT display_name, profile_image_url FROM users WHERE id = ${senderId}`;
        if (sender) {
          senderName = sender.display_name || 'Someone';
          senderAvatar = sender.profile_image_url || '';
        }
      } catch (e: any) { console.error('[notifications] Sender lookup failed:', e.message); }

      bundled.push({
        id: group.latest.id,
        type: 'message',
        message: group.count > 1
          ? `${group.count} messages from ${senderName}`
          : `Message from ${senderName}`,
        read: group.latest.read,
        link: group.latest.link,
        sender_id: senderId,
        sender_name: senderName,
        sender_avatar: senderAvatar,
        message_count: group.count,
        created_at: group.latest.created_at,
        bundled: true,
      });
    }

    // Sort by created_at desc
    bundled.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    notifs = bundled;

    // Unread count — deduplicate messages from same sender
    const [nonMessageUnread] = await sql`
      SELECT COUNT(*)::int as count FROM notifications
      WHERE user_id = ${userId} AND read = false AND (type != 'message' OR link NOT LIKE '/messages?user=%')
    `;
    const [messageSenders] = await sql`
      SELECT COUNT(DISTINCT link)::int as count FROM notifications
      WHERE user_id = ${userId} AND read = false AND type = 'message' AND link LIKE '/messages?user=%'
    `;
    const dedupedUnread = (nonMessageUnread?.count || 0) + (messageSenders?.count || 0);

    return NextResponse.json({
      notifications: notifs,
      unreadCount: dedupedUnread,
    });
  } catch (e: any) {
    console.error('Notifications GET error:', e.message);
    return NextResponse.json({ error: 'Failed to load notifications', notifications: [], unreadCount: 0 }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { id, markAllRead } = await request.json();

    const userId = session.id;

    if (markAllRead) {
      await sql`
        UPDATE notifications SET read = true
        WHERE user_id = ${userId} AND read = false
      `;
      return NextResponse.json({ ok: true });
    }

    if (id) {
      await sql`
        UPDATE notifications SET read = true
        WHERE id = ${id} AND user_id = ${userId}
      `;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Missing id or markAllRead' }, { status: 400 });
  } catch (e: any) {
    console.error('Notifications PATCH error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
