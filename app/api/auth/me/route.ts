import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  
  if (!sessionCookie) return NextResponse.json({ user: null });

  try {
    const crypto = await import('crypto');
    const [payload, sig] = sessionCookie.split('.');
    const expected = crypto
      .createHmac('sha256', process.env.NEXTAUTH_SECRET || 'selah-secret')
      .update(payload)
      .digest('hex');

    if (sig !== expected) return NextResponse.json({ user: null });

    const user = JSON.parse(Buffer.from(payload, 'base64').toString());
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function PATCH(request: Request) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const body = await request.json();
    const users = await sql`SELECT id FROM users WHERE email = ${session.email}`;
    if (users.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const userId = users[0].id;
    const updates: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) { updates.push(`display_name = $${updates.length + 1}`); values.push(body.name); }
    if (body.bio !== undefined) { updates.push(`bio = $${updates.length + 1}`); values.push(body.bio); }
    if (body.genres !== undefined) { updates.push(`genres = $${updates.length + 1}`); values.push(body.genres); }
    if (body.preferredCpm !== undefined) { updates.push(`preferred_cpm_cents = $${updates.length + 1}`); values.push(parseInt(body.preferredCpm)); }
    if (body.tiktok_handle !== undefined) { updates.push(`tiktok_handle = $${updates.length + 1}`); values.push(body.tiktok_handle); }
    if (body.instagram_handle !== undefined) { updates.push(`instagram_handle = $${updates.length + 1}`); values.push(body.instagram_handle); }
    if (body.youtube_handle !== undefined) { updates.push(`youtube_handle = $${updates.length + 1}`); values.push(body.youtube_handle); }
    if (body.facebook_handle !== undefined) { updates.push(`facebook_handle = $${updates.length + 1}`); values.push(body.facebook_handle); }
    if (body.facebook_handle !== undefined) { updates.push(`facebook_handle = $${updates.length + 1}`); values.push(body.facebook_handle); }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    
    const result = await sql`
      UPDATE users SET display_name = COALESCE(${body.name || null}, display_name),
        bio = COALESCE(${body.bio ?? null}, bio),
        genres = COALESCE(${body.genres ?? null}, genres),
        preferred_cpm_cents = COALESCE(${body.preferredCpm ? parseInt(body.preferredCpm) : null}, preferred_cpm_cents),
        tiktok_handle = COALESCE(${body.tiktok_handle ?? null}, tiktok_handle),
        instagram_handle = COALESCE(${body.instagram_handle ?? null}, instagram_handle),
        youtube_handle = COALESCE(${body.youtube_handle ?? null}, youtube_handle),
        facebook_handle = COALESCE(${body.facebook_handle ?? null}, facebook_handle),
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, email, display_name, bio, genres, preferred_cpm_cents, tiktok_handle, instagram_handle, youtube_handle, facebook_handle
    `;

    return NextResponse.json({ ok: true, user: result[0] });
  } catch (e: any) {
    console.error('Profile update error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
