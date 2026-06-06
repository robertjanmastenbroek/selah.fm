import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { cookies } from 'next/headers';

export default getRequestConfig(async ({ requestLocale }) => {
  // Try requestLocale first (populated by next-intl from Accept-Language)
  let locale = await requestLocale;

  // Fall back to cookie (set by our middleware for non-English locales)
  if (!locale || !routing.locales.includes(locale as any)) {
    try {
      const cookieStore = await cookies();
      const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
      if (cookieLocale && routing.locales.includes(cookieLocale as any)) {
        locale = cookieLocale;
      }
    } catch {
      // cookies() may fail in some edge cases
    }
  }

  // Final fallback to default
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const messages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
