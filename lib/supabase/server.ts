import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CookieOptionWithName } from './types';

/**
 * Supabase server client — for use in:
 * - Server Components
 * - API Routes (Route Handlers)
 * - Server Actions
 * 
 * Uses next/headers cookies() for session management.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieOptionWithName[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

/**
 * Get the current authenticated user from a server context.
 * Returns null if not authenticated.
 */
export async function getUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Check if the current user is an admin.
 * Compares user email against ADMIN_EMAILS constant.
 */
export async function isAdmin(adminEmails: string[]): Promise<boolean> {
  const user = await getUser();
  if (!user?.email) return false;
  return adminEmails.includes(user.email);
}
