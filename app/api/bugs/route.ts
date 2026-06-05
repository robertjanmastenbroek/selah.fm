import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';
import { getUser } from '@/lib/supabase/server';

/**
 * POST — Submit a bug report (any authenticated user)
 * GET  — List bugs (admin only)
 * PATCH — Update bug status (admin only)
 * DELETE — Delete a bug (admin only)
 */
export async function POST(request: Request) {
  const user = await getUser();
  const { description, stepsToReproduce, severity = 'medium' } = await request.json();

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    return NextResponse.json({ error: 'Description is required and must be at least 10 characters.' }, { status: 400 });
  }

  const validSeverities = ['low', 'medium', 'high', 'critical'];
  const sev = validSeverities.includes(severity) ? severity : 'medium';

  try {
    const userId = user?.id || null;
    const result = await sql`
      INSERT INTO bugs (user_id, description, steps_to_reproduce, severity, status)
      VALUES (${userId}, ${description.trim()}, ${stepsToReproduce?.trim() || null}, ${sev}, 'new')
      RETURNING id, description, severity, status, created_at
    `;
    return NextResponse.json({ bug: result[0] }, { status: 201 });
  } catch (e: any) {
    console.error('Bug creation error:', e.message);
    if (e.message?.includes('relation') || e.message?.includes('exist')) {
      return NextResponse.json({ error: 'Bugs table not created yet. Run Admin → Migrate first.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to log bug.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  // Allow users to see their own bug reports
  const user = await getUser();
  const isAdmin = await isAdminRequest(request);
  
  if (!isAdmin && !user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const bugs = await sql`
      SELECT b.id, b.user_id, b.description, b.steps_to_reproduce, b.severity, b.status, b.created_at,
             COALESCE(u.email, 'anonymous') as user_email
      FROM bugs b
      LEFT JOIN users u ON u.id = b.user_id
      ${isAdmin || !user?.id ? sql`` : sql`WHERE b.user_id = ${user.id}`}
      ORDER BY b.created_at DESC
      LIMIT 100
    `;
    return NextResponse.json(bugs);
  } catch (e: any) {
    console.error('Bug fetch error:', e.message);
    return NextResponse.json({ error: 'Failed to fetch bugs.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { id, status } = await request.json();
  if (!id || !['new', 'in_progress', 'fixed', 'closed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid id or status' }, { status: 400 });
  }

  try {
    await sql`UPDATE bugs SET status = ${status}, updated_at = now() WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    await sql`DELETE FROM bugs WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
