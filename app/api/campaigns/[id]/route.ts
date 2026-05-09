import { NextResponse } from 'next/server';
import sql from '@/lib/db';

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
