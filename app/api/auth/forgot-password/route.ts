import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import crypto from 'crypto';

/**
 * POST /api/auth/forgot-password — Send password reset email
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const users = await sql`SELECT id, email FROM users WHERE email = ${email}`;
    
    // Always return success to prevent email enumeration
    if (users.length === 0) {
      return NextResponse.json({ sent: true });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await sql`
      UPDATE users SET reset_token = ${resetToken}, reset_token_expires = ${expires}
      WHERE id = ${users[0].id}
    `;

    // Send reset email via Resend
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resetUrl = `https://selah.fm/login?reset=${resetToken}`;
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: 'Selah.fm <info@selah.fm>',
          to: [email],
          subject: 'Reset your Selah.fm password',
          html: `<div style="font-family:system-ui,sans-serif;color:#F0F0F0;background:#0D0D0D;padding:24px;border-radius:12px;max-width:480px"><h2 style="color:#5B7FFF">Reset your password</h2><p style="color:#A0A0A0">Click the button below to reset your password. This link expires in 1 hour.</p><a href="${resetUrl}" style="display:inline-block;margin-top:12px;padding:12px 24px;background:#5B7FFF;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Reset password</a><p style="margin-top:24px;font-size:11px;color:#555">If you didn't request this, ignore this email.</p></div>`,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ sent: true });
  } catch (e: any) {
    return NextResponse.json({ sent: true }); // Don't leak errors
  }
}
