# Status — Selah.fm

**Last updated:** 2026-06-05 (4 pushes to main, Phase 0 at 75%)

## This Session (2026-06-05) — 4 pushes to main

### Completed
- **Pinned Robert-Jan Mastenbroek** as top artist on /browse — pinned column + ORDER BY
- **Full platform audit** — 10 dimensions scored vs top 0.0001% platforms (56/100)
- **A+ roadmap** — 6 phases, 16 weeks, ~304h written into SELAH.md
- **Cache-Control** on `/api/stats`, `/api/artists`, `/api/discover` (60s s-maxage)
- **`/pricing` page** — CPM calculator, comparison table, FAQPage schema
- **Social proof** — always-visible stats (2,158 artists), testimonial section
- **GDPR endpoints** — `/api/me/export` (data export) + `/api/me/delete` (PII anonymization)
- **Enhanced submission flow** — "What's next?" guided steps after video submit
- **Rate limiting** on all public GET routes (artists, campaigns, stats, discover, export, delete)
- **Server-side file validation** — MIME type + size check on campaign image uploads
- **Admin email via env var** — ADMIN_EMAILS env var with hardcoded fallback
- **Test framework** — 52 tests passing (fees.ts + validation.ts), 0 failures
- **Audit corrections**: admin routes/CSRF/Claim API/cookie banner/budget-zero already fixed

## Live System Health
- **Site**: selah.fm → 200 OK
- **TypeScript**: 0 errors
- **Tests**: 52/52 passing (Vitest: fees.ts + validation.ts)
- **Blog**: 22 published posts (2 pipeline-generated)
- **Pipeline**: Auto-generating on schedule (hours 2/3/4/8/14/20)
- **DB**: Supabase upgraded plan — writes working

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

## Distribution
| Platform | Status | Auto-posts |
|----------|--------|-----------|
| Bluesky | ✅ Free API | Daily build-in-public |
| Reddit | ✅ Free | 3 blog posts/day |
| Email | ✅ Resend | Weekly digest |
| GitHub | ✅ DA 90+ | 10 SEO repos |
| LinkedIn | ❌ User declined | — |
| Dev.to | ❌ API removed | — |
| Medium | ❌ Tokens discontinued | — |
| X/Twitter | ❌ $100/mo required | — |

## Key Metrics
- **Users**: 19
- **Blog posts**: 22 published
- **Question pool**: 287 across 15 categories
- **Artists in DB**: 2,158
- **GitHub SEO repos**: 10
- **Quality threshold**: ≥75/100

See [SELAH.md](./SELAH.md) for full project details.
