import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

/** GET: List inbox emails by mailbox */
export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const mailbox = searchParams.get('mailbox') || 'support';

    const emails = await sql`
      SELECT id, mailbox, from_address, to_address, subject, body_html, body_text, read, created_at
      FROM inbound_emails
      WHERE mailbox = ${mailbox}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return NextResponse.json(emails);
  } catch (e: any) {
    if (e.message?.includes('relation')) return NextResponse.json([]);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** PATCH: Mark email as read */
export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  try {
    const { id } = await request.json();
    await sql`UPDATE inbound_emails SET read = true WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
