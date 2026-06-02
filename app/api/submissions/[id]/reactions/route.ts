import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/submissions/[id]/reactions — Get reaction counts for a submission
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: submissionId } = params;

    const reactions = await sql`
      SELECT reaction_type, COUNT(*)::int as count
      FROM submission_reactions WHERE submission_id = ${submissionId}
      GROUP BY reaction_type
    `;

    const counts: Record<string, number> = { heart: 0, fire: 0, clap: 0, star: 0 };
    for (const r of reactions) counts[r.reaction_type] = r.count;

    return NextResponse.json({ reactions: counts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
