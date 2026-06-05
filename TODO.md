└── .DS_Store
TODO.md
── next.config.js (modified)
── app/layout.tsx (modified)
── i18n/
   ├── routing.ts
   ├── request.ts
   └── navigation.ts
── messages/
   ├── en.json
   ├── nl.json
   ├── es.json
   ├── de.json
   └── fr.json
── middleware.ts (modified)
── app/api/admin/emails/send/route.ts (modified - consolidated to getUser)
── app/api/ratings/route.ts (modified - consolidated to getUser)
── app/api/bugs/route.ts (modified - consolidated to getUser)
── app/api/earnings/route.ts (modified - consolidated to getUser)
── app/api/review/route.ts (modified - consolidated to getUser)
── app/api/review/reject-duplicates/route.ts (modified - consolidated to getUser)
── app/api/submissions/route.ts (modified - consolidated to getUser)
── app/api/submissions/[id]/dispute/route.ts (modified - consolidated to getUser)
── app/api/artists/[slug]/tracks/route.ts (modified - consolidated to getUser)
── app/api/artists/[slug]/tracks/[id]/route.ts (modified - consolidated to getUser)
── app/api/campaigns/route.ts (modified - consolidated to getUser)
── app/api/campaigns/[id]/support/route.ts (modified - consolidated to getUser)
── app/api/campaigns/[id]/route.ts (modified - consolidated to getUser)
── app/api/connect/callback/route.ts (modified - consolidated to getUser)
── app/api/admin/interview-capture/route.ts (modified - consolidated to getUser)
── components/TopNav.tsx (modified - useTranslations i18n integration)
── components/HomePageClient.tsx (modified - useTranslations i18n integration)
── app/pricing/page.tsx (modified - useTranslations i18n integration)
── app/pricing/PricingClient.tsx (modified - useTranslations i18n integration)
── app/browse/page.tsx (modified - useTranslations i18n integration)
── app/c/[slug]/page.tsx (modified - AggregateRating + @id schema)
── app/globals.css (modified - fixed skeleton bg-muted contrast)
── lib/format.ts (new - locale-aware formatters)
── components/LocaleSwitcher.tsx (new)
── STATUS.md (modified)
── SELAH.md (modified)
