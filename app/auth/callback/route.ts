import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

function parseCookies(header: string) {
  return header
    .split(';')
    .filter(Boolean)
    .map(c => {
      const idx = c.indexOf('=');
      if (idx === -1) return { name: c.trim(), value: '' };
      return { name: c.substring(0, idx).trim(), value: c.substring(idx + 1).trim() };
    });
}

/**
 * Get the real origin, accounting for Railway's reverse proxy.
 * Railway forwards x-forwarded-host and x-forwarded-proto headers.
 */
function getOrigin(request: Request): string {
  const host = request.headers.get('x-forwarded-host') || new URL(request.url).host;
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  return `${proto}://${host}`;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/browse';
  const origin = getOrigin(request);

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', origin));
  }

  try {
    const redirectUrl = new URL(next, origin);
    const response = NextResponse.redirect(redirectUrl, 302);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return parseCookies(request.headers.get('cookie') || '');
          },
          setAll(cookiesToSet: { name: string; value: string; options: Record<string, any> }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error.message);
      return NextResponse.redirect(new URL('/login?error=auth_failed', origin));
    }

    return response;
  } catch (err: any) {
    console.error('Auth callback exception:', err.message);
    return NextResponse.redirect(new URL('/login?error=auth_error', origin));
  }
}
