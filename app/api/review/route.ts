import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { submissionId, status } = await request.json();
    const result = await sql`
      UPDATE submissions
      SET review_status = ${status}, reviewed_at = NOW()
      WHERE id = ${submissionId}
      RETURNING *
    `;
    return NextResponse.json(result[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
