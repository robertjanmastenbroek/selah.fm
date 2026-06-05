import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { routing } from './i18n/routing';

/**
 * CSRF protection: validates Origin/Referer header on mutation requests.
 */
function csrfProtection(request: NextRequest): NextResponse | null {
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) return null;

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  const allowedOrigins = [
    'https://selah.fm',
    'https://www.selah.fm',
    process.env.NEXT_PUBLIC_URL,
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean) as string[];

  if (origin) {
    const isAllowed = allowedOrigins.some(ao => origin === ao || origin.startsWith(ao + '/'));
    if (!isAllowed) {
      return NextResponse.json({ error: 'CSRF validation failed: invalid origin' }, { status: 403 });
    }
    return null;
  }

  if (referer) {
    const isAllowed = allowedOrigins.some(ao => referer.startsWith(ao));
    if (!isAllowed) {
      return NextResponse.json({ error: 'CSRF validation failed: invalid referer' }, { status: 403 });
    }
    return null;
  }

  return NextResponse.json({ error: 'CSRF validation failed: no origin header on mutation request' }, { status: 403 });
}

/** Detect preferred locale from Accept-Language header */
function detectLocale(acceptLanguage: string | null): string {
  if (!acceptLanguage) return routing.defaultLocale;
  // Parse Accept-Language: "en-US,en;q=0.9,nl;q=0.8"
  const preferred = acceptLanguage
    .split(',')
    .map(s => {
      const [lang, q] = s.trim().split(';');
      const quality = q ? parseFloat(q.split('=')[1]) || 1 : 1;
      return { lang: lang.split('-')[0], quality };
    })
    .sort((a, b) => b.quality - a.quality)
    .find(l => routing.locales.includes(l.lang as any));
  return preferred?.lang || routing.defaultLocale;
}

export async function middleware(request: NextRequest) {
  // 1. CSRF check
  const csrfResponse = csrfProtection(request);
  if (csrfResponse) return csrfResponse;

  // 2. Locale detection — set cookie without URL rewriting
  // (Pages are NOT under [locale] directories, so locale prefix
  // routing would cause 404s. Instead we detect from Accept-Language
  // and set the NEXT_LOCALE cookie for useTranslations to use.)
  const response = await updateSession(request);
  const currentLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (!currentLocale) {
    const detected = detectLocale(request.headers.get('accept-language'));
    if (detected !== routing.defaultLocale) {
      response.cookies.set('NEXT_LOCALE', detected, {
        path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365,
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
