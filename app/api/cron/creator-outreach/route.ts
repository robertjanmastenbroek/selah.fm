import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { sendOutreachEmail } from '@/lib/email-outreach';
import { generateCreatorOutreachEmail } from '@/lib/creator-email-outreach';
import { emailWrapper } from '@/lib/email-templates';
import { verifyEmail } from '@/lib/email-verify';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Automated creator email outreach cron.
 * Sends emails to discovered creators who haven't been contacted yet.
 * Max 5 per run to stay within Resend free tier (shared with artist pipeline).
 */
export async function GET(request: Request) {
  const secret = new URL(request.url).searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: { creator: string; email: string; sent: boolean; error?: string }[] = [];

  try {
    const creators = await sql`
      SELECT * FROM discovered_creators
      WHERE email_address IS NOT NULL
        AND status = 'discovered'
        AND NOT EXISTS (SELECT 1 FROM creator_outreach_log WHERE discovered_creator_id = discovered_creators.id)
      ORDER BY follower_count DESC
      LIMIT 13
    `;

    for (const creator of creators) {
      // Pre-send verification
      const verification = await verifyEmail(creator.email_address);
      if (!verification.valid) {
        await sql`
          UPDATE discovered_creators SET email_confidence = 'guess', updated_at = NOW()
          WHERE id = ${creator.id}
        `;
        results.push({ creator: creator.display_name || creator.username, email: creator.email_address, sent: false, error: verification.reason });
        continue;
      }

      try {
        const email = await generateCreatorOutreachEmail(
          creator.display_name || creator.username,
          creator.bio?.substring(0, 60) || 'content creator',
          'https://selah.fm/browse?utm_source=email&utm_medium=outreach&utm_campaign=creator_invite'
        );

        const htmlBody = emailWrapper({
          title: 'Get paid for your content',
          body: email.body.replace(/\n/g, '<br>'),
          cta: { text: 'Browse campaigns →', url: 'https://selah.fm/browse' },
        });

        const result = await sendOutreachEmail({
          to: creator.email_address,
          subject: email.subject,
          htmlBody,
        });

        if (result.sent) {
          await sql`
            INSERT INTO creator_outreach_log (discovered_creator_id, channel, message_text, status)
            VALUES (${creator.id}, 'email', ${email.body}, 'sent')
          `;
          await sql`UPDATE discovered_creators SET status = 'emailed', updated_at = NOW() WHERE id = ${creator.id}`;
        }

        results.push({ creator: creator.display_name || creator.username, email: creator.email_address, sent: result.sent, error: result.error });
        await new Promise(r => setTimeout(r, 1000));
      } catch (e: any) {
        results.push({ creator: creator.display_name || creator.username, email: creator.email_address, sent: false, error: e.message });
      }
    }

    return NextResponse.json({
      processed: results.length,
      sent: results.filter(r => r.sent).length,
      results,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
