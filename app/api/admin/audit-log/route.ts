import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/audit-log?limit=50&action=payment.donation
 * Returns paginated audit log entries.
 */
export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const action = searchParams.get('action') || '';
  const targetType = searchParams.get('target_type') || '';

  try {
    let query = sql`
      SELECT al.*, u.display_name as actor_name
      FROM audit_log al
      LEFT JOIN users u ON u.id = al.actor_id
      WHERE 1=1
    `;

    if (action) query = sql`${query} AND al.action = ${action}`;
    if (targetType) query = sql`${query} AND al.target_type = ${targetType}`;

    query = sql`${query} ORDER BY al.created_at DESC LIMIT ${limit}`;

    const entries = await query;
    return NextResponse.json({ entries, total: entries.length });
  } catch (e: any) {
    if (e.message?.includes('relation "audit_log" does not exist')) {
      return NextResponse.json({ entries: [], total: 0, note: 'audit_log table not yet created' });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
