import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

/**
 * Claim API — handles the claim code verification and campaign transfer.
 * 
 * GET  /api/claim?code=XXX     → Verify claim code, return campaign info
 * POST /api/claim              → Complete claim (after OAuth verification)
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Claim code required' }, { status: 400 });
  }

  try {
    const [claim] = await sql`
      SELECT cc.*, c.slug, c.title, c.track_title, c.cover_art_url, c.status as campaign_status,
             c.is_unclaimed, da.artist_name, da.spotify_id, da.latest_track_name
      FROM campaign_claims cc
      JOIN campaigns c ON c.id = cc.campaign_id
      LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id
      WHERE cc.claim_code = ${code}
    `;

    if (!claim) {
      return NextResponse.json({ error: 'Invalid claim code' }, { status: 404 });
    }

    if (claim.claimed_at) {
      return NextResponse.json({ error: 'This campaign has already been claimed', claimed: true }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      campaign: {
        id: claim.campaign_id,
        title: claim.title,
        track_title: claim.track_title,
        cover_art_url: claim.cover_art_url,
        slug: claim.slug,
        is_unclaimed: claim.is_unclaimed,
      },
      artist: {
        name: claim.artist_name,
        spotify_id: claim.spotify_id,
        track_name: claim.latest_track_name,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Derive user_id from session, NOT from request body
    const sessionUser = await getUser();
    if (!sessionUser?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const user_id = sessionUser.id;

    const body = await request.json();
    const { claim_code, verification_method } = body;

    if (!claim_code) {
      return NextResponse.json({ error: 'claim_code required' }, { status: 400 });
    }

    // Verify the claim code
    const [claim] = await sql`
      SELECT * FROM campaign_claims WHERE claim_code = ${claim_code} AND claimed_at IS NULL
    `;

    if (!claim) {
      return NextResponse.json({ error: 'Invalid or already claimed code' }, { status: 400 });
    }

    // Transfer campaign ownership
    await sql`
      UPDATE campaigns SET
        artist_id = ${user_id},
        is_unclaimed = false,
        claimed_by_user_id = ${user_id},
        claimed_at = NOW(),
        updated_at = NOW()
      WHERE id = ${claim.campaign_id}
    `;

    // Update claim record
    await sql`
      UPDATE campaign_claims SET
        verification_method = ${verification_method || 'manual'},
        claimed_by_user_id = ${user_id},
        claimed_at = NOW()
      WHERE id = ${claim.id}
    `;

    // Update artist status
    if (claim.discovered_artist_id) {
      await sql`
        UPDATE discovered_artists SET status = 'claimed', updated_at = NOW()
        WHERE id = ${claim.discovered_artist_id}
      `;
    }

    // Log in outreach if exists
    await sql`
      UPDATE outreach_log SET
        status = 'claimed',
        replied_at = NOW()
      WHERE campaign_id = ${claim.campaign_id} AND status IN ('sent', 'delivered', 'read')
    `;

    return NextResponse.json({
      claimed: true,
      campaign_id: claim.campaign_id,
      message: 'Campaign claimed successfully! Welcome to Selah.fm.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
