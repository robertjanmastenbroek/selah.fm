import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { discoverArtists, auditArtist } from '@/lib/outreach';
import { resolveStreamingLinks } from '@/lib/streaming-links';

export const dynamic = 'force-dynamic';
export const maxDuration = 600; // 10 minutes for full pipeline run

/**
 * Autonomous outreach pipeline — runs discovery → audit → campaign creation.
 * Called by cron or manual trigger. No admin dashboard needed.
 * 
 * GET /api/cron/outreach-pipeline
 * Optional: ?secret=CRON_SECRET for auth
 */

export async function GET(request: Request) {
  // Optional secret auth — via query param or X-Cron-Secret header
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
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
    
    const discoveryLimit = parseInt(searchParams.get('limit') || '100');
    const auditBatchSize = parseInt(searchParams.get('audit') || '200');
    const campaignBatchSize = parseInt(searchParams.get('campaigns') || '50');

    log.push(`Pipeline config: discover=${discoveryLimit}, audit=${auditBatchSize}, campaigns=${campaignBatchSize}`);

    const discoveryResult = await discoverArtists(discoveryLimit);
    const discovered = discoveryResult.artists;
    log.push(...discoveryResult.diagnostics);
    if (discoveryResult.channels) {
      log.push(`Channels: Reddit ${discoveryResult.channels.reddit.candidates}, Bandcamp ${discoveryResult.channels.bandcamp.candidates}, YouTube ${discoveryResult.channels.youtube.candidates}`);
    }

    if (discovered.length > 0) {
      log.push(`Discovered ${discovered.length} artists`);

      // Store discovered artists — REQUIRE both artist name AND track name
      let stored = 0;
      for (const a of discovered) {
      // Validation gate: must have both
      if (!a.artist_name || a.artist_name.length < 2) continue;
      if (!a.latest_track_name || a.latest_track_name.length < 2) continue;

      // Check if artist already exists — add track instead of skipping
      let existingArtist: any = null;
      if (a.spotify_id) {
        [existingArtist] = await sql`SELECT id, artist_name FROM discovered_artists WHERE spotify_id = ${a.spotify_id}`;
      }
      if (!existingArtist) {
        [existingArtist] = await sql`SELECT id, artist_name FROM discovered_artists WHERE artist_name ILIKE ${a.artist_name} LIMIT 1`;
      }

      if (existingArtist) {
        // Check MAX track cap — prevent compilation album floods
        const [trackCount] = await sql`
          SELECT COUNT(*)::int as count FROM artist_tracks WHERE artist_id = ${existingArtist.id}
        `;
        if ((trackCount?.count || 0) >= 50) {
          log.push(`  ⏭️ Artist ${existingArtist.artist_name} already has ${trackCount.count} tracks — skipping (compilation guard)`);
          continue;
        }

        // Artist exists — add this track as a new artist_tracks entry
        log.push(`  → Adding track "${a.latest_track_name}" to existing artist ${existingArtist.artist_name}`);
        try {
          const [existingTrack] = await sql`
            SELECT id FROM artist_tracks 
            WHERE artist_id = ${existingArtist.id} AND (title ILIKE ${a.latest_track_name} OR spotify_url = ${a.latest_track_spotify_url || ''})
            LIMIT 1
          `;
          if (!existingTrack) {
            await sql`
              INSERT INTO artist_tracks (artist_id, title, spotify_url, cover_art_url, cpm_rate_cents, sort_order)
              VALUES (${existingArtist.id}, ${a.latest_track_name}, ${a.latest_track_spotify_url || null},
                      ${a.latest_track_cover_url || null}, 10, 
                      (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM artist_tracks WHERE artist_id = ${existingArtist.id}))
            `;
            log.push(`    ✅ Track added: "${a.latest_track_name}"`);
          } else {
            log.push(`    ⏭️ Track already exists: "${a.latest_track_name}"`);
          }
        } catch (e: any) {
          log.push(`    ❌ Failed to add track: ${e.message}`);
        }
        continue;
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
    } else {
      log.push('No new artists discovered (all candidates already in DB)');
    }

    // ── Phase 2: Audit ─────────────────────────────────────
    const toAudit = await sql`
      SELECT * FROM discovered_artists
      WHERE status = 'discovered' AND is_ai_artist = false
      ORDER BY discovered_at ASC
      LIMIT ${auditBatchSize}
    `;

    log.push(`Auditing ${toAudit.length} artists...`);
    // ⚡ BATCHED PARALLEL: Process audits in batches for maximum throughput
    const AUDIT_BATCH_SIZE = 8;
    for (let batchIdx = 0; batchIdx < toAudit.length; batchIdx += AUDIT_BATCH_SIZE) {
      const batch = toAudit.slice(batchIdx, batchIdx + AUDIT_BATCH_SIZE);
      const batchNum = Math.floor(batchIdx / AUDIT_BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(toAudit.length / AUDIT_BATCH_SIZE);
      log.push(`Audit batch ${batchNum}/${totalBatches} (${batch.length} artists)...`);

      const batchResults = await Promise.all(batch.map(async (artist: any) => {
        try {
          log.push(`Auditing: ${artist.artist_name}`);
          // Extract Bandcamp URL from social_links if available
          const socialLinks = typeof artist.social_links === 'string' ? JSON.parse(artist.social_links) : (artist.social_links || {});
          const bandcampUrl = socialLinks.bandcamp || '';
          let genres: string[] = [];
          try {
            if (Array.isArray(artist.genres)) genres = artist.genres;
            else if (typeof artist.genres === 'string') {
              const parsed = JSON.parse(artist.genres);
              genres = Array.isArray(parsed) ? parsed : Object.keys(parsed);
            } else if (artist.genres && typeof artist.genres === 'object') {
              genres = Array.isArray(artist.genres) ? artist.genres : Object.keys(artist.genres);
            }
          } catch { genres = []; }
          const audit = await auditArtist(artist.artist_name, artist.latest_track_name, genres, bandcampUrl, socialLinks);

          if (!audit) {
            log.push(`  ❌ Audit failed for ${artist.artist_name}`);
            return { artist, error: true, msg: 'Audit returned null' };
          }

          await sql`
            INSERT INTO artist_audits (
              discovered_artist_id, spotify_monthly_listeners, spotify_track_streams,
              youtube_video_url, youtube_video_views, spotify_embed_url, artist_bio,
              recommended_cpm_cents, recommended_budget_cents,
              instagram_handle, instagram_followers, tiktok_handle, tiktok_followers,
              email_address, email_source, email_confidence, website_url, hashtags, personal_angle
            ) VALUES (
              ${artist.id}, ${audit.spotify_monthly_listeners}, ${audit.spotify_track_streams},
              ${audit.youtube_video_url}, ${audit.youtube_video_views}, ${audit.spotify_embed_url}, ${audit.artist_bio},
              ${audit.recommended_cpm_cents}, ${audit.recommended_budget_cents},
              ${audit.instagram_handle}, ${audit.instagram_followers}, ${audit.tiktok_handle}, ${audit.tiktok_followers},
              ${audit.email_address}, ${audit.email_source}, ${audit.email_confidence}, ${audit.website_url}, ${audit.hashtags}, ${audit.personal_angle}
            )
          `;

          await sql`UPDATE discovered_artists SET status = 'audited', updated_at = NOW() WHERE id = ${artist.id}`;
          log.push(`  ✅ Audited: ${artist.artist_name}`);
          return { artist, error: false, msg: 'ok' };
        } catch (e: any) {
          log.push(`  ❌ Error auditing ${artist.artist_name}: ${e.message}`);
          return { artist, error: true, msg: e.message };
        }
      }));

      const batchSuccesses = batchResults.filter(r => !r.error).length;
      const batchErrors = batchResults.filter(r => r.error).length;
      results.audited += batchSuccesses;
      results.errors += batchErrors;
      log.push(`Batch ${batchNum}/${totalBatches} done: ${batchSuccesses} ok, ${batchErrors} errors`);
    }

    // ── Phase 3: Campaign Creation ─────────────────────────
    const toCreate = await sql`
      SELECT da.*, aa.recommended_cpm_cents, aa.recommended_budget_cents,
             aa.youtube_video_url, aa.hashtags
      FROM discovered_artists da
      JOIN artist_audits aa ON aa.discovered_artist_id = da.id
      WHERE da.status = 'audited' AND aa.email_address IS NOT NULL AND aa.email_address != '' AND aa.email_confidence IN ('verified', 'high', 'medium', 'low')
      ORDER BY aa.audited_at ASC
      LIMIT ${campaignBatchSize}
    `;

    // ⚡ BATCHED PARALLEL: Create campaigns in batches for maximum throughput
    const CAMPAIGN_BATCH_SIZE = 5;
    for (let batchIdx = 0; batchIdx < toCreate.length; batchIdx += CAMPAIGN_BATCH_SIZE) {
      const batch = toCreate.slice(batchIdx, batchIdx + CAMPAIGN_BATCH_SIZE);
      const batchNum = Math.floor(batchIdx / CAMPAIGN_BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(toCreate.length / CAMPAIGN_BATCH_SIZE);
      log.push(`Campaign batch ${batchNum}/${totalBatches} (${batch.length} artists)...`);

      const batchResults = await Promise.all(batch.map(async (artist: any) => {
        try {
          // Skip artists without email — email is the primary outreach channel
          const auditCheck = await sql`
            SELECT email_address, instagram_handle, tiktok_handle FROM artist_audits
            WHERE discovered_artist_id = ${artist.id}
            ORDER BY audited_at DESC LIMIT 1
          `;
          const audit = auditCheck[0];
          if (!audit?.email_address) {
            log.push(`  ⚠️  No email for ${artist.artist_name} — skipping`);
            return { artist, error: false, skipped: true, msg: 'no email' };
          }

          // Check if artist already has campaigns — if so, add as new track instead
          const [existingClaim] = await sql`SELECT id FROM campaign_claims WHERE discovered_artist_id = ${artist.id} LIMIT 1`;
          if (existingClaim) {
            // Artist already has a campaign — add this as a new track to their catalog
            log.push(`  → Adding new track "${artist.latest_track_name}" to existing artist ${artist.artist_name}`);
            
            // Check if this track already exists
            const [existingTrack] = await sql`
              SELECT id FROM artist_tracks 
              WHERE artist_id = ${artist.id} AND (title ILIKE ${artist.latest_track_name || ''} OR spotify_url = ${artist.latest_track_spotify_url || ''})
              LIMIT 1
            `;
            
            if (!existingTrack && artist.latest_track_name) {
              await sql`
                INSERT INTO artist_tracks (artist_id, title, spotify_url, cover_art_url, cpm_rate_cents, sort_order)
                VALUES (${artist.id}, ${artist.latest_track_name}, ${artist.latest_track_spotify_url || null},
                        ${artist.latest_track_cover_url || null}, ${artist.recommended_cpm_cents || 10},
                        (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM artist_tracks WHERE artist_id = ${artist.id}))
              `;
              log.push(`    ✅ Track added: "${artist.latest_track_name}"`);
            } else {
              log.push(`    ⏭️ Track already exists or has no name`);
            }
            
            return { artist, error: false, skipped: true, msg: 'track_added' };
          }

          log.push(`Creating campaign: ${artist.artist_name}`);

          // Format slug: artist-name-track-name-random4
          const artistSlug = (artist.artist_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          const trackSlug = (artist.latest_track_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          const slug = `${artistSlug}-${trackSlug}-${crypto.randomUUID().slice(0, 4)}`.slice(0, 100).replace(/--+/g, '-');

          // Cover art: download & store in DB (persistent)
          let coverArtUrl = artist.latest_track_cover_url || '';
          let imageData: Buffer | null = null;
          let imageMime = 'image/jpeg';
          if (coverArtUrl && coverArtUrl.startsWith('http')) {
            const urls = [coverArtUrl];
            const bcMatch = coverArtUrl.match(/(https:\/\/f\d+\.bcbits\.com\/img\/a\d+)_\d+\.(jpg|png)/);
            if (bcMatch) { urls.push(`${bcMatch[1]}_10.${bcMatch[2]}`, `${bcMatch[1]}_2.${bcMatch[2]}`); }
            for (const u of urls) {
              try {
                const res = await fetch(u, {
                  headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'Accept': 'image/*' },
                  signal: AbortSignal.timeout(15000),
                });
                if (res.ok) {
                  const buf = Buffer.from(await res.arrayBuffer());
                  if (buf.length > 2000 && ((buf[0] === 0xFF && buf[1] === 0xD8) || (buf[0] === 0x89 && buf[1] === 0x50) || (buf[0] === 0x52 && buf[1] === 0x49))) {
                    imageData = buf;
                    if (buf[0] === 0x89) imageMime = 'image/png';
                    else if (buf[0] === 0x52) imageMime = 'image/webp';
                    break;
                  }
                }
              } catch {}
            }
            if (imageData) {
              const ext = coverArtUrl.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)?.[1] || 'jpg';
              coverArtUrl = `/images/campaigns/campaign-${crypto.randomUUID().slice(0, 8)}.${ext}`;
            }
          }
          if (!coverArtUrl) coverArtUrl = '/images/og-image.jpg';

          // Track URL — prefer Bandcamp link from social_links, fallback to any URL
          const socialLinks = typeof artist.social_links === 'string' ? JSON.parse(artist.social_links) : (artist.social_links || {});
          const trackUrl = socialLinks.bandcamp || artist.latest_track_spotify_url || 'https://selah.fm';

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
              0,  /* total_budget_cents — always $0 for auto-generated */
              0,  /* budget_remaining_cents — always $0 */
              ${artist.recommended_budget_cents || 10000},
              ${'Make a video featuring this track. Any style. Any length. No minimum followers. Just good content.'},
              ${artist.hashtags || []},
              ${['tiktok', 'instagram', 'youtube']},
              ${artist.youtube_video_url || null},
              true,
              'active'
            )
            RETURNING *
          `;

          // Store image in campaign_images table
          if (imageData) {
            await sql`INSERT INTO campaign_images (campaign_id, data, mime) VALUES (${campaign.id}, ${imageData}, ${imageMime})`;
          }

          // Create claim code
          const claimCode = crypto.randomUUID();
          await sql`
            INSERT INTO campaign_claims (campaign_id, discovered_artist_id, claim_code)
            VALUES (${campaign.id}, ${artist.id}, ${claimCode})
          `;

          await sql`UPDATE discovered_artists SET status = 'campaign_created', updated_at = NOW() WHERE id = ${artist.id}`;
          log.push(`  ✅ Campaign: ${campaign.title} → /c/${campaign.slug}`);

          // Force Facebook re-scrape (non-blocking fire-and-forget)
          const fbToken = process.env.FACEBOOK_ACCESS_TOKEN;
          if (fbToken) {
            fetch(`https://graph.facebook.com/v18.0/?id=${encodeURIComponent(`https://selah.fm/c/${campaign.slug}`)}&scrape=true&access_token=${fbToken}`, { method: 'POST' }).catch(() => {});
          }

          // Enrich streaming links (Spotify/Apple Music) — fire-and-forget
          const artistName = artist.artist_name;
          const trackName = artist.latest_track_name;
          resolveStreamingLinks(artistName, trackName, {
            spotifyUrl: artist.latest_track_spotify_url,
            youtubeUrl: artist.youtube_video_url,
            bandcampUrl: socialLinks.bandcamp,
          }).then(links => {
            sql`
              UPDATE discovered_artists
              SET social_links = social_links || ${JSON.stringify({
                spotify: links.spotify,
                apple_music: links.appleMusic,
                youtube: links.youtube,
                soundcloud: links.soundcloud,
              })}::jsonb
              WHERE id = ${artist.id}
            `.catch(() => {});
          }).catch(() => {});

          return { artist, error: false, skipped: false, msg: campaign.title };
        } catch (e: any) {
          log.push(`  ❌ Error creating campaign for ${artist.artist_name}: ${e.message}`);
          return { artist, error: true, msg: e.message };
        }
      }));

      const batchDone = batchResults.filter(r => !r.error && !r.skipped).length;
      const batchSkipped = batchResults.filter(r => r.skipped).length;
      const batchErrors = batchResults.filter(r => r.error).length;
      results.campaigns_created += batchDone;
      results.errors += batchErrors;
      log.push(`Campaign batch ${batchNum}/${totalBatches} done: ${batchDone} created, ${batchSkipped} skipped, ${batchErrors} errors`);
    }

    log.push(`\nPipeline complete: ${results.discovered} discovered, ${results.audited} audited, ${results.campaigns_created} campaigns, ${results.errors} errors`);

    return NextResponse.json({ results, log });

  } catch (e: any) {
    log.push(`Pipeline crashed: ${e.message}`);
    return NextResponse.json({ error: e.message, results, log }, { status: 500 });
  }
}
