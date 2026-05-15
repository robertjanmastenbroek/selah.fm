import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import type { CookieOptionWithName } from './types';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: CookieOptionWithName[]) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );
}

/** Alternate client that reads cookies from raw headers (bypasses cookies() issues) */
function createClientFromHeaders() {
  try {
    const cookieHeader = headers().get('cookie') || '';
    const parsed: { name: string; value: string }[] = cookieHeader
      .split(';')
      .filter(Boolean)
      .map(c => {
        const [name, ...rest] = c.trim().split('=');
        return { name: name.trim(), value: rest.join('=').trim() };
      });

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return parsed; },
          setAll() {}, // no-op in server components
        },
      }
    );
  } catch {
    return createClient();
  }
}

export async function getUser() {
  try {
    // Try cookies() first, fall back to headers()
    let supabase;
    try { supabase = createClient(); } catch { supabase = createClientFromHeaders(); }
    const { data: { user } } = await supabase.auth.getUser();
    return user || null;
  } catch {
    return null;
  }
}

export async function isAdmin(adminEmails: string[]): Promise<boolean> {
  const user = await getUser();
  if (!user?.email) return false;
  return adminEmails.includes(user.email);
}
