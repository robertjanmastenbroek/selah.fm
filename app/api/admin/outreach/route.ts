import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';
import { discoverArtists, auditArtist, renderOutreachMessage, renderFollowUpMessage } from '@/lib/outreach';
import { generateArticle, findVoiceExamples } from '@/lib/blog-engine';
import { fetchBlogImage } from '@/lib/blog-images';

export const maxDuration = 180; // 3 minutes — 20 searches + up to 200 artist lookups

// ── POST /api/admin/outreach ──────────────────────────────────────

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await request.json();
  const action = body.action;

  try {
    switch (action) {
      case 'discover':               return runDiscovery(body.query, body.limit);
      case 'audit':                  return runAudit(body.artistId);
      case 'create_campaign':        return runCreateCampaign(body.artistId);
      case 'render_outreach':        return runRenderOutreach(body.artistId);
      case 'render_follow_up':       return runRenderFollowUp(body.artistId);
      case 'log_outreach':           return runLogOutreach(body.artistId, body.channel, body.status);
      case 'get_pipeline':           return getPipelineOverview();
      case 'get_artist':             return getArtistById(body.artistId);
      default: return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (e: any) {
    console.error('Outreach error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── GET /api/admin/outreach ───────────────────────────────────────

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const artistId = searchParams.get('artistId');

  try {
    if (artistId) return getArtistById(artistId);
    return getPipelineOverview();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── Action Handlers ───────────────────────────────────────────────

async function runDiscovery(query: string = 'year:2025-2026', limit: number = 10) {
  try {
  const result = await discoverArtists(query, limit || 10);
  const { artists, diagnostics, channels } = result;
  
  // Store in database
  let stored = 0;
  for (const a of artists) {
    const existing = await sql`SELECT id FROM discovered_artists WHERE spotify_id = ${a.spotify_id}`;
    if (existing.length > 0) continue;

    await sql`
      INSERT INTO discovered_artists (
        artist_name, spotify_id, genres, monthly_listeners, followers,
        social_links, latest_track_name, latest_track_spotify_url,
        latest_track_cover_url, latest_release_date, discovery_source,
        ai_signals_detected, is_ai_artist, status
      ) VALUES (
        ${a.artist_name}, ${a.spotify_id}, ${a.genres}, ${a.monthly_listeners}, ${a.followers},
        ${JSON.stringify(a.social_links)}, ${a.latest_track_name}, ${a.latest_track_spotify_url},
        ${a.latest_track_cover_url}, ${a.latest_release_date || null}, ${a.discovery_source},
        ${a.ai_signals_detected}, ${a.is_ai_artist}, 'discovered'
      )
    `;
    stored++;
  }

  const [count] = await sql`SELECT COUNT(*)::int FROM discovered_artists`;
  const [awaiting] = await sql`SELECT COUNT(*)::int FROM discovered_artists WHERE status = 'discovered'`;

  return NextResponse.json({
    discovered: artists.length,
    stored,
    total_in_db: count?.count || 0,
    awaiting_audit: awaiting?.count || 0,
    artists: artists.slice(0, 5),
    diagnostics,
    channels,
  });
  } catch (e: any) {
    console.error('Discovery error:', e.message);
    return NextResponse.json({
      error: e.message,
      discovered: 0,
      stored: 0,
      total_in_db: 0,
      awaiting_audit: 0,
      artists: [],
      diagnostics: [`❌ Discovery crashed: ${e.message}`],
    });
  }
}

async function runAudit(artistId: string) {
  // Get artist from DB
  const [artist] = await sql`SELECT * FROM discovered_artists WHERE id = ${artistId}`;
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

  // Run audit via YouTube
  const audit = await auditArtist(artist.artist_name, artist.latest_track_name, artist.genres || []);
  if (!audit) return NextResponse.json({ error: 'Audit failed' }, { status: 500 });

  // Store audit
  await sql`
    INSERT INTO artist_audits (
      discovered_artist_id, spotify_monthly_listeners, spotify_track_streams,
      youtube_video_url, youtube_video_views, spotify_embed_url, artist_bio,
      recommended_cpm_cents, recommended_budget_cents,
      instagram_handle, instagram_followers, tiktok_handle, tiktok_followers,
      email_address, website_url, hashtags, personal_angle
    ) VALUES (
      ${artist.id}, ${audit.spotify_monthly_listeners}, ${audit.spotify_track_streams},
      ${audit.youtube_video_url}, ${audit.youtube_video_views}, ${audit.spotify_embed_url}, ${audit.artist_bio},
      ${audit.recommended_cpm_cents}, ${audit.recommended_budget_cents},
      ${audit.instagram_handle}, ${audit.instagram_followers}, ${audit.tiktok_handle}, ${audit.tiktok_followers},
      ${audit.email_address}, ${audit.website_url}, ${audit.hashtags}, ${audit.personal_angle}
    )
  `;

  // Update artist status
  await sql`UPDATE discovered_artists SET status = 'audited', updated_at = NOW() WHERE id = ${artist.id}`;

  return NextResponse.json({ artist, audit, status: 'audited' });
}

async function runCreateCampaign(artistId: string) {
  const [artist] = await sql`SELECT * FROM discovered_artists WHERE id = ${artistId}`;
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

  const [audit] = await sql`SELECT * FROM artist_audits WHERE discovered_artist_id = ${artist.id} ORDER BY audited_at DESC LIMIT 1`;
  if (!audit) return NextResponse.json({ error: 'No audit found — run audit first' }, { status: 400 });

  const slug = `${artist.artist_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${artist.latest_track_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${crypto.randomUUID().slice(0, 4)}`.slice(0, 100);

  // Try to get cover art — use Spotify CDN URL or fallback
  let coverArtUrl = artist.latest_track_cover_url || '/images/og-image.jpg';
  // If it's a Spotify CDN URL, download and cache it
  if (coverArtUrl.startsWith('https://i.scdn.co/')) {
    try {
      const imgRes = await fetch(coverArtUrl);
      if (imgRes.ok) {
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const fs = await import('fs');
        const path = await import('path');
        const dir = path.join(process.cwd(), 'public/images/campaigns');
        fs.mkdirSync(dir, { recursive: true });
        const filename = `campaign-${artist.spotify_id?.slice(0, 8) || 'outreach'}-${Date.now().toString(36)}.jpg`;
        fs.writeFileSync(path.join(dir, filename), buffer);
        coverArtUrl = `/images/campaigns/${filename}`;
      }
    } catch {}
  }

  const [campaign] = await sql`
    INSERT INTO campaigns (
      artist_id, track_title, title, slug, cover_art_url, track_url,
      cpm_rate_cents, max_payout_per_submission_cents,
      requirements, recommended_hashtags, platforms,
      youtube_video_url, is_unclaimed, status
    ) VALUES (
      (SELECT id FROM users WHERE email = 'info@selah.fm' LIMIT 1),
      ${artist.latest_track_name || artist.artist_name},
      ${`${artist.artist_name} — ${artist.latest_track_name || 'Latest Release'}`},
      ${slug},
      ${coverArtUrl},
      ${artist.latest_track_spotify_url || ''},
      ${audit.recommended_cpm_cents || 10},
      ${audit.recommended_budget_cents || 10000},
      ${'Make a video featuring this track. Any style. Any length. No minimum followers. Just good content.'},
      ${audit.hashtags || []},
      ${JSON.stringify(['tiktok', 'instagram', 'youtube'])},
      ${audit.youtube_video_url || null},
      true,
      'active'
    )
    RETURNING *
  `;

  // Generate claim code
  const claimCode = crypto.randomUUID();
  await sql`
    INSERT INTO campaign_claims (campaign_id, discovered_artist_id, claim_code)
    VALUES (${campaign.id}, ${artist.id}, ${claimCode})
  `;

  // Update artist status
  await sql`UPDATE discovered_artists SET status = 'campaign_created', updated_at = NOW() WHERE id = ${artist.id}`;

  const campaignUrl = `https://selah.fm/c/${campaign.slug}`;
  const claimUrl = `https://selah.fm/claim/${claimCode}`;

  return NextResponse.json({
    campaign,
    campaign_url: campaignUrl,
    claim_url: claimUrl,
    claim_code: claimCode,
  });
}

async function runRenderOutreach(artistId: string) {
  const [artist] = await sql`SELECT * FROM discovered_artists WHERE id = ${artistId}`;
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

  const [audit] = await sql`SELECT * FROM artist_audits WHERE discovered_artist_id = ${artist.id} ORDER BY audited_at DESC LIMIT 1`;
  if (!audit) return NextResponse.json({ error: 'No audit found' }, { status: 400 });

  const [claim] = await sql`SELECT * FROM campaign_claims WHERE discovered_artist_id = ${artist.id} ORDER BY created_at DESC LIMIT 1`;
  if (!claim) return NextResponse.json({ error: 'No campaign created yet' }, { status: 400 });

  const [campaign] = await sql`SELECT slug FROM campaigns WHERE id = ${claim.campaign_id}`;
  const campaignUrl = `https://selah.fm/c/${campaign?.slug || ''}`;

  // Reconstruct audit object from DB row
  const auditObj = {
    spotify_monthly_listeners: audit.spotify_monthly_listeners,
    spotify_track_streams: audit.spotify_track_streams,
    youtube_video_url: audit.youtube_video_url,
    youtube_video_views: audit.youtube_video_views,
    spotify_embed_url: audit.spotify_embed_url,
    artist_bio: audit.artist_bio,
    recommended_cpm_cents: audit.recommended_cpm_cents,
    recommended_budget_cents: audit.recommended_budget_cents,
    instagram_handle: audit.instagram_handle,
    instagram_followers: audit.instagram_followers,
    tiktok_handle: audit.tiktok_handle,
    tiktok_followers: audit.tiktok_followers,
    email_address: audit.email_address,
    website_url: audit.website_url,
    hashtags: audit.hashtags || [],
    personal_angle: audit.personal_angle,
  };

  const message = renderOutreachMessage(
    artist.artist_name,
    artist.latest_track_name || 'your latest track',
    auditObj,
    campaignUrl
  );

  return NextResponse.json({
    message,
    artist_name: artist.artist_name,
    track_name: artist.latest_track_name,
    campaign_url: campaignUrl,
    instagram_handle: audit.instagram_handle,
    email_address: audit.email_address,
  });
}

async function runRenderFollowUp(artistId: string) {
  const [artist] = await sql`SELECT * FROM discovered_artists WHERE id = ${artistId}`;
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

  // Check if follow-up already exists
  const [existingFollowUp] = await sql`
    SELECT id FROM outreach_log
    WHERE discovered_artist_id = ${artist.id} AND message_type = 'follow_up'
    LIMIT 1
  `;
  if (existingFollowUp) {
    return NextResponse.json({ error: 'Follow-up already sent for this artist' }, { status: 400 });
  }

  // Check if initial outreach was sent at least 7 days ago
  const [initialOutreach] = await sql`
    SELECT * FROM outreach_log
    WHERE discovered_artist_id = ${artist.id} AND message_type = 'initial'
    ORDER BY created_at DESC LIMIT 1
  `;
  if (!initialOutreach) {
    return NextResponse.json({ error: 'No initial outreach found' }, { status: 400 });
  }

  const [claim] = await sql`SELECT * FROM campaign_claims WHERE discovered_artist_id = ${artist.id} ORDER BY created_at DESC LIMIT 1`;
  if (!claim) return NextResponse.json({ error: 'No campaign found' }, { status: 400 });

  const [campaign] = await sql`SELECT slug FROM campaigns WHERE id = ${claim.campaign_id}`;
  const campaignUrl = `https://selah.fm/c/${campaign?.slug || ''}`;

  // Get social proof
  const [donations] = await sql`
    SELECT COUNT(*)::int as count, COALESCE(SUM(amount_cents)::int, 0) as total
    FROM campaign_donations WHERE campaign_id = ${claim.campaign_id}
  `;
  const [submissions] = await sql`
    SELECT COUNT(*)::int as count
    FROM submissions WHERE campaign_id = ${claim.campaign_id}
  `;

  const message = renderFollowUpMessage(
    artist.artist_name,
    artist.latest_track_name || 'your latest track',
    campaignUrl,
    donations?.count || 0,
    (donations?.total || 0) / 100,
    submissions?.count || 0,
  );

  return NextResponse.json({
    message,
    artist_name: artist.artist_name,
    track_name: artist.latest_track_name,
    campaign_url: campaignUrl,
    donations: donations?.count || 0,
    submission_count: submissions?.count || 0,
    initial_sent_at: initialOutreach.created_at,
    ready_to_send: true,
  });
}

async function runLogOutreach(artistId: string, channel: string, status: string) {
  const [artist] = await sql`SELECT * FROM discovered_artists WHERE id = ${artistId}`;
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

  const [claim] = await sql`SELECT * FROM campaign_claims WHERE discovered_artist_id = ${artist.id} ORDER BY created_at DESC LIMIT 1`;

  // Get the rendered message for logging
  const [audit] = await sql`SELECT * FROM artist_audits WHERE discovered_artist_id = ${artist.id} ORDER BY audited_at DESC LIMIT 1`;
  const [campaign] = await sql`SELECT slug FROM campaigns WHERE id = ${claim?.campaign_id}`;
  const campaignUrl = `https://selah.fm/c/${campaign?.slug || ''}`;

  let messageText = '';
  if (audit) {
    const auditObj = {
      spotify_monthly_listeners: audit.spotify_monthly_listeners,
      spotify_track_streams: audit.spotify_track_streams,
      youtube_video_url: audit.youtube_video_url,
      youtube_video_views: audit.youtube_video_views,
      spotify_embed_url: audit.spotify_embed_url,
      artist_bio: audit.artist_bio,
      recommended_cpm_cents: audit.recommended_cpm_cents,
      recommended_budget_cents: audit.recommended_budget_cents,
      instagram_handle: audit.instagram_handle,
      instagram_followers: audit.instagram_followers,
      tiktok_handle: audit.tiktok_handle,
      tiktok_followers: audit.tiktok_followers,
      email_address: audit.email_address,
      website_url: audit.website_url,
      hashtags: audit.hashtags || [],
      personal_angle: audit.personal_angle,
    };
    messageText = renderOutreachMessage(artist.artist_name, artist.latest_track_name || '', auditObj, campaignUrl);
  }

  await sql`
    INSERT INTO outreach_log (
      discovered_artist_id, campaign_id, channel, message_type,
      message_text, status, delivered_at
    ) VALUES (
      ${artist.id}, ${claim?.campaign_id || null}, ${channel}, 'initial',
      ${messageText}, ${status}, ${status === 'sent' ? new Date().toISOString() : null}
    )
  `;

  // Update artist status
  await sql`UPDATE discovered_artists SET status = 'outreach_sent', updated_at = NOW() WHERE id = ${artist.id}`;

  return NextResponse.json({ logged: true, channel, status });
}

// ── Query Handlers ────────────────────────────────────────────────

async function getPipelineOverview() {
  const [totalDiscovered] = await sql`SELECT COUNT(*)::int FROM discovered_artists`;
  const [totalAudited] = await sql`SELECT COUNT(*)::int FROM discovered_artists WHERE status = 'audited'`;
  const [totalCampaignsCreated] = await sql`SELECT COUNT(*)::int FROM discovered_artists WHERE status = 'campaign_created'`;
  const [totalOutreachSent] = await sql`SELECT COUNT(*)::int FROM discovered_artists WHERE status = 'outreach_sent'`;
  const [totalClaimed] = await sql`SELECT COUNT(*)::int FROM discovered_artists WHERE status = 'claimed'`;
  const [totalDeclined] = await sql`SELECT COUNT(*)::int FROM discovered_artists WHERE status = 'declined'`;
  const [awaitingAudit] = await sql`SELECT COUNT(*)::int FROM discovered_artists WHERE status = 'discovered'`;
  const [totalOutreach] = await sql`SELECT COUNT(*)::int FROM outreach_log`;
  const [repliesReceived] = await sql`SELECT COUNT(*)::int FROM outreach_log WHERE status = 'replied'`;

  // Recent discoveries
  const recent = await sql`
    SELECT * FROM discovered_artists ORDER BY discovered_at DESC LIMIT 10
  `;

  return NextResponse.json({
    pipeline: {
      discovered: totalDiscovered?.count || 0,
      awaiting_audit: awaitingAudit?.count || 0,
      audited: totalAudited?.count || 0,
      campaigns_created: totalCampaignsCreated?.count || 0,
      outreach_sent: totalOutreachSent?.count || 0,
      claimed: totalClaimed?.count || 0,
      declined: totalDeclined?.count || 0,
    },
    outreach: {
      total_sent: totalOutreach?.count || 0,
      replies: repliesReceived?.count || 0,
    },
    recent: recent.slice(0, 5),
  });
}

async function getArtistById(artistId: string) {
  const [artist] = await sql`SELECT * FROM discovered_artists WHERE id = ${artistId}`;
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

  const [audit] = await sql`SELECT * FROM artist_audits WHERE discovered_artist_id = ${artist.id} ORDER BY audited_at DESC LIMIT 1`;
  const [outreach] = await sql`SELECT * FROM outreach_log WHERE discovered_artist_id = ${artist.id} ORDER BY created_at DESC LIMIT 1`;
  const [claim] = await sql`SELECT * FROM campaign_claims WHERE discovered_artist_id = ${artist.id} ORDER BY created_at DESC LIMIT 1`;

  let campaign = null;
  if (claim?.campaign_id) {
    const [c] = await sql`SELECT id, slug, title, status, is_unclaimed FROM campaigns WHERE id = ${claim.campaign_id}`;
    campaign = c || null;
  }

  return NextResponse.json({ artist, audit, outreach, claim, campaign });
}
