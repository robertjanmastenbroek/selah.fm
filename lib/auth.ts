/**
 * Auth helpers — Supabase-based replacement for the old HMAC cookie system.
 * 
 * Uses @supabase/ssr server client under the hood.
 * All old exports (getSession, isAdminRequest, setSessionCookie, clearSessionCookie)
 * are replaced with Supabase equivalents.
 */

export { createClient as createSupabaseClient } from '@/lib/supabase/server';
export { getUser, isAdmin } from '@/lib/supabase/server';
export { ADMIN_EMAILS } from '@/lib/constants';

// ── Backward-compatible wrappers for gradual migration ──────────

import { getUser } from '@/lib/supabase/server';
import { ADMIN_EMAILS } from '@/lib/constants';

/**
 * @deprecated Use `getUser()` from @/lib/supabase/server instead.
 * Returns a SessionUser-compatible object for backward compat.
 * 
 * NOTE: This function does a dynamic import + extra DB query on every call.
 * Migrate routes to use getUser() directly for better performance.
 */
export async function getSession(request?: Request): Promise<{
  id: string;
  email: string;
  type: 'artist' | 'creator';
  name: string;
  is_artist: boolean;
  is_creator: boolean;
} | null> {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[auth] getSession() is deprecated — use getUser() from @/lib/supabase/server instead');
  }
  const user = await getUser();
  if (!user) return null;

  // Fetch profile from public.users for user_type and display_name
  const { default: sql } = await import('@/lib/db');
  const rows = await sql`SELECT user_type, is_artist, is_creator, display_name FROM users WHERE id = ${user.id}`;
  const profile = rows[0];

  return {
    id: user.id,
    email: user.email!,
    type: (profile?.user_type as 'artist' | 'creator') || 'creator',
    name: profile?.display_name || user.email!,
    is_artist: profile?.is_artist ?? false,
    is_creator: profile?.is_creator ?? true,
  };
}

/**
 * @deprecated Use `isAdmin(ADMIN_EMAILS)` from @/lib/supabase/server instead.
 */
export async function isAdminRequest(request?: Request): Promise<boolean> {
  const user = await getUser();
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email);
}
