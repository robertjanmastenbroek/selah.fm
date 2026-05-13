import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { renderFollowUpMessage } from '@/lib/outreach';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Day-7 follow-up system — checks for campaigns where initial outreach
 * was sent 7+ days ago but the campaign remains unclaimed.
 * 
 * GET /api/cron/outreach-followup
 * Optional: ?secret=CRON_SECRET for auth
 * 
 * Rules:
 * - One follow-up per campaign. Ever.
 * - Only if initial outreach was sent 7+ days ago
 * - Only if campaign is still unclaimed
 * - Adds social proof if any (donations, submissions)
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const log: string[] = [];
  const results = { checked: 0, follow_ups_generated: 0, errors: 0 };

  try {
    // Find outreach entries that:
    // - Are initial messages sent 7+ days ago
    // - Have no existing follow-up for the same artist
    // - Campaign is still unclaimed
    const candidates = await sql`
      SELECT DISTINCT ON (ol.discovered_artist_id)
        ol.id as outreach_id,
        ol.discovered_artist_id,
        ol.campaign_id,
        ol.created_at as sent_at,
        da.artist_name,
        da.latest_track_name,
        da.status as artist_status,
        cc.claim_code,
        c.slug as campaign_slug,
        c.is_unclaimed
      FROM outreach_log ol
      JOIN discovered_artists da ON da.id = ol.discovered_artist_id
      JOIN artist_audits aa ON aa.discovered_artist_id = ol.discovered_artist_id
      LEFT JOIN campaign_claims cc ON cc.campaign_id = ol.campaign_id
      LEFT JOIN campaigns c ON c.id = ol.campaign_id
      WHERE ol.message_type = 'initial'
        AND ol.status = 'sent'
        AND ol.created_at < NOW() - INTERVAL '7 days'
        AND (aa.instagram_handle IS NOT NULL OR aa.tiktok_handle IS NOT NULL)
        AND c.is_unclaimed = true
        AND cc.claimed_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM outreach_log fol
          WHERE fol.discovered_artist_id = ol.discovered_artist_id
            AND fol.message_type = 'follow_up'
        )
      ORDER BY ol.discovered_artist_id, ol.created_at DESC
      LIMIT 10
    `;

    results.checked = candidates.length;
    log.push(`Found ${candidates.length} candidates for follow-up`);

    for (const row of candidates) {
      try {
        // Get social proof data
        const [donations] = await sql`
          SELECT COUNT(*)::int as count, COALESCE(SUM(amount_cents)::int, 0) as total
          FROM campaign_donations WHERE campaign_id = ${row.campaign_id}
        `;

        const [submissions] = await sql`
          SELECT COUNT(*)::int as count
          FROM submissions WHERE campaign_id = ${row.campaign_id}
        `;

        const campaignUrl = `https://selah.fm/c/${row.campaign_slug || row.campaign_id}`;

        const message = renderFollowUpMessage(
          row.artist_name,
          row.latest_track_name || 'your latest track',
          campaignUrl,
          donations?.count || 0,
          (donations?.total || 0) / 100,
          submissions?.count || 0,
        );

        // Log the follow-up
        await sql`
          INSERT INTO outreach_log (
            discovered_artist_id, campaign_id, channel, message_type,
            message_text, status, notes, created_at
          ) VALUES (
            ${row.discovered_artist_id}, ${row.campaign_id}, 'instagram_dm',
            'follow_up', ${message}, 'pending',
            ${`Auto-generated follow-up. Initial outreach sent ${row.sent_at}. Donations: ${donations?.count || 0}, Submissions: ${submissions?.count || 0}`},
            NOW()
          )
        `;

        results.follow_ups_generated++;
        log.push(`  ✅ Follow-up for ${row.artist_name} (sent ${row.sent_at?.toString().slice(0, 10)})`);
      } catch (e: any) {
        log.push(`  ❌ Error for ${row.artist_name}: ${e.message}`);
        results.errors++;
      }
    }

    log.push(`\nFollow-up complete: ${results.checked} checked, ${results.follow_ups_generated} generated, ${results.errors} errors`);

    return NextResponse.json({ results, log });

  } catch (e: any) {
    log.push(`Follow-up pipeline crashed: ${e.message}`);
    return NextResponse.json({ error: e.message, results, log }, { status: 500 });
  }
}
