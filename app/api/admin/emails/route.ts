import { NextResponse } from 'next/server';
import sql from '@/lib/db';

// Admin-only: verified by middleware
export async function GET() {
  try {
    const emails = await sql`
      SELECT id, to_email, subject, sent, sent_by, created_at
      FROM email_logs
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return NextResponse.json({ emails });
  } catch {
    return NextResponse.json({ emails: [] });
  }
}
