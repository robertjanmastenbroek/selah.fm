# Status — Selah.fm

**Last updated:** 2026-06-05 (commit pending)

## This Session (2026-06-05)
- **Pinned Robert-Jan Mastenbroek** as top artist on /browse — added `pinned` column to artist_profiles, ORDER BY `ap.pinned DESC`
- **Full platform audit** — 10 dimensions scored vs top 0.0001% platforms. Overall: 56/100. A+ roadmap written (6 phases, 16 weeks, ~304h)
- **Cache-Control** added to `/api/stats`, `/api/artists`, `/api/discover` (60s s-maxage + stale-while-revalidate)
- **`/pricing` page** — interactive CPM calculator, two-column pricing, competitor comparison, FAQPage schema
- **Social proof** — always-visible stats on homepage (2,158 artists), testimonial section, /pricing in footer
- **Audit corrections found**: 4 admin routes already secured, CSRF already in middleware, Claim API already reads session (previous audit was stale)

## Live System Health
- **Site**: selah.fm → 200 OK
- **TypeScript**: 0 errors
- **Tests**: 62/62 passing
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
