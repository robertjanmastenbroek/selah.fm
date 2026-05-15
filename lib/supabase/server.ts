import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

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
        setAll() {},
      },
    }
  );
}

export function createRouteClient(response: NextResponse) {
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
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptionsWithName }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as Partial<ResponseCookie>);
          });
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
