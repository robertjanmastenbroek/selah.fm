import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.resend.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'resend',
    pass: process.env.SMTP_PASS || '',
  },
});

const FROM = `"Selah.fm" <${process.env.SMTP_FROM || 'noreply@selah.fm'}>`;

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.SMTP_PASS) {
    console.log(`[EMAIL] Would send to ${to}: "${subject}" (SMTP not configured)`);
    return { sent: false, reason: 'SMTP not configured' };
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    return { sent: true };
  } catch (e: any) {
    console.error(`[EMAIL] Failed to send to ${to}:`, e.message);
    return { sent: false, reason: e.message };
  }
}

// ── Templates ──────────────────────────────────────────────────

export function welcomeEmail(name: string) {
  return {
    subject: 'Welcome to Selah.fm — Start creating!',
    html: `<div style="max-width:480px;margin:0 auto;font-family:system-ui,sans-serif;color:#F0F0F0;background:#0D0D0D;padding:32px;border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
      <h1 style="color:#5B7FFF;font-size:24px;margin-bottom:16px">Welcome to Selah.fm, ${name}!</h1>
      <p style="color:#A0A0A0;line-height:1.6">You&apos;ve joined the marketplace where artists and creators connect. Browse campaigns, submit content, and start earning — or launch your first campaign.</p>
      <a href="https://selah.fm/browse" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#5B7FFF;color:#0D0D0D;text-decoration:none;border-radius:8px;font-weight:600">Start exploring</a>
      <p style="margin-top:24px;font-size:11px;color:#555">— The Selah.fm team</p>
    </div>`,
  };
}

export function submissionApprovedEmail(name: string, trackTitle: string, amount: string) {
  return {
    subject: `Your submission was approved — $${amount} earned!`,
    html: `<div style="max-width:480px;margin:0 auto;font-family:system-ui,sans-serif;color:#F0F0F0;background:#0D0D0D;padding:32px;border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
      <h1 style="color:#81C784;font-size:24px;margin-bottom:16px">Approved! 🎉</h1>
      <p style="color:#A0A0A0;line-height:1.6">Your submission for <strong style="color:#F0F0F0">${trackTitle}</strong> was approved. You earned <strong style="color:#81C784">$${amount}</strong>.</p>
      <a href="https://selah.fm/earnings" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#5B7FFF;color:#0D0D0D;text-decoration:none;border-radius:8px;font-weight:600">View earnings</a>
      <p style="margin-top:24px;font-size:11px;color:#555">— The Selah.fm team</p>
    </div>`,
  };
}

export function submissionRejectedEmail(name: string, trackTitle: string) {
  return {
    subject: `Update on your submission for "${trackTitle}"`,
    html: `<div style="max-width:480px;margin:0 auto;font-family:system-ui,sans-serif;color:#F0F0F0;background:#0D0D0D;padding:32px;border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
      <h1 style="color:#EF9A9A;font-size:24px;margin-bottom:16px">Submission update</h1>
      <p style="color:#A0A0A0;line-height:1.6">Your submission for <strong style="color:#F0F0F0">${trackTitle}</strong> wasn&apos;t approved this time. Don&apos;t worry — there are plenty of other campaigns to try.</p>
      <a href="https://selah.fm/browse" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#5B7FFF;color:#0D0D0D;text-decoration:none;border-radius:8px;font-weight:600">Browse campaigns</a>
      <p style="margin-top:24px;font-size:11px;color:#555">— The Selah.fm team</p>
    </div>`,
  };
}

export function payoutEmail(name: string, amount: string) {
  return {
    subject: `$${amount} has been sent to your account!`,
    html: `<div style="max-width:480px;margin:0 auto;font-family:system-ui,sans-serif;color:#F0F0F0;background:#0D0D0D;padding:32px;border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
      <h1 style="color:#81C784;font-size:24px;margin-bottom:16px">Money sent! 💰</h1>
      <p style="color:#A0A0A0;line-height:1.6"><strong style="color:#81C784;font-size:20px">$${amount}</strong> has been transferred via Stripe. Check your bank account in 1-3 business days.</p>
      <a href="https://selah.fm/earnings" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#5B7FFF;color:#0D0D0D;text-decoration:none;border-radius:8px;font-weight:600">View earnings</a>
      <p style="margin-top:24px;font-size:11px;color:#555">— The Selah.fm team</p>
    </div>`,
  };
}
