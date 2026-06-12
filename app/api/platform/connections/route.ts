/**
 * /api/platform/connections
 * GET  — list current user's platform connections
 * DELETE — disconnect a platform
 */
import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const connections = await sql`
    SELECT id, platform, role, platform_user_id, platform_username, avatar_url, token_expires_at, created_at, updated_at
    FROM platform_connections
    WHERE user_id = ${user.id}
    ORDER BY platform
  `;

  return NextResponse.json({ connections });
}

export async function DELETE(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { platform } = await request.json();
  if (!platform) return NextResponse.json({ error: 'Platform required' }, { status: 400 });

  await sql`
    DELETE FROM platform_connections WHERE user_id = ${user.id} AND platform = ${platform}
  `;

  return NextResponse.json({ ok: true });
}
