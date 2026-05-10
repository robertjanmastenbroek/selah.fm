import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET  — Return current user (or null if not authenticated)
 * PATCH — Update user profile
 */
export async function GET(request: Request) {
  // Use the unified getSession — handles both cookies() and raw header parsing
  const session = getSession(request);
  if (!session) return NextResponse.json({ user: null });

  // Session already contains id, email, type, name
  // Fetch additional fields from DB for the full profile
  try {
    const users = await sql`
      SELECT id, email, display_name, bio, genres, preferred_cpm_cents,
             tiktok_handle, instagram_handle, youtube_handle, facebook_handle,
             user_type, stripe_connect_id, profile_image_url
      FROM users WHERE id = ${session.id}
    `;
    if (users.length > 0) {
      const u = users[0];
      return NextResponse.json({
        user: {
          id: u.id,
          email: u.email,
          name: u.display_name || session.name,
          type: u.user_type || session.type,
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
        display_name = COALESCE(${body.name || null}, display_name),
        bio = COALESCE(${body.bio ?? null}, bio),
        genres = COALESCE(${body.genres ?? null}, genres),
        preferred_cpm_cents = COALESCE(${body.preferredCpm ? parseInt(body.preferredCpm) || null : null}::int, preferred_cpm_cents),
        tiktok_handle = COALESCE(${body.tiktok_handle ?? null}, tiktok_handle),
        instagram_handle = COALESCE(${body.instagram_handle ?? null}, instagram_handle),
        youtube_handle = COALESCE(${body.youtube_handle ?? null}, youtube_handle),
        facebook_handle = COALESCE(${body.facebook_handle ?? null}, facebook_handle),
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