import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';
import { ADMIN_EMAILS } from '@/lib/constants';
import { markOnboarded, sendWelcomeEmail } from '@/lib/engagement';

/**
 * GET /api/auth/me — returns current user session (Supabase-backed).
 * Maintains backward compatibility with existing SWR hooks.
 */
export async function GET(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ user: null, isAdmin: false });

    // Get user profile + social handles + matching artist audit data
    const [profile] = await sql`
      SELECT u.display_name, u.user_type, u.is_artist, u.is_creator, u.stripe_connect_id, u.onboarded_at,
        u.bio, u.genres, u.preferred_cpm_cents,
        u.tiktok_handle, u.instagram_handle, u.youtube_handle, u.facebook_handle,
        u.profile_image_url, u.email as user_email,
        aa.id as audit_id, aa.instagram_handle as audit_ig, aa.tiktok_handle as audit_tt
      FROM users u
      LEFT JOIN discovered_artists da ON da.artist_name ILIKE u.display_name OR da.email_address = u.email
      LEFT JOIN artist_audits aa ON aa.discovered_artist_id = da.id
      WHERE u.id = ${user.id}
      ORDER BY aa.audited_at DESC LIMIT 1
    `;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: profile?.display_name || user.email,
        type: profile?.user_type || 'creator',
        is_artist: profile?.is_artist ?? false,
        is_creator: profile?.is_creator ?? true,
        stripe_connect_id: profile?.stripe_connect_id,
        bio: profile?.bio || null,
        genres: profile?.genres || null,
        preferred_cpm_cents: profile?.preferred_cpm_cents || null,
        tiktok_handle: profile?.tiktok_handle || profile?.audit_tt || null,
        instagram_handle: profile?.instagram_handle || profile?.audit_ig || null,
        youtube_handle: profile?.youtube_handle || null,
        facebook_handle: profile?.facebook_handle || null,
        profile_image_url: profile?.profile_image_url || null,
      },
      onboarded: !!profile?.onboarded_at,
      isAdmin: ADMIN_EMAILS.includes(user.email || ''),
    });
  } catch (e: any) {
    return NextResponse.json({ user: null, isAdmin: false, error: e.message });
  }
}

/**
 * PATCH /api/auth/me — update user profile (display_name, user_type, handles).
 */
export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const body = await request.json();
    const { name, type, is_artist, is_creator, bio, genres, tiktok_handle, instagram_handle, youtube_handle } = body;

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) { updates.push(`display_name = $${updates.length + 1}`); values.push(name); }
    if (type !== undefined && ['artist', 'creator'].includes(type)) { updates.push(`user_type = $${updates.length + 1}`); values.push(type); }
    if (is_artist !== undefined) { updates.push(`is_artist = $${updates.length + 1}`); values.push(is_artist); }
    if (is_creator !== undefined) { updates.push(`is_creator = $${updates.length + 1}`); values.push(is_creator); }
    if (bio !== undefined) { updates.push(`bio = $${updates.length + 1}`); values.push(bio); }
    if (genres !== undefined) { updates.push(`genres = $${updates.length + 1}`); values.push(genres); }
    if (tiktok_handle !== undefined) { updates.push(`tiktok_handle = $${updates.length + 1}`); values.push(tiktok_handle); }
    if (instagram_handle !== undefined) { updates.push(`instagram_handle = $${updates.length + 1}`); values.push(instagram_handle); }
    if (youtube_handle !== undefined) { updates.push(`youtube_handle = $${updates.length + 1}`); values.push(youtube_handle); }

    if (updates.length === 0) return NextResponse.json({ ok: true });

    updates.push(`updated_at = NOW()`);
    values.push(user.id);

    await sql.raw(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    // Sync social handles to artist_audits if a matching discovered artist exists
    if (instagram_handle !== undefined || tiktok_handle !== undefined || youtube_handle !== undefined) {
      try {
        const [artist] = await sql`
          SELECT da.id FROM discovered_artists da
          WHERE da.artist_name ILIKE ${user.email} OR da.artist_name ILIKE ${user.email?.split('@')[0]}
             OR da.email_address = ${user.email} LIMIT 1
        `;
        if (artist) {
          const aUpdates: string[] = []; const aValues: any[] = [];
          if (instagram_handle !== undefined) { aUpdates.push(`instagram_handle = $${aUpdates.length + 1}`); aValues.push(instagram_handle); }
          if (tiktok_handle !== undefined) { aUpdates.push(`tiktok_handle = $${aUpdates.length + 1}`); aValues.push(tiktok_handle); }
          if (youtube_handle !== undefined) { aUpdates.push(`youtube_handle = $${aUpdates.length + 1}`); aValues.push(youtube_handle); }
          if (aUpdates.length > 0) {
            aValues.push(artist.id);
            await sql.raw(`UPDATE artist_audits SET ${aUpdates.join(', ')}, updated_at = NOW() WHERE discovered_artist_id = $${aValues.length}`, aValues);
          }
        }
      } catch { /* non-critical sync */ }
    }

    // Trigger welcome email on first onboarding save
    try {
      const [profile] = await sql`SELECT onboarded_at, display_name, email FROM users WHERE id = ${user.id}`;
      if (profile && !profile.onboarded_at) {
        const role: 'artist' | 'creator' = type === 'artist' ? 'artist' : 'creator';
        const displayName = name || profile.display_name || 'there';
        
        // Mark as onboarded
        await markOnboarded(user.id, role);
        
        // Send welcome email #1 (fire-and-forget — don't block response)
        sendWelcomeEmail(user.id, user.email || '', displayName, role, 0).catch(() => {});
      }
    } catch {
      // Non-critical — onboarding still succeeds even if welcome email fails
    }

    return NextResponse.json({ ok: true, onboarded: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}