import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const campaigns = await sql`
      SELECT c.*, 
        COALESCE(v.approved_submissions, '0') as approved_submissions,
        COALESCE(v.pending_submissions, '0') as pending_submissions,
        COALESCE(v.total_verified_views, '0') as total_verified_views
      FROM campaigns c
      LEFT JOIN campaign_stats v ON v.id = c.id
      WHERE c.status IN ('active', 'draft')
      ORDER BY c.created_at DESC
      LIMIT 50
    `;
    return NextResponse.json(campaigns);
  } catch (e: any) {
    return NextResponse.json({ error: e.message, hint: 'Set DATABASE_URL in Railway env vars' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { trackTitle, trackUrl, cpmRate, budget, maxPayout, driveUrl, hashtags, requirements, coverArtUrl } = await request.json();
    
    // Get user ID from session cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    let artistId = null;
    if (sessionMatch) {
      try {
        const [payload] = sessionMatch[1].split('.');
        const user = JSON.parse(Buffer.from(payload, 'base64').toString());
        const existing = await sql`SELECT id FROM users WHERE email = ${user.email}`;
        if (existing.length > 0) artistId = existing[0].id;
      } catch {}
    }

    const result = await sql`
      INSERT INTO campaigns (artist_id, track_title, track_url, cpm_rate_cents, total_budget_cents, max_payout_per_submission_cents, budget_remaining_cents, status, content_assets_url, recommended_hashtags, requirements, cover_art_url)
      VALUES (${artistId}, ${trackTitle}, ${trackUrl}, ${cpmRate * 100}, ${budget * 100}, ${maxPayout * 100}, ${budget * 100}, 'active', ${driveUrl || ''}, ${hashtags || '#selahfm'}, ${requirements || ''}, ${coverArtUrl || null})
      RETURNING *
    `;
    return NextResponse.json(result[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
