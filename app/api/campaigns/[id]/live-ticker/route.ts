import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const events = await sql`
      SELECT event_type, payload, created_at
      FROM live_ticker_events
      WHERE campaign_id = ${params.id}
      ORDER BY created_at DESC
      LIMIT 15
    `;

    // Format messages from payload
    const messages = events.map((e: any) => {
      const p = typeof e.payload === 'string' ? JSON.parse(e.payload) : e.payload;
      if (e.event_type === 'donation_received') {
        return {
          type: 'donation',
          message: `${p.first_name} ${p.last_initial}. donated $${Number(p.amount).toLocaleString()}`,
          timestamp: e.created_at,
        };
      }
      if (e.event_type === 'video_submitted') {
        return {
          type: 'submission',
          message: `${p.first_name} ${p.last_initial}. submitted a video on ${p.platform || 'TikTok'}`,
          timestamp: e.created_at,
        };
      }
      return { type: 'unknown', message: '', timestamp: e.created_at };
    }).filter((m: any) => m.message);

    return NextResponse.json({ events: messages });
  } catch (e: any) {
    return NextResponse.json({ events: [] });
  }
}
