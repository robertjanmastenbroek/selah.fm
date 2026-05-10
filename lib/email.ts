/**
 * Selah.fm — Email System
 * Uses Resend HTTP API (api.resend.com) for reliable delivery.
 * Falls back to console logging if RESEND_API_KEY is not configured.
 */

const RESEND_API = 'https://api.resend.com/emails';
const FROM_GENERAL = 'Selah.fm <info@selah.fm>';
const FROM_SUPPORT = 'Selah.fm Support <support@selah.fm>';

export async function sendEmail({ to, subject, html, from }: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = from || FROM_GENERAL;

  if (!apiKey) {
    console.log(`[EMAIL] Would send to ${to}: "${subject}" (RESEND_API_KEY not set)`);
    await logEmail({ to, subject, sent: false, reason: 'RESEND_API_KEY not configured' });
    return { sent: false, reason: 'Email service not configured' };
  }

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: sender,
        to: [to],
        subject,
        html,
      }),
    });

    if (res.ok) {
      await logEmail({ to, subject, sent: true });
      return { sent: true };
    }

    const err = await res.json().catch(() => ({}));
    console.error(`[EMAIL] Resend error for ${to}:`, err);
    await logEmail({ to, subject, sent: false, reason: JSON.stringify(err) });
    return { sent: false, reason: (err as any).message || 'Delivery failed' };
  } catch (e: any) {
    console.error(`[EMAIL] Failed to send to ${to}:`, e.message);
    await logEmail({ to, subject, sent: false, reason: e.message }).catch(() => {});
    return { sent: false, reason: e.message };
  }
}

// ── Email logging (non-blocking) ─────────────────────────────
async function logEmail({ to, subject, sent, reason }: {
  to: string; subject: string; sent: boolean; reason?: string;
}) {
  try {
    const { default: sql } = await import('@/lib/db');
    await sql`
      INSERT INTO email_logs (recipient, subject, sent, reason)
      VALUES (${to}, ${subject}, ${sent}, ${reason || null})
    `;
  } catch {
    // Table may not exist yet — non-critical
  }
}

// ── Templates ──────────────────────────────────────────────────

export function welcomeEmail(name: string) {
  const ctaUrl = 'https://selah.fm/browse';
  return {
    subject: 'Welcome to Selah.fm — start creating!',
    html: `<div style="max-width:480px;margin:0 auto;font-family:system-ui,sans-serif;color:#F0F0F0;background:#0D0D0D;padding:32px;border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
      <h1 style="color:#5B7FFF;font-size:24px;margin-bottom:16px">Welcome to Selah.fm, ${name}!</h1>
      <p style="color:#A0A0A0;line-height:1.6">You've joined the marketplace where artists and creators connect. Browse campaigns, submit content, and start earning — or launch your first campaign.</p>
      <a href="${ctaUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#5B7FFF;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Start exploring</a>
      <p style="margin-top:24px;font-size:11px;color:#555">— The Selah.fm team</p>
    </div>`,
  };
}

export function submissionApprovedEmail(name: string, trackTitle: string, amount: string) {
  const ctaUrl = 'https://selah.fm/earnings';
  return {
    subject: `Your submission was approved — $${amount} earned!`,
    html: `<div style="max-width:480px;margin:0 auto;font-family:system-ui,sans-serif;color:#F0F0F0;background:#0D0D0D;padding:32px;border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
      <h1 style="color:#81C784;font-size:24px;margin-bottom:16px">Approved! 🎉</h1>
      <p style="color:#A0A0A0;line-height:1.6">Your submission for <strong style="color:#F0F0F0">${trackTitle}</strong> was approved. You earned <strong style="color:#81C784">$${amount}</strong>.</p>
      <a href="${ctaUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#5B7FFF;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">View earnings</a>
      <p style="margin-top:24px;font-size:11px;color:#555">— The Selah.fm team</p>
    </div>`,
  };
}

export function submissionRejectedEmail(name: string, trackTitle: string) {
  const ctaUrl = 'https://selah.fm/browse';
  return {
    subject: `Update on your submission for "${trackTitle}"`,
    html: `<div style="max-width:480px;margin:0 auto;font-family:system-ui,sans-serif;color:#F0F0F0;background:#0D0D0D;padding:32px;border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
      <h1 style="color:#EF9A9A;font-size:24px;margin-bottom:16px">Submission update</h1>
      <p style="color:#A0A0A0;line-height:1.6">Your submission for <strong style="color:#F0F0F0">${trackTitle}</strong> wasn't approved this time. Don't worry — there are plenty of other campaigns to try.</p>
      <a href="${ctaUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#5B7FFF;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Browse campaigns</a>
      <p style="margin-top:24px;font-size:11px;color:#555">— The Selah.fm team</p>
    </div>`,
  };
}

export function payoutEmail(name: string, amount: string) {
  const ctaUrl = 'https://selah.fm/earnings';
  return {
    subject: `$${amount} has been sent to your account!`,
    html: `<div style="max-width:480px;margin:0 auto;font-family:system-ui,sans-serif;color:#F0F0F0;background:#0D0D0D;padding:32px;border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
      <h1 style="color:#81C784;font-size:24px;margin-bottom:16px">Money sent! 💰</h1>
      <p style="color:#A0A0A0;line-height:1.6"><strong style="color:#81C784;font-size:20px">$${amount}</strong> has been transferred via Stripe. Check your bank account in 1-3 business days.</p>
      <a href="${ctaUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#5B7FFF;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">View earnings</a>
      <p style="margin-top:24px;font-size:11px;color:#555">— The Selah.fm team</p>
    </div>`,
  };
}

/**
 * Send a support-related email (uses support@selah.fm as sender).
 */
export async function sendSupportEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  return sendEmail({ to, subject, html, from: FROM_SUPPORT });
}
