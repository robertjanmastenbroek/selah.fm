import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { generateOutreachEmail, sendOutreachEmail } from '@/lib/email-outreach';
import { emailWrapper } from '@/lib/email-templates';
import { verifyEmail } from '@/lib/email-verify';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * Automated email outreach cron.
 * Finds audited artists with email addresses and pending campaigns,
 * generates personalized emails, and sends them via Resend.
 * 
 * Rate limited: sends max 10 emails per run to stay under Resend free tier.
 * Runs every 6 hours via Railway cron.
 */
export async function GET(request: Request) {
  const secret = new URL(request.url).searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: { artist: string; email: string; sent: boolean; error?: string }[] = [];

  try {
    // Find artists ready for email outreach
    const artists = await sql`
      SELECT DISTINCT ON (da.id) 
        da.id, da.artist_name, da.latest_track_name, da.genres,
        aa.email_address,
        c.slug as campaign_slug,
        cc.claim_code
      FROM discovered_artists da
      JOIN artist_audits aa ON aa.discovered_artist_id = da.id
      JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
      JOIN campaigns c ON c.id = cc.campaign_id
      WHERE da.status = 'campaign_created'
        AND aa.email_address IS NOT NULL
        AND aa.email_address != ''
        AND (aa.email_confidence = 'verified' OR aa.email_confidence = 'high')
        AND (aa.bounced_at IS NULL)
        AND NOT EXISTS (
          SELECT 1 FROM outreach_log ol 
          WHERE ol.discovered_artist_id = da.id AND ol.channel = 'email'
        )
      ORDER BY da.id, aa.audited_at DESC
      LIMIT 10
    `;

    for (const artist of artists) {
      const campaignUrl = `https://selah.fm/c/${artist.campaign_slug}`;
      const genre = (artist.genres?.[0] || 'music').toString();

      // ── Pre-send verification ──────────────────────────────────
      const verification = await verifyEmail(artist.email_address);
      if (!verification.valid) {
        // Mark as bounced so we don't retry
        await sql`
          UPDATE artist_audits 
          SET bounced_at = NOW(), bounce_reason = ${verification.reason}
          WHERE discovered_artist_id = ${artist.id}
        `;
        results.push({
          artist: artist.artist_name,
          email: artist.email_address,
          sent: false,
          error: `Pre-send verification failed: ${verification.reason}`,
        });
        continue;
      }

      try {
        const email = await generateOutreachEmail(
          artist.artist_name,
          artist.latest_track_name || 'your latest release',
          genre,
          campaignUrl,
        );

        const htmlBody = emailWrapper({
          title: 'Your campaign page is live',
          body: email.body.replace(/\n/g, '<br>'),
          cta: { text: 'View your campaign page →', url: campaignUrl },
        });

        const result = await sendOutreachEmail({
          to: artist.email_address,
          subject: email.subject,
          htmlBody,
        });

        if (result.sent) {
          await sql`
            INSERT INTO outreach_log (discovered_artist_id, campaign_id, channel, message_type, message_text, status, delivered_at)
            VALUES (${artist.id}, 
              (SELECT campaign_id FROM campaign_claims WHERE discovered_artist_id = ${artist.id} LIMIT 1),
              'email', 'initial', ${email.body}, 'sent', NOW())
          `;
          await sql`UPDATE discovered_artists SET status = 'outreach_sent', updated_at = NOW() WHERE id = ${artist.id}`;
        }

        results.push({
          artist: artist.artist_name,
          email: artist.email_address,
          sent: result.sent,
          error: result.error,
        });

        // Rate limit: 1 second between emails
        await new Promise(r => setTimeout(r, 1000));
      } catch (e: any) {
        results.push({
          artist: artist.artist_name,
          email: artist.email_address,
          sent: false,
          error: e.message,
        });
      }
    }

    return NextResponse.json({
      processed: results.length,
      sent: results.filter(r => r.sent).length,
      failed: results.filter(r => !r.sent).length,
      results,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
