import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import sql from '@/lib/db';

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

    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error.message);
      return NextResponse.redirect(new URL('/login?error=auth_failed', origin));
    }

    // Detect new users — redirect to onboarding if never completed
    const user = data?.user;
    if (user) {
      try {
        const rows = await sql`SELECT onboarded_at FROM users WHERE id = ${user.id}`;
        const existing = rows[0];
        
        // New user or never completed onboarding → onboarding flow
        if (!existing || !existing.onboarded_at) {
          const onboardUrl = new URL('/onboarding', origin);
          // Don't overwrite explicit next param (e.g. from campaign links)
          if (next === '/browse') {
            return NextResponse.redirect(onboardUrl, 302);
          }
        }
      } catch {
        // DB query failed — still redirect to onboarding to be safe
        if (next === '/browse') {
          return NextResponse.redirect(new URL('/onboarding', origin), 302);
        }
      }
    }

    return response;
  } catch (err: any) {
    console.error('Auth callback exception:', err.message);
    return NextResponse.redirect(new URL('/login?error=auth_error', origin));
  }
}
