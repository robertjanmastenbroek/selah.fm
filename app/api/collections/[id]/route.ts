import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/collections/[id] — get collection with items
 * DELETE /api/collections/[id] — delete collection
 * PATCH /api/collections/[id] — update collection name/description
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const [collection] = await sql`
    SELECT c.*, u.display_name as owner_name
    FROM collections c
    JOIN users u ON u.id = c.user_id
    WHERE c.id = ${params.id}
    LIMIT 1
  `;
  if (!collection) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const items = await sql`
    SELECT ci.*, at.title, at.cover_art_url, at.cpm_rate_cents,
           da.artist_name, ap.slug as artist_slug
    FROM collection_items ci
    JOIN artist_tracks at ON at.id = ci.track_id
    JOIN artist_profiles ap ON ap.id = at.artist_id
    JOIN discovered_artists da ON da.id = ap.artist_id
    WHERE ci.collection_id = ${params.id}
    ORDER BY ci.sort_order ASC, ci.created_at DESC
    LIMIT 50
  `;

  return NextResponse.json({ collection, items });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [col] = await sql`SELECT id FROM collections WHERE id = ${params.id} AND user_id = ${user.id} LIMIT 1`;
  if (!col) return NextResponse.json({ error: 'Not found or not yours' }, { status: 404 });

  await sql`DELETE FROM collections WHERE id = ${params.id}`;
  return NextResponse.json({ ok: true });
}
