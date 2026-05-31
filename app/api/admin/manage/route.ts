import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

/**
 * Admin management API — PATCH for updates, DELETE for removal.
 * All operations require admin authentication.
 *
 * PATCH /api/admin/manage?type=users&id=UUID  — update a user
 * PATCH /api/admin/manage?type=campaigns&id=UUID — update a campaign
 * PATCH /api/admin/manage?type=submissions&id=UUID — update a submission
 * DELETE /api/admin/manage?type=users&id=UUID — delete a user
 */

export async function PATCH(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const body = await request.json();

    if (!type || !id) return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });

    switch (type) {
      case 'users': {
        // Use tagged template for each field individually
        if (body.display_name !== undefined) await sql`UPDATE users SET display_name = ${body.display_name}, updated_at = NOW() WHERE id = ${id}`;
        if (body.user_type !== undefined) await sql`UPDATE users SET user_type = ${body.user_type}, updated_at = NOW() WHERE id = ${id}`;
        if (body.bio !== undefined) await sql`UPDATE users SET bio = ${body.bio}, updated_at = NOW() WHERE id = ${id}`;
        if (body.genres !== undefined) await sql`UPDATE users SET genres = ${body.genres}, updated_at = NOW() WHERE id = ${id}`;
        if (body.tiktok_handle !== undefined) await sql`UPDATE users SET tiktok_handle = ${body.tiktok_handle}, updated_at = NOW() WHERE id = ${id}`;
        if (body.instagram_handle !== undefined) await sql`UPDATE users SET instagram_handle = ${body.instagram_handle}, updated_at = NOW() WHERE id = ${id}`;
        if (body.youtube_handle !== undefined) await sql`UPDATE users SET youtube_handle = ${body.youtube_handle}, updated_at = NOW() WHERE id = ${id}`;
        return NextResponse.json({ ok: true });
      }

      case 'campaigns': {
        if (body.track_title !== undefined) await sql`UPDATE campaigns SET track_title = ${body.track_title}, updated_at = NOW() WHERE id = ${id}`;
        if (body.cpm_rate_cents !== undefined) await sql`UPDATE campaigns SET cpm_rate_cents = ${body.cpm_rate_cents}, updated_at = NOW() WHERE id = ${id}`;
        if (body.total_budget_cents !== undefined) await sql`UPDATE campaigns SET total_budget_cents = ${body.total_budget_cents}, updated_at = NOW() WHERE id = ${id}`;
        if (body.budget_remaining_cents !== undefined) await sql`UPDATE campaigns SET budget_remaining_cents = ${body.budget_remaining_cents}, updated_at = NOW() WHERE id = ${id}`;
        if (body.status !== undefined) await sql`UPDATE campaigns SET status = ${body.status}, updated_at = NOW() WHERE id = ${id}`;
        if (body.requirements !== undefined) await sql`UPDATE campaigns SET requirements = ${body.requirements}, updated_at = NOW() WHERE id = ${id}`;
        if (body.recommended_hashtags !== undefined) await sql`UPDATE campaigns SET recommended_hashtags = ${body.recommended_hashtags}, updated_at = NOW() WHERE id = ${id}`;
        if (body.is_pinned !== undefined) await sql`UPDATE campaigns SET is_pinned = ${body.is_pinned}, updated_at = NOW() WHERE id = ${id}`;
        return NextResponse.json({ ok: true });
      }

      case 'submissions': {
        if (body.review_status !== undefined) await sql`UPDATE submissions SET review_status = ${body.review_status} WHERE id = ${id}`;
        if (body.payout_status !== undefined) await sql`UPDATE submissions SET payout_status = ${body.payout_status} WHERE id = ${id}`;
        if (body.payout_amount_cents !== undefined) await sql`UPDATE submissions SET payout_amount_cents = ${body.payout_amount_cents} WHERE id = ${id}`;
        if (body.views_verified !== undefined) await sql`UPDATE submissions SET views_verified = ${body.views_verified} WHERE id = ${id}`;
        if (body.rejection_reason !== undefined) await sql`UPDATE submissions SET rejection_reason = ${body.rejection_reason} WHERE id = ${id}`;
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (e: any) {
    console.error('Admin PATCH error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });

    switch (type) {
      case 'users':
        await sql`DELETE FROM users WHERE id = ${id}`;
        break;
      case 'campaigns':
        await sql`DELETE FROM campaigns WHERE id = ${id}`;
        break;
      case 'submissions':
        await sql`DELETE FROM submissions WHERE id = ${id}`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Admin DELETE error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Also support GET for detailed views of individual records
export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const search = searchParams.get('search') || '';

    if (type === 'submissions') {
      let rows;
      if (search) {
        rows = await sql`
          SELECT s.*, c.track_title, u.display_name as creator_name, u.email as creator_email
          FROM submissions s
          JOIN campaigns c ON c.id = s.campaign_id
          LEFT JOIN users u ON u.id = s.creator_id
          WHERE c.track_title ILIKE ${'%' + search + '%'} OR u.display_name ILIKE ${'%' + search + '%'}
          ORDER BY s.submitted_at DESC LIMIT 200
        `;
      } else {
        rows = await sql`
          SELECT s.*, c.track_title, u.display_name as creator_name, u.email as creator_email
          FROM submissions s
          JOIN campaigns c ON c.id = s.campaign_id
          LEFT JOIN users u ON u.id = s.creator_id
          ORDER BY s.submitted_at DESC LIMIT 200
        `;
      }
      return NextResponse.json(rows);
    }

    if (type === 'payouts') {
      const rows = await sql`
        SELECT s.id, s.payout_amount_cents, s.payout_status, s.review_status, s.submitted_at,
               c.track_title, u.display_name as creator_name, u.email as creator_email,
               u.stripe_connect_id
        FROM submissions s
        JOIN campaigns c ON c.id = s.campaign_id
        LEFT JOIN users u ON u.id = s.creator_id
        WHERE s.payout_amount_cents > 0
        ORDER BY s.submitted_at DESC LIMIT 200
      `;
      return NextResponse.json(rows);
    }

    if (type === 'campaigns') {
      const rows = search
        ? await sql`
          SELECT c.*, u.display_name as artist_name, u.email as artist_email
          FROM campaigns c
          LEFT JOIN users u ON u.id = c.artist_id
          WHERE c.track_title ILIKE ${'%' + search + '%'} OR u.display_name ILIKE ${'%' + search + '%'}
          ORDER BY c.created_at DESC LIMIT 200
        `
        : await sql`
          SELECT c.*, u.display_name as artist_name, u.email as artist_email
          FROM campaigns c
          LEFT JOIN users u ON u.id = c.artist_id
          ORDER BY c.created_at DESC LIMIT 200
        `;
      return NextResponse.json(rows);
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
