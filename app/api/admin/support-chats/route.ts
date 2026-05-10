import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  try {
    const chats = await sql`
      SELECT * FROM support_chats
      ORDER BY created_at DESC
      LIMIT 200
    `;
    return NextResponse.json(chats);
  } catch (e: any) {
    if (e.message?.includes('relation')) return NextResponse.json([]);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
