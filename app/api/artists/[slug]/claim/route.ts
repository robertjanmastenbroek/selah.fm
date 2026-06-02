import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/artists/[slug]/claim
 * Links the authenticated user to an artist profile.
 * Creates activity event, adds claim code, and notifies.
 */
export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { slug } = params;

    // Find the artist
    const [artist] = await sql`
      SELECT da.id, da.artist_name, da.spotify_id, ap.slug
      FROM discovered_artists da
      JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE ap.slug = ${slug} LIMIT 1
    `;
    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    // Check if already claimed by this user
    const [existing] = await sql`
      SELECT id FROM campaign_claims cc
      JOIN campaigns c ON c.id = cc.campaign_id
      WHERE cc.discovered_artist_id = ${artist.id} AND c.artist_id = ${user.id}
      LIMIT 1
    `;

    if (existing) {
      return NextResponse.json({ error: 'You already own this artist profile' }, { status: 409 });
    }

    // Find any campaign linked to this artist
    const [campaign] = await sql`
      SELECT c.id FROM campaigns c
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      WHERE cc.discovered_artist_id = ${artist.id}
      LIMIT 1
    `;

    if (campaign) {
      // Transfer the campaign ownership
      await sql`UPDATE campaigns SET artist_id = ${user.id} WHERE id = ${campaign.id}`;
    }

    // Create activity event
    await sql`
      INSERT INTO activity_events (artist_id, event_type, actor_type, actor_name, actor_id, message)
      VALUES (${artist.id}, 'artist_claimed', 'user', ${user.email?.split('@')[0] || 'Artist'}, ${user.id},
              ${'Artist claimed their profile'})
    `;

    return NextResponse.json({
      success: true,
      slug: artist.slug,
      artist_name: artist.artist_name,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
