import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const campaigns = await sql`
      SELECT * FROM campaign_stats WHERE status = 'active'
      ORDER BY cpm_rate_cents DESC, budget_remaining_cents DESC
      LIMIT 50
    `;
    return NextResponse.json(campaigns);
  } catch (e: any) {
    return NextResponse.json({ error: e.message, hint: 'Set DATABASE_URL in Railway env vars' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { trackTitle, trackUrl, cpmRate, budget, maxPayout } = await request.json();
    const result = await sql`
      INSERT INTO campaigns (musician_id, track_title, track_url, cpm_rate_cents, total_budget_cents, max_payout_per_submission_cents, budget_remaining_cents)
      VALUES ('artist-1', ${trackTitle}, ${trackUrl}, ${cpmRate * 100}, ${budget * 100}, ${maxPayout * 100}, ${budget * 100})
      RETURNING *
    `;
    return NextResponse.json(result[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
