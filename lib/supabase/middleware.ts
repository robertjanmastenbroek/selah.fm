import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { CookieOptionWithName } from './types';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet: CookieOptionWithName[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
          },
        },
        cookieOptions: {
          secure: process.env.NODE_ENV === 'production',
        },
      }
    );

    // Refresh session
    await supabase.auth.getUser();

    // Protected routes
    const PROTECTED = ['/dashboard', '/review', '/earnings', '/settings', '/analytics', '/onboarding'];
    const { pathname } = request.nextUrl;
    const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'));

    if (isProtected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
      }
    }
  } catch {
    // If middleware fails, let the request through — server components handle auth
  }

  return supabaseResponse;
}
