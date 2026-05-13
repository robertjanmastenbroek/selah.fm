import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { discoverArtists, auditArtist } from '@/lib/outreach';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for full pipeline run

/**
 * Autonomous outreach pipeline — runs discovery → audit → campaign creation.
 * Called by cron or manual trigger. No admin dashboard needed.
 * 
 * GET /api/cron/outreach-pipeline
 * Optional: ?secret=CRON_SECRET for auth
 */

export async function GET(request: Request) {
  // Optional secret auth
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const log: string[] = [];
  const results = { discovered: 0, audited: 0, campaigns_created: 0, errors: 0 };

  try {
    // ── Phase 1: Discovery ──────────────────────────────────
    const genres = ['indie', 'alternative', 'electronic', 'hip-hop', 'r-n-b', 'pop', 'rock', 'folk', 'metal'];
    const shuffled = [...genres].sort(() => Math.random() - 0.5);
    
    const discoveryLimit = parseInt(searchParams.get('limit') || '5');

    log.push(`Starting multi-channel discovery (Reddit + Bandcamp + YouTube) [limit=${discoveryLimit}]`);

    const discoveryResult = await discoverArtists('year:2025-2026', discoveryLimit);
    const discovered = discoveryResult.artists;
    log.push(...discoveryResult.diagnostics);
    if (discoveryResult.channels) {
      log.push(`Channels: Reddit ${discoveryResult.channels.reddit.candidates}, Bandcamp ${discoveryResult.channels.bandcamp.candidates}, YouTube ${discoveryResult.channels.youtube.candidates}`);
    }

    if (discovered.length === 0) {
      log.push('No artists discovered in this run');
      return NextResponse.json({ results: { ...results, discovered: 0 }, log });
    }

    log.push(`Discovered ${discovered.length} artists`);

    // Store discovered artists
    let stored = 0;
    for (const a of discovered) {
      // Use spotify_id if available, otherwise check by artist_name
      if (a.spotify_id) {
        const existing = await sql`SELECT id FROM discovered_artists WHERE spotify_id = ${a.spotify_id}`;
        if (existing.length > 0) continue;
      } else {
        const existing = await sql`SELECT id FROM discovered_artists WHERE artist_name = ${a.artist_name}`;
        if (existing.length > 0) continue;
      }

      await sql`
        INSERT INTO discovered_artists (
          artist_name, spotify_id, genres, monthly_listeners, followers,
          social_links, latest_track_name, latest_track_spotify_url,
          latest_track_cover_url, latest_release_date, discovery_source,
          ai_signals_detected, is_ai_artist, status
        ) VALUES (
          ${a.artist_name}, ${a.spotify_id || null}, ${a.genres}, ${a.monthly_listeners}, ${a.followers},
          ${JSON.stringify(a.social_links)}, ${a.latest_track_name}, ${a.latest_track_spotify_url},
          ${a.latest_track_cover_url}, ${a.latest_release_date || null}, ${a.discovery_source || 'multi_channel'},
          ${a.ai_signals_detected}, ${a.is_ai_artist}, 'discovered'
        )
      `;
      stored++;
    }

    results.discovered = stored;
    log.push(`Stored ${stored} new artists`);

    // ── Phase 2: Audit ─────────────────────────────────────
    const auditBatchSize = parseInt(searchParams.get('audit') || '10');
    const toAudit = await sql`
      SELECT * FROM discovered_artists
      WHERE status = 'discovered' AND is_ai_artist = false
      ORDER BY discovered_at ASC
      LIMIT ${auditBatchSize}
    `;

    log.push(`Auditing ${toAudit.length} artists...`);
    for (const artist of toAudit) {
      try {
        log.push(`Auditing: ${artist.artist_name}`);
        // Extract Bandcamp URL from social_links if available
        const socialLinks = typeof artist.social_links === 'string' ? JSON.parse(artist.social_links) : (artist.social_links || {});
        const bandcampUrl = socialLinks.bandcamp || '';
        const audit = await auditArtist(artist.artist_name, artist.latest_track_name, artist.genres || [], bandcampUrl);

        if (!audit) {
          log.push(`  ❌ Audit failed for ${artist.artist_name}`);
          results.errors++;
          continue;
        }

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

        await sql`UPDATE discovered_artists SET status = 'audited', updated_at = NOW() WHERE id = ${artist.id}`;
        results.audited++;
        log.push(`  ✅ Audited: ${artist.artist_name}`);
      } catch (e: any) {
        log.push(`  ❌ Error auditing ${artist.artist_name}: ${e.message}`);
        results.errors++;
      }
    }

    // ── Phase 3: Campaign Creation ─────────────────────────
    const toCreate = await sql`
      SELECT da.*, aa.recommended_cpm_cents, aa.recommended_budget_cents,
             aa.youtube_video_url, aa.hashtags
      FROM discovered_artists da
      JOIN artist_audits aa ON aa.discovered_artist_id = da.id
      WHERE da.status = 'audited'
      ORDER BY aa.audited_at ASC
      LIMIT 3
    `;

    for (const artist of toCreate) {
      try {
        log.push(`Creating campaign: ${artist.artist_name}`);

        // Format slug: artist-name-track-name-random4
        const artistSlug = (artist.artist_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const trackSlug = (artist.latest_track_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const slug = `${artistSlug}-${trackSlug}-${crypto.randomUUID().slice(0, 4)}`.slice(0, 100).replace(/--+/g, '-');

        // Cover art — use Bandcamp CDN URL directly (no download needed)
        let coverArtUrl = artist.latest_track_cover_url || '/images/og-image.jpg';
        // Download only Spotify CDN images (legacy — shouldn't happen anymore)
        if (coverArtUrl.startsWith('https://i.scdn.co/')) {
          try {
            const imgRes = await fetch(coverArtUrl);
            if (imgRes.ok) {
              const buffer = Buffer.from(await imgRes.arrayBuffer());
              const fs = await import('fs'); const path = await import('path');
              const dir = path.join(process.cwd(), 'public/images/campaigns');
              fs.mkdirSync(dir, { recursive: true });
              const filename = `campaign-${Date.now().toString(36)}.jpg`;
              fs.writeFileSync(path.join(dir, filename), buffer);
              coverArtUrl = `/images/campaigns/${filename}`;
            }
          } catch {}
        }

        // Track URL — prefer Bandcamp link from social_links, fallback to any URL
        const socialLinks = typeof artist.social_links === 'string' ? JSON.parse(artist.social_links) : (artist.social_links || {});
        const trackUrl = socialLinks.bandcamp || artist.latest_track_spotify_url || 'https://selah.fm';

        const budgetCents = artist.recommended_budget_cents || 0; // $0 for auto-generated

        const [campaign] = await sql`
          INSERT INTO campaigns (
            artist_id, track_title, track_url, title, slug, cover_art_url,
            cpm_rate_cents, total_budget_cents, budget_remaining_cents,
            max_payout_per_submission_cents,
            requirements, recommended_hashtags, platforms,
            youtube_video_url, is_unclaimed, status
          ) VALUES (
            (SELECT id FROM users WHERE email = 'info@selah.fm' LIMIT 1),
            ${artist.latest_track_name || artist.artist_name},
            ${trackUrl},
            ${`${artist.artist_name} — ${artist.latest_track_name || 'Latest Release'}`},
            ${slug},
            ${coverArtUrl},
            ${artist.recommended_cpm_cents || 10},
            ${budgetCents},
            ${budgetCents},
            ${artist.recommended_budget_cents || 10000},
            ${'Make a video featuring this track. Any style. Any length. No minimum followers. Just good content.'},
            ${artist.hashtags || []},
            ${JSON.stringify(['tiktok', 'instagram', 'youtube'])},
            ${artist.youtube_video_url || null},
            true,
            'active'
          )
          RETURNING *
        `;

        // Create claim code
        const claimCode = crypto.randomUUID();
        await sql`
          INSERT INTO campaign_claims (campaign_id, discovered_artist_id, claim_code)
          VALUES (${campaign.id}, ${artist.id}, ${claimCode})
        `;

        await sql`UPDATE discovered_artists SET status = 'campaign_created', updated_at = NOW() WHERE id = ${artist.id}`;
        results.campaigns_created++;
        log.push(`  ✅ Campaign: ${campaign.title} → /c/${campaign.slug}`);

      } catch (e: any) {
        log.push(`  ❌ Error creating campaign for ${artist.artist_name}: ${e.message}`);
        results.errors++;
      }
    }

    log.push(`\nPipeline complete: ${results.discovered} discovered, ${results.audited} audited, ${results.campaigns_created} campaigns, ${results.errors} errors`);

    return NextResponse.json({ results, log });

  } catch (e: any) {
    log.push(`Pipeline crashed: ${e.message}`);
    return NextResponse.json({ error: e.message, results, log }, { status: 500 });
  }
}
