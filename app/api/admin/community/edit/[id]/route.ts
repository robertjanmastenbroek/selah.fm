import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { createNotification } from '@/lib/notifications';

export const runtime = 'nodejs';

interface RouteParams { params: { id: string } }

/**
 * PATCH /api/admin/community/edit/[id]
 * Approves or rejects an edit suggestion.
 * On approval: inserts into artist_edit_history, updates artist_audits if bio field,
 * sends notification to the submitter.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    // Admin check
    const cookies = request.headers.get('cookie') || '';
    const sessionMatch = cookies.match(/sb-[^=]+=([^;]+)/);
    if (!sessionMatch) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const [adminUser] = await sql`SELECT id, email FROM auth.users WHERE id::text = ${sessionMatch[1]} LIMIT 1`;
    if (!adminUser || adminUser.email !== 'motomotosings@gmail.com') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse body
    const body = await request.json().catch(() => null);
    if (!body || !body.status) {
      return NextResponse.json({ error: 'status is required (approved or rejected)' }, { status: 400 });
    }

    const { id } = params;
    const newStatus = body.status;
    if (!['approved', 'rejected'].includes(newStatus)) {
      return NextResponse.json({ error: 'status must be "approved" or "rejected"' }, { status: 400 });
    }

    // Fetch the suggestion
    const [suggestion] = await sql`
      SELECT aes.id, aes.user_id, aes.artist_id, aes.field_name,
             aes.current_value, aes.suggested_value, aes.reason,
             aes.status, aes.source
      FROM artist_edit_suggestions aes
      WHERE aes.id = ${id} AND aes.status = 'pending'
      LIMIT 1
    `;

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found or already moderated' }, { status: 404 });
    }

    const moderatorId = adminUser.id;
    const moderatorNotes = body.moderator_notes || null;

    if (newStatus === 'approved') {
      // Apply the edit
      const oldValue = suggestion.current_value;

      // 1. Update artist_audits.bio if bio field
      if (suggestion.field_name === 'bio') {
        await sql`
          INSERT INTO artist_audits (discovered_artist_id, bio)
          VALUES (${suggestion.artist_id}, ${suggestion.suggested_value})
          ON CONFLICT (discovered_artist_id)
          DO UPDATE SET bio = ${suggestion.suggested_value}, updated_at = NOW()
        `;
      }

      // 2. Insert into artist_edit_history
      await sql`
        INSERT INTO artist_edit_history
          (artist_id, suggestion_id, field_name, old_value, new_value, applied_by, is_verified, verified_by, verified_at)
        VALUES
          (${suggestion.artist_id}, ${id}, ${suggestion.field_name}, ${oldValue}, ${suggestion.suggested_value}, ${moderatorId}, TRUE, ${moderatorId}, NOW())
      `;

      // 3. Update suggestion status
      await sql`
        UPDATE artist_edit_suggestions
        SET status = 'approved', moderator_id = ${moderatorId}, moderator_notes = ${moderatorNotes}, applied_at = NOW(), updated_at = NOW()
        WHERE id = ${id}
      `;

      // 4. Notify submitter
      if (suggestion.user_id) {
        createNotification({
          userId: suggestion.user_id,
          type: 'edit_approved',
          message: `Your ${suggestion.field_name} edit was approved!`,
          link: `/artist/${suggestion.artist_id}`,
          metadata: { suggestion_id: id, field_name: suggestion.field_name },
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, status: 'approved' });
    } else {
      // Reject
      await sql`
        UPDATE artist_edit_suggestions
        SET status = 'rejected', moderator_id = ${moderatorId}, moderator_notes = ${moderatorNotes}, updated_at = NOW()
        WHERE id = ${id}
      `;

      // Notify submitter
      if (suggestion.user_id) {
        createNotification({
          userId: suggestion.user_id,
          type: 'edit_needs_changes',
          message: moderatorNotes
            ? `Your ${suggestion.field_name} edit needs changes: ${moderatorNotes}`
            : `Your ${suggestion.field_name} edit was not approved.`,
          link: `/artist/${suggestion.artist_id}`,
          metadata: { suggestion_id: id, field_name: suggestion.field_name, reason: moderatorNotes },
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, status: 'rejected' });
    }
  } catch (e: any) {
    console.error('[ADMIN COMMUNITY] Error moderating edit:', e.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
