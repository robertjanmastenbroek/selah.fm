import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import crypto from 'crypto';
import { generateCampaignDefaults } from '@/lib/defaults';
import { trackCreateCampaign } from '@/lib/analytics-server';

export const dynamic = 'force-dynamic';
// Allow larger request bodies for campaign creation (cover art can be 5MB+ as data URL)
export const maxDuration = 30; // 30 seconds timeout

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || searchParams.get('q') || '';
    const platform = searchParams.get('platform') || '';
    const genre = searchParams.get('genre') || '';
    const cpmMin = parseInt(searchParams.get('cpm_min') || '0');
    const cpmMax = parseInt(searchParams.get('cpm_max') || '0');
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const sort = searchParams.get('sort') || 'popular';

    // If user is authenticated, show only their campaigns (dashboard).
    // If not, show all active/draft campaigns (public browse).
    const { getSession } = await import('@/lib/auth');
    const session = await getSession(request);
    const isOwnerView = !!session;

    // ORDER BY must be raw SQL — cannot use sql`` helper (returns object, not string)
    const pinSort = `c.is_pinned DESC NULLS LAST`;

    // Build sort order clause
    // isOwnerView flag: when true, skip donations subquery references (dashboard view
    // doesn't include the donations LEFT JOIN) and default to newest-first ordering.
    function orderClause(isOwner: boolean = false) {
      const c = (col: string) => `c.${col}`;
      // Owner dashboard: newest first by default; donations not available in FROM
      if (isOwner) {
        switch (sort) {
          case 'popular':
          case 'newest':
          case 'recent':
            return `${pinSort}, ${c('created_at')} DESC`;
          case 'highest_cpm':
            return `${pinSort}, ${c('cpm_rate_cents')} DESC NULLS LAST`;
          case 'most_funded':
            return `${pinSort}, (${c('total_budget_cents')} - ${c('budget_remaining_cents')}) DESC NULLS LAST`;
          case 'most_views':
            return `${pinSort}, COALESCE(v.total_verified_views, '0')::int DESC NULLS LAST, ${c('created_at')} DESC`;
          default:
            return `${pinSort}, ${c('created_at')} DESC`;
        }
      }
      // Public browse: full popularity sort with donations
      switch (sort) {
        case 'newest':
        case 'recent':
          return `${pinSort}, ${c('created_at')} DESC`;
        case 'highest_cpm':
          return `${pinSort}, ${c('cpm_rate_cents')} DESC NULLS LAST`;
        case 'most_funded':
          return `${pinSort}, (${c('total_budget_cents')} - ${c('budget_remaining_cents')}) DESC NULLS LAST`;
        case 'most_views':
          return `${pinSort}, COALESCE(v.total_verified_views, '0')::int DESC NULLS LAST, ${c('created_at')} DESC`;
        default: // popular
          return `${pinSort},
            (COALESCE(v.approved_submissions, '0')::int * 100 +
             COALESCE(v.total_verified_views, '0')::float / 1000 +
             CASE WHEN ${c('total_budget_cents')} > 0 
               THEN (${c('total_budget_cents')} - ${c('budget_remaining_cents')})::float / ${c('total_budget_cents')} * 50 
               ELSE 0 END +
             COALESCE(donations.total_cents, 0)::float / 100
            ) + RANDOM() * 200 DESC`;
      }
    }

    // Build WHERE conditions and params array
    const conditions: string[] = [];
    const params: any[] = [];
    let p = (v: any) => { params.push(v); return params.length; };

    if (isOwnerView) {
      conditions.push(`c.artist_id = $${p(session.id)}`);
    } else {
      conditions.push(`c.status IN ('active', 'draft')`);
    }

    if (search) {
      conditions.push(`(COALESCE(c.title, c.track_title) ILIKE '%' || $${p(search)} || '%' OR COALESCE(u.display_name, da.artist_name) ILIKE '%' || $${p(search)} || '%')`);
    }

    if (platform) {
      conditions.push(`$${p(platform)} = ANY(c.platforms)`);
    }

    if (genre) {
      conditions.push(`(da.genres ILIKE '%' || $${p(genre)} || '%')`);
    }

    if (cpmMin > 0) {
      conditions.push(`c.cpm_rate_cents >= $${p(cpmMin)}`);
    }

    if (cpmMax > 0) {
      conditions.push(`c.cpm_rate_cents <= $${p(cpmMax)}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitIdx = p(limit);

    let campaigns;

    if (isOwnerView) {
      const query = `
        SELECT c.*,
          COALESCE(c.title, c.track_title) as title,
          COALESCE(v.approved_submissions, '0') as approved_submissions,
          COALESCE(v.pending_submissions, '0') as pending_submissions,
          COALESCE(v.total_verified_views, '0') as total_verified_views,
          COALESCE(da.artist_name, u.display_name) as artist_name,
          ap.slug as artist_slug,
          COALESCE(ap.spotify_image_url, da.latest_track_cover_url, u.profile_image_url) as artist_avatar
        FROM campaigns c
        LEFT JOIN campaign_stats v ON v.id = c.id
        LEFT JOIN users u ON u.id = c.artist_id
        LEFT JOIN campaign_claims cc ON cc.campaign_id = c.id
        LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id
        LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
        ${whereClause}
        ORDER BY ${orderClause(isOwnerView)}
        LIMIT $${limitIdx}
      `;
      campaigns = await sql.raw(query, params);
    } else {
      // Public browsing
      const query = `
        SELECT c.*,
          COALESCE(c.title, c.track_title) as title,
          COALESCE(v.approved_submissions, '0') as approved_submissions,
          COALESCE(v.pending_submissions, '0') as pending_submissions,
          COALESCE(v.total_verified_views, '0') as total_verified_views,
          COALESCE(da.artist_name, u.display_name) as artist_name,
          ap.slug as artist_slug,
          c.artist_id,
          u.is_creator as artist_is_creator,
          COALESCE(ap.spotify_image_url, da.latest_track_cover_url, u.profile_image_url) as artist_avatar,
          COALESCE(donations.total_cents, 0) as donation_total_cents,
          COALESCE(donations.donation_count, 0) as donation_count
        FROM campaigns c
        LEFT JOIN campaign_stats v ON v.id = c.id
        LEFT JOIN users u ON u.id = c.artist_id
        LEFT JOIN campaign_claims cc ON cc.campaign_id = c.id
        LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id
        LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
        LEFT JOIN (
          SELECT campaign_id, COALESCE(SUM(amount_cents), 0) as total_cents, COUNT(*) as donation_count
          FROM campaign_donations GROUP BY campaign_id
        ) donations ON donations.campaign_id = c.id
        ${whereClause}
        ORDER BY ${orderClause(isOwnerView)}
        LIMIT $${limitIdx}
      `;
      campaigns = await sql.raw(query, params);
    }

    // Total count: re-run with just the WHERE (no ORDER BY/LIMIT)
    let total = campaigns.length;
    try {
      const countParams = params.slice(0, -1); // remove limit param
      const countWhere = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const countQuery = isOwnerView
        ? `SELECT COUNT(*)::int FROM campaigns c LEFT JOIN campaign_claims cc ON cc.campaign_id = c.id LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id LEFT JOIN users u ON u.id = c.artist_id ${countWhere}`
        : `SELECT COUNT(*)::int FROM campaigns c LEFT JOIN campaign_claims cc ON cc.campaign_id = c.id LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id LEFT JOIN users u ON u.id = c.artist_id ${countWhere}`;
      const countResult = await sql.raw(countQuery, countParams);
      total = countResult[0]?.count || total;
    } catch (e: any) { console.error('Unhandled error in api/campaigns/route.ts:', e); }

    const page = campaigns.slice(offset, offset + limit);

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
  const rl = await rateLimit(getRateLimitKey(request), { maxRequests: 5, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });

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

    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.id;

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

    // Handle cover art: store binary in campaign_images, serve from API
    let finalCoverArt = coverArtUrl || null;
    let imageBuffer: Buffer | null = null;
    let imageMime = 'image/jpeg';
    if (coverArtUrl && coverArtUrl.startsWith('data:')) {
      const match = coverArtUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (match) {
        try {
          imageMime = `image/${match[1] === 'jpeg' ? 'jpeg' : match[1]}`;
          imageBuffer = Buffer.from(match[2], 'base64');
          // Don't set finalCoverArt yet — we'll set it after we have the campaign ID
        } catch (e: any) { console.error('Unhandled error in api/campaigns/route.ts:', e); }
      }
    }

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
        'active', ${driveUrl || ''}, ${finalHashtags}, ${finalRequirements}, ${finalCoverArt},
        ${requiredHashtags || null}, ${requireFtc || false}, ${finalMinLength}, ${finalCaption}
      )
      RETURNING *
    `;

    // Store image in campaign_images and update cover_art_url to API format
    if (imageBuffer) {
      await sql`INSERT INTO campaign_images (campaign_id, data, mime) VALUES (${result[0].id}, ${imageBuffer}, ${imageMime})`;
      const ext = imageMime.includes('png') ? 'png' : 'jpg';
      const shortId = result[0].id.replace(/-/g, '').slice(0, 12);
      const apiUrl = `/api/images/campaign/${shortId}.${ext}`;
      await sql`UPDATE campaigns SET cover_art_url = ${apiUrl} WHERE id = ${result[0].id}`;
      result[0].cover_art_url = apiUrl;
    }

    // Server-side GA tracking
    trackCreateCampaign(trackTitle, budget || 0, userId).catch(e => console.error('Async error in api/campaigns/route.ts:', e));
    return NextResponse.json(result[0]);
  } catch (e: any) {
    console.error('Campaign POST error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}