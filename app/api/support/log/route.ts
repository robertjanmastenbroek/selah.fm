import { NextResponse } from 'next/server';
import sql from '@/lib/db';

/**
 * POST — Log a support chat message pair (user → bot)
 * Called by the support chat widget after each exchange.
 */
export async function POST(request: Request) {
  try {
    const { userMessage, botReply, source } = await request.json();
    if (!userMessage) return NextResponse.json({ ok: true });

    try {
      await sql`
        INSERT INTO support_chats (user_message, bot_reply, reply_source)
        VALUES (${userMessage.slice(0, 2000)}, ${(botReply || '').slice(0, 2000)}, ${source || 'unknown'})
      `;
    } catch {
      // Table may not exist — non-critical
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
