import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/artist/claim
 * Creates or links an artist profile for the current user.
 * Called at the end of onboarding when role='artist'.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { artistName, genres } = await request.json();
    if (!artistName?.trim()) {
      return NextResponse.json({ error: 'artistName required' }, { status: 400 });
    }

    const name = artistName.trim();
    const genreList = Array.isArray(genres) ? genres : [];

    // Check if a discovered_artists record already exists with this name (exact match)
    const [existingArtist] = await sql`
      SELECT id, artist_name, status FROM discovered_artists
      WHERE LOWER(artist_name) = LOWER(${name})
      LIMIT 1
    `;

    let artistId: string;

    if (existingArtist) {
      artistId = existingArtist.id;
      // Update status if it's just 'discovered'
      if (existingArtist.status === 'discovered' || !existingArtist.status) {
        await sql`UPDATE discovered_artists SET status = 'claimed' WHERE id = ${artistId}`;
      }
    } else {
      // Create new artist record
      const [created] = await sql`
        INSERT INTO discovered_artists (artist_name, genres, source, status, email_address)
        VALUES (${name}, ${genreList}, 'self-claim', 'claimed', ${user.email || null})
        RETURNING id
      `;
      artistId = created.id;
    }

    // Generate a slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + artistId.slice(0, 6);
    
    // Check if slug exists, if so append a suffix
    const [existingSlug] = await sql`
      SELECT slug FROM artist_profiles WHERE slug = ${baseSlug} LIMIT 1
    `;
    const slug = existingSlug ? baseSlug + '-' + Math.random().toString(36).slice(2, 6) : baseSlug;

    // Create or update artist_profiles
    await sql`
      INSERT INTO artist_profiles (artist_id, slug)
      VALUES (${artistId}, ${slug})
      ON CONFLICT (artist_id) DO UPDATE SET slug = ${slug}, updated_at = NOW()
    `;

    // Link user to artist via claimed_by_user_id on artist_profiles
    await sql`
      UPDATE artist_profiles SET claimed_by_user_id = ${user.id} WHERE artist_id = ${artistId}
    `;

    return NextResponse.json({
      ok: true,
      artistId,
      slug,
      artistName: name,
    });
  } catch (e: any) {
    console.error('Artist claim error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
