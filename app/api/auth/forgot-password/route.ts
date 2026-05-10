import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import crypto from 'crypto';
import { emailWrapper } from '@/lib/email-templates';

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
          html: emailWrapper({
            title: 'Reset your password',
            body: 'Click the button below to reset your password. This link expires in 1 hour.',
            cta: { text: 'Reset password', url: resetUrl },
          }),
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ sent: true });
  } catch (e: any) {
    return NextResponse.json({ sent: true }); // Don't leak errors
  }
}
