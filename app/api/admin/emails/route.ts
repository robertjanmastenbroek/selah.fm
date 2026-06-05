import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  // Inbound emails
  if (type === 'inbound') {
    try {
      const emails = await sql`
        SELECT id, from_email, from_name, subject, body_text, body_html,
               CASE WHEN status = 'unread' THEN false ELSE true END as read,
               created_at as received_at
        FROM inbound_emails
        ORDER BY created_at DESC
        LIMIT 100
      `;
      return NextResponse.json(emails);
    } catch {
      return NextResponse.json([]);
    }
  }

  // Outbound email log (default)
  try {
    const emails = await sql`
      SELECT id, to_email, subject, body, html_body, sent, sent_by, created_at
      FROM email_logs
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return NextResponse.json({ emails });
  } catch {
    return NextResponse.json({ emails: [] });
  }
}
