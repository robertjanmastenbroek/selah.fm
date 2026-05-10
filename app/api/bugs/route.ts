import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * POST — Submit a bug report (any authenticated user)
 * GET  — Pull new bugs (requires BUG_PULL_SECRET in query param)
 */
export async function POST(request: Request) {
  const session = getSession(request);
  const { description, stepsToReproduce, severity = 'medium' } = await request.json();

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    return NextResponse.json({ error: 'Description is required and must be at least 10 characters.' }, { status: 400 });
  }

  const validSeverities = ['low', 'medium', 'high', 'critical'];
  const sev = validSeverities.includes(severity) ? severity : 'medium';

  try {
    // Get user ID if logged in
    let userId: string | null = null;
    if (session) {
      const users = await sql`SELECT id FROM users WHERE email = ${session.email}`;
      if (users.length > 0) userId = users[0].id;
    }

    const result = await sql`
      INSERT INTO bugs (user_id, description, steps_to_reproduce, severity, status)
      VALUES (${userId}, ${description.trim()}, ${stepsToReproduce?.trim() || null}, ${sev}, 'new')
      RETURNING id, description, severity, status, created_at
    `;

    return NextResponse.json({ bug: result[0] }, { status: 201 });
  } catch (e: any) {
    console.error('Bug creation error:', e.message);
    // If table doesn't exist, return a helpful message
    if (e.message?.includes('relation') || e.message?.includes('exist')) {
      return NextResponse.json({ error: 'Bugs table not created yet. Run Admin → Migrate first.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to log bug.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const auth = searchParams.get('auth');

  // Require shared secret for pulling bugs
  const pullSecret = process.env.BUG_PULL_SECRET;
  if (pullSecret && auth !== pullSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const newBugs = await sql`
      SELECT b.id, b.description, b.steps_to_reproduce, b.severity, b.created_at,
             u.email as user_email
      FROM bugs b
      LEFT JOIN users u ON u.id = b.user_id
      WHERE b.status = 'new'
      ORDER BY
        CASE b.severity
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        b.created_at ASC
      LIMIT 50
    `;

    return NextResponse.json({ newBugs });
  } catch (e: any) {
    console.error('Bug fetch error:', e.message);
    return NextResponse.json({ error: 'Failed to fetch bugs.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  // Allow marking bugs as fixed/in_progress
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { id, status } = await request.json();
  if (!id || !['in_progress', 'fixed', 'closed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid id or status' }, { status: 400 });
  }

  try {
    await sql`
      UPDATE bugs SET status = ${status}, updated_at = now()
      WHERE id = ${id}
    `;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
