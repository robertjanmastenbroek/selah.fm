import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { CookieOptionWithName } from './types';
import { ADMIN_EMAILS } from '@/lib/constants';

/**
 * Supabase middleware — refreshes the auth session and protects routes.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieOptionWithName[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Protected routes (require any login)
  const PROTECTED = ['/dashboard', '/review', '/earnings', '/settings', '/analytics', '/onboarding'];
  const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Admin routes (require admin email)
  if (pathname.startsWith('/admin')) {
    if (!user?.email) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    const isAdmin = ADMIN_EMAILS.some(
      (a) => a.toLowerCase() === user.email!.toLowerCase()
    );

    if (!isAdmin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return supabaseResponse;
}
