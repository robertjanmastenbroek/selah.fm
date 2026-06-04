import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/collections — list user's collections
 * POST /api/collections — create new collection
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const collections = await sql`
    SELECT c.*, (SELECT COUNT(*)::int FROM collection_items ci WHERE ci.collection_id = c.id) as item_count
    FROM collections c
    WHERE c.user_id = ${user.id}
    ORDER BY c.updated_at DESC
    LIMIT 50
  `;

  return NextResponse.json({ collections });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description } = await request.json();
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const [collection] = await sql`
    INSERT INTO collections (user_id, name, description)
    VALUES (${user.id}, ${name.trim().slice(0, 100)}, ${description?.slice(0, 500) || null})
    RETURNING *
  `;

  return NextResponse.json({ collection }, { status: 201 });
}
