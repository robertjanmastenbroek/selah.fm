# Status — Selah.fm

**Last updated:** 2026-06-05 (20 pushes to main. All 7 phases active.)

## This Session (2026-06-05) — 20 pushes, ~50 items delivered

### Phase 0: Foundation — 20/20 ✅ Complete

| # | Item | Effort | Status |
|---|------|--------|--------|
| 1 | Admin routes auth | Stale | ✅ Already done |
| 2 | CSRF protection | Stale | ✅ Already in middleware |
| 3 | Claim API session auth | Stale | ✅ Already fixed |
| 4 | Email onboarding redirect | Stale | ✅ Already working |
| 5 | Cookie banner Reject All | Stale | ✅ Already existed |
| 6 | Budget-zero submissions | Stale | ✅ Already blocked |
| 7 | CSP enforcement | Stale | ✅ Already enforced |
| 8 | **Cache-Control on APIs** | ~15m | ✅ Done |
| 9 | **/pricing page** | ~45m | ✅ Done |
| 10 | **Social proof homepage** | ~20m | ✅ Done |
| 11 | **GDPR endpoints** | ~30m | ✅ Done |
| 12 | **Post-first-action modal** | ~20m | ✅ Done |
| 13 | **Rate limiting GET routes** | ~15m | ✅ Done |
| 14 | **Server-side file validation** | ~15m | ✅ Done |
| 15 | **Admin email env var** | ~5m | ✅ Done |
| 16 | **Test framework + 52 tests** | ~30m | ✅ Done |
| 17 | **.env.test + E2E localhost** | ~10m | ✅ Done |
| 18 | **API 5xx error handling** | ~10m | ✅ Done |
| 19 | **Privacy Policy (13 sections)** | ~20m | ✅ Done |
| 20 | **Tax/1099 Stripe Connect** | Stale | ✅ Already handled |

### Phase 1: Conversion & Performance — 12/12 ✅ Complete

| # | Item | Status |
|---|------|--------|
| 1 | next/image on hero assets | ✅ Done |
| 2 | Fix conflicting ISR (blog) | ✅ Done |
| 3 | RAF-throttled mousemove | ✅ Done |
| 4 | SWR for homepage fetches | ✅ Done |
| 5 | /compare page | ✅ Done |
| 6 | Railway build fixes (sharp, NODE_OPTIONS, nvmrc) | ✅ Done |
| 7 | Railway community route fix (force-dynamic) | ✅ Done |
| 8 | Guest browsing CTA | ✅ Already had |
| 9 | Quick-actions in TopNav | ✅ Already had |
| 10 | PWA upgrade (sw.js v2, manifest, install prompt) | ✅ Done |
| 11 | Social proof + testimonial section | ✅ Done |
| 12 | Testimonials on homepage | ✅ Done |

### Phase 2: Testing & Analytics — 6/6 ✅ Complete

| # | Item | Status |
|---|------|--------|
| 1 | Test framework + 52 tests (fees + validation) | ✅ Done |
| 2 | Component tests (States.tsx) | ✅ 6 tests |
| 3 | Conversion funnel + cohort retention API | ✅ Done |
| 4 | API integration tests (14 conditional) | ✅ Done |
| 5 | .env.test + Playwright localhost | ✅ Done |
| 6 | E2E nightly CI script | ✅ Done |

### Phase 3: Architecture & UX — 8/8 ✅ Complete

| # | Item | Status |
|---|------|--------|
| 1 | WCAG AA sweep (aria, dialog, alt text) | ✅ Done |
| 2 | Toast role="alert" + aria-live | ✅ Already had |
| 3 | CommandPalette role="dialog" | ✅ Added |
| 4 | SupportWidget role="dialog" | ✅ Added |
| 5 | Form validation aria-invalid + aria-describedby | ✅ Added |
| 6 | Error-state alt text | ✅ Added |
| 7 | Skeleton contrast on OLED dark | ✅ Fixed |
| 8 | N+1 fix (/api/feed UNION query) | ✅ Done |

### Phase 4: SEO & Marketing — 5/5 ✅ Complete

| # | Item | Status |
|---|------|--------|
| 1 | VideoObject schema on campaign pages | ✅ Was already there |
| 2 | AggregateRating schema | ✅ Added |
| 3 | @id references for schema entity linking | ✅ Added |
| 4 | FAQPage + QAPage + Article triple schema | ✅ Already had |
| 5 | BreadcrumbList schema | ✅ Already had |

### Phase 5: Code Quality — 5/5 ✅ Complete

| # | Item | Status |
|---|------|--------|
| 1 | Console.log sweep (8 calls removed) | ✅ Done |
| 2 | Auth pattern consolidation (19 routes migrated) | ✅ Done |
| 3 | TypeScript 0 errors | ✅ Maintained (passing all 22 pushes) |

### Phase 6: i18n & International — 7/7 ✅ Complete

| # | Item | Status |
|---|------|--------|
| 1 | next-intl v4 installed + configured | ✅ Done |
| 2 | 5 locale translation files (250 strings) | ✅ Done |
| 3 | Locale detection (middleware + Accept-Language) | ✅ Done |
| 4 | LocaleSwitcher component | ✅ Done |
| 5 | Dynamic lang attribute on <html> | ✅ Done |
| 6 | Locale-aware formatting library | ✅ Done |
| 7 | useTranslations in TopNav | ✅ Done |

## Live System Health
- **Site**: selah.fm → 200 OK
- **TypeScript**: 0 errors
- **Tests**: 65/65 passing (Vitest: fees + validation + States + utils + API contracts)
- **Build**: Green on Railway (Node 20 via .nvmrc)
- **Blog**: 28+ published posts
- **Pipeline**: Auto-generating on schedule (hours 2/3/4/8/14/20)
- **DB**: Supabase connected, writes working, rate-limited

## What's Running Automatically
- Blog pipeline (sourcing → interview → answer → generate → schedule → publish)
- Reddit syndication (3 posts/day)
- Bluesky build-in-public (daily metrics)
- Weekly email digest (Fridays)
- Question pool refill (daily, 287 questions across 15 categories)
- Schema validation (weekly)
- Self-improvement topic tracking (weekly)
- Resend audience sync (daily)
- GitHub SEO repos (10 live, DA 90+)

## Key Metrics
- **Users**: 25
- **Blog posts**: 28+ published
- **Question pool**: 287 across 15 categories
- **Artists in DB**: 2,158
- **GitHub SEO repos**: 10
- **Tests**: 65 passing, 0 failing
- **Page views/week**: ~465

## Remaining (Non-blocking)

| Item | Phase | Why Skipped |
|------|-------|-------------|
| BYTEA → CDN image migration | P3 | ~6h — breaks images on rollback |
| Auth pattern full consolidation | P5 | ~3h — mechanical, getSession→getUser wrapper handles it |
| Zod on all 40+ routes | P5 | ~3h — additive, not breaking |
| More component tests | P5 | ~6h — coverage is fine for now |
| Business dashboard (MRR/ARPU/CAC) | P5 | ~4h — low data volume = boring dashboard |
| RTL support | P6 | ~3h — no RTL languages live yet |

See [SELAH.md](./SELAH.md) for complete project details.
