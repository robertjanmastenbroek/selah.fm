import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import crypto from 'crypto';
import { generateCampaignDefaults } from '@/lib/defaults';
import { trackCreateCampaign } from '@/lib/analytics-server';

// Allow larger request bodies for campaign creation (cover art can be 5MB+ as data URL)
export const maxDuration = 30; // 30 seconds timeout

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const platform = searchParams.get('platform') || '';
    const minCpm = searchParams.get('minCpm') || '';
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const sort = searchParams.get('sort') || 'newest';

    // If user is authenticated, show only their campaigns (dashboard).
    // If not, show all active/draft campaigns (public browse).
    const { getSession, resolveUserId } = await import('@/lib/auth');
    const session = getSession(request);
    const isOwnerView = !!session;

    let campaigns;
    // ORDER BY must be raw SQL — cannot use sql`` helper (returns object, not string)
    const pinSort = `c.is_pinned DESC NULLS LAST`;
    
    if (isOwnerView) {
      const userId = session.id || await resolveUserId(session);
      const orderClause = sort === 'popular'
        ? `${pinSort}, COALESCE(v.total_verified_views, '0')::int DESC, c.created_at DESC`
        : `${pinSort}, c.created_at DESC`;
      campaigns = await sql`
        SELECT c.*, 
          COALESCE(c.title, c.track_title) as title,
          COALESCE(v.approved_submissions, '0') as approved_submissions,
          COALESCE(v.pending_submissions, '0') as pending_submissions,
          COALESCE(v.total_verified_views, '0') as total_verified_views,
          COALESCE(u.display_name, da.artist_name) as artist_name,
          u.profile_image_url as artist_avatar
        FROM campaigns c
        LEFT JOIN campaign_stats v ON v.id = c.id
        LEFT JOIN users u ON u.id = c.artist_id
        LEFT JOIN campaign_claims cc ON cc.campaign_id = c.id
        LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id
        WHERE c.artist_id = ${userId}
        ORDER BY ${orderClause}
        LIMIT ${limit}
      `;
    } else {
      // Public browse: sort by pinned → budget utilization % → total budget → date
      const orderClause2 = `${pinSort},
        CASE WHEN c.total_budget_cents > 0 
          THEN (c.total_budget_cents - c.budget_remaining_cents)::float / c.total_budget_cents 
          ELSE 0 
        END DESC,
        c.total_budget_cents DESC,
        c.created_at DESC`;
      campaigns = await sql`
        SELECT c.*, 
          COALESCE(c.title, c.track_title) as title,
          COALESCE(v.approved_submissions, '0') as approved_submissions,
          COALESCE(v.pending_submissions, '0') as pending_submissions,
          COALESCE(v.total_verified_views, '0') as total_verified_views,
          COALESCE(u.display_name, da.artist_name) as artist_name,
          u.profile_image_url as artist_avatar
        FROM campaigns c
        LEFT JOIN campaign_stats v ON v.id = c.id
        LEFT JOIN users u ON u.id = c.artist_id
        LEFT JOIN campaign_claims cc ON cc.campaign_id = c.id
        LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id
        WHERE c.status IN ('active', 'draft')
        ORDER BY ${orderClause2}
        LIMIT ${limit}
      `;
    }

    let filtered = campaigns;
    
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((c: any) => 
        (c.title || c.track_title)?.toLowerCase().includes(q) ||
        (c.recommended_hashtags || '').toLowerCase().includes(q) ||
        (c.artist_name || '').toLowerCase().includes(q)
      );
    }
    
    if (platform) {
      filtered = filtered.filter((c: any) => 
        Array.isArray(c.platforms) && c.platforms.includes(platform)
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
  const { rateLimit, getRateLimitKey } = await import('@/lib/rate-limit');
  const rl = rateLimit(getRateLimitKey(request), { maxRequests: 5, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });

  try {
    const body = await request.json();
    const { validateCampaignInput } = await import('@/lib/validation');
    const { getSession, resolveUserId } = await import('@/lib/auth');

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

    const userId = session.id || await resolveUserId(session);

    // Fetch display_name and genres for auto-generated defaults
    const profile = await sql`SELECT display_name, genres FROM users WHERE id = ${userId}`;
    const artistName = profile.length > 0 ? profile[0].display_name : session.name;
    const artistGenres = profile.length > 0 ? profile[0].genres : null;

    // Auto-generate defaults for empty fields
    const defaults = generateCampaignDefaults(trackTitle, artistGenres, artistName);

    const finalRequirements = requirements || defaults.requirements;
    const finalHashtags = hashtags || defaults.hashtags;
    const finalCaption = captionRequirements || defaults.captionRequirements;
    const finalMinLength = minVideoLength || defaults.minVideoLengthSeconds;

    // Auto-generate SEO slug: artist_name-track_title
    const slugSource = `${artistName}-${trackTitle}`.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 100);
    const uniqueSlug = slugSource + '-' + crypto.randomUUID().slice(0, 4);

    const result = await sql`
      INSERT INTO campaigns (
        artist_id, track_title, title, slug, track_url, 
        cpm_rate_cents, total_budget_cents, max_payout_per_submission_cents, budget_remaining_cents,
        status, content_assets_url, recommended_hashtags, requirements, cover_art_url,
        required_hashtags, require_ftc, min_video_length_seconds, caption_requirements
      )
      VALUES (
        ${userId}, ${trackTitle}, ${body.title || null}, ${uniqueSlug}, ${trackUrl}, 
        ${cpmRate * 100}, ${budget * 100}, ${maxPayout * 100}, ${budget * 100},
        'active', ${driveUrl || ''}, ${finalHashtags}, ${finalRequirements}, ${coverArtUrl || null},
        ${requiredHashtags || null}, ${requireFtc || false}, ${finalMinLength}, ${finalCaption}
      )
      RETURNING *
    `;
    // Server-side GA tracking
    trackCreateCampaign(trackTitle, budget || 0, userId).catch(() => {});
    return NextResponse.json(result[0]);
  } catch (e: any) {
    console.error('Campaign POST error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
