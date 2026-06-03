import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/messages/typing
 * Fired when user is typing. Updates typing_indicators table.
 * Auto-expires after 5 seconds of no keystrokes.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { conversation_with } = await request.json();
    if (!conversation_with) {
      return NextResponse.json({ error: 'conversation_with required' }, { status: 400 });
    }

    // Upsert typing indicator with 5s TTL
    await sql`
      INSERT INTO typing_indicators (user_id, conversation_with, updated_at, expired_at)
      VALUES (${user.id}, ${conversation_with}, NOW(), NOW() + INTERVAL '5 seconds')
      ON CONFLICT (user_id)
      DO UPDATE SET updated_at = NOW(), expired_at = NOW() + INTERVAL '5 seconds'
    `;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * GET /api/messages/typing?with=USER_ID
 * Returns whether the other user is currently typing.
 */
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ typing: false });

  try {
    const { searchParams } = new URL(request.url);
    const conversationWith = searchParams.get('with');
    if (!conversationWith) {
      return NextResponse.json({ typing: false });
    }

    const [indicator] = await sql`
      SELECT user_id, conversation_with FROM typing_indicators
      WHERE user_id = ${conversationWith}
        AND conversation_with = ${user.id}
        AND expired_at > NOW()
      LIMIT 1
    `;

    return NextResponse.json({ typing: !!indicator });
  } catch {
    return NextResponse.json({ typing: false });
  }
}
