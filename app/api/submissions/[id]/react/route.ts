import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/submissions/[id]/react — Toggle reaction on a submission
 * Body: { type: 'heart' }
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in to react' }, { status: 401 });
    }

    const { rateLimit, getRateLimitKey } = await import('@/lib/rate-limit');
    const rl = await rateLimit(getRateLimitKey(request), { maxRequests: 30, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const type = (body.type || 'heart') as string;
    if (!['heart', 'fire', 'clap', 'star'].includes(type)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
    }

    const { id: submissionId } = params;

    // Check if submission exists
    const [submission] = await sql`SELECT id, campaign_id FROM submissions WHERE id = ${submissionId}`;
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Toggle reaction
    const [existing] = await sql`
      SELECT id FROM submission_reactions
      WHERE submission_id = ${submissionId} AND user_id = ${user.id} AND reaction_type = ${type}
    `;

    if (existing) {
      // Remove reaction
      await sql`DELETE FROM submission_reactions WHERE id = ${existing.id}`;
      await sql`UPDATE submissions SET reactions_count = GREATEST(reactions_count - 1, 0) WHERE id = ${submissionId}`;
    } else {
      // Add reaction
      await sql`
        INSERT INTO submission_reactions (submission_id, user_id, reaction_type)
        VALUES (${submissionId}, ${user.id}, ${type})
      `;
      await sql`UPDATE submissions SET reactions_count = reactions_count + 1 WHERE id = ${submissionId}`;
    }

    // Get updated counts
    const reactions = await sql`
      SELECT reaction_type, COUNT(*)::int as count
      FROM submission_reactions WHERE submission_id = ${submissionId}
      GROUP BY reaction_type
    `;
    const counts: Record<string, number> = {};
    for (const r of reactions) counts[r.reaction_type] = r.count;

    // Create batched activity event (only every 5 reactions to avoid spam)
    const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
    if (totalCount % 5 === 0 && totalCount > 0) {
      // Get the campaign's artist
      const [camp] = await sql`
        SELECT cc.discovered_artist_id FROM campaigns c
        JOIN campaign_claims cc ON cc.campaign_id = c.id
        WHERE c.id = ${submission.campaign_id} LIMIT 1
      `;
      if (camp) {
        sql`
          INSERT INTO activity_events (artist_id, event_type, actor_type, actor_name, message, metadata)
          VALUES (${camp.discovered_artist_id}, 'reaction_batch', 'system', '', ${totalCount + ' people loved this video'}, ${JSON.stringify({ submission_id: submissionId, reaction_count: totalCount })})
        `.catch((e: any) => console.error('Async error in api/submissions/[id]/react/route.ts:', e));
        // Notify the submission creator
        sql`
          INSERT INTO notifications (user_id, type, message, link)
          SELECT s.creator_id, 'reaction', ${'Your video got ' + totalCount + ' ❤️ reactions!'}, '/dashboard'
          FROM submissions s WHERE s.id = ${submissionId} AND s.creator_id IS NOT NULL
        `.catch((e: any) => console.error('Async error in api/submissions/[id]/react/route.ts:', e));
      }
    }

    return NextResponse.json({ reactions: counts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
