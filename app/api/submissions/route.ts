import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { campaignId, contentUrl, platform, postedAt } = await request.json();
    const result = await sql`
      INSERT INTO submissions (campaign_id, creator_id, content_url, platform, posted_at, views_at_submit)
      VALUES (${campaignId}, 'creator-1', ${contentUrl}, ${platform}, ${postedAt}, 0)
      RETURNING *
    `;
    return NextResponse.json(result[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const submissions = await sql`
      SELECT s.*, c.track_title, c.cpm_rate_cents
      FROM submissions s
      JOIN campaigns c ON c.id = s.campaign_id
      WHERE s.campaign_id = ${campaignId}
      ORDER BY s.submitted_at DESC
    `;
    return NextResponse.json(submissions);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
