import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sql from '@/lib/db';

/**
 * POST /api/campaigns/[id]/interest — toggle interest/save
 * GET /api/campaigns/[id]/interest — check if saved
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [existing] = await sql`
    SELECT id FROM campaign_interests WHERE user_id = ${user.id} AND campaign_id = ${params.id} LIMIT 1
  `;

  if (existing) {
    await sql`DELETE FROM campaign_interests WHERE id = ${existing.id}`;
    return NextResponse.json({ saved: false });
  }

  await sql`INSERT INTO campaign_interests (user_id, campaign_id) VALUES (${user.id}, ${params.id})`;
  return NextResponse.json({ saved: true });
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ saved: false });

  const [existing] = await sql`
    SELECT id FROM campaign_interests WHERE user_id = ${user.id} AND campaign_id = ${params.id} LIMIT 1
  `;

  return NextResponse.json({ saved: !!existing });
}
