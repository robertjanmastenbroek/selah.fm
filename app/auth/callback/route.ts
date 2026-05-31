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
    // Determine final redirect URL after auth exchange + new-user check
    let finalUrl = new URL(next, origin);

    // Collect auth cookies into array since we don't have response object yet
    const pendingCookies: { name: string; value: string; options: Record<string, any> }[] = [];

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
              pendingCookies.push({ name, value, options });
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
        const rows = await sql`SELECT onboarded_at, profile_image_url FROM users WHERE id = ${user.id}`;
        const existing = rows[0];
        
        // Save Google avatar if user doesn't have a profile image yet
        const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        if (googleAvatar && (!existing || !existing.profile_image_url)) {
          await sql`
            UPDATE users SET profile_image_url = ${googleAvatar}, updated_at = NOW()
            WHERE id = ${user.id}
          `;
        }
        
        // New user or never completed onboarding → onboarding flow
        if ((!existing || !existing.onboarded_at) && next === '/browse') {
          finalUrl = new URL('/onboarding', origin);
        }
      } catch {
        // DB query failed — still redirect to onboarding to be safe
        if (next === '/browse') {
          finalUrl = new URL('/onboarding', origin);
        }
      }
    }

    // Create a SINGLE redirect response with both cookies and correct URL
    const response = NextResponse.redirect(finalUrl, 302);
    for (const c of pendingCookies) {
      response.cookies.set(c.name, c.value, c.options);
    }

    return response;
  } catch (err: any) {
    console.error('Auth callback exception:', err.message);
    return NextResponse.redirect(new URL('/login?error=auth_error', origin));
  }
}
