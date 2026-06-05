import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const maxDuration = 60;

/**
 * Weekly email digest — sends top 3 blog posts to all subscribed users.
 * Runs Fridays at hour 14 via dispatcher.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  // Only run on Fridays (day 5). Also runs if ?force=true for testing.
  if (new Date().getUTCDay() !== 5 && searchParams.get('force') !== 'true') {
    return NextResponse.json({ skipped: true, message: 'Only runs on Fridays' });
  }

  try {
    // Get top 3 posts from this week
    const posts = await sql`
      SELECT title, slug, excerpt, published_at
      FROM blog_posts
      WHERE status = 'published'
        AND published_at > NOW() - INTERVAL '7 days'
      ORDER BY published_at DESC
      LIMIT 3
    `;

    if (posts.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No posts this week' });
    }

    // Get all users who haven't unsubscribed
    const users = await sql`
      SELECT email, display_name
      FROM users
      WHERE email IS NOT NULL AND email != ''
        AND (unsubscribed_at IS NULL OR unsubscribed_at > NOW() - INTERVAL '30 days')
      ORDER BY created_at DESC
    `;

    if (users.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No users to email' });
    }

    // Build HTML email
    const postsHtml = posts.map((p: any) => `
      <tr>
        <td style="padding:20px 0;">
          <a href="https://selah.fm/blog/${p.slug}" style="text-decoration:none;color:#e4e4e7;display:block;">
            <h3 style="margin:0 0 8px;font-size:16px;font-weight:600;color:#e4e4e7;">${p.title}</h3>
            <p style="margin:0 0 4px;font-size:13px;color:#a1a1aa;line-height:1.5;">${(p.excerpt || '').slice(0, 200)}</p>
            <span style="font-size:11px;color:#6366f1;">Read more →</span>
          </a>
        </td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:40px 20px;background:#0F0F23;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#e4e4e7;font-size:22px;font-weight:700;margin:0;">Selah.fm</h1>
      <p style="color:#6366f1;font-size:13px;font-weight:500;margin:4px 0 0;">Weekly Digest</p>
    </div>
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;margin-bottom:20px;">
      <p style="color:#a1a1aa;font-size:13px;line-height:1.6;margin:0 0 16px;">
        Here are this week's top articles from the Selah.fm blog — practical music promotion tips, CPM strategies, and creator insights.
      </p>
      <table style="width:100%;border-collapse:collapse;">
        ${postsHtml}
      </table>
    </div>
    <div style="text-align:center;padding:16px 0;">
      <a href="https://selah.fm/blog" style="display:inline-block;padding:10px 24px;background:#4338CA;color:white;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">Browse all articles →</a>
    </div>
    <p style="text-align:center;color:#52525b;font-size:11px;margin-top:24px;">
      You're receiving this because you have a Selah.fm account.<br>
      <a href="https://selah.fm/settings" style="color:#6366f1;text-decoration:none;">Unsubscribe</a>
    </p>
  </div>
</body></html>`;

    const text = `Selah.fm Weekly Digest\n\n${posts.map((p: any) => `${p.title}\n${(p.excerpt || '').slice(0, 200)}\nhttps://selah.fm/blog/${p.slug}\n`).join('\n')}\nBrowse all: https://selah.fm/blog`;

    let sent = 0;
    for (const user of users) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: 'Selah.fm <info@selah.fm>',
            to: [user.email],
            subject: `Selah.fm Weekly — ${posts.length} new article${posts.length > 1 ? 's' : ''}`,
            html,
            text,
          }),
        });
        if (res.ok) sent++;
        else {
          const err = await res.text();
          console.error(`[email-digest] Failed for ${user.email}:`, err.slice(0, 100));
        }
      } catch (e: any) {
        console.error(`[email-digest] Error sending to ${user.email}:`, e.message);
      }
    }

    return NextResponse.json({
      sent,
      total: users.length,
      posts: posts.length,
      week_of: new Date().toISOString().slice(0, 10),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
