import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const campaigns = await sql`
      SELECT c.*, 
        COALESCE(v.approved_submissions, '0') as approved_submissions,
        COALESCE(v.pending_submissions, '0') as pending_submissions,
        COALESCE(v.total_verified_views, '0') as total_verified_views
      FROM campaigns c
      LEFT JOIN campaign_stats v ON v.id = c.id
      WHERE c.id = ${params.id}
    `;
    
    if (campaigns.length === 0) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    return NextResponse.json(campaigns[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { status } = await request.json();
    if (!['active', 'paused', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Verify ownership
    const campaign = await sql`SELECT artist_id FROM campaigns WHERE id = ${params.id}`;
    if (campaign.length === 0) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    if (campaign[0].artist_id !== session.id) {
      return NextResponse.json({ error: 'Not your campaign' }, { status: 403 });
    }

    const result = await sql`
      UPDATE campaigns SET status = ${status}, updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `;
    return NextResponse.json(result[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
