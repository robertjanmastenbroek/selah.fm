# Selah.fm — Living Document

**Last updated:** 2026-06-15
**Concept:** A CPM marketplace where artists set budgets, creators earn per verified view, and fans fund promotion — all open source under MIT.
**Role:** Single source of truth. If it isn't here, it's either archived or doesn't matter right now.

---

## Identity

### The Loop

```
ARTIST creates campaign (track + CPM rate + budget)
         │
         ├── CREATOR browses, picks a track, submits a video
         │     → Artist approves ✓
         │     → Creator earns per verified view (full CPM)
         │     → 20% platform premium added on deposits
         │
         ├── FAN funds the promotion budget
         │     → Money goes to campaign → pays creators
         │     → 20% platform premium deducted
         │
         └── SEO / LLMO crawlers index every page
               → Traffic arrives → loop continues
```

### Three User Types

| User | Trigger | Action | Incentive |
|------|---------|--------|-----------|
| **Artist** | Searches own name, gets emailed | Creates campaign, sets CPM, approves videos | Real promotion, pay only for verified views |
| **Creator** | Searches "earn making music videos" | Picks track, submits video, earns per view | Real money, no algorithm dependency |
| **Fan** | Searches "[artist] promotion" | Funds campaign budget | Helps artists they believe in |

### Core Principle

The platform works **without requiring artists to participate**. Every discovered artist gets a full profile. Claiming is a value-add (control, CPM, payouts) — never a requirement.

---

## Business Model

| Flow | What happens | Fee |
|------|-------------|-----|
| **Artist deposits** (campaign budget) | Artist pays $120 → $100 to campaign budget + $20 platform premium | 20% premium on top |
| **Creator payout** | Creator earns full CPM rate per verified view | 0% deducted from creator |
| **Fan funds promotion** | Fan pays $10 → $8 to campaign budget + $2 platform premium | 20% on fan contributions |
| **Stripe fees** | Applied on deposits (2.9% + $0.30) and payouts ($0.25) | Pass-through |

Creators earn 100% of the CPM rate. The platform premium is added on deposits — never deducted from creator earnings.

---

## Architecture

### Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 14 (App Router), TypeScript | SSR for SEO, App Router for layouts |
| Database | Supabase PostgreSQL (pooler) | Managed, cheap at scale, row-level security |
| Auth | Supabase SSR (Google OAuth) | Session cookies, no JWT juggling |
| Payments | Stripe Connect + Elements | Express accounts, destination charges |
| AI | DeepSeek V4 | Blog pipeline, outreach emails, bios |
| Email | Resend | Transactional + audience, 100/day free |
| Styling | Tailwind CSS + shadcn/ui | Consistent design system |
| Deploy | Railway (auto on git push) | Zero-ops, built-in cron, Postgres sidecar |

### Key Pages

| Page | Purpose | Route |
|------|---------|-------|
| Artist Profile | SEO page with bio, tracks, stats, CTAs | `/artist/[slug]` |
| Campaign | Per-track campaign with budget, CPM, submission gallery | `/c/[slug]` |
| Browse | Campaigns + Artists tabs, genre/sort/search | `/browse` |
| Checkout | Fund campaign + deposit, Stripe Elements | `/checkout` |
| Dashboard | 4 tabs: Profile, Tracks, Campaigns, Stats | `/dashboard` |
| Onboarding | Universal flow → artist or creator path | `/onboarding` |
| Create Campaign | Step-by-step wizard (pick track → budget → launch) | `/create` |
| Review | Submission review queue with approve/reject | `/review` |
| Messages | Full chat with SSE polling | `/messages` |
| Admin | Money flow, review queue, analytics | `/admin` |
| Blog | AI-generated SEO articles, answer-first format | `/blog/[slug]` |

### Cron Infrastructure

Single Railway entry at `0 * * * *` → dispatcher (`/api/cron/dispatcher`) routes to all time-gated workers.

| Worker | Schedule | Output |
|--------|----------|--------|
| Blog pipeline | 02, 08, 14, 20 UTC | 2 posts per run |
| Blog publish | 09, 15 UTC | Publishes 1 post |
| Bio generation | 00 UTC | 100 bios/night |
| Wikipedia enrich | 00 UTC | 100 artists/night |
| Bandcamp scrape | 01 UTC | 100 artists/night |
| YouTube enrich | 08 UTC | 100 artists/night |
| Wikidata enrich | 06 UTC | 200 artists/night |
| Email outreach | 03, 09, 15, 21 UTC | 50 artists/run |
| Creator outreach | 11, 23 UTC | 13 creators/run |
| Activity archive | 01 UTC | Events >30 days |
| Blog syndication | 04 UTC | Auto-post to Reddit |
| Creator discovery | 05, 17 UTC | New creator sourcing |
| Message notifications | 12 UTC | Email digests |
| Followup emails | 10 UTC | Re-engagement |
| Welcome sequence | 09 UTC | Onboarding sequence |
| Re-engagement | 11 UTC | Inactive users |
| Refresh metrics | 08 UTC | Social stats refresh |

---

## Status

**Live metrics as of 2026-06-15:**

| Metric | Value |
|--------|-------|
| Users | 19 |
| Onboarded users | 18 |
| Artists in database | ~2,038 |
| Artist profiles | 2,158 |
| Artist tracks | 2,542 |
| Active campaigns | 1 |
| Submissions | 24 |
| Approved submissions | 2 |
| Total funded | $35 |
| Total paid to creators | $2.08 |
| Blog posts | 28+ |
| Page views/week | ~465 |
| React components | ~108 |
| API routes | 105+ |
| DB migrations | 33 |
| Cron workers | 17 |

### What's Live (Working)

- Artist pages with LLMO bios, SEO schema, social stats, activity feed
- Campaign pages with CPM display, submission gallery, breadcrumbs
- Browse with genre filters, search, popularity-ordering
- Checkout with Stripe Connect (fund promotion + deposit)
- Messaging system (ChatWidget, conversations, read receipts)
- Dashboard (profile editor, track management, campaign builder, stats)
- Admin (money flow overview, review queue, user flows)
- Blog pipeline (answer-first format, triple schema, Reddit syndication)
- Bio engine (composable slots, ~37B unique combinations)
- View scraping (YouTube API — reliable, TikTok — sandbox/scrape)
- Review system (approve/reject, auto-payout, undo)
- Referral system (10% bonus on first $10+ deposit)
- Rate limiting (DB-backed, scale-across-instances)
- PWA (service worker, manifest, offline support)

### In Progress

- Onboarding → first campaign creation integration
- TikTok sandbox → production API approval
- Reconciliation cron + idempotency + dispute flow
- Wikidata `sameAs` integration for all artists

---

## Core Systems Status

| System | Score | Key Gaps |
|--------|:-----:|----------|
| **Onboarding** | 7/10 | Artist flow doesn't create first campaign. Stripe Connect skippable. |
| **TikTok Integration** | 4/10 | Sandbox only. Page scraping is fragile. No production API. |
| **Review/Approval** | 6/10 | No dispute flow. No creator notification on rejection. No payout retry. |
| **Payouts** | 5/10 | No reconciliation cron. No idempotency keys. No minimum payout enforcement. No escrow. |
| **SEO/LLMO** | 7/10 | Bios at 100/night (20 days for full coverage). No Wikidata sameAs. No genre pages. |

---

## Roadmap

### Current Phase: Core Systems to 100%

**Focus:** Make each core system fully reliable before adding new features.

1. **Onboarding → first campaign** — Universal flow creates profile + first campaign seamlessly
2. **TikTok sandbox → production** — Sandbox works 100%, record demo video, apply for production API
3. **Review + payout** — Dispute flow, reconciliation cron, idempotency, minimum payouts, payout retry
4. **SEO/LLMO** — Wikidata sameAs for all artists, faster bio generation pipeline
5. **Document consolidation** — SELAH.md as single truth, archive conflicting docs

### Next (after core systems)

| Item | Effort | When |
|------|--------|------|
| Public REST API | ~8h | Post-launch |
| Embeddable artist widget + backlink strategy | ~2h | Post-launch |
| Genre landing pages with SEO content | ~3h | Post-launch |
| Google Indexing API submission | ~1h | Post-launch |
| Creator levels & badges | ~2h | Post-launch |

### Signals That Change Priorities

- **If deposits hit $200/month**: Add escrow hold period
- **If users hit 50**: Ramp creator outreach, double blog cadence
- **If page views hit 1,000/week**: Enable retargeting, push referral flywheel

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
- Before every deploy: verify homepage, browse, campaign, and artist page load.
- When in doubt, ship it. The fastest way to learn what matters is to put it in front of real people.

### This Document

SELAH.md is the living source of truth. Update it when:
- Metrics change (users, deposits, page views)
- Roadmap priorities shift
- A major architectural decision is made
- A cron worker is added or removed

---

## Key Decisions

### Why CPM marketplace (not boosting/donations)
CPM aligns incentives: creators earn per verified view, artists pay only for real engagement. The "boost" model (pay to promote like GoFundMe) creates misaligned incentives. CPM is transparent, fair, and scalable.

### Why 20% premium on deposits (not deducted from creators)
Creators earn the full CPM rate. The 20% premium is added on deposits — this means creators see their full earning potential, artists see the transparent markup, and the platform earns its fee without penalizing either side.

### Why no artist permission needed
If we required artist opt-in, we'd have 0 pages instead of 2,000+. Discovery happens when fans search. A page exists whether the artist knows or not.

### Why BYTEA images (not CDN URLs)
Railway redeploys wipe the filesystem. URL-based images break on redeploy. BYTEA in DB survives everything. 1-year cache headers make the performance cost negligible.

### Why single cron dispatcher
Railway doesn't support `*/N` or comma-separated cron syntax. One entry at `0 * * * *` routes to all workers based on the hour. Simpler, more reliable, one health-check point.

### Why DeepSeek over GPT-4
Cost: DeepSeek V4 is ~$0.14/M input tokens vs GPT-4o at ~$2.50/M. At blog pipeline volume (2 posts/day + outreach + bios), GPT-4 would cost 18× more for similar quality.

### Why answer-first blog format
Every post opens with a direct answer block (QAPage schema, <0.1% of sites use this). Triple schema (FAQPage + Article + QAPage). Google surfaces QAPage blocks as rich results with ~30% higher CTR.

### Why composable bio engine
Single-prompt bio generation produces templated results that LLMO detectors flag. Composable multi-slot (8 independent components × random assembly) produces ~37B unique combinations that pass LLMO detection and keep every artist page genuinely unique.

### Why noindex thin artists
Artists with zero tracks and zero activity waste crawl budget. Noindex until they have content protects the site's overall index health.

### Why open source (MIT)
Transparency builds trust in a marketplace handling money. Open source also creates a competitive moat — no other CPM music marketplace is open source. Developers can self-host, audit the code, and contribute.

---

## Archived Documents

The following files are superseded by this document. They remain on disk for historical reference but are no longer maintained.

- `archive/` — all pre-consolidation research, audits, and plans (40+ files)
- `docs/research/2026-06-15_TOP_0.0001_RESEARCH.md` — full gap analysis, incorporated into Roadmap and Core Systems Status sections
- `ROADMAP.md` — consolidated into Roadmap section
- `STATUS.md` — consolidated into Status section
