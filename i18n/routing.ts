import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'nl', 'es', 'de', 'fr'],
  defaultLocale: 'en',
  localePrefix: 'as-needed', // /about for default, /nl/about for others
});
