import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ADMIN_EMAILS } from '@/lib/constants';

// Case-insensitive admin check — handles any casing differences between DB and env
const isAdminEmail = (email: string) =>
  ADMIN_EMAILS.some(a => a.toLowerCase() === (email || '').toLowerCase());

/**
 * GET  — Return current user (or null if not authenticated)
 * PATCH — Update user profile
 */
export async function GET(request: Request) {
  // Use the unified getSession — handles both cookies() and raw header parsing
  const session = getSession(request);
  if (!session) return NextResponse.json({ user: null, isAdmin: false });

  // Resolve user ID (handles old sessions that lack id)
  const userId = session.id || (await sql`SELECT id FROM users WHERE email = ${session.email}`.then((r: any) => r[0]?.id));
  if (!userId) return NextResponse.json({ user: { ...session, id: undefined, isAdmin: isAdminEmail(session.email) } });

  // Fetch additional fields from DB for the full profile
  try {
    const users = await sql`
      SELECT id, email, display_name, bio, genres, preferred_cpm_cents,
             tiktok_handle, instagram_handle, youtube_handle, facebook_handle,
             user_type, is_artist, is_creator, stripe_connect_id, profile_image_url
      FROM users WHERE id = ${userId}
    `;
    if (users.length > 0) {
      const u = users[0];
      return NextResponse.json({
        user: {
          id: u.id,
          email: u.email,
          isAdmin: isAdminEmail(u.email),
          name: u.display_name || session.name,
          type: u.user_type || session.type,
          is_artist: u.is_artist ?? (u.user_type === 'artist'),
          is_creator: u.is_creator ?? (u.user_type === 'creator'),
          bio: u.bio,
          genres: u.genres,
          preferred_cpm_cents: u.preferred_cpm_cents,
          tiktok_handle: u.tiktok_handle,
          instagram_handle: u.instagram_handle,
          youtube_handle: u.youtube_handle,
          facebook_handle: u.facebook_handle,
          stripe_connect_id: u.stripe_connect_id,
          profile_image_url: u.profile_image_url,
        },
      });
    }
  } catch {
    // DB down — return session data only
  }

  return NextResponse.json({
    user: {
      id: session.id,
      email: session.email,
      isAdmin: isAdminEmail(session.email),
      name: session.name,
      type: session.type,
    },
  });
}

export async function PATCH(request: Request) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const body = await request.json();

    await sql`
      UPDATE users SET
        user_type = COALESCE(${body.user_type || null}, user_type),
        is_artist = CASE WHEN ${body.is_artist !== undefined} THEN ${body.is_artist ? true : false} ELSE is_artist END,
        is_creator = CASE WHEN ${body.is_creator !== undefined} THEN ${body.is_creator ? true : false} ELSE is_creator END,
        display_name = COALESCE(${body.name || null}, display_name),
        bio = COALESCE(${body.bio ?? null}, bio),
        genres = COALESCE(${body.genres ?? null}, genres),
        preferred_cpm_cents = COALESCE(${body.preferredCpm ? parseInt(body.preferredCpm) || null : null}::int, preferred_cpm_cents),
        tiktok_handle = COALESCE(${body.tiktok_handle ?? null}, tiktok_handle),
        instagram_handle = COALESCE(${body.instagram_handle ?? null}, instagram_handle),
        youtube_handle = COALESCE(${body.youtube_handle ?? null}, youtube_handle),
        facebook_handle = COALESCE(${body.facebook_handle ?? null}, facebook_handle),
        profile_image_url = CASE WHEN ${body.profile_image_url !== undefined} THEN ${body.profile_image_url || null} ELSE profile_image_url END,
        updated_at = NOW()
      WHERE id = ${session.id}
    `;

    const result = await sql`
      SELECT id, email, display_name, bio, genres, preferred_cpm_cents,
             tiktok_handle, instagram_handle, youtube_handle, facebook_handle
      FROM users WHERE id = ${session.id}
    `;

    return NextResponse.json({ ok: true, user: result[0] });
  } catch (e: any) {
    console.error('Profile update error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}