import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) return NextResponse.json({ user: null });
    const crypto = await import('crypto');
    const [payload, sig] = sessionCookie.split('.');
    const expected = crypto.createHmac('sha256', process.env.NEXTAUTH_SECRET || 'selah-secret').update(payload).digest('hex');
    if (sig !== expected) return NextResponse.json({ user: null });
    const session = JSON.parse(Buffer.from(payload, 'base64').toString());

    // Fetch the actual DB user ID for the chat system
    let dbUser = null;
    try {
      const users = await sql`SELECT id FROM users WHERE email = ${session.email}`;
      if (users.length > 0) dbUser = { ...session, id: users[0].id };
    } catch {}

    return NextResponse.json({ user: dbUser || session });
  } catch { return NextResponse.json({ user: null }); }
}

export async function PATCH(request: Request) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const body = await request.json();
    const users = await sql`SELECT id FROM users WHERE email = ${session.email}`;
    if (users.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const userId = users[0].id;

    await sql`
      UPDATE users SET
        user_type = COALESCE(${body.user_type || null}, user_type),
        display_name = COALESCE(${body.name || null}, display_name),
        bio = COALESCE(${body.bio ?? null}, bio),
        genres = COALESCE(${body.genres ?? null}, genres),
        preferred_cpm_cents = COALESCE(${body.preferredCpm ? parseInt(body.preferredCpm) || null : null}::int, preferred_cpm_cents),
        tiktok_handle = COALESCE(${body.tiktok_handle ?? null}, tiktok_handle),
        instagram_handle = COALESCE(${body.instagram_handle ?? null}, instagram_handle),
        youtube_handle = COALESCE(${body.youtube_handle ?? null}, youtube_handle),
        facebook_handle = COALESCE(${body.facebook_handle ?? null}, facebook_handle),
        updated_at = NOW()
      WHERE id = ${userId}
    `;

    const result = await sql`
      SELECT id, email, display_name, bio, genres, preferred_cpm_cents, tiktok_handle, instagram_handle, youtube_handle, facebook_handle
      FROM users WHERE id = ${userId}
    `;

    return NextResponse.json({ ok: true, user: result[0] });
  } catch (e: any) {
    console.error('Profile update error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
