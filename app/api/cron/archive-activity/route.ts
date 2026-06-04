import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Weekly cron: archives activity events older than 30 days.
 * Moves from activity_events → activity_events_archive.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Count what will be archived
    const [{ count }] = await sql`
      SELECT COUNT(*)::int FROM activity_events
      WHERE created_at < NOW() - INTERVAL '30 days'
    `;

    if (count === 0) {
      return NextResponse.json({ archived: 0, message: 'Nothing to archive' });
    }

    // Move to archive table
    await sql`
      INSERT INTO activity_events_archive
      SELECT * FROM activity_events
      WHERE created_at < NOW() - INTERVAL '30 days'
    `;

    // Delete from main table
    await sql`
      DELETE FROM activity_events
      WHERE created_at < NOW() - INTERVAL '30 days'
    `;

    return NextResponse.json({ archived: count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
