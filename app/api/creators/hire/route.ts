import { NextResponse } from 'next/server';
import sql from '@/lib/db';

// Hire a creator for a specific campaign with custom CPM
export async function POST(request: Request) {
  try {
    const { creatorId, cpmCents, campaignId } = await request.json();
    if (!creatorId || !cpmCents || !campaignId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Create a direct hire submission — marks this creator as hired
    await sql`
      INSERT INTO submissions (campaign_id, creator_id, content_url, platform, review_status, created_at)
      VALUES (${campaignId}, ${creatorId}, 'direct-hire', 'tiktok', 'pending', NOW())
    `;

    return NextResponse.json({ hired: true, creatorId, cpmCents });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
