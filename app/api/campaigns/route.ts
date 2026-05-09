import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { validateCampaignInput } from '@/lib/validation';
import { getSession } from '@/lib/auth';

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
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateCampaignInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
    }

    const { trackTitle, trackUrl, cpmRate, budget, maxPayout, requirements, driveUrl, hashtags, coverArtUrl } = validation.sanitized!;

    // Get authenticated user
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const users = await sql`SELECT id FROM users WHERE email = ${session.email}`;
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const artistId = users[0].id;

    const result = await sql`
      INSERT INTO campaigns (
        artist_id, track_title, track_url, 
        cpm_rate_cents, total_budget_cents, max_payout_per_submission_cents, budget_remaining_cents,
        status, content_assets_url, recommended_hashtags, requirements, cover_art_url
      )
      VALUES (
        ${artistId}, ${trackTitle}, ${trackUrl}, 
        ${cpmRate * 100}, ${budget * 100}, ${maxPayout * 100}, ${budget * 100},
        'active', ${driveUrl || ''}, ${hashtags || '#selahfm'}, ${requirements || ''}, ${coverArtUrl || null}
      )
      RETURNING *
    `;
    return NextResponse.json(result[0]);
  } catch (e: any) {
    console.error('Campaign POST error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
