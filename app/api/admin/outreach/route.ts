import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';
import { discoverArtists, auditArtist, renderOutreachMessage, renderFollowUpMessage, generateOutreachMessage } from '@/lib/outreach';
import { generateArticle, findVoiceExamples } from '@/lib/blog-engine';
import { fetchBlogImage } from '@/lib/blog-images';
import { renderArtistOutreachEmail, generateOutreachEmail, sendOutreachEmail } from '@/lib/email-outreach';
import { emailWrapper } from '@/lib/email-templates';

export const maxDuration = 180; // 3 minutes — 20 searches + up to 200 artist lookups

// ── POST /api/admin/outreach ──────────────────────────────────────

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
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
      case 'decline':                return runDecline(body.artistId);
      case 'batch_audit':           return runBatchAudit(body.limit || 5);
      case 'get_pipeline':           return getPipelineOverview();
      case 'get_artist':             return getArtistById(body.artistId);
      case 'get_outreach_queue':     return getOutreachQueue();
      case 'repair_campaign_images': return repairCampaignImages();
      case 'get_ready_for_campaign': return getReadyForCampaign();
      case 'get_email_queue':        return getEmailQueue();
      case 'render_email':           return runRenderEmail(body.artistId);
      case 'send_email':             return runSendEmail(body.artistId);
      default: return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (e: any) {
    console.error('Outreach error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── GET /api/admin/outreach ───────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const secret = searchParams.get('secret');

  // Allow repair with secret (like cron endpoints) or admin session
  const isRepairWithSecret = action === 'repair_campaign_images' && secret && secret === process.env.CRON_SECRET;
  if (!isRepairWithSecret && !(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const artistId = searchParams.get('artistId');

  try {
    if (action === 'repair_campaign_images') return repairCampaignImages();
    if (artistId) return getArtistById(artistId);
    return getPipelineOverview();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── Action Handlers ───────────────────────────────────────────────

async function runDiscovery(query: string = 'year:2025-2026', limit: number = 10) {
  try {
  // Multi-channel discovery: Reddit + Bandcamp + YouTube → Spotify cross-reference
  const result = await discoverArtists(limit || 10);
  const { artists, diagnostics, channels } = result;
  
  // Store in database — REQUIRE both artist name AND track name
  let stored = 0;
  for (const a of artists) {
    if (!a.artist_name || a.artist_name.length < 2) continue;
    if (!a.latest_track_name || a.latest_track_name.length < 2) continue;

    // Dedup: check by spotify_id if non-empty, otherwise by artist_name + track_name
    if (a.spotify_id) {
      const existing = await sql`SELECT id FROM discovered_artists WHERE spotify_id = ${a.spotify_id}`;
      if (existing.length > 0) continue;
    } else {
      const existing = await sql`SELECT id FROM discovered_artists WHERE artist_name = ${a.artist_name} AND latest_track_name = ${a.latest_track_name}`;
      if (existing.length > 0) continue;
    }

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

  // Skip if already audited or beyond
  if (artist.status !== 'discovered') {
    return NextResponse.json({ error: `Artist is already ${artist.status} — cannot re-audit` }, { status: 400 });
  }

  // Run audit via YouTube + Bandcamp social discovery
  const socialLinks = typeof artist.social_links === 'string' ? JSON.parse(artist.social_links) : (artist.social_links || {});
  const bandcampUrl = socialLinks.bandcamp || '';
  const audit = await auditArtist(artist.artist_name, artist.latest_track_name, artist.genres || [], bandcampUrl, socialLinks);
  if (!audit) return NextResponse.json({ error: 'Audit failed' }, { status: 500 });

  // Store audit (even without IG — campaign creation gate handles the IG check)
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

  // Prevent duplicate campaigns — check if claim already exists
  const [existingClaim] = await sql`SELECT id, campaign_id FROM campaign_claims WHERE discovered_artist_id = ${artist.id} LIMIT 1`;
  if (existingClaim) {
    const [existingCampaign] = await sql`SELECT slug FROM campaigns WHERE id = ${existingClaim.campaign_id}`;
    const campaignUrl = existingCampaign ? `https://selah.fm/c/${existingCampaign.slug}` : null;
    return NextResponse.json({
      error: 'Campaign already exists for this artist',
      campaign_url: campaignUrl,
    }, { status: 409 });
  }

  const [audit] = await sql`SELECT * FROM artist_audits WHERE discovered_artist_id = ${artist.id} ORDER BY audited_at DESC LIMIT 1`;
  if (!audit) return NextResponse.json({ error: 'No audit found — run audit first' }, { status: 400 });

  if (!audit.instagram_handle && !audit.tiktok_handle && !audit.email_address) {
    return NextResponse.json({ error: 'No Instagram, TikTok, or email — cannot reach this artist. Campaign not created.' }, { status: 400 });
  }

  // Clean slug: artist-name-track-name-random4 (ASCII only, max 100 chars)
  const artistSlug = (artist.artist_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const trackSlug = (artist.latest_track_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const baseSlug = trackSlug ? `${artistSlug}-${trackSlug}` : artistSlug;
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 4)}`.slice(0, 100).replace(/--+/g, '-').replace(/^-|-$/g, '');

  // Campaign title: "Artist — Track" or "Artist — Latest Release"
  const campaignTitle = artist.latest_track_name
    ? `${artist.artist_name} — ${artist.latest_track_name}`
    : `${artist.artist_name} — Latest Release`;

  // Cover art: 1) Download & store in DB  2) Keep external URL  3) Fallback
  let coverArtUrl = artist.latest_track_cover_url || '';
  let imageData: Buffer | null = null;
  let imageMime = 'image/jpeg';
  if (coverArtUrl && coverArtUrl.startsWith('http')) {
    const result = await downloadImage(coverArtUrl);
    if (result) {
      imageData = result.buffer;
      imageMime = result.mime;
      const ext = coverArtUrl.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)?.[1] || 'jpg';
      const filename = `campaign-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      coverArtUrl = `/images/campaigns/${filename}`;
    }
    // If download failed, keep the external URL as fallback
  }
  if (!coverArtUrl) coverArtUrl = '/images/og-image.jpg';

  const [campaign] = await sql`
    INSERT INTO campaigns (
      artist_id, track_title, title, slug, cover_art_url, track_url,
      cpm_rate_cents, total_budget_cents, budget_remaining_cents,
      max_payout_per_submission_cents,
      requirements, recommended_hashtags, platforms,
      youtube_video_url, is_unclaimed, status
    ) VALUES (
      (SELECT id FROM users WHERE email = 'info@selah.fm' LIMIT 1),
      ${artist.latest_track_name || artist.artist_name},
      ${campaignTitle},
      ${slug},
      ${coverArtUrl},
      ${artist.latest_track_spotify_url || ''},
      ${audit.recommended_cpm_cents || 10},
      0,  /* total_budget_cents — always $0 for auto-generated */
      0,  /* budget_remaining_cents — always $0 */
      ${audit.recommended_budget_cents || 10000},
      ${'Make a video featuring this track. Any style. Any length. No minimum followers. Just good content.'},
      ${audit.hashtags || []},
      ${['tiktok', 'instagram', 'youtube']},
      ${audit.youtube_video_url || null},
      true,
      'active'
    )
    RETURNING *
  `;

  // Store image in campaign_images table (persistent, survives deploys)
  if (imageData) {
    await sql`
      INSERT INTO campaign_images (campaign_id, data, mime)
      VALUES (${campaign.id}, ${imageData}, ${imageMime})
    `;
  }

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

  // Force Facebook/Instagram to re-scrape the new campaign URL
  const fbToken = process.env.FACEBOOK_ACCESS_TOKEN;
  if (fbToken) {
    try {
      await fetch(`https://graph.facebook.com/v18.0/?id=${encodeURIComponent(campaignUrl)}&scrape=true&access_token=${fbToken}`, { method: 'POST' });
    } catch { /* non-critical */ }
  }

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

  // Use AI-powered message if DEEPSEEK_API_KEY is set, fallback to template
  const genre = (audit.hashtags?.[0] || '').replace('#', '') || (artist.genres?.[0] || 'music');
  const message = await generateOutreachMessage(
    artist.artist_name,
    artist.latest_track_name || 'your latest track',
    genre,
    campaignUrl,
    audit.instagram_handle || undefined,
    audit.youtube_video_url || undefined,
    audit.tiktok_handle || undefined,
  );

  return NextResponse.json({
    message,
    artist_name: artist.artist_name,
    track_name: artist.latest_track_name,
    campaign_url: campaignUrl,
    instagram_handle: audit.instagram_handle,
    tiktok_handle: audit.tiktok_handle,
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
  const [totalCampaignsCreated] = await sql`SELECT COUNT(*)::int FROM campaign_claims`;
  const [totalOutreachSent] = await sql`SELECT COUNT(*)::int FROM discovered_artists WHERE status = 'outreach_sent'`;
  const [totalClaimed] = await sql`SELECT COUNT(*)::int FROM discovered_artists WHERE status = 'claimed'`;
  const [totalDeclined] = await sql`SELECT COUNT(*)::int FROM discovered_artists WHERE status = 'declined'`;
  const [awaitingAudit] = await sql`SELECT COUNT(*)::int FROM discovered_artists WHERE status = 'discovered'`;
  const [totalOutreach] = await sql`SELECT COUNT(*)::int FROM outreach_log`;
  const [repliesReceived] = await sql`SELECT COUNT(*)::int FROM outreach_log WHERE status = 'replied'`;

  // Recent discoveries — join with LATEST audit only to avoid duplicate rows
  const recent = await sql`
    SELECT DISTINCT ON (da.id) da.*, aa.instagram_handle, aa.tiktok_handle
    FROM discovered_artists da
    LEFT JOIN artist_audits aa ON aa.discovered_artist_id = da.id
    ORDER BY da.id, aa.audited_at DESC
  `;
  // Sort undiscovered first, then by recency — so fresh artists always show
  const sorted = recent.sort((a: any, b: any) => {
    if (a.status === 'discovered' && b.status !== 'discovered') return -1;
    if (a.status !== 'discovered' && b.status === 'discovered') return 1;
    return new Date(b.discovered_at).getTime() - new Date(a.discovered_at).getTime();
  }).slice(0, 20);

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
    recent: sorted,
  });
}

/** Mark an artist as declined — no social handles, can't reach them */
async function runDecline(artistId: string) {
  await sql`UPDATE discovered_artists SET status = 'declined', updated_at = NOW() WHERE id = ${artistId}`;
  return NextResponse.json({ declined: true });
}

/** Batch audit: audit N discovered artists, auto-skip those without social handles */
async function runBatchAudit(limit: number = 5) {
  const artists = await sql`
    SELECT * FROM discovered_artists
    WHERE status = 'discovered' AND is_ai_artist = false
    ORDER BY discovered_at ASC
    LIMIT ${limit}
  `;

  let audited = 0, skipped = 0;
  for (const artist of artists) {
    try {
      const socialLinks = typeof artist.social_links === 'string' ? JSON.parse(artist.social_links) : (artist.social_links || {});
      const bandcampUrl = socialLinks.bandcamp || '';
      const audit = await auditArtist(artist.artist_name, artist.latest_track_name, artist.genres || [], bandcampUrl, socialLinks);

      if (!audit) {
        await sql`UPDATE discovered_artists SET status = 'declined', updated_at = NOW() WHERE id = ${artist.id}`;
        skipped++;
        continue;
      }

      await sql`
        INSERT INTO artist_audits (discovered_artist_id, spotify_monthly_listeners, spotify_track_streams, youtube_video_url, youtube_video_views, spotify_embed_url, artist_bio, recommended_cpm_cents, recommended_budget_cents, instagram_handle, instagram_followers, tiktok_handle, tiktok_followers, email_address, website_url, hashtags, personal_angle)
        VALUES (${artist.id}, ${audit.spotify_monthly_listeners}, ${audit.spotify_track_streams}, ${audit.youtube_video_url}, ${audit.youtube_video_views}, ${audit.spotify_embed_url}, ${audit.artist_bio}, ${audit.recommended_cpm_cents}, ${audit.recommended_budget_cents}, ${audit.instagram_handle}, ${audit.instagram_followers}, ${audit.tiktok_handle}, ${audit.tiktok_followers}, ${audit.email_address}, ${audit.website_url}, ${audit.hashtags}, ${audit.personal_angle})
      `;
      await sql`UPDATE discovered_artists SET status = 'audited', updated_at = NOW() WHERE id = ${artist.id}`;
      audited++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ audited, skipped });
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

/** Download image from URL with multiple retry strategies */
async function downloadImage(url: string): Promise<{ buffer: Buffer; mime: string } | null> {
  if (!url?.startsWith('http')) return null;

  // Generate all URLs to try
  const urls = [url];
  const bcMatch = url.match(/(https:\/\/f\d+\.bcbits\.com\/img\/a\d+)_\d+\.(jpg|png)/);
  if (bcMatch) {
    urls.push(`${bcMatch[1]}_10.${bcMatch[2]}`, `${bcMatch[1]}_16.${bcMatch[2]}`, `${bcMatch[1]}_2.${bcMatch[2]}`);
  }
  // Also try the Bandcamp page itself to scrape a fresh image URL
  const bandcampPage = url.match(/https?:\/\/([^.]+)\.bandcamp\.com/);
  if (bandcampPage) {
    urls.push(`https://${bandcampPage[1]}.bandcamp.com/`);
  }

  // Header strategies to rotate through
  const headerSets = [
    { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36', 'Accept': 'image/*' } as Record<string, string>,
    { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': '*/*' } as Record<string, string>,
    {} as Record<string, string>,
  ];

  for (const u of urls) {
    for (const headers of headerSets) {
      try {
        const res = await fetch(u, { headers, signal: AbortSignal.timeout(12000) });
        if (!res.ok) continue;

        // If we hit a Bandcamp page, scrape the og:image
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('text/html') && bandcampPage) {
          const html = await res.text();
          const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
          if (ogMatch) {
            const scrapedUrl = ogMatch[1];
            if (scrapedUrl.startsWith('http')) {
              const imgResult = await downloadImage(scrapedUrl); // Recursive try
              if (imgResult) return imgResult;
            }
          }
          continue;
        }

        if (!ct.includes('image/') && !ct.includes('application/octet-stream')) continue;

        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length < 2000) continue;

        const isValidImage = 
          (buffer[0] === 0xFF && buffer[1] === 0xD8) ||
          (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) ||
          (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46);

        if (isValidImage) {
          let mime = 'image/jpeg';
          if (buffer[0] === 0x89) mime = 'image/png';
          else if (buffer[0] === 0x52) mime = 'image/webp';
          return { buffer, mime };
        }
      } catch {}
    }
  }
  return null;
}

/** Repair campaign images — restore from discovered_artists or download + re-host */
async function repairCampaignImages() {
  const [totalCampaigns] = await sql`SELECT COUNT(*)::int FROM campaigns`;
  const [localImages] = await sql`SELECT COUNT(*)::int FROM campaigns WHERE cover_art_url LIKE '/images/campaigns/%'`;
  const [externalUrls] = await sql`SELECT COUNT(*)::int FROM campaigns WHERE cover_art_url LIKE 'http%'`;
  const [ogFallbacks] = await sql`SELECT COUNT(*)::int FROM campaigns WHERE cover_art_url = '/images/og-image.jpg'`;
  const [other] = await sql`SELECT COUNT(*)::int FROM campaigns WHERE cover_art_url IS NULL OR cover_art_url = ''`;

  // Include ALL campaigns that could benefit from image repair
  const campaigns = await sql`
    SELECT c.id, c.slug, c.cover_art_url, da.latest_track_cover_url
    FROM campaigns c
    LEFT JOIN campaign_claims cc ON cc.campaign_id = c.id
    LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id
    WHERE (c.cover_art_url NOT LIKE '/images/campaigns/%'
           OR da.latest_track_cover_url IS NOT NULL)
      AND c.cover_art_url IS NOT NULL AND c.cover_art_url != ''
    ORDER BY c.created_at DESC
    LIMIT 200
  `;

  let restored = 0, downloaded = 0, skipped = 0;

  for (const c of campaigns) {
    const originalUrl = c.latest_track_cover_url;
    const currentUrl = c.cover_art_url;

    // If we have an original URL in discovered_artists, try downloading from there
    const sourceUrl = originalUrl?.startsWith('http') ? originalUrl : currentUrl?.startsWith('http') ? currentUrl : null;
    
    if (sourceUrl) {
      const result = await downloadImage(sourceUrl);
      if (result) {
        const ext = sourceUrl.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)?.[1] || 'jpg';
        const filename = `campaign-${crypto.randomUUID().slice(0, 8)}.${ext}`;
        const imagePath = `/images/campaigns/${filename}`;

        // Store image binary in campaign_images table (survives redeploys)
        await sql`
          INSERT INTO campaign_images (campaign_id, data, mime)
          VALUES (${c.id}::uuid, ${result.buffer}, ${result.mime})
          ON CONFLICT (campaign_id) DO UPDATE SET data = EXCLUDED.data, mime = EXCLUDED.mime
        `;

        await sql`UPDATE campaigns SET cover_art_url = ${imagePath} WHERE id = ${c.id}`;
        if (originalUrl?.startsWith('http') && currentUrl !== originalUrl) {
          restored++;
        } else {
          downloaded++;
        }
        continue;
      }
    }

    skipped++;
  }

  return NextResponse.json({
    restored, downloaded, skipped, total: campaigns.length,
    diag: {
      total_campaigns: totalCampaigns?.count || 0,
      local_images: localImages?.count || 0,
      external_urls: externalUrls?.count || 0,
      og_fallbacks: ogFallbacks?.count || 0,
      empty: other?.count || 0,
    },
  });
}

/** Returns audited artists with social handles — ready for campaign creation */
async function getReadyForCampaign() {
  const artists = await sql`
    SELECT DISTINCT ON (da.id) da.*, aa.instagram_handle, aa.tiktok_handle
    FROM discovered_artists da
    LEFT JOIN artist_audits aa ON aa.discovered_artist_id = da.id
    WHERE da.status = 'audited'
      AND (aa.instagram_handle IS NOT NULL OR aa.tiktok_handle IS NOT NULL)
    ORDER BY da.id, aa.audited_at DESC
    LIMIT 50
  `;
  return NextResponse.json(artists);
}

// ── Email Outreach Handlers ────────────────────────────────────────

/** Preview an email for an artist */
async function runRenderEmail(artistId: string) {
  const [artist] = await sql`SELECT * FROM discovered_artists WHERE id = ${artistId}`;
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

  const [audit] = await sql`SELECT * FROM artist_audits WHERE discovered_artist_id = ${artist.id} ORDER BY audited_at DESC LIMIT 1`;
  if (!audit) return NextResponse.json({ error: 'No audit found' }, { status: 400 });
  if (!audit.email_address) return NextResponse.json({ error: 'No email address for this artist' }, { status: 400 });

  const [claim] = await sql`SELECT * FROM campaign_claims WHERE discovered_artist_id = ${artist.id} ORDER BY created_at DESC LIMIT 1`;
  if (!claim) return NextResponse.json({ error: 'No campaign created yet' }, { status: 400 });

  const [campaign] = await sql`SELECT slug FROM campaigns WHERE id = ${claim.campaign_id}`;
  const campaignUrl = `https://selah.fm/c/${campaign?.slug || ''}`;

  const genre = (audit.hashtags?.[0] || '').replace('#', '') || 'music';
  const email = await generateOutreachEmail(artist.artist_name, artist.latest_track_name, genre, campaignUrl);

  return NextResponse.json({
    to: audit.email_address,
    subject: email.subject,
    body: email.body,
    campaign_url: campaignUrl,
  });
}

/** Send an outreach email to an artist */
async function runSendEmail(artistId: string) {
  const [artist] = await sql`SELECT * FROM discovered_artists WHERE id = ${artistId}`;
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

  const [audit] = await sql`SELECT * FROM artist_audits WHERE discovered_artist_id = ${artist.id} ORDER BY audited_at DESC LIMIT 1`;
  if (!audit) return NextResponse.json({ error: 'No audit found' }, { status: 400 });
  if (!audit.email_address) return NextResponse.json({ error: 'No email address for this artist' }, { status: 400 });

  const [claim] = await sql`SELECT * FROM campaign_claims WHERE discovered_artist_id = ${artist.id} ORDER BY created_at DESC LIMIT 1`;
  if (!claim) return NextResponse.json({ error: 'No campaign created yet' }, { status: 400 });

  const [campaign] = await sql`SELECT slug FROM campaigns WHERE id = ${claim.campaign_id}`;
  const campaignUrl = `https://selah.fm/c/${campaign?.slug || ''}`;

  // Check if email was already sent
  const [existing] = await sql`SELECT id FROM outreach_log WHERE discovered_artist_id = ${artist.id} AND channel = 'email' LIMIT 1`;
  if (existing) return NextResponse.json({ error: 'Email already sent to this artist' }, { status: 409 });

  const genre = (audit.hashtags?.[0] || '').replace('#', '') || 'music';
  const email = await generateOutreachEmail(artist.artist_name, artist.latest_track_name, genre, campaignUrl);
  
  const htmlBody = emailWrapper({
    title: `Your campaign page is live`,
    body: email.body.replace(/\n/g, '<br>'),
    cta: { text: 'View your campaign page →', url: campaignUrl },
  });

  const result = await sendOutreachEmail({
    to: audit.email_address,
    subject: email.subject,
    htmlBody,
  });

  if (result.sent) {
    await sql`
      INSERT INTO outreach_log (discovered_artist_id, campaign_id, channel, message_type, message_text, status, delivered_at)
      VALUES (${artist.id}, ${claim.campaign_id}, 'email', 'initial', ${email.body}, 'sent', NOW())
    `;
    await sql`UPDATE discovered_artists SET status = 'outreach_sent', updated_at = NOW() WHERE id = ${artist.id}`;
  }

  return NextResponse.json(result);
}

/** Get artists with email addresses — ready for email outreach */
async function getEmailQueue() {
  const artists = await sql`
    SELECT DISTINCT ON (da.id) da.*, aa.email_address, aa.personal_angle,
           c.slug as campaign_slug, c.title as campaign_title
    FROM discovered_artists da
    JOIN artist_audits aa ON aa.discovered_artist_id = da.id
    JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
    JOIN campaigns c ON c.id = cc.campaign_id
    WHERE da.status = 'campaign_created'
      AND aa.email_address IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM outreach_log ol WHERE ol.discovered_artist_id = da.id AND ol.channel = 'email')
    ORDER BY da.id, aa.audited_at DESC
    LIMIT 50
  `;
  return NextResponse.json(artists);
}

/** Returns all artists with campaign_created status (ready for outreach) + their audit data */
async function getOutreachQueue() {
  const artists = await sql`
    SELECT DISTINCT ON (da.id) da.*, aa.instagram_handle, aa.tiktok_handle, aa.personal_angle, aa.youtube_video_url,
           c.slug as campaign_slug, c.title as campaign_title
    FROM discovered_artists da
    JOIN artist_audits aa ON aa.discovered_artist_id = da.id
    JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
    JOIN campaigns c ON c.id = cc.campaign_id
    WHERE da.status = 'campaign_created'
      AND (aa.instagram_handle IS NOT NULL OR aa.tiktok_handle IS NOT NULL)
      AND NOT EXISTS (SELECT 1 FROM outreach_log ol WHERE ol.discovered_artist_id = da.id AND ol.status = 'sent')
    ORDER BY da.id, aa.audited_at DESC
    LIMIT 50
  `;

  return NextResponse.json(artists);
}
