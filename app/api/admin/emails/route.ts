import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  // Inbound emails
  if (type === 'inbound') {
    try {
      const emails = await sql`
        SELECT id, from_email, to_email, subject, body_text, body_html, read, received_at
        FROM inbound_emails
        ORDER BY received_at DESC
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
