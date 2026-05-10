import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * POST /api/auth/reset-password — Reset password with token from email
 */
export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const users = await sql`
      SELECT id FROM users
      WHERE reset_token = ${token} AND reset_token_expires > NOW()
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await sql`
      UPDATE users SET
        password_hash = ${hashedPassword},
        reset_token = NULL,
        reset_token_expires = NULL
      WHERE id = ${users[0].id}
    `;

    return NextResponse.json({ reset: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
