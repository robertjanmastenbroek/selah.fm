# Selah.fm — Status & Reference
**Version:** 3.0 · **Live:** https://selah.fm · **Updated:** 2026-06-01

---

## Current State (June 2026)

| Area | Status |
|------|--------|
| Auth | Supabase Auth (Google OAuth), redirect bug fixed, avatar saved on login |
| Database | Supabase PostgreSQL (29+ tables, 2,100+ artists) |
| Outreach | Cron dispatcher → 10 workers, 100 emails/day target, Resend delivery |
| Campaigns | 2,564 campaigns (2,563 unclaimed, 1 claimed) |
| Engagement | Onboarding flow, welcome/re-engage sequence, action tracker |
| Fee model | 20% added on artist CPM, creators earn full CPM + Stripe Connect payouts |
| Email verification | MX record + disposable domain filter + pre-send check |
| Blog/SEO | 19 posts (13 published, 6 scheduled), 2/day auto-generation |
| Stripe Payouts | Connect Express setup, auto-payout on approval, webhook tracking |
| Free SEO tools | Playlist Analyzer, CPM Calculator, Creator Earnings, Budget Planner |
| Submissions | 24 total (2 approved, 22 rejected), URL dedup active |
| Users | 11 signups, 11 onboarded |
| Analytics | Admin view shows all submissions, user view shows own |

---

## Pipeline Status

| Table | Rows | Notes |
|-------|------|-------|
| discovered_artists | 2,095 | Multi-channel: Bandcamp + Reddit + YouTube |
| artist_audits | 3,192 | Email scraping (Bandcamp, Instagram, SoundCloud, Twitter/X, Google) |
| campaigns | 2,564 | Auto-generated, 1 claimed |
| campaign_claims | 2,561 | UUID claim codes |
| outreach_log (email) | 333 | Sent via Resend, 0 bounces today |
| creator_outreach_log | 13 | Creator emails sent |
| verified emails | 83 | Bandcamp text (71), SoundCloud (8), Twitter (4) |
| discovered_creators | 20 | TikTok scraping + Reddit creator discovery |
| submissions | 24 | 2 approved ($2.08 total), 22 rejected (duplicates) |
| blog_posts | 19 | 13 published, 6 scheduled, 2/day generation |
| users | 11 | 11 onboarded, 1 Stripe account connected |

**Cron Schedule (dispatcher at 0 * * * *)**

| UTC Hour | Workers |
|----------|---------|
| 00 | Pipeline + Creator-outreach |
| 03 | Email-outreach |
| 05 | Creator-discovery |
| 06 | Pipeline |
| 08 | Blog-pipeline (source → interview → answer → 2 posts → schedule) |
| 09 | Email-outreach + Welcome-sequence |
| 10 | Blog-publish + Follow-up |
| 11 | Creator-outreach + Re-engage |
| 12 | Pipeline |
| 15 | Email-outreach |
| 17 | Creator-discovery |
| 18 | Pipeline |
| 21 | Email-outreach |
| 22 | Re-audit emails |
| 23 | Creator-outreach |

---

## Blog Generation System

| Component | Status |
|-----------|--------|
| Pipeline | Source questions → generate interviews → AI answer → 2 posts → schedule |
| Quality | Multi-pass self-critique, anti-detection guardrails, founder source-of-truth |
| Anti-fabrication | 50 verified founder Q&A in `lib/founder-answers.json` — AI draws from real answers |
| SEO | FAQ schema (JSON-LD), internal linking engine, author E-E-A-T page, meta descriptions |
| Formatting | Auto markdown→HTML conversion (headings, bold, lists, dividers) |
| Slugs | Title-based, never `post-[timestamp]` |

---

## Stripe Payout System

| Component | Status |
|-----------|--------|
| Onboarding | `POST /api/stripe/connect` — creates Express account + onboarding link |
| Payout API | `POST /api/stripe/payout` — creates transfer to creator account |
| Webhook | `POST /api/webhooks/stripe` — account.updated + transfer.created |
| Auto-email | Fires when payout deferred (missing Stripe) — links to /earnings |
| Review UI | Shows `payout_note` on approval (processing/deferred/reason) |
| DB columns | `users.stripe_account_id`, `users.stripe_onboarding_complete`, `submissions.payout_status`, `submissions.stripe_transfer_id` |

---

## SEO Tools (Free, Public)

| Tool | URL | Description |
|------|-----|-------------|
| CPM Calculator | `/tools/cpm-calculator` | Compare platform CPM rates, interactive calculator |
| Creator Earnings | `/tools/creator-earnings` | Monthly earnings estimator for short-form creators |
| Promotion Budget | `/tools/promotion-budget` | Budget-to-views planner with industry context |
| Playlist Analyzer | `/tools/playlist-analyzer` | Spotify bot detection — name, owner, tracks, followers, popularity |

---

## Key Files

| File | Purpose |
|------|---------|
| `app/c/[id]/page.tsx` | Campaign detail — metadata, JSON-LD, canonical slug |
| `components/HomePageClient.tsx` | Homepage — hero, campaigns grid, live stats |
| `app/api/admin/outreach/route.ts` | All outreach actions (discover, audit, campaign, email, reaudit) |
| `app/api/cron/dispatcher/route.ts` | Single Railway cron entry → routes to 10 workers |
| `app/api/cron/blog-pipeline/route.ts` | Blog automation: source → interview → answer → post → schedule → link |
| `app/api/cron/blog-publish/route.ts` | Publishes scheduled posts + auto-tweets |
| `app/api/cron/email-outreach/route.ts` | Artist email sending (MX-verified, 50/run) |
| `app/api/cron/creator-outreach/route.ts` | Creator email sending (13/run) |
| `app/api/cron/creator-discovery/route.ts` | TikTok/Reddit creator discovery |
| `lib/blog-engine.ts` | DeepSeek article generation, founder answers, anti-detection |
| `lib/founder-answers.json` | 50 verified Q&A — source of truth for all AI content |
| `lib/outreach.ts` | Artist audit + email scraping + AI messages |
| `lib/discovery.ts` | Multi-channel discovery (Bandcamp API + Reddit + YouTube) |
| `lib/url-normalize.ts` | URL dedup — normalizes short links, strips tracking params |
| `app/api/review/route.ts` | Review submissions, auto-payout trigger, Stripe reminder email |
| `app/api/stripe/connect/route.ts` | Stripe Connect Express onboarding |
| `app/api/stripe/payout/route.ts` | Stripe transfer execution |
| `app/api/webhooks/stripe/route.ts` | Stripe Connect webhooks |
| `app/earnings/page.tsx` | Creator earnings dashboard + Stripe Connect button |
| `app/about/page.tsx` | Author E-E-A-T page — full founder bio with credentials |
| `app/blog/[slug]/page.tsx` | Blog post page — FAQ schema, related posts, Article JSON-LD |
| `app/tools/playlist-analyzer/page.tsx` | Spotify playlist analyzer UI |
| `app/tools/[slug]/page.tsx` | Free SEO tool pages |
| `components/ToolCalculators.tsx` | CPM, earnings, and budget calculators |
| `railway.json` | Single cron entry at `0 * * * *` pointing to dispatcher |

---

## Important Rules

- **CPM source of truth:** `campaign.cpm_rate_cents` — never hardcode
- **Creator earnings:** Full CPM, no deduction (fee is artist-side `CPM × 1.20`)
- **Email sending:** Verified/high/medium confidence, MX check pre-send
- **Campaign count:** Homepage uses `campaign_claims` table (cumulative)
- **OG images:** Root layout must NOT set `openGraph.images`
- **Blog fabrication:** AI draws from `lib/founder-answers.json` — no invented details
- **Blog year:** Always current year, never hardcoded
- **Blog slugs:** Title-based via `slugify()` — never `post-` prefix
- **Blog formatting:** All content passes through `cleanMarkdown()` before saving
- **URL dedup:** `extractVideoId()` + `normalizeUrl()` before submission insert
- **Image fallback:** DB binary → external URL → `/images/og-image.jpg`
- **Session cookies:** Supabase manages via `@supabase/ssr`
- **TypeScript:** `npx tsc --noEmit` must pass with zero errors before commit
- **Cron:** Single dispatcher entry at `0 * * * *` — Railway doesn't support `*/N` or comma-separated

---

## Changelog (May 31 – June 1 Session)

### Outreach & Automation
- Fixed Railway cron: single dispatcher entry replacing 21 broken entries
- Expanded email confidence gate: verified → verified+high+medium
- Re-audit emails cron at 22:00 UTC for Google-sourced emails

### User Engagement
- Auth callback redirect fix (no longer drops session cookies)
- Google OAuth avatar saved to `users.profile_image_url`
- OnboardingBanner on browse for non-onboarded users
- Backfilled `onboarded_at` for all 10 existing users
- 5 re-engagement emails sent to dormant users

### Review & Submissions
- URL normalization + dedup: blocks same-video variants, short URLs, tracking params
- Review page: AnimatePresence with popLayout, no scroll jumping
- Approve/Reject buttons: loading spinners, disabled during action
- Auto-reject duplicates on approve
- Fixed `rejection_feedback` → `rejection_reason` column name
- Analytics: admins see all 24 submissions (was 3)

### Blog & SEO
- Complete blog pipeline built and verified (14 iterations to fix)
- 2 posts/day auto-generation with FAQ schema + internal linking
- Multi-pass self-critique for AI detection avoidance
- Founder source-of-truth: 50 Q&A wired into generation
- Anti-fabrication: real CPM data, current year, no invented numbers
- SEO backfill: FAQ, schema, meta, internal links on all 14 posts
- Author E-E-A-T page at /about
- 6 auth pages noindex via layout.tsx
- Campaign canonical URLs using slugs (fixes 31 duplicate warnings)
- Sitemap: 543 URLs with blog posts + free tools
- Markdown→HTML auto-conversion (headings, bold, lists, dividers)
- Ugly slug prevention (`post-[timestamp]` → title-based)

### Tools & Calculators
- Spotify Playlist Analyzer v2: full data extraction from embedded state
- Promotion Budget calculator: fixed math ($10 = 100,000 views, not 100)
- Creator Earnings: YouTube Shorts CPM $0.05 (was long-form $2.50)
- All 4 tools at /tools/* verified HTTP 200

### Stripe Payout System
- Connect Express onboarding API + webhook
- Auto-payout on approval + Stripe reminder email
- Migrated old `stripe_connect_id` → `stripe_account_id`
- DB columns: payout_status, stripe_transfer_id
- Earnings page: Set up payouts button + status display

### Record Deal Age
- Corrected from 17 to 21 across all 4 references in codebase
