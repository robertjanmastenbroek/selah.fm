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

    let notifs;
    if (unreadOnly) {
      notifs = await sql`
        SELECT id, type, message, read, link, metadata, created_at
        FROM notifications
        WHERE user_id = ${userId} AND read = false
        ORDER BY created_at DESC
        LIMIT 50
      `;
    } else {
      notifs = await sql`
        SELECT id, type, message, read, link, metadata, created_at
        FROM notifications
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 50
      `;
    }

    const unreadCount = await sql`
      SELECT COUNT(*)::int as count
      FROM notifications
      WHERE user_id = ${userId} AND read = false
    `;

    return NextResponse.json({
      notifications: notifs,
      unreadCount: unreadCount[0]?.count || 0,
    });
  } catch (e: any) {
    console.error('Notifications GET error:', e.message);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
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
