import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';
import { headers } from 'next/headers';

/**
 * Supabase server client — reads cookies directly from request headers.
 * This is more reliable than cookies() in server components on some deployments.
 */
export function createClient() {
  const cookieHeader = headers().get('cookie') || '';

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieHeader.split(';').filter(Boolean).map(c => {
            const [name, ...rest] = c.trim().split('=');
            return { name: name.trim(), value: rest.join('=').trim() };
          });
        },
        setAll() {
          // Server Components can't set cookies — middleware handles refresh
        },
      },
    }
  );
}

export async function getUser() {
  try {
    const supabase = createClient();
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
