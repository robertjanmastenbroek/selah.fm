import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    nextauth_url: process.env.NEXTAUTH_URL || '(not set)',
    google_client_id_set: Boolean(process.env.GOOGLE_CLIENT_ID),
    google_client_id_length: (process.env.GOOGLE_CLIENT_ID || '').length,
    google_client_secret_set: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    nextauth_secret_set: Boolean(process.env.NEXTAUTH_SECRET),
    callback_url_if_set: process.env.NEXTAUTH_URL
      ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
      : '(NEXTAUTH_URL not set — this is the problem)',
  });
}
