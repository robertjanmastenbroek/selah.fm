import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

function getCookiePairs(): { name: string; value: string }[] {
  // Primary: headers() — works in edge runtime
  const cookieHeader = headers().get('cookie') || '';
  if (cookieHeader) {
    return cookieHeader.split(';').filter(Boolean).map(c => {
      const idx = c.indexOf('=');
      if (idx === -1) return { name: c.trim(), value: '' };
      return { name: c.substring(0, idx).trim(), value: c.substring(idx + 1).trim() };
    });
  }

  // Fallback: cookies() — works in Node.js runtime
  try {
    const store = cookies();
    return store.getAll().map(c => ({ name: c.name, value: c.value }));
  } catch {
    return [];
  }
}

export function createClient() {
  const pairs = getCookiePairs();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return pairs; },
        setAll() {},
      },
    }
  );
}

export function createRouteClient(response: NextResponse) {
  const pairs = getCookiePairs();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return pairs; },
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
