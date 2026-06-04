# Selah.fm — Living Document

**Last updated:** 2026-06-04
**Concept:** A global SEO/LLMO database of every artist — where fans donate, creators make content, and artists don't need to lift a finger.
**Role:** Single source of truth. Replaces 40+ research, audit, and plan files. If it isn't here, it's either archived or doesn't matter right now.

---

## Identity

### The Loop

```
SELAH.FM ARTIST DATABASE (2,000+ artists)
         │
         ├── SEO / LLMO crawlers index every page
         │     → Traffic arrives at artist profiles
         │
         ├── Fan lands on /artist/[slug]
         │     → Donates → promotion pool
         │     → Comments, ❤️ reacts, shares
         │
         ├── Creator lands on /artist/[slug]
         │     → Picks a track, makes a video, submits
         │     → Earns per verified view from the pool
         │     → Gets hyped by fan reactions
         │
         └── Artist discovers their page
               → Claims it → controls CPM, approves videos
               → Responds to fans, messages creators
               → Sees "X people donated $Y, Z fans ❤️ this"
```

### Three User Types

| User | Trigger | Action | Incentive |
|------|---------|--------|-----------|
| **Fan** | Searches "[artist] support" | Donates, comments, reacts, shares | Supports artists, public recognition |
| **Creator** | Searches "earn making music videos" | Picks track, submits video, earns | Real money + fan recognition |
| **Artist** | Searches own name, gets emailed | Claims page, sets CPM, approves | Free promotion, fan money, creator content |

### Core Principle

The platform works **without requiring artists to participate**. Every discovered artist gets a full profile. Claiming is a value-add (control, CPM, payouts) — never a requirement.

---

## Architecture

### Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 14 (App Router), TypeScript | SSR for SEO, App Router for layouts |
| Database | Supabase PostgreSQL (pooler) | Managed, cheap at scale, row-level security |
| Auth | Supabase SSR (Google OAuth) | Session cookies, no JWT juggling |
| Payments | Stripe Elements + Connect | Payouts to artists, 20% platform fee |
| AI | DeepSeek V4 | Blog pipeline, outreach emails, support chat |
| Email | Resend | Transactional + audience sync, free tier 100/day |
| Styling | Tailwind CSS + shadcn/ui | Consistent design system, low CSS debt |
| Deploy | Railway (auto on git push) | Zero-ops, built-in cron, Postgres + Crawl4AI sidecars |

### Key Feature Surface

| Page | Purpose | Route |
|------|---------|-------|
| Artist Profile | Every artist gets a full SEO page with bio, tracks, social stats, comments, activity feed, donate + create CTAs | `/artist/[slug]` |
| Track Page | Per-track SEO with earnings calculator, schema, CTA | `/artist/[slug]/tracks/[id]` |
| Campaign (Promotion) | Per-track campaign with budget, CPM, submission gallery | `/c/[slug]` |
| Browse | Artists + Campaigns tabs, genre/sort/search | `/browse` |
| Checkout | Donations + deposits, Stripe Elements | `/checkout` |
| Dashboard | 4 tabs: Profile, Tracks, Campaigns, Stats | `/dashboard` |
| Messages | Full chat with SSE polling, edit/delete | `/messages` |
| Admin | Money flow, review queue, analytics, user flows | `/admin` |
| Blog | AI-generated articles, answer-first format, triple schema | `/blog/[slug]` |

### Cron Infrastructure

Single Railway entry at `0 * * * *` → dispatcher (`/api/cron/dispatcher`) routes to 15+ time-gated workers.

| Worker | Schedule | Rate | Output |
|--------|----------|------|--------|
| Blog pipeline | 02, 08, 14, 20 UTC | 4×/day | 2 posts scheduled |
| Blog publish | 09, 15 UTC | 2×/day | Publishes 1 post |
| Bio generation | 00 UTC | 100/night | Unique SEO bios |
| Wikipedia enrich | 00 UTC | 100/night | Infobox + summary data |
| Bandcamp scrape | 01 UTC | 100/night | Track listings + emails |
| YouTube enrich | 08 UTC | 100/night | Subscriber counts |
| Wikidata enrich | 06 UTC | 200/night | Knowledge Graph sameAs |
| Email outreach | 03, 09, 15, 21 UTC | 50/run | Artist emails |
| Creator outreach | 11, 23 UTC | 13/run | Creator emails |
| Activity archive | 01 UTC | Daily | Events >30 days archived |
| Blog syndication | 04 UTC | Daily | Auto-post to Reddit |
| Creator discovery | 05, 17 UTC | 2×/day | New creator sourcing |
| Message notifications | 12 UTC | Daily | Email digests |
| Followup emails | 10 UTC | Daily | Re-engagement |
| Welcome sequence | 09 UTC | Daily | Onboarding |
| Re-engagement | 11 UTC | Daily | Inactive users |
| Refresh metrics | 08 UTC | Daily | Social stats refresh |

---

## Status

**Live metrics as of 2026-06-04:**

| Metric | Value | Δ vs yesterday |
|--------|-------|----------------|
| Users | 19 | +3 |
| Onboarded users | 18 | +3 |
| Artists in database | ~2,038 | — |
| Artist profiles | 2,158 | — |
| Artist tracks | 2,542 | — |
| Active campaigns (real) | 1 | — |
| Submissions | 24 | — |
| Approved submissions | 2 | — |
| Total deposited | $35 | — |
| Total paid out | $2.08 | — |
| Blog posts (auto) | 28+ | — |
| Scheduled posts | 11+ (2/day through June 12) | — |
| Page views/week | ~465 | — |
| Total commits | ~1,130 | — |
| React components | ~108 | — |
| API routes | 105+ | — |
| DB migrations | 22 | — |
| Cron workers | 17 | — |

### Pipeline Health

All 17 cron workers green. Blog generates 2 posts/day, bio engine runs 100 artists/night, data enrichment cycles through all artists across Wikipedia/YouTube/Bandcamp/Wikidata.

### What's Live

- Artist pages with LLMO bios, social stats, comments, reactions, activity feed
- Campaign pages with 7 schema types, server-rendered SEO, breadcrumbs
- Browse with popularity-weighted random ordering, genre filters, search
- Checkout with Stripe Connect, donations, deposits, artist wallet
- Full messaging system with ChatWidget on every page
- Dashboard with profile editor, track management, campaign builder, stats
- Admin with money flow overview, review queue, analytics, user flows
- Blog with answer-first format, triple schema (QAPage + FAQPage + Article), Reddit syndication
- SEO tools (CPM calculator, playlist analyzer, promotion budget planner)
- Bio engine: 8 composable slot libraries producing ~37 billion unique combinations
- Data enrichment: Wikipedia summaries, YouTube subs, Bandcamp tracks, Wikidata knowledge graph
- Track pages per-track with earnings calculator + MusicRecording schema
- Fan reviews (5-star + text), public REST API, share buttons
- Referral system with Stripe split (10% on first $10+ deposit)
- Collections, follow feed, save/interested buttons

### Code Health

- TypeScript: `npx tsc --noEmit` passes with zero errors
- E2E tests: Playwright suite for critical paths
- Security: CSRF audit passed, rate limiting (DB-backed, scale-across-instances), CSP, PWA
- Images: All stored as BYTEA in DB, served via `/api/images/` with 1-year cache

---

## Roadmap

### Current phase: Acquisition

The codebase is feature-complete for v1. The bottleneck has shifted from development to acquisition.

**Single most important action:** Curated launch — 5 artists with real audiences + 20 creators + real budgets flowing through the system. Everything else amplifies what happens after real users generate real activity.

### Deferred (until post-launch)

| Item | Effort | Why deferred |
|------|--------|--------------|
| Instagram content automation (blog→IG cron) | ~2h | Needs real content first |
| Referral in bio links (`/r/[code]`) | ~30m | Needs referrers first |
| LLMO bios bulk completion (manual trigger) | ~$140 DeepSeek | 20 days remaining at 100/night, not blocking |
| A/B testing infrastructure | ~4h | Needs traffic first |
| Retargeting pixels | ~2h | Needs audience first |

### Signals That Change Priorities

- **If page views hit 1,000/week**: Enable retargeting, push referral flywheel
- **If users hit 50**: Ramp creator outreach, double blog cadence
- **If deposits hit $200/month**: Enable Instagram content automation
- **If paid artists hit 10**: Double down on testimonial/ case study content

---

## How We Work

> *The marginal cost of completeness is near zero with AI.*
>
> Do the whole thing. Do it right. Do it with tests. Do it with documentation.
> The standard isn't "good enough" — it's "holy shit, that's done."
> Every commit leaves the project better than you found it.

- Search before building. Test before shipping. Ship the complete thing.
- Never table something for later when the permanent solve is within reach.
- Before every commit: `npx tsc --noEmit` must pass with zero errors.
- Before every deploy: verify homepage, blog, campaign, and artist page load.
- When in doubt, ship it. The fastest way to learn what matters is to put it in front of real people.

### This Document

SELAH.md is the living source of truth. Update it when:
- Metrics change (users, deposits, page views)
- Roadmap priorities shift
- A major architectural decision is made
- A cron worker is added or removed

Don't create new `.md` files for research, audits, or plans. Update SELAH.md instead. If something isn't worth updating SELAH.md for, it probably isn't worth doing.

---

## Key Decisions

### Why artist-first (not campaign-first)
Campaigns expire. Artists are permanent. An artist page accumulates SEO value, social proof, and content forever. Every track becomes a new campaign surface.

### Why no artist permission needed
If we required artist opt-in, we'd have 0 pages instead of 2,000+. Discovery happens when fans search. A page exists whether the artist knows or not.

### Why CPM model (not flat fee)
CPM aligns incentives: creators earn per verified view, artists pay only for real engagement. Flat fees create misaligned incentives (creators get paid regardless of performance).

### Why BYTEA images (not CDN URLs)
Railway redeploys wipe the filesystem. URL-based images break on redeploy. BYTEA in DB survives everything. 1-year cache headers make the performance cost negligible.

### Why single cron dispatcher
Railway doesn't support `*/N` or comma-separated cron syntax. One entry at `0 * * * *` routes to all 17 workers based on the hour. Simpler, more reliable, one health-check point.

### Why DeepSeek over GPT-4
Cost: DeepSeek V4 is ~$0.14/M input tokens vs GPT-4o at ~$2.50/M. At blog pipeline volume (2 posts/day + outreach + bios), GPT-4 would cost 18× more for similar quality.

### Why answer-first blog format
Every post opens with a direct answer block (QAPage schema, <0.1% of sites use this). Triple schema (FAQPage + Article + QAPage). Google surfaces QAPage blocks as rich results with ~30% higher CTR.

### Why composable bio engine
Single-prompt bio generation produces templated results that LLMO detectors flag. Composable multi-slot (8 independent components × random assembly) produces ~37B unique combinations that pass LLMO detection and keep every artist page genuinely unique.

### Why noindex thin artists
Artists with zero tracks and zero activity waste crawl budget. Noindex until they have content protects the site's overall index health.

---

## Archived Documents

The following files are superseded by this document. They contain historical research, audit findings, and plans that are either fully executed or no longer relevant.

### Why so many docs

Selah.fm was built in rapid research-driven sprints. Each sprint started with deep competitive analysis (10-25 platforms), produced a blueprint, then executed. The docs served their purpose — they guided the build. Now they're liabilities: they create confusion, duplicate information, and make it hard to see what's actually important.

### Archive (`archive/` directory)

All archived files moved to `archive/`. They remain on disk for reference but are no longer maintained.

- `0.0001_PLAN.md` — superseded by Roadmap section
- `00-BLUEPRINT.md` — superseded by Architecture section
- `A11Y_AUDIT.md` — WCAG AA audit, all critical items resolved
- `ARTIST-CARD.md` — artist card design, shipped and live
- `ARTIST_MODEL_PLAN.md` — artist-first pivot planning, fully built
- `ARTIST_PAGE_RESEARCH.md` — competitor analysis, fully executed
- `ARTIST_SEO_LLMO_PLAN.md` — 5 phases, all built
- `ARTIST_UX_AUDIT.md` — UX audit, all gaps closed
- `ARTIST_WALLET_RESEARCH.md` — wallet system, shipped
- `AUTH_ONBOARDING_AUDIT.md` — auth overhaul, shipped
- `BIO_ENGINE_DATA_RESEARCH.md` — bio quality research, all incorporated
- `BIO_ENGINE_REFINEMENTS.md` — bio refinements, all implemented
- `BIO_ENGINE_RESEARCH.md` — bio system research, fully built
- `BIO_UNIQUENESS_ARCHITECTURE.md` — bio architecture doc, fully built
- `BLUEPRINT.md` — master implementation plan, fully executed
- `CHAT_AUDIT.md` — chat system audit, all bugs fixed
- `CHAT_MASTER_PLAN.md` — chat research, fully rebuilt
- `COMMUNITY_BLUEPRINT.md` — social features plan, fully built
- `CREATOR-PIPELINE.md` — creator discovery pipeline, built
- `CSRF_AUDIT.md` — security audit, all findings resolved
- `DASHBOARD_AUDIT.md` — dashboard audit, fully rewritten
- `DATA_ENRICHMENT_PLAN.md` — enrichment strategy, all pipelines live
- `FINANCIAL_BLUEPRINT.md` — financial flow research, all built
- `GAMIFICATION_BLUEPRINT.md` — gamification plan, referral system shipped
- `GROWTH_AUDIT.md` — growth audit, findings incorporated in Roadmap
- `GROWTH_BLUEPRINT.md` — growth strategy, referenced in Roadmap
- `LAUNCH_CHECKLIST.md` — launch plan, referenced in Roadmap
- `MARKETING.md` — marketing strategy, superseded by Roadmap
- `OUTREACH.md` — outreach strategy, all pipelines live
- `PHASE2_PLAN.md` — phase 2 planning, all items built
- `RESEARCH_INDEX.md` — research index, no longer needed
- `ROADMAP.md` — consolidated into this document
- `SELAH_EXECUTION_PLAN.md` — execution planning, all phases built
- `SELAH_FM_COMPETITIVE_AUDIT.md` — competitive audit, all gaps closed
- `SELAH_ROADMAP.md` — superseded by Roadmap section
- `STATUS.md` — consolidated into this document
- `UX_COMPETITOR_RESEARCH.md` — 25-platform UX research, all patterns applied
- `UX_IMPLEMENTATION_PLAN.md` — UX implementation, all phases built
- `UX_OVERHAUL_PLAN.md` — UX overhaul, all phases executed
- `UX_SIMPLIFICATION.md` — UX simplification research, all applied
- `VISION.md` — consolidated into this document
