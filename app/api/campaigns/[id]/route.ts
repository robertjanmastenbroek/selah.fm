import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Support both UUID and slug lookup — split queries avoid Postgres
    // short-circuit-evaluation pitfalls with `::uuid` casts on non-UUID strings.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);

    const campaigns = isUuid
      ? await sql`
          SELECT c.*,
            COALESCE(c.title, c.track_title) as title,
            COALESCE(v.approved_submissions, '0') as approved_submissions,
            COALESCE(v.pending_submissions, '0') as pending_submissions,
            COALESCE(v.total_verified_views, '0') as total_verified_views,
            u.display_name as artist_name,
            u.profile_image_url as artist_avatar
          FROM campaigns c
          LEFT JOIN campaign_stats v ON v.id = c.id
          LEFT JOIN users u ON u.id = c.artist_id
          WHERE c.id = ${params.id}::uuid
        `
      : await sql`
          SELECT c.*,
            COALESCE(c.title, c.track_title) as title,
            COALESCE(v.approved_submissions, '0') as approved_submissions,
            COALESCE(v.pending_submissions, '0') as pending_submissions,
            COALESCE(v.total_verified_views, '0') as total_verified_views,
            u.display_name as artist_name,
            u.profile_image_url as artist_avatar
          FROM campaigns c
          LEFT JOIN campaign_stats v ON v.id = c.id
          LEFT JOIN users u ON u.id = c.artist_id
          WHERE c.slug = ${params.id}
        `;

    if (campaigns.length === 0) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const campaign = campaigns[0];
    const campaignId = campaign.id; // resolved UUID for donations lookup

    let donations = { totalCents: 0, count: 0, supporters: [] as any[] };
    try {
      const [totalRow] = await sql`
        SELECT COALESCE(SUM(amount_cents)::int, 0) as total, COUNT(*)::int as count
        FROM campaign_donations WHERE campaign_id = ${campaignId}
      `;
      donations.totalCents = totalRow?.total || 0;
      donations.count = totalRow?.count || 0;
      const supporters = await sql`
        SELECT donor_name, amount_cents, message, anonymous, created_at
        FROM campaign_donations WHERE campaign_id = ${campaignId}
        ORDER BY created_at DESC LIMIT 20
      `;
      donations.supporters = supporters;
    } catch {}

    return NextResponse.json({ ...campaign, donations });
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
    const body = await request.json();

    // Resolve id to UUID (supports both slug and UUID in URL)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
    let campaignId = params.id;
    if (!isUuid) {
      const resolved = await sql`SELECT id FROM campaigns WHERE slug = ${params.id}`;
      if (resolved.length === 0) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      campaignId = resolved[0].id;
    }

    // Ownership check
    const campaign = await sql`SELECT * FROM campaigns WHERE id = ${campaignId}`;
    if (campaign.length === 0) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    if (campaign[0].artist_id !== session.id) {
      return NextResponse.json({ error: 'Not your campaign' }, { status: 403 });
    }

    // ── CPM lock: reject cpmRate changes if submissions exist ──
    if (body.cpmRate !== undefined) {
      const subCount = await sql`SELECT COUNT(*)::int as c FROM submissions WHERE campaign_id = ${campaignId}`;
      if (subCount[0].c > 0) {
        return NextResponse.json({ error: 'CPM rate is locked once submissions exist. Create a new campaign to change your rate.' }, { status: 400 });
      }
    }

    // ── Prepare update values ──────────────────────────────────
    const trackTitle = body.trackTitle !== undefined ? String(body.trackTitle).slice(0, 200) : null;
    const title = body.title !== undefined ? (body.title ? String(body.title).slice(0, 300) : null) : null;
    const trackUrl = body.trackUrl !== undefined ? String(body.trackUrl).slice(0, 2048) : null;
    const requirements = body.requirements !== undefined ? String(body.requirements).slice(0, 2000) : null;
    const hashtags = body.hashtags !== undefined ? String(body.hashtags).slice(0, 500) : null;
    
    // Fields that can be explicitly set to null (distinguish "clear" from "keep")
    const coverArtUrl = body.coverArtUrl !== undefined ? (body.coverArtUrl || null) : null;
    const requiredHashtags = body.requiredHashtags !== undefined ? (body.requiredHashtags || null) : null;
    const captionRequirements = body.captionRequirements !== undefined ? (body.captionRequirements || null) : null;
    const contentAssetsUrl = body.contentAssetsUrl !== undefined ? (body.contentAssetsUrl || '') : null;

    let cpmRateCents: number | null = null;
    if (body.cpmRate !== undefined) {
      const cpm = Math.round(parseFloat(body.cpmRate) * 100);
      if (cpm > 0 && cpm <= 100000) cpmRateCents = cpm;
    }

    let maxPayoutCents: number | null = null;
    if (body.maxPayout !== undefined) {
      const max = Math.round(parseInt(body.maxPayout) * 100);
      if (max > 0) maxPayoutCents = max;
    }

    let requireFtc: boolean | null = null;
    if (body.requireFtc !== undefined) requireFtc = !!body.requireFtc;

    let minVideoLength: number | null = null;
    if (body.minVideoLength !== undefined) {
      minVideoLength = body.minVideoLength ? parseInt(body.minVideoLength) : null;
    }

    let platforms: string | null = null;
    if (body.platforms !== undefined) platforms = JSON.stringify(body.platforms);

    const youtubeVideoUrl = body.youtubeVideoUrl !== undefined ? (body.youtubeVideoUrl || null) : null;
    const hasYoutubeUrl = body.youtubeVideoUrl !== undefined;

    const galleryImages = body.galleryImages !== undefined ? JSON.stringify(body.galleryImages) : null;
    const hasGalleryImages = body.galleryImages !== undefined;

    // For nullable fields where "keep" vs "set to null" matters, use separate flags
    const hasCoverArt = body.coverArtUrl !== undefined;
    const hasReqHashtags = body.requiredHashtags !== undefined;
    const hasCaptionReq = body.captionRequirements !== undefined;
    const hasMinVideoLength = body.minVideoLength !== undefined;

    const result = await sql`
      UPDATE campaigns SET
        track_title = COALESCE(${trackTitle}, track_title),
        title = CASE WHEN ${body.title !== undefined} THEN ${title} ELSE title END,
        track_url = COALESCE(${trackUrl}, track_url),
        cover_art_url = CASE WHEN ${hasCoverArt} THEN ${coverArtUrl} ELSE cover_art_url END,
        cpm_rate_cents = COALESCE(${cpmRateCents}, cpm_rate_cents),
        max_payout_per_submission_cents = COALESCE(${maxPayoutCents}, max_payout_per_submission_cents),
        requirements = COALESCE(${requirements}, requirements),
        recommended_hashtags = COALESCE(${hashtags}, recommended_hashtags),
        required_hashtags = CASE WHEN ${hasReqHashtags} THEN ${requiredHashtags} ELSE required_hashtags END,
        require_ftc = COALESCE(${requireFtc}, require_ftc),
        min_video_length_seconds = CASE WHEN ${hasMinVideoLength} THEN ${minVideoLength} ELSE min_video_length_seconds END,
        caption_requirements = CASE WHEN ${hasCaptionReq} THEN ${captionRequirements} ELSE caption_requirements END,
        content_assets_url = COALESCE(${contentAssetsUrl}, content_assets_url),
        platforms = COALESCE(ARRAY(SELECT * FROM jsonb_array_elements_text(${platforms}::jsonb)), platforms),
        youtube_video_url = CASE WHEN ${hasYoutubeUrl} THEN ${youtubeVideoUrl} ELSE youtube_video_url END,
        gallery_images = CASE WHEN ${hasGalleryImages} THEN ${galleryImages}::jsonb ELSE gallery_images END,
        updated_at = NOW()
      WHERE id = ${campaignId}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (e: any) {
    console.error('Campaign PATCH error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
