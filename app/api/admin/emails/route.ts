import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession, ADMIN_EMAILS } from '@/lib/auth';

export async function GET(request: Request) {
  const session = getSession(request);
  if (!session || !ADMIN_EMAILS.includes(session.email)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  try {
    // Try to query email_logs table, fall back gracefully
    let emails: any[] = [];
    try {
      emails = await sql`
        SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 50
      `;
    } catch {
      // Table might not exist yet — return empty
    }
    return NextResponse.json({ emails });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
