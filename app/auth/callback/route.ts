import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptionWithName } from '@/lib/supabase/types';
import sql from '@/lib/db';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

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

  // Rate limit: max 10 auth callbacks per minute per IP
  const rl = await rateLimit(getRateLimitKey(request), { maxRequests: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    console.warn('Rate limited auth callback from:', request.headers.get('x-forwarded-for') || 'unknown');
    return NextResponse.redirect(new URL('/login?error=rate_limited', origin));
  }

  try {
    let finalUrl = new URL(next, origin);

    // Use the Next.js cookies() API — this is the official Supabase SSR pattern.
    // cookies().set() automatically includes Set-Cookie headers on every response,
    // so we don't need to manually attach them to the redirect.
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: CookieOptionWithName[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
        // Ensure session cookies have the secure flag on HTTPS (Railway)
        cookieOptions: {
          secure: process.env.NODE_ENV === 'production',
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
        const isNewUser = !existing || !existing.onboarded_at;
        
        // Save Google avatar if user doesn't have a profile image yet
        const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        if (googleAvatar && (!existing || !existing.profile_image_url)) {
          await sql`
            UPDATE users SET profile_image_url = ${googleAvatar}, updated_at = NOW()
            WHERE id = ${user.id}
          `;
        }

        // ── Claim referral code on first signup ─────────────────
        const refCode = requestUrl.searchParams.get('ref');
        if (refCode && isNewUser) {
          try {
            // Find referrer by code
            const [referrer] = await sql`
              SELECT id FROM users WHERE referral_code = ${refCode} AND id != ${user.id}
            `;
            if (referrer) {
              await sql`
                UPDATE users SET referred_by = ${referrer.id} WHERE id = ${user.id}
              `;
            }
          } catch (refErr) {
            console.error('Referral claim failed:', refErr);
          }
        }
        
        // New user or never completed onboarding → onboarding flow with role
        // Only redirect if user is truly new (created within last hour),
        // not existing accounts that predate the onboarding system.
        const userCreatedAt = user.created_at ? new Date(user.created_at).getTime() : 0;
        const accountAgeMs = Date.now() - userCreatedAt;
        const isTrulyNewUser = isNewUser && accountAgeMs < 3600000; // < 1 hour old
        
        if (isTrulyNewUser && next === '/browse') {
          const userType = user.user_metadata?.user_type || user.user_metadata?.is_artist ? 'artist' : 'creator';
          finalUrl = new URL(`/onboarding?role=${userType}`, origin);
        }
      } catch {
        // DB query failed — still redirect to onboarding to be safe
        if (next === '/browse') {
          finalUrl = new URL('/onboarding', origin);
        }
      }
    }

    // Redirect — cookies are auto-included by Next.js because we used cookies().set()
    return NextResponse.redirect(finalUrl, 302);
  } catch (err: any) {
    console.error('Auth callback exception:', err.message);
    return NextResponse.redirect(new URL('/login?error=auth_error', origin));
  }
}
