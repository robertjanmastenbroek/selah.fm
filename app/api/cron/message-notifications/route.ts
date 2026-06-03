import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { emailWrapper } from '@/lib/email-templates';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const RESEND_API_KEY = process.env.RESEND_API_KEY;

/**
 * GET /api/cron/message-notifications?secret=...
 * Sends daily digest emails (max 1/user/day) for unread messages.
 * Runs once daily at UTC 12 (noon) via dispatcher.
 */
export async function GET(request: Request) {
  const secret = new URL(request.url).searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const results: { email: string; name: string; count: number; sent: boolean; error?: string }[] = [];

  try {
    // Find users with unread messages who haven't received a notification today
    // Also skip users who've been notified in the last 24 hours
    const recipients = await sql`
      WITH unread_grouped AS (
        SELECT 
          m.receiver_id,
          COUNT(*)::int as unread_count,
          COUNT(DISTINCT m.sender_id)::int as sender_count,
          MAX(m.created_at) as latest_message_at
        FROM messages m
        WHERE m.read = false
          AND m.created_at > NOW() - INTERVAL '24 hours'
        GROUP BY m.receiver_id
      ),
      already_notified AS (
        SELECT DISTON user_id FROM message_notifications 
        WHERE sent_at > NOW() - INTERVAL '24 hours'
      )
      SELECT 
        ug.receiver_id,
        u.email,
        u.display_name,
        ug.unread_count,
        ug.sender_count
      FROM unread_grouped ug
      JOIN users u ON u.id = ug.receiver_id
      LEFT JOIN already_notified an ON an.user_id = ug.receiver_id
      WHERE an.user_id IS NULL
        AND u.email IS NOT NULL
      ORDER BY ug.unread_count DESC
      LIMIT 50
    `;

    for (const r of recipients) {
      try {
        const senderNames = await sql`
          SELECT DISTINCT u.display_name
          FROM messages m
          JOIN users u ON u.id = m.sender_id
          WHERE m.receiver_id = ${r.receiver_id}
            AND m.read = false
            AND m.created_at > NOW() - INTERVAL '24 hours'
          LIMIT 5
        `;

        const names = senderNames.map((s: any) => s.display_name).filter(Boolean);
        const nameList = names.length > 0 ? names.join(', ') : 'Someone';

        const subject = r.unread_count === 1
          ? `New message from ${nameList} on Selah.fm`
          : `${r.unread_count} new messages from ${nameList} on Selah.fm`;

        const body = `Hi ${r.display_name || 'there'},\n\n`
          + `You have ${r.unread_count} unread message${r.unread_count !== 1 ? 's' : ''}`
          + ` from ${r.sender_count} ${r.sender_count === 1 ? 'person' : 'people'}`
          + ` on Selah.fm.\n\n`
          + `Log in to read and reply:`;

        const html = emailWrapper({
          title: subject,
          body,
          cta: {
            text: 'Open Messages →',
            url: `https://selah.fm/messages?user=${r.receiver_id}`,
          },
        });

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Selah.fm <notifications@selah.fm>',
            to: r.email,
            subject,
            html,
          }),
        });

        if (res.ok) {
          // Record that we sent a notification for this user
          await sql`
            INSERT INTO message_notifications (user_id, unread_count, sender_count, sent_at)
            VALUES (${r.receiver_id}, ${r.unread_count}, ${r.sender_count}, NOW())
          `;
          results.push({ email: r.email, name: r.display_name, count: r.unread_count, sent: true });
        } else {
          const errText = await res.text();
          results.push({ email: r.email, name: r.display_name, count: r.unread_count, sent: false, error: errText.slice(0, 200) });
        }
      } catch (e: any) {
        results.push({ email: r.email, name: r.display_name, count: r.unread_count, sent: false, error: e.message });
      }
    }

    return NextResponse.json({ sent: results.filter(r => r.sent).length, failed: results.filter(r => !r.sent).length, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, results }, { status: 500 });
  }
}
