# Selah.fm — Living Document

**Last updated:** 2026-06-06 (All 7 phases complete. 42 pushes to main. Campaign→track consolidation done. Artist-wide donations. No "draft" status.)
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
| Track Page | Per-track SEO with 7 schema types (MusicRecording, VideoObject, FAQPage, HowTo, Offer, AggregateRating, BreadcrumbList), earnings calculator, supporter grid, donate CTA, share modal, FAQ, trust bar. Creators can submit videos regardless of budget. Donations are artist-wide. | `/artist/[slug]/tracks/[id]` |
| Campaign (Legacy) | Legacy per-track campaign detail — permanently redirects (308) to track page | `/c/[slug]` → 308 → `/artist/.../tracks/...` |
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

**Live metrics as of 2026-06-05:**

| Metric | Value | Δ vs yesterday |
|--------|-------|----------------|
| Users | 19 | — |
| Onboarded users | 18 | — |
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
| Total commits | ~1,155 | +25 |
| React components | ~60 | — |
| API routes | 43 | — |
| DB migrations | 34 | +12 |
| DB tables | 44 | — |
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
- Collections, follow feed, save/interested buttons
- **Payout onboarding UX**: Enhanced payout CTA in overview, earnings tab, and leaderboard page with step indicators, status badges
- **Stripe Connect fix**: `card_payments` + `transfers` capabilities for US accounts (fixes payout setup error)
- **Referral system v2**: Milestone tiers (1/3/5/10/25), native share (Twitter, WhatsApp, mobile), social proof feed, animated progress, claim-to-campaign withdrawal

### Code Health

- TypeScript: `npx tsc --noEmit` passes with zero errors
- E2E tests: Playwright suite for critical paths (runs against **production** — risky)
- Unit tests: Vitest configured with jsdom. 52 tests across 2 files (fees.ts, validation.ts). All passing (0 failures, 0 skipped). Coverage: financial logic, URL validation, XSS sanitization, campaign input validation.
- Security: Rate limiting (DB-backed) applied inconsistently; CSP in report-only mode; **zero CSRF protection**; **4 admin routes have no auth**
- Images: Stored as BYTEA in DB — survives Railway redeploys but every request hits PostgreSQL instead of a CDN
- Type safety: 50+ `: any` usages, 3 competing auth patterns across 40+ routes
- Production hygiene: 22 `console.log` calls in production code, `.bak` file committed

---

## Deep-Dive Audit (10 Parallel Agents)

**Date:** 2026-06-05
**Method:** Spawned 10 specialized AI agents to audit the codebase in parallel across performance, security, CRO, UX/a11y, code quality, legal/compliance, i18n, architecture, analytics, and testing. Each agent read 25-60+ files and ran targeted searches across the full source tree. Results synthesized into ~85 findings.

### Legend

| Priority | Meaning |
|----------|---------|
| **🔴 P0** | Fix **now** — security hole, broken flow, or blocks scale |
| **🟠 P1** | Fix **this sprint** — significant user or business impact |
| **🟡 P2** | Fix **next sprint** — important quality, debt, or compliance gap |
| **🟢 P3** | Fix **when convenient** — polish, low-impact debt |
| ✅ | Already covered in existing roadmap |

---

### 🔴 P0 — Fix Now

| # | Domain | Finding | Effort | Agent |
|---|--------|---------|--------|-------|
| 1 | **Security** | **4 admin routes have zero auth**: `admin/user-flows`, `admin/emails`, `admin/email-stats`, `admin/backfill-audience`. Anyone who discovers the endpoints can read all emails, analytics sessions, and trigger Resend API calls. | ~30m | 蓝鲸 |
| 2 | **Security** | **Zero CSRF protection** on any mutation endpoint (POST/PATCH/DELETE). Session cookies are automatically sent by browsers — a malicious site can perform actions as the logged-in user. | ~1h | 蓝鲸 |
| 3 | **CRO** | **Email signup → onboarding is broken**: users who sign up with email + OTP hit `/verify`, then land on `/browse` instead of `/onboarding`. They never set role, genre, budget, or Stripe Connect. | ~2h | 座头鲸 |
| 4 | **CRO** | **No post-first-action activation**: after a first video submit or campaign creation, there's zero sequential prompting — no "What's next?" nudge, no email drip, no guided next step. | ~3h | 座头鲸 |
| 5 | **Legal** | **No GDPR data export or deletion**: zero self-service endpoints. Privacy policy says "email us." No `/api/me/export` or `/api/me/delete`. Dutch DPA exposure. | ~3h | 塞鲸 |
| 6 | **Legal** | **No tax/1099 handling**: Stripe Connect pays US creators but no W-9, tax ID, or 1099-K configuration. IRS reporting required for payments >$600/year. | ~4h | 塞鲸 |
| 7 | **Testing** | **Zero test framework**: no Jest, Vitest, React Testing Library, or any unit test infrastructure. 57 lib files, 56 components, 41 API routes — zero coverage. | ~2h (setup) | 抹香鲸 |
| 8 | **Testing** | **E2E tests run against production** (`baseURL: https://selah.fm`). The signup test creates real users. No staging environment. | ~30m | 抹香鲸 |
| 9 | **Testing** | **financial logic untested**: `lib/fees.ts` (calculatePayout, grossDeposit, stripeCharge) handles real money with zero tests. | ~2h | 抹香鲸 |

---

### 🟠 P1 — Fix This Sprint

| # | Domain | Finding | Effort | Agent | In Roadmap? |
|---|--------|---------|--------|-------|-------------|
| 10 | **Security** | **Claim API trusts client-provided `user_id`**: POST `/api/claim` reads `user_id` from JSON body instead of the session. If an attacker knows a claim code, they can transfer the campaign to any user ID. | ~1h | 蓝鲸 |
| 11 | **Security** | **CSP in report-only mode** with `'unsafe-inline'` and `'unsafe-eval'` — violations logged but not blocked. | ~2h | 蓝鲸 |
| 12 | **Performance** | **No `next/image`**: 0 imports across 1,156 files. Raw `<img>` everywhere — no WebP/AVIF conversion, no responsive sizes, no blur placeholders. Directly harms LCP. | ~4h | Sperm |
| 13 | **Performance** | **No `next/dynamic`**: framer-motion imported in 37+ files (bundled in every page), recharts imported unconditionally. No code-splitting. | ~2h | Sperm |
| 14 | **Performance** | **SWR waterfall on dashboard**: 6 sequential calls (auth → campaigns → artist → earnings → activity → referral code). Each adds round-trip latency. | ~3h | Sperm |
| 15 | **Performance** | **No Cache-Control on any data API route**: all `force-dynamic`, every page navigation triggers a fresh database query. | ~3h | Sperm, Blue |
| 16 | **Architecture** | **In-memory filtering in `/api/creators`**: `SELECT WHERE is_creator = true` without LIMIT, then JS `.filter()` in memory. Doesn't scale past a few thousand creators. | ~1h | Blue |
| 17 | **Architecture** | **PgBouncer configured but not deployed**: pool URL says `?pgbouncer=true` but Railway has no PgBouncer service. Each cold start creates a new pool. | ~30m | Blue |
| 18 | **Architecture** | **Fire-and-forget cascade**: review approval fires 4+ async ops with `.catch(() => {})`. Stripe payout could fail silently while notifications still fire. | ~3h | Blue |
| 19 | **CRO** | **Budget-zero submissions allowed**: SubmitVideoModal shows artist balance but doesn't block when balance is $0. Creators submit to unfunded campaigns. | ~1h | 座头鲸 |
| 20 | **CRO** | **Login redirect loss**: signup handler's fallback drops the onboarding path for auto-confirm email users. | ~1h | 座头鲸 |
| 21 | **UX** | **DashboardErrorBoundary leaks stack traces**: renders `error.message` and `error.stack` as visible UI text. | ~30m | Humpback |
| 22 | **UX** | **Form validation color-only**: error state uses `text-red-400` with no icons, no `aria-describedby`, no `aria-invalid`. Color-blind users miss errors. | ~2h | Humpback |
| 23 | **Legal** | **Cookie banner accept-only**: no "Reject All" or granular controls. Text claims analytics cookies but Privacy Policy says no analytics — contradictory. EU ePrivacy violation. | ~2h | 塞鲸 |
| 24 | **Legal** | **COPPA: self-attestation only**: "I am 13+" checkbox. No DOB collection, no parental consent. Under-13 users can (and will) sign up. | ~2h | 塞鲸 |
| 25 | **Code quality** | **Silent error swallowing**: 3+ API routes return 200 with empty data on DB errors instead of 5xx. Production monitoring is blind to these failures. | ~2h | 长须鲸, Blue |
| 26 | **Code quality** | **Auth pattern inconsistency**: 3 competing patterns (`getUser()`, `getSession()`, `createClient()`) across 40+ routes. Maintenance burden, potential auth bypass. | ~3h | 长须鲸 |
| 27 | **Architecture** | **No Zod/validation library**: all routes manually parse JSON. No schema composition, no TypeScript type inference from validation. | ~3h | Blue |
| 28 | **Architecture** | **Serial cron dispatcher**: 30+ workers in `for...of` loop with 300s timeout each. Total wall-clock time could exceed 90 minutes. No recovery on crash. | ~4h | Blue |
| 29 | **Architecture** | **BYTEA image storage**: every image request hits PostgreSQL instead of a CDN. DB IO for campaign covers, blog images, avatars. Doesn't scale. | ~6h | Blue |
| 30 | **Performance** | **Third-party scripts block rendering**: Meta Pixel + Google Ads in `<head>` via `dangerouslySetInnerHTML` without `next/script` strategy. | ~1h | Sperm |
| 31 | **Testing** | **`lib/validation.ts` untested**: `validateCampaignInput`, `isValidSubmissionUrl`, `sanitizeInput` are the gatekeepers for all user-submitted data. | ~2h | 抹香鲸 |

---

### 🟡 P2 — Fix Next Sprint

| # | Domain | Finding | Effort | Agent |
|---|--------|---------|--------|-------|
| 32 | **Performance** | **58 `'use client'` components on static pages**: FAQ, 404, not-found, open-source, welcome pages all ship JavaScript bundle for zero interactivity. | ~3h | Sperm |
| 33 | **Performance** | **Homepage uses raw `fetch` (not SWR)** for `/api/stats` and `/api/campaigns` — no dedup, no stale-while-revalidate, no retry. | ~1h | Sperm |
| 34 | **Performance** | **`mousemove` handler causes re-renders**: homepage tracks mouse position in React state, re-rendering on every pixel. | ~1h | Sperm |
| 35 | **Performance** | **Conflicting `force-dynamic` + `revalidate=3600`**: blog and tools pages have both — `force-dynamic` wins silently. | ~30m | Sperm |
| 36 | **Security** | **File upload validation client-side only**: server accepts arbitrary base64 data URLs up to 10MB. No server-side type/size enforcement. | ~2h | 蓝鲸 |
| 37 | **Security** | **Rate limiting inconsistently applied**: many GET routes (campaigns, artists, creators) have no rate limiting at all. | ~2h | 蓝鲸 |
| 38 | **Security** | **Admin email hardcoded**: `motomotosings@gmail.com` in migration files. No env var, no admin role table. | ~1h | 蓝鲸 |
| 39 | **CRO** | **No quick-actions in TopNav**: hamburger menu has Dashboard, Messages, Earnings, Browse, GitHub. No "Create Campaign" or "Submit Video". | ~1h | 座头鲸 |
| 40 | **CRO** | **Earnings page lacks CPM explanation**: creators see dollar amounts but not the rate model. Payout setup prompt appears only after earnings exist. | ~2h | 座头鲸 |
| 41 | **CRO** | **No URL validation on video submit**: only checks `startsWith('https://')`. No platform-specific regex (TikTok, IG, YT, FB). | ~1h | 座头鲸 |
| 42 | **UX** | **Pinch-zoom disabled**: `userScalable: false, maximumScale: 1` — WCAG 1.4.4 failure. Low-vision users cannot zoom text. | ~5m | Humpback |
| 43 | **UX** | **Toast system screen-reader invisible**: no `role="alert"` or `aria-live="assertive"`. | ~1h | Humpback |
| 44 | **UX** | **Command palette + SupportWidget lack `role="dialog"` and `aria-modal`**. | ~1h | Humpback |
| 45 | **UX** | **Custom range slider missing ARIA**: no `aria-valuenow`, `aria-valuetext`, `aria-label` on homepage CPM calculator. | ~1h | Humpback |
| 46 | **UX** | **Error-state images have empty alt text**: `alt=""` on `error-state.png` — should describe error context for screen readers. | ~30m | Humpback |
| 47 | **Legal** | **Data retention**: one archive cron (30-day). No inactive account PII cleanup. | ~3h | 塞鲸 |
| 48 | **Legal** | **Content moderation**: comment reporting exists but no proactive scanning for prohibited content (hate speech, violence, CSAM). | ~5h | 塞鲸 |
| 49 | **Code quality** | **50+ `: any` usages** across admin pages and catch blocks. Type safety erosion. | ~4h | 长须鲸 |
| 50 | **Code quality** | **Duplicated outreach modules**: `lib/email-outreach.ts` and `lib/creator-email-outreach.ts` share ~80% code. Bug fixes must be applied twice. | ~2h | 长须鲸 |
| 51 | **Code quality** | **shadcn CLI in runtime `dependencies`** instead of `devDependencies` — adds ~30MB to production installs. | ~5m | 长须鲸 |
| 52 | **Architecture** | **N+1 in `/api/feed`**: 3 separate SQL queries (follows, submissions, campaigns) merged in-memory instead of a UNION. | ~1h | Blue |
| 53 | **Architecture** | **Dual schema files**: `lib/db/schema.sql` and `lib/db/supabase-schema.sql` drift from migration state. | ~1h | Blue |
| 54 | **Analytics** | **No cohort/retention/LTV analysis**: can't measure creator or artist unit economics. | ~4h | Fin |
| 55 | **Analytics** | **No conversion funnel analysis**: events captured but no computed funnel across user journey. | ~3h | Fin |
| 56 | **Analytics** | **No business/exec dashboard**: admin shows operational metrics (users, submissions, money flow) but no MRR/ARPU/CAC/NPS. | ~4h | Fin |
| 57 | **Analytics** | **A/B testing framework dormant**: `EXPERIMENTS` array empty. Zero active experiments. All product decisions untested. | ~1h (launch first experiment) | Fin |
| 58 | **Analytics** | **`session_id` inconsistently populated**: nullable columns, fragile sessionization for user-level analytics. | ~2h | Fin |
| 59 | **Testing** | **Zero component tests**: 56 component files (CampaignWizard, ErrorBoundary, PaymentSuccess, StripePaymentModal, etc.) — zero rendering tests. | ~6h | 抹香鲸 |
| 60 | **Testing** | **Zero API route tests**: 41 route directories — zero integration tests. Stripe webhook, submissions, review, auth — all untested. | ~8h | 抹香鲸 |
| 61 | **Testing** | **CI/CD `continue-on-error: true`**: nightly E2E failures don't block deploys. | ~30m | 抹香鲸 |
| 62 | **Testing** | **`lib/discovery.ts` untested**: 300+ line module hitting Reddit/Bandcamp/YouTube APIs with complex parsing logic. | ~3h | 抹香鲸 |

---

### 🟢 P3 — Fix When Convenient

| # | Domain | Finding | Effort | Agent |
|---|--------|---------|--------|-------|
| 63 | **i18n** | Zero i18n infrastructure — no library, no config, no routing | ~10h | Sei |
| 64 | **i18n** | 30+ hardcoded `'en-US'` locale calls for date/time formatting | ~3h | Sei |
| 65 | **i18n** | Currency hardcoded to USD `$` prefix everywhere | ~4h | Sei |
| 66 | **i18n** | No RTL support — zero RTL-aware CSS properties | ~6h | Sei |
| 67 | **i18n** | Latin-only fonts — no CJK/Arabic/Cyrillic fallbacks | ~2h | Sei |
| 68 | **i18n** | No locale-aware number abbreviation — `K`/`M` suffixes hardcoded | ~1h | Sei |
| 69 | **i18n** | No `Accept-Language` detection in middleware | ~1h | Sei |
| 70 | **Security** | Debug-cookies endpoint exposes Supabase cookie names | ~30m | 蓝鲸 |
| 71 | **Security** | Health endpoint returns aggregate stats | ~15m | 蓝鲸 |
| 72 | **CRO** | Homepage CTA path multiplicity — 4 entry-points to different destinations | ~1h | 座头鲸 |
| 73 | **UX** | Empty state inconsistency — 8+ copy variants, most bypass `<EmptyState>` | ~2h | Humpback |
| 74 | **UX** | shadcn Skeleton invisible on OLED dark — `bg-muted` at 3:1 contrast | ~30m | Humpback |
| 75 | **Code quality** | 22 `console.log` calls in production code | ~1h | 长须鲸 |
| 76 | **Code quality** | `.bak` file committed (`components/HomePageClient.tsx.bak`) | ~5m | 长须鲸 |
| 77 | **Code quality** | `ES2017` target — should be `ES2022` for modern Node.js | ~5m | 长须鲸 |
| 78 | **Code quality** | Overly flat `lib/` — 45+ files at root | ~2h | 长须鲸 |
| 79 | **Legal** | Privacy Policy incomplete — no DPO, no international transfers, no portability | ~3h | 塞鲸 |
| 80 | **Legal** | ToS has no arbitration clause — expensive NL court jurisdiction | ~2h | 塞鲸 |
| 81 | **Architecture** | Stripe API version cast as `any` — defeats TypeScript checking | ~5m | Blue |
| 82 | **Analytics** | Sentry replays at 10% sample — 90% of sessions invisible | ~5m | Fin |
| 83 | **Analytics** | No real-time monitoring or alerting for error spikes | ~4h | Fin |
| 84 | **Analytics** | Reconciliation alerts logged but not notified | ~1h | Fin |
| 85 | **Testing** | No visual regression testing (Percy/Chromatic) | ~3h | 抹香鲸 |

---

### Roadmap Cross-Reference

The following items are already in the existing roadmap and validated by the agents as important. Keep them as planned.

| Roadmap Item | Phase | Agent Validation |
|-------------|-------|-----------------|
| WebSocket notifications | Current P0 | ✅ Multiple agents flagged SSE as insufficient |
| View fraud detection | Current P0 | ✅ Blue flagged silent error swallowing in review pipeline |
| Creator analytics dashboard | Current P1 | ✅ Fin flagged missing cohort/funnel/business metrics |
| Artist auto-CPM | Current P1 | ✅ Blue flagged missing request validation for campaign creation |
| Dispute resolution system | Current P1 | ✅ 座头鲸 flagged budget-zero submissions; 塞鲸 flagged moderation gaps |
| Performance optimization | Phase 3 P1 | ✅ Sperm found 0 next/image, 0 next/dynamic, no Cache-Control |
| Monitoring + APM | Phase 3 P1 | ✅ Fin, Blue both flagged silent error swallowing, no alerting |
| Multi-currency/international | Phase 3 P0 | ✅ Sei confirmed zero i18n infrastructure, USD-only, en-US hardcoded |
| Email drip sequences | Phase 3 P2 | ✅ 座头鲸 flagged no post-first-action activation |
| A/B testing | Phase 3 P2 | ✅ Fin confirmed framework dormant, zero experiments active |
| Content moderation | Phase 4 P2 | ✅ 塞鲸 flagged no proactive scanning |
| Public API platform | Phase 4 P2 | ✅ Blue flagged no response caching, no Zod for API consumers |

### What This Means

**9 items need to be pulled into the current sprint** (P0 findings 1-9 — admin auth, CSRF, onboarding fix, activation, GDPR, tax, test setup, prod E2E, fees tests). These are active gaps the roadmap doesn't address.

**~22 items should be worked this sprint and next** (P1 findings 10-31 — mostly security hardening, performance, architecture, and CRO fixes).

The remaining ~38 findings (P2-P3) are real but can wait until the foundation is solid.

---

## A+ Roadmap: 16 Weeks to World-Class

**Last updated:** 2026-06-05
**Method:** 6 parallel research agents × 10 expert domains. Cross-referenced vs SoundBetter, AirGigs, Fiverr, Upwork, Patreon, Kickstarter, Bandcamp, TikTok Creator Marketplace, YouTube BrandConnect, Stripe, Linear, Vercel.
**Goal:** A+ in every dimension (90+/100). This means:
- Security: Zero unauthenticated endpoints, CSP enforced, all Stripe webhooks verified, rate limiting on every public route
- Conversion: 100% guided onboarding, post-first-action activation, social proof at every funnel stage
- Performance: Lighthouse 95+, Core Web Vitals green, <1s TTFB, 100% images optimized
- SEO/LLMO: Maintain A+, add VideoObject + AggregateRating schema, FAQPage on artist pages
- Testing: 200+ tests, CI/CD blocking gates, 100% coverage on financial logic
- Analytics: Cohort retention, conversion funnel, business dashboard, active A/B experiments
- Legal: GDPR self-service, tax/1099, cookie banner with granular controls, DPO contact
- Code quality: 0 `:any`, 0 `console.log`, single auth pattern, Zod for all API routes

---

## Phase 0: Foundation (Week 1-2: June 5-19)
**Target: Security D→A, Legal D→B, Testing F→D**

### Week 1 — Security & Legal Emergency

| Day | Item | Effort | Who |
|-----|------|--------|-----|
| **1** | `isAdminRequest()` on 4 admin routes | ~30m | Security Engineer |
| **1** | Fix Claim API: read `user_id` from session, not body | ~1h | Security Engineer |
| **1** | Add CSRF protection (Origin/Referer validation) to middleware | ~1h | Security Engineer |
| **2** | Cookie banner: add "Reject All" + granular controls | ~2h | Legal + Frontend |
| **2** | Fix CSP: enforce with nonces, remove `unsafe-inline` | ~2h | Security Engineer |
| **3** | GDPR endpoints: `/api/me/export` + `/api/me/delete` | ~3h | Backend Engineer |
| **3** | Privacy Policy update: DPO contact, international transfers, portability | ~2h | Legal |
| **4** | Tax/1099: add `business_type` + `tax_id` to Stripe Connect onboarding | ~4h | Backend Engineer |
| **4** | Rate limiting: add DB-backed rate limiter to all public GET routes | ~2h | Security Engineer |
| **5** | Server-side file validation: type/size/magic-byte check on uploads | ~2h | Security Engineer |
| **5** | Admin email to env var: `ADMIN_EMAIL` not hardcoded | ~1h | Security Engineer |

### Week 2 — Test Foundation + Fix Onboarding

| Day | Item | Effort | Who |
|-----|------|--------|-----|
| **1** | Install Vitest + React Testing Library + configure | ~1h | Test Engineer |
| **1** | Property-based tests for `lib/fees.ts` (calculatePayout, grossDeposit, stripeCharge) | ~2h | Test Engineer |
| **2** | Tests for `lib/validation.ts` (validateCampaignInput, isValidSubmissionUrl, sanitizeInput) | ~2h | Test Engineer |
| **2** | Add `.env.test` + switch Playwright to local dev target | ~30m | Test Engineer |
| **3** | Fix email onboarding: persist redirect through `/verify` → `/onboarding` | ~2h | Full Stack |
| **3** | Block budget-zero submissions: disable Submit button when balance = $0 | ~1h | Full Stack |
| **4** | Add post-first-action activation: "What's next?" modal after submit/campaign create | ~3h | Full Stack |
| **4** | Set up CI/CD test gates: remove `continue-on-error: true` | ~30m | DevOps |
| **5** | Fix login redirect loss: persist `?redirect=/onboarding` through auth flow | ~1h | Full Stack |
| **5** | API route error handling: return 5xx instead of 200 with empty data | ~2h | Backend Engineer |

**Phase 0 success metrics:**
- 0 unauthenticated admin endpoints
- 100% mutation endpoints have CSRF protection
- GDPR export/delete functional in <30s
- Test suite: 20+ tests passing, CI fails on test failure
- Email signups land on onboarding (not browse)
- Budget-zero submissions blocked

---

## Phase 1: Conversion & Performance (Week 3-4: June 19 - July 3)
**Target: Conversion C→B+, Performance C→B, Architecture C→B**

### Week 3 — Performance Audit

| Day | Item | Effort | Who |
|-----|------|--------|-----|
| **1** | Replace top 20 `<img>` with `next/image` (homepage, browse, campaign, artist) | ~3h | Frontend Engineer |
| **1** | Add `next/dynamic` for framer-motion on low-interaction pages | ~2h | Frontend Engineer |
| **2** | Add Cache-Control headers to all data API routes (60s stale-while-revalidate) | ~3h | Backend Engineer |
| **2** | Fix SWR waterfall on dashboard: parallelize 6 calls | ~3h | Frontend Engineer |
| **3** | Remove conflicting ISR config (decide: `force-dynamic` or `revalidate`) | ~30m | Backend Engineer |
| **3** | Fix third-party scripts: move Meta Pixel + Google Ads to `next/script with strategy` | ~1h | Full Stack |
| **4** | Convert 30 static pages from `'use client'` to server components | ~3h | Frontend Engineer |
| **4** | Homepage: replace raw `fetch` with SWR for `/api/stats` and `/api/campaigns` | ~1h | Frontend Engineer |
| **5** | Fix `mousemove` handler: use `requestAnimationFrame` or `transform: translate3d` | ~1h | Frontend Engineer |
| **5** | Lighthouse audit: target 90+ on mobile, 95+ on desktop | ~2h | Frontend Engineer |

### Week 4 — Conversion & Social Proof

| Day | Item | Effort | Who |
|-----|------|--------|-----|
| **1** | Social proof wall: "X paid to creators this week", live visitor counter | ~3h | Full Stack |
| **1** | Testimonial carousel on homepage (loaded from DB or static) | ~2h | Frontend Engineer |
| **2** | Create `/pricing` page: CPM explained, calculator, no signup required | ~3h | Frontend Engineer + Marketing |
| **2** | Create `/compare` page: vs TikTok Fund, SoundBetter, BeatStars | ~2h | Full Stack |
| **3** | Guest browsing: "Browse without signing up" CTA on logged-out views | ~1h | Frontend Engineer |
| **3** | Add urgency signals: "X artists browsing now", real-time activity | ~2h | Full Stack |
| **4** | PWA upgrade: push notifications, install prompt, service worker caching | ~4h | Frontend Engineer |
| **4** | Quick-actions in TopNav: "Create Campaign" + "Submit Video" | ~1h | Frontend Engineer |
| **5** | Earnings page: add CPM explanation + payout progress | ~2h | Full Stack |
| **5** | Video submit: add platform-specific URL validation (TikTok/IG/YT regex) | ~1h | Full Stack |

**Phase 1 success metrics:**
- Lighthouse: 90+ mobile, 95+ desktop
- Cache-Control on all data APIs
- `/pricing` and `/compare` pages live
- PWA: push notifications working, install prompt shown
- Testimonial carousel with real user quotes

---

## Phase 2: Testing & Analytics (Week 5-6: July 3-17)
**Target: Testing F→C, Analytics D-→C, Architecture C→B+**

### Week 5 — Test Coverage Sprint

| Day | Item | Effort | Who |
|-----|------|--------|-----|
| **1** | Component tests: ArtistCard, CampaignCover, SubmitVideoModal, StripePaymentModal | ~4h | Test Engineer |
| **2** | API integration tests: GET /api/campaigns, GET /api/artists, GET /api/stats | ~4h | Test Engineer |
| **3** | Mutation API tests: POST /api/submit, POST /api/claim, PATCH /api/review | ~4h | Test Engineer |
| **4** | Webhook tests: Stripe payment intents, Stripe Connect payouts | ~3h | Test Engineer |
| **4** | `lib/discovery.ts` tests: Reddit/Bandcamp/YouTube parsing logic | ~3h | Test Engineer |
| **5** | E2E tests: complete user journey (signup → browse → submit → earn) | ~4h | Test Engineer |

### Week 6 — Analytics Infrastructure

| Day | Item | Effort | Who |
|-----|------|--------|-----|
| **1** | Cohort/retention analysis: weekly active users, retention curves | ~4h | Data Engineer |
| **1** | Conversion funnel: signup → onboard → browse → submit → earn → payout | ~3h | Data Engineer |
| **2** | Business dashboard: MRR, ARPU, CAC, NPS, LTV:CAC ratio | ~4h | Full Stack |
| **3** | `session_id` fix: populate on every event, null-check removed | ~2h | Backend Engineer |
| **3** | A/B testing: launch first experiment (CTA text, onboarding flow variant) | ~3h | Full Stack |
| **4** | Real-time monitoring: Sentry error alerts, PagerDuty/email on 5xx spikes | ~3h | DevOps |
| **4** | Unit economics: per-cohort revenue tracking, creator LTV model | ~3h | Data Engineer |
| **5** | Fix cron dispatcher: parallel execution, timeout handling, crash recovery | ~4h | Backend Engineer |
| **5** | Add Zod validation to top 10 API routes: request/response schemas | ~3h | Backend Engineer |

**Phase 2 success metrics:**
- 100+ tests passing, >60% code coverage on critical paths
- Conversion funnel dashboard live
- A/B testing framework with 1 active experiment
- Sentry alerts on error spikes
- Zod validation on all mutation routes
- Cron dispatcher handles parallel execution

---

## Phase 3: Architecture & UX Polish (Week 7-8: July 17-31)
**Target: Architecture C→A, UX/Design B+→A, Conversion B+→A**

### Week 7 — Architecture Overhaul

| Day | Item | Effort | Who |
|-----|------|--------|-----|
| **1** | Migrate images from BYTEA to S3-compatible object storage (R2) | ~6h | Backend Engineer |
| **1** | Add CDN caching layer: Cloudflare or Railay edge caching | ~4h | DevOps |
| **2** | N+1 fix in `/api/feed`: UNION query instead of 3 separate queries | ~1h | Backend Engineer |
| **2** | In-memory filtering in `/api/creators`: add SQL LIMIT | ~1h | Backend Engineer |
| **3** | Consolidate auth patterns: single `getUser()` across all 40+ routes | ~3h | Backend Engineer |
| **3** | Remove dual schema files: single source of truth from migrations | ~1h | Backend Engineer |
| **4** | Zod for remaining 30 API routes: request/response validation | ~3h | Backend Engineer |
| **4** | Fire-and-forget cascade fix: proper Promise.all with error handling | ~3h | Backend Engineer |
| **5** | PgBouncer: deploy Railway PgBouncer service or remove config | ~30m | DevOps |
| **5** | Stripe API version: remove `:any` cast, use typed version | ~5m | Backend Engineer |

### Week 8 — UX Polish

| Day | Item | Effort | Who |
|-----|------|--------|-----|
| **1** | Replace `text-white/[opacity]` with `--gray-*` scale across codebase | ~4h | Frontend Engineer |
| **1** | Enforce spacing tokens: `--space-section`, `--space-card` usage audit | ~2h | Frontend Engineer |
| **2** | Add container queries to Browse grid | ~2h | Frontend Engineer |
| **2** | Add page transition between dark pages (Browse → Track) | ~2h | Frontend Engineer |
| **3** | Fix BottomNav active state differentiation | ~1h | Frontend Engineer |
| **3** | Empty state consolidation: single `<EmptyState>` component used everywhere | ~2h | Frontend Engineer |
| **4** | WCAG AA sweep: color-only form validation → add icons + aria-describedby + aria-invalid | ~3h | Frontend Engineer |
| **4** | Toast system: add `role="alert"` and `aria-live="assertive"` | ~1h | Frontend Engineer |
| **5** | Command palette + SupportWidget: add `role="dialog"` and `aria-modal` | ~1h | Frontend Engineer |
| **5** | Range slider: add `aria-valuenow`, `aria-valuetext`, `aria-label` | ~1h | Frontend Engineer |
| **5** | Skeleton visibility: fix `bg-muted` on OLED dark (contrast ratio ≥4.5:1) | ~30m | Frontend Engineer |
| **5** | Error-state images: meaningful alt text | ~30m | Frontend Engineer |

**Phase 3 success metrics:**
- Images served from CDN (not PostgreSQL)
- Single auth pattern across all routes
- Zod validation on all API routes
- WCAG AA audit pass (automated + manual spot-check)
- Gray scale used instead of opacity chains
- Container queries on Browse grid

---

## Phase 4: SEO/LLMO Polish + Marketing (Week 9-12: July 31 - Aug 28)
**Target: SEO A→A+, Marketing B-→A**

### Week 9 — SEO/LLMO to A+

| Day | Item | Effort | Who |
|-----|------|--------|-----|
| **1** | Add FAQPage schema to artist pages | ~2h | SEO Engineer |
| **1** | Add VideoObject schema for submission videos | ~2h | SEO Engineer |
| **2** | Add AggregateRating schema for reviews | ~1h | SEO Engineer |
| **2** | Add `@id` references for schema entity linking | ~2h | SEO Engineer |
| **3** | Fix blog image alt text: descriptive, not empty | ~2h | Content + Frontend |
| **3** | Add Person schema to About page | ~1h | SEO Engineer |
| **4** | Structured data testing: Google Rich Results Test + Schema.org validator | ~2h | SEO Engineer |
| **4** | Blog pipeline: add FAQPage schema to posts | ~1h | SEO Engineer |
| **5** | LLMO optimization: ensure all pages have answer-first content blocks | ~3h | Content Engineer |

### Week 10 — Referral Flywheel & Growth Loops

| Day | Item | Effort | Who |
|-----|------|--------|-----|
| **1** | Launch referral flywheel: in-product "Share" prompt after first deposit/submission | ~3h | Full Stack |
| **1** | Referral leaderboard: top referrers this week | ~2h | Full Stack |
| **2** | Case study page: "How Artist X got Y views in Z days" | ~4h | Marketing + Full Stack |
| **2** | Testimonial collection: email drip requesting reviews after payout | ~2h | Marketing |
| **3** | PR/HARO outreach: pitch founder story to music tech press | ~2h | Marketing |
| **3** | Instagram content automation: blog → IG carousel cron | ~3h | Full Stack |
| **4** | Retargeting: Meta Pixel + Google Ads retargeting campaigns for browse visitors | ~2h | Marketing |
| **4** | Email drip sequences: behavior-triggered onboarding, re-engagement, milestones | ~4h | Marketing + Backend |
| **5** | Educator program: YouTube tutorial script + blog post series | ~3h | Marketing |

### Week 11 — Positioning & Pricing

| Day | Item | Effort | Who |
|-----|------|--------|-----|
| **1** | `/pricing` page: tiered plans, enterprise pricing for labels | ~4h | Marketing + Full Stack |
| **1** | `/compare` page: feature matrix vs TikTok Fund, SoundBetter, BeatStars | ~3h | Marketing + Full Stack |
| **2** | Landing pages: `/for-artists`, `/for-creators`, `/for-labels` | ~4h | Marketing + Full Stack |
| **2** | Case study videos: record creator testimonials | ~3h | Marketing |
| **3** | SEO optimization: optimize all landing pages for long-tail keywords | ~4h | SEO Engineer |
| **4** | Product Hunt launch prep: copy, screenshots, founder story | ~3h | Marketing |
| **4** | Launch on Hacker News: "Show HN" post with open source pitch | ~2h | Marketing |
| **5** | PR distribution: music tech blogs, creator economy newsletters | ~2h | Marketing |

### Week 12 — Outreach & Content Expansion

| Day | Item | Effort | Who |
|-----|------|--------|-----|
| **1** | Ramp creator outreach: 2× frequency (all hours instead of half) | ~1h | Backend Engineer |
| **1** | Artist outreach personalization: use artist stats in email | ~2h | Backend Engineer |
| **2** | Guest posting: 5 blog posts on music tech sites | ~5h | Content Engineer |
| **2** | Reddit expansion: post to 10 subreddits instead of current | ~2h | Content Engineer |
| **3** | Bluesky automation: daily metrics + featured campaigns | ~2h | Backend Engineer |
| **3** | GitHub release notes: auto-post to repo on deploy | ~1h | DevOps |
| **4** | Email digest upgrade: personalized recommendations, view metrics | ~3h | Full Stack |
| **4** | Abandoned checkout emails: "You have an incomplete campaign" | ~2h | Backend Engineer |
| **5** | Referral in bio links: `/r/[code]` shortlinks | ~1h | Backend Engineer |

**Phase 4 success metrics:**
- FAQPage schema on all artist pages
- VideoObject + AggregateRating schema live
- Referral flywheel: 20% of new users from referrals
- 5 case studies published
- Instagram automation posting daily
- `/pricing` and `/compare` driving traffic

---

## Phase 5: Analytics & Code Quality to A+ (Week 13-14: Aug 28 - Sep 11)
**Target: Analytics D-→A+, Testing C→A**

| Week | Day | Item | Effort | Who |
|------|-----|------|--------|-----|
| **13** | **1-2** | Complete test coverage: all components, all API routes | ~10h | Test Engineer |
| **13** | **3** | Property-based tests for financial models (fuzz testing) | ~4h | Test Engineer |
| **13** | **3** | Visual regression tests (Percy/Chromatic) | ~3h | Test Engineer |
| **13** | **4-5** | Cohort analysis: weekly retention dashboard, cohort comparison | ~6h | Data Engineer |
| **14** | **1** | Conversion funnel: automated monitoring + drop-off alerts | ~4h | Data Engineer |
| **14** | **2** | Business dashboard: MRR, ARPU, CAC, LTV fully automated | ~4h | Full Stack |
| **14** | **3** | A/B results dashboard: statistical significance calculator | ~3h | Full Stack |
| **14** | **4-5** | Code quality sweep: 0 `:any`, 0 `console.log`, 0 `.bak` files | ~6h | All Engineers |
| **14** | **5** | Auth pattern consolidation: final cleanup of remaining legacy patterns | ~2h | Backend Engineer |

**Phase 5 success metrics:**
- 200+ tests, 80%+ coverage on critical code
- Visual regression tests on all major pages
- Cohort retention analysis live
- Business dashboard with real-time MRR/ARPU/CAC
- 0 `:any`, 0 `console.log` in production

---

## Phase 6: i18n & International (Week 15-16: Sep 11-25)
**Target: Legal D→B+, Architecture B+→A, All Others Maintain A**

| Week | Day | Item | Effort | Who |
|------|-----|------|--------|-----|
| **15** | **1-2** | i18n framework: next-intl setup, routing, locale detection | ~6h | Frontend Engineer |
| **15** | **2-3** | Translation extraction: all user-facing strings | ~4h | Frontend Engineer |
| **15** | **4** | Currency: Stripe Connect multi-currency support | ~4h | Backend Engineer |
| **15** | **5** | First translation: NL (Dutch) — founder's home market | ~3h | Content |
| **16** | **1** | Date/time: remove hardcoded `en-US`, use locale-aware formatting | ~2h | Frontend Engineer |
| **16** | **2** | Number formatting: locale-aware K/M abbreviations | ~1h | Frontend Engineer |
| **16** | **3** | Font fallbacks: CJK/Arabic/Cyrillic support | ~2h | Frontend Engineer |
| **16** | **4** | RTL CSS audit: ensure layout works in RTL | ~3h | Frontend Engineer |
| **16** | **5** | Privacy Policy update: international transfers, DPO, portability | ~2h | Legal |
| **16** | **5** | ToS update: arbitration clause, jurisdiction | ~2h | Legal |

**Phase 6 success metrics:**
- i18n framework deployed with NL + EN locales
- Multi-currency payments through Stripe Connect
- Date/time/currency locale-aware
- Privacy Policy complete with DPO and international transfers

---

## Post-Phase 6: Maintain & Iterate

Once all phases are complete, the platform should operate in **maintenance + iteration mode**:

| Cadence | Activity |
|---------|----------|
| **Daily** | Monitor error rates, check conversion funnel, review A/B results |
| **Weekly** | Cohort retention check, business dashboard review, deploy cycle |
| **Bi-weekly** | A/B experiment analysis, feature flag cleanup, SEO content update |
| **Monthly** | Full audit: security scan, dependency updates, Lighthouse score review |
| **Quarterly** | Legal review, privacy policy update, 1099 filing, competitive landscape scan |

---

## Resource Allocation Summary

| Phase | Total Effort | Engineer-days | Security | Frontend | Backend | Marketing | Legal |
|-------|-------------|---------------|----------|----------|---------|-----------|-------|
| **P0** Foundation | ~31h | ~4 days | 3 | 2 | 3 | — | 2 |
| **P1** Conversion + Perf | ~38h | ~5 days | — | 7 | 3 | 1 | — |
| **P2** Testing + Analytics | ~51h | ~6 days | — | 1 | 7 | — | — |
| **P3** Architecture + UX | ~42h | ~5 days | — | 8 | 5 | — | — |
| **P4** SEO + Marketing | ~65h | ~8 days | — | 2 | 1 | 10 | — |
| **P5** Analytics + Code | ~45h | ~6 days | — | 2 | 3 | — | — |
| **P6** i18n + Legal | ~32h | ~4 days | — | 5 | 2 | — | 2 |
| **All Phases** | **~304h** | **~38 days** | 3 | 27 | 24 | 11 | 4 |

**Note:** Effort estimates assume parallel work. Sequential wall-clock time depends on team size. With 1 full-time engineer: ~8-10 weeks of focused execution. With 2 engineers: ~5-6 weeks. With 2 engineers + 1 marketing: ~4 weeks.

---

## A+ Definition Per Dimension (Measurable Outcomes)

| Dimension | Current Score | A+ Target | Key Metrics for A+ |
|-----------|--------------|-----------|-------------------|
| **SEO & LLMO** | A (90) | A+ (96+) | FAQPage on all pages, VideoObject schema, AggregateRating, @id references, 100% pages with answer-first blocks, all images have descriptive alt text |
| **UI/UX & Design** | B+ (82) | A+ (94+) | Gray scale used everywhere, spacing tokens enforced, container queries, WCAG AA pass, no color-only validation, all modals accessible, responsive < 3s on 3G |
| **Conversion & Funnel** | C (55) | A+ (90+) | 100% guided onboarding, post-first-action activation on every action, social proof at every funnel stage, A/B optimized CTAs, < 3 steps to first value |
| **Security & Auth** | D (45) | A (90+) | 0 unauthenticated endpoints, CSP enforced, CSRF on every mutation, rate limiting on all routes, Stripe webhooks verified, no hardcoded secrets |
| **Marketing & Outreach** | B- (65) | A (92+) | Referral flywheel driving 20%+ new users, 5+ case studies, Instagram automation, retargeting campaigns, HARO/PR coverage, drip sequences live |
| **Performance & Arch** | C (55) | A (90+) | Lighthouse 95+, Core Web Vitals green, 100% next/image, Cache-Control on all APIs, CDN for images, server components on static pages |
| **Legal & Compliance** | D (40) | B+ (82+) | GDPR self-service endpoints, tax/1099 handling, cookie banner granular, COPPA compliant, Privacy Policy complete, arbitration clause |
| **Analytics & Data** | D- (30) | A (90+) | Cohort retention, conversion funnel, business dashboard (MRR/ARPU/CAC), A/B testing with significance, real-time monitoring alerts |
| **Testing & Code Quality** | F (20) | A (92+) | 200+ tests, 80%+ coverage, CI/CD blocking gates, 0 `:any`, 0 `console.log`, single auth pattern, Zod on all routes |
| **Market Positioning** | B (78) | A+ (94+) | /pricing page, /compare page, tiered plans, landing pages per persona, Product Hunt launch, Hacker News front page candidate |

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

### Why referral milestones (not flat 5%)
Variable rewards (Robinhood model) drive higher engagement than fixed percentages. Tiers at 1/3/5/10/25 create a progression loop — users are motivated to reach the next tier. Milestone bonuses are surprise-delivered to maximize dopamine.

### Why share buttons over copy-only
Dropbox's referral success came from one-click frictionless sharing. Copy-only adds a barrier. On mobile, `navigator.share()` opens the OS share sheet (WhatsApp, Messages, email, any installed app). On desktop, Twitter + WhatsApp cover the two most common sharing surfaces. The copy link is a fallback.

### Why WebSocket over SSE polling
Current SSE polling for messages works at low volume but won't scale. WebSocket provides bidirectional, typed event channels (message, submission, payout, notification) over a single persistent connection. Room-based subscriptions (user-scoped) keep it efficient. Implementation: `ws` server in Next.js API route, or a lightweight external service like `socket.io` behind Railway.

### Why fraud detection first (before acquisition)
A single fraudulent payout erodes trust completely. Artists deposit money based on our promise of verified views. If that verification is exploitable, the platform collapses. The fraud detection pipeline cross-references view counts from TikTok, Instagram, and YouTube APIs, flags anomalous spikes (>3σ from mean), and holds payouts for manual review.

### Why artist-wide donations (not per-campaign)
Donations fund the artist, not a specific campaign. A fan discovers an artist through any page — artist profile, track page, browse — and donates to the artist. The funds go into a shared promotion pool the artist controls. They can allocate it across tracks or withdraw it. This simplifies the mental model: "I support this artist" not "I support this specific promotion."

### Why no "draft" status
Every track on the platform is either available or not. There's no intermediate "draft" state. If a track is discovered (via Spotify, YouTube, Bandcamp enrichment) or manually added, it's immediately visible with:
- A donate button (fans can support the artist)
- A submit CTA (creators can make content)
- Full SEO (MusicRecording schema, open graph, sitemap)
The CPM and budget are optional — they show if the artist has set them, but their absence doesn't hide the track or disable participation.

### Why submissions without budget
Creators can submit videos to any track, even unfunded ones. The difference: without a budget, the submission won't generate earnings. The track page clearly shows the budget status so creators know whether a track is funded before they invest time making content. This maximizes content creation (more tracks = more submissions) while maintaining transparency about earnings.

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
