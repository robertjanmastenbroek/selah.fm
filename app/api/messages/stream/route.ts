import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/messages/stream?with=USER_ID
 * Server-Sent Events endpoint for real-time message delivery.
 * Pushes the full message list every 3 seconds.
 */
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return new Response('Not authenticated', { status: 401 });

  const { searchParams } = new URL(request.url);
  const otherUserId = searchParams.get('with');
  if (!otherUserId) return new Response('Missing "with" parameter', { status: 400 });

  const userId = user.id;
  if (userId === otherUserId) return new Response('Cannot stream with self', { status: 400 });

  let keepAlive: NodeJS.Timeout | null = null;

  try {
    const stream = new ReadableStream({
      start(controller) {
        try { controller.enqueue(`event: connected\ndata: {"status":"ok"}\n\n`); } catch {}

        keepAlive = setInterval(() => {
          try { controller.enqueue(`:keepalive\n\n`); } catch { if (keepAlive) clearInterval(keepAlive); }
        }, 15000);

        const poll = async () => {
          try {
            const messages = await sql`
              SELECT m.id, m.content, m.created_at, m.read, m.sender_id, m.receiver_id
              FROM messages m
              WHERE (m.sender_id = ${userId} AND m.receiver_id = ${otherUserId})
                 OR (m.sender_id = ${otherUserId} AND m.receiver_id = ${userId})
              ORDER BY m.created_at ASC
              LIMIT 50
            `;
            controller.enqueue(`event: messages\ndata: ${JSON.stringify({ messages })}\n\n`);
          } catch (e: any) {
            console.error('SSE poll error:', e.message);
          }
          setTimeout(poll, 3000);
        };

        setTimeout(poll, 500);
      },
      cancel() {
        if (keepAlive) clearInterval(keepAlive);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (e: any) {
    console.error('SSE error:', e.message);
    return new Response('SSE error', { status: 500 });
  }
}
