import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import crypto from 'crypto';

/**
 * POST /api/auth/verify-email — Verify email with token from signup email
 */
export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    const users = await sql`
      UPDATE users SET email_verified = true, verification_token = NULL
      WHERE verification_token = ${token}
      RETURNING id, email
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
    }

    return NextResponse.json({ verified: true, email: users[0].email });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
