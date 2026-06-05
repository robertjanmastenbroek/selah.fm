import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { validateEditSuggestion, validateFeedback } from '@/lib/validation';
import { rateLimitFeedback, rateLimitEditSuggestion, getRateLimitKey } from '@/lib/rate-limit';
import { createNotification } from '@/lib/notifications';
import { recordUserAction } from '@/lib/engagement';

export const runtime = 'nodejs';

interface RouteParams { params: { slug: string } }

/**
 * POST /api/artist/[slug]/feedback
 *
 * Two actions in one endpoint:
 * 1. Submit "Was this helpful?" feedback (👍/👎) — anonymous or authenticated
 * 2. Submit an edit suggestion — requires authentication
 *
 * Body:
 *   { helpful: boolean }
 *   — or —
 *   { suggestion: { field_name, current_value?, suggested_value, reason? } }
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    // ── Resolve artist_id from slug ──
    const [artist] = await sql`
      SELECT da.id as artist_id, da.artist_name
      FROM artist_profiles ap
      JOIN discovered_artists da ON da.id = ap.artist_id
      WHERE ap.slug = ${params.slug}
      LIMIT 1
    `;

    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    const artistId = artist.artist_id;
    const artistName = artist.artist_name;

    // ── Parse body ──
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // ── Route: Feedback submission ──
    if ('helpful' in body) {
      const validated = validateFeedback(body);
      if (!validated.valid) {
        return NextResponse.json({ error: validated.error }, { status: 400 });
      }

      // Rate limit (anonymous or session-based)
      const key = getRateLimitKey(request);
      const rl = await rateLimitFeedback(key);
      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'rate_limit', retry_after: Math.ceil(rl.resetIn / 1000) },
          { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
        );
      }

      // Get session_id for anonymous tracking
      const cookieHeader = request.headers.get('cookie') || '';
      let sessionId = cookieHeader.match(/session=([^;]+)/)?.[1] || null;

      // Get authenticated user
      const authHeader = request.headers.get('authorization') || '';
      let userId: string | null = null;
      if (authHeader.startsWith('Bearer ')) {
        // Try to resolve from session cookie (Supabase SSR pattern)
        const sessionMatch = cookieHeader.match(/sb-[^=]+=([^;]+)/);
        if (sessionMatch) {
          const [userRow] = await sql`SELECT id FROM auth.users WHERE id::text = ${sessionMatch[1]} LIMIT 1`;
          userId = userRow?.id || null;
        }
      }

      // Insert feedback
      const [feedback] = await sql`
        INSERT INTO artist_feedback (user_id, artist_id, helpful, session_id)
        VALUES (${userId}, ${artistId}, ${validated.sanitized.helpful}, ${sessionId})
        RETURNING id
      `;

      if (userId) {
        recordUserAction(userId).catch(() => {});
      }

      return NextResponse.json({ success: true, feedback_id: feedback.id });
    }

    // ── Route: Edit suggestion ──
    if ('suggestion' in body) {
      // Requires authentication
      const cookieHeader = request.headers.get('cookie') || '';
      const sessionMatch = cookieHeader.match(/sb-[^=]+=([^;]+)/);
      let userId: string | null = null;
      if (sessionMatch) {
        const [userRow] = await sql`SELECT id FROM auth.users WHERE id::text = ${sessionMatch[1]} LIMIT 1`;
        userId = userRow?.id || null;
      }

      if (!userId) {
        return NextResponse.json({ error: 'Authentication required to submit edit suggestions' }, { status: 401 });
      }

      // Rate limit per user
      const rl = await rateLimitEditSuggestion(userId);
      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'rate_limit', retry_after: Math.ceil(rl.resetIn / 1000) },
          { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
        );
      }

      // Validate suggestion
      const validated = validateEditSuggestion(body.suggestion);
      if (!validated.valid) {
        return NextResponse.json({ error: validated.error }, { status: 400 });
      }

      // Fetch current value for the field (snapshot)
      let currentValue: string | null = null;
      if (validated.sanitized.field_name === 'bio') {
        const [audit] = await sql`SELECT bio FROM artist_audits WHERE discovered_artist_id = ${artistId} LIMIT 1`;
        currentValue = audit?.bio || null;
      }

      const s = validated.sanitized;

      // Insert suggestion
      const [suggestion] = await sql`
        INSERT INTO artist_edit_suggestions
          (user_id, artist_id, field_name, current_value, suggested_value, reason)
        VALUES
          (${userId}, ${artistId}, ${s.field_name}, ${s.current_value || currentValue}, ${s.suggested_value}, ${s.reason})
        RETURNING id, status
      `;

      recordUserAction(userId).catch(() => {});

      return NextResponse.json({
        success: true,
        suggestion_id: suggestion.id,
        status: suggestion.status,
        message: 'Your suggestion has been submitted for review.',
      });
    }

    return NextResponse.json({ error: 'Invalid request body. Send { helpful: boolean } or { suggestion: {...} }.' }, { status: 400 });
  } catch (e: any) {
    console.error('[FEEDBACK API] Error:', e.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
