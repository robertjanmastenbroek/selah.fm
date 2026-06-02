import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/comments/[id] — Delete a comment (own or admin)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = params;

    // Find the comment
    const [comment] = await sql`
      SELECT id, user_id FROM page_comments WHERE id = ${id}
    `;
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Only the author or an admin can delete
    const { ADMIN_EMAILS } = await import('@/lib/constants');
    const isAdmin = ADMIN_EMAILS.includes(user.email || '');

    if (comment.user_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await sql`DELETE FROM page_comments WHERE id = ${id}`;

    return NextResponse.json({ deleted: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
