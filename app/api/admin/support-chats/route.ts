import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  try {
    const rows = await sql`
      SELECT * FROM support_chats
      ORDER BY created_at DESC
      LIMIT 500
    `;

    // Group into conversations: sequential messages within 5 min = same session
    const conversations: any[] = [];
    let currentConv: any = null;

    for (const row of rows) {
      if (!currentConv) {
        currentConv = {
          id: row.id,
          messages: [row],
          started_at: row.created_at,
          last_at: row.created_at,
          message_count: 1,
        };
        continue;
      }

      const gap = new Date(currentConv.last_at).getTime() - new Date(row.created_at).getTime();
      if (Math.abs(gap) < 5 * 60 * 1000) {
        // Same conversation
        currentConv.messages.push(row);
        currentConv.last_at = row.created_at;
        currentConv.message_count++;
      } else {
        // New conversation
        conversations.push(currentConv);
        currentConv = {
          id: row.id,
          messages: [row],
          started_at: row.created_at,
          last_at: row.created_at,
          message_count: 1,
        };
      }
    }
    if (currentConv) conversations.push(currentConv);

    return NextResponse.json(conversations);
  } catch (e: any) {
    if (e.message?.includes('relation')) return NextResponse.json([]);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
