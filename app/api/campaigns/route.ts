import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const platform = searchParams.get('platform') || '';
    const minCpm = searchParams.get('minCpm') || '';
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    let query = sql`
      SELECT c.*, 
        COALESCE(v.approved_submissions, '0') as approved_submissions,
        COALESCE(v.pending_submissions, '0') as pending_submissions,
        COALESCE(v.total_verified_views, '0') as total_verified_views
      FROM campaigns c
      LEFT JOIN campaign_stats v ON v.id = c.id
      WHERE c.status IN ('active', 'draft')
    `;

    // No easy way to do dynamic SQL with the tagged template, so filter in JS
    const campaigns = await query;
    
    let filtered = campaigns;
    
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((c: any) => 
        c.track_title?.toLowerCase().includes(q) ||
        (c.recommended_hashtags || '').toLowerCase().includes(q)
      );
    }
    
    if (platform) {
      filtered = filtered.filter((c: any) => 
        c.platforms?.includes(platform)
      );
    }
    
    if (minCpm) {
      const min = parseFloat(minCpm) * 100;
      filtered = filtered.filter((c: any) => c.cpm_rate_cents >= min);
    }

    const total = filtered.length;
    const page = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      campaigns: page,
      total,
      offset,
      limit,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, campaigns: [], total: 0 }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { validateCampaignInput } = await import('@/lib/validation');
    const { getSession } = await import('@/lib/auth');

    const validation = validateCampaignInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
    }

    const { trackTitle, trackUrl, cpmRate, budget, maxPayout, requirements, driveUrl, hashtags, coverArtUrl } = validation.sanitized!;
    const { requiredHashtags, requireFtc, minVideoLength, captionRequirements } = body;

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
        status, content_assets_url, recommended_hashtags, requirements, cover_art_url,
        required_hashtags, require_ftc, min_video_length_seconds, caption_requirements
      )
      VALUES (
        ${artistId}, ${trackTitle}, ${trackUrl}, 
        ${cpmRate * 100}, ${budget * 100}, ${maxPayout * 100}, ${budget * 100},
        'active', ${driveUrl || ''}, ${hashtags || '#selahfm'}, ${requirements || ''}, ${coverArtUrl || null},
        ${requiredHashtags || null}, ${requireFtc || false}, ${minVideoLength || null}, ${captionRequirements || null}
      )
      RETURNING *
    `;
    return NextResponse.json(result[0]);
  } catch (e: any) {
    console.error('Campaign POST error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
