import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ADMIN_EMAILS } from '@/lib/constants';

/**
 * POST /api/review/reject-duplicates
 * Auto-rejects duplicate submissions with the same content_url and campaign_id.
 * Called after approving a submission to clean up duplicates.
 */
export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const isAdmin = ADMIN_EMAILS.includes(session.email || '');
  if (!isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  try {
    const { submissionId, content_url, campaign_id } = await request.json();

    if (!content_url || !campaign_id) {
      return NextResponse.json({ error: 'Missing content_url or campaign_id' }, { status: 400 });
    }

    const result = await sql`
      UPDATE submissions
      SET review_status = 'rejected',
          reviewed_at = NOW(),
          reviewed_by = ${session.id},
          rejection_reason = 'Duplicate submission — original was approved'
      WHERE content_url = ${content_url}
        AND campaign_id = ${campaign_id}
        AND id != ${submissionId}
        AND review_status = 'pending'
      RETURNING id
    `;

    return NextResponse.json({ rejected: result.length, ids: result.map((r: any) => r.id) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
