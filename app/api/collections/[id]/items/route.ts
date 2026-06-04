import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/collections/[id]/items — add track to collection
 * Body: { trackId }
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership
  const [col] = await sql`SELECT id FROM collections WHERE id = ${params.id} AND user_id = ${user.id} LIMIT 1`;
  if (!col) return NextResponse.json({ error: 'Not found or not yours' }, { status: 404 });

  const { trackId } = await request.json();
  if (!trackId) return NextResponse.json({ error: 'Missing trackId' }, { status: 400 });

  // Check track exists
  const [track] = await sql`SELECT id FROM artist_tracks WHERE id = ${trackId} LIMIT 1`;
  if (!track) return NextResponse.json({ error: 'Track not found' }, { status: 404 });

  // Check not duplicate
  const [existing] = await sql`SELECT id FROM collection_items WHERE collection_id = ${params.id} AND track_id = ${trackId} LIMIT 1`;
  if (existing) return NextResponse.json({ ok: true, message: 'Already in collection' });

  const [item] = await sql`
    INSERT INTO collection_items (collection_id, track_id, sort_order)
    VALUES (${params.id}, ${trackId}, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM collection_items WHERE collection_id = ${params.id}))
    RETURNING *
  `;

  // Update collection timestamp
  await sql`UPDATE collections SET updated_at = NOW() WHERE id = ${params.id}`;

  return NextResponse.json({ item }, { status: 201 });
}

/**
 * DELETE /api/collections/[id]/items?trackId=X — remove track from collection
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const trackId = searchParams.get('trackId');
  if (!trackId) return NextResponse.json({ error: 'Missing trackId' }, { status: 400 });

  // Verify ownership
  const [col] = await sql`SELECT id FROM collections WHERE id = ${params.id} AND user_id = ${user.id} LIMIT 1`;
  if (!col) return NextResponse.json({ error: 'Not found or not yours' }, { status: 404 });

  await sql`DELETE FROM collection_items WHERE collection_id = ${params.id} AND track_id = ${trackId}`;
  await sql`UPDATE collections SET updated_at = NOW() WHERE id = ${params.id}`;

  return NextResponse.json({ ok: true });
}
