import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  try {
    const logs = await sql`
      SELECT id, recipient, subject, sent, reason, created_at
      FROM email_logs
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return NextResponse.json(logs);
  } catch (e: any) {
    // Table might not exist yet
    if (e.message?.includes('relation') || e.message?.includes('does not exist')) {
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
