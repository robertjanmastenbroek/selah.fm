# Selah.fm — Living Document

**Last updated:** 2026-06-05 (deep-dive audit + blind spots added)
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
- Unit tests: **None** — no Jest/Vitest/RTL configured across 57 lib files, 56 components, 41 API routes
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

## Roadmap

### Current Phase: Trust & Retention (June 5–12)

The platform needs to earn user trust before acquisition spend makes sense. These items make the existing experience sticky and trustworthy.

| Priority | Item | Effort | Impact | Why now |
|----------|------|--------|--------|---------|
| P0 | **Real-time notifications via WebSocket** | ~4h | 🔥 Prevents missed messages, drives re-engagement | Users return when they get notified |
| P0 | **Automated view fraud detection** | ~3h | 🔥 Protects artist budget, builds trust | Artists won't deposit without fraud protection |
| P1 | **Creator analytics dashboard** | ~6h | 📊 Shows earnings breakdown, top tracks, view trends | Keeps creators engaged, shows progress |
| P1 | **Artist auto-suggested CPM** | ~2h | 🤖 Recommends optimal CPM based on budget & track | Removes friction for new artists |
| P1 | **Dispute resolution system** | ~3h | ⚖️ Structured appeals, admin moderation, history | Trust requires a fair process |

### Phase 2: Growth Engines (June 12–26)

Once trust infrastructure is solid, ignite acquisition loops.

| Priority | Item | Effort | Impact | Why now |
|----------|------|--------|--------|---------|
| P0 | **Mobile PWA upgrade + push notifications** | ~8h | 📱 Service worker push, install prompt, deep links | 60%+ of creator traffic is mobile |
| P0 | **Algorithmic trending feed** | ~5h | 🎯 Personalized recommendations, trending, "hot" | Discovery drives engagement |
| P1 | **Community challenges + leaderboards** | ~6h | 🏆 Weekly challenges, seasonal leaderboards, badges | Creates stickiness and content |
| P1 | **Onboarding with referral nudge** | ~3h | 🔗 Prompt to share after first deposit/submission | Capitalizes on enthusiasm moment |
| P1 | **Instagram content automation** | ~2h | 📸 Blog → IG carousel cron | Expands reach to visual platform |
| P2 | **Referral in bio links (`/r/[code]`)** | ~30m | 🔗 Short redirect links for artist/creator bios | Makes sharing frictionless |

### Phase 3: Scale Infrastructure (June 26 – July 10)

Before pouring fuel on the fire, make sure the house won't burn down.

| Priority | Item | Effort | Impact | Why now |
|----------|------|--------|--------|---------|
| P0 | **Multi-currency / international** | ~10h | 🌍 Stripe Connect multi-currency, locale detection, i18n framework | Unlocks global creator market |
| P1 | **Performance optimization** | ~6h | ⚡ Lighthouse 90+, Core Web Vitals, image optimization, code splitting | SEO ranking factor, user retention |
| P1 | **Monitoring + APM** | ~4h | 📈 Sentry error tracking, business metrics dashboard, uptime monitoring | Know when things break before users do |
| P2 | **Email drip sequences** | ~4h | 📧 Behavior-triggered onboarding, re-engagement, milestone celebration | Automates user retention |
| P2 | **A/B testing infrastructure** | ~4h | 🧪 Feature flags, experiment framework, statistical significance | Data-driven decisions |

### Phase 4: Platform Moat (July 10+)

Defensible advantages that make switching costly and the platform genuinely world-class.

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| P0 | **Native mobile app (React Native)** | ~40h | 📱 Full iOS + Android native experience |
| P1 | **Artist auto-campaign management** | ~6h | 🤖 Auto-adjust CPM, auto-top-up budget, smart allocation |
| P1 | **Creator growth recommendations engine** | ~8h | 🧠 Personalized tips: "TikTok videos perform 3× better", trending styles |
| P2 | **Public API platform** | ~10h | 🔌 REST + GraphQL API for third-party integrations, developer docs |
| P2 | **Content moderation system** | ~5h | 🛡️ Automated content flagging, human review queue, appeals |
| P3 | **Virtual events + live streaming** | ~12h | 🎥 Artist-hosted listening parties, creator meetups, AMAs |

### Immediate Execution Plan (This Week)

**Must fix from deep-dive audit (P0 blind spots):**
1. **🔴 Admin auth** — add `isAdminRequest()` to `admin/user-flows`, `admin/emails`, `admin/email-stats`, `admin/backfill-audience`
2. **🔴 CSRF protection** — add `Origin`/`Referer` header validation in middleware
3. **🔴 Email onboarding fix** — persist redirect through `/verify` callback so email signups land on `/onboarding`
4. **🔴 Post-first-action activation** — add "What's next?" CTA on submission/campaign success screen
5. **🔴 GDPR data endpoints** — build `/api/me/export` (JSON dump) and `/api/me/delete` (soft-delete + anonymize)
6. **🔴 Tax/1099 setup** — add `business_type` and `tax_id` collection to Stripe Connect onboarding
7. **🔴 Test framework setup** — install Vitest + React Testing Library, configure test scripts
8. **🔴 E2E staging target** — switch Playwright `baseURL` to local dev server or add `.env.test`
9. **🔴 fees.ts tests** — add property-based tests for `calculatePayout`, `grossDeposit`, `stripeCharge`

**Already planned roadmap items (continue in parallel):**
10. **WebSocket notification service** — single shared connection, typed events for messages, submissions, payouts
11. **Fraud detection pipeline** — cross-reference view counts from 3 platforms, flag anomalies, hold suspicious payouts
12. **Creator analytics** — new `/dashboard?tab=analytics` tab with earnings breakdown, view trends, performance by platform
13. **Artist auto-CPM** — `lib/cpm-suggest.ts` that recommends CPM based on campaign budget, track popularity, genre average
14. **Dispute UI** — dispute form, admin review queue, status tracking, resolution notification

### Signals That Change Priorities

| Signal | Action |
|--------|--------|
| Page views hit 1,000/week | Accelerate Phase 2 (algorithmic feed, Instagram automation) |
| Users hit 50 | Launch referral flywheel, ramp creator outreach 2× |
| Deposits hit $200/month | Prioritize multi-currency (Phase 3), Instagram automation |
| Paid artists hit 10 | Case study content, testimonial pipeline, PR outreach |
| Bounce rate > 70% | Prioritize PWA + performance (Phase 3) |
| Fraud attempt detected | Escalate fraud detection to P0, build escrow system |

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
