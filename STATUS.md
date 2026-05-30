# Selah.fm — Status & Reference
**Version:** 2.1 · **Live:** https://selah.fm · **Updated:** 2026-05-30

---

## Current State (May 2026)

| Area | Status |
|------|--------|
| Auth | Supabase Auth (Google OAuth + email/password) |
| Database | Supabase PostgreSQL (27 tables, 1,800+ artists) |
| Outreach | Automated email pipeline (Resend, 100 emails/day, artist + creator) |
| Campaigns | 2,561 auto-generated campaigns (Bandcamp + Reddit + YouTube) |
| Engagement | Onboarding flow, welcome email sequence, re-engagement cron |
| Fee model | 20% added on artist CPM, creators earn full CPM |
| Email verification | MX record check + disposable domain filter + Resend webhook |
| Streaming links | Spotify/Apple Music/YouTube links on every campaign page |
| Homepage | Server-rendered stats (1.2K active campaigns, 6 creators) |

---

## Pipeline Status

| Table | Rows | Notes |
|-------|------|-------|
| discovered_artists | 2,095 | Multi-channel: Bandcamp + Reddit + YouTube |
| artist_audits | 3,192 | Email scraping (Bandcamp, Instagram, SoundCloud, Twitter/X, Google) |
| campaigns | 2,562 | 2,561 unclaimed, 1 claimed (auto-generated) |
| campaign_claims | 2,561 | UUID claim codes, 0 user-claimed |
| outreach_log (email) | 331 | Sent via Resend, bounce-tracked via webhook |
| creator_outreach_log | 13 | Creator emails sent |
| verified emails | 71 | Verified emails on artist pages |
| discovered_creators | 20 | TikTok scraping + Reddit creator discovery |
| submissions | 3 | Test submissions (pending review) |
| users | 10 | 9 creators, 0 active |

**Cron schedule (all times UTC):**
- Pipeline (discover→audit→campaign): every 3h (0,3,6,9,12,15,18,21) — 8x/day
- Artist email outreach: 4x/day (3,9,15,21)
- Creator discovery: 4x/day (5,11,17,23) — TikTok + Reddit
- Creator email outreach: 4x/day (6,12,18,0)
- Welcome email sequence: daily 09:00
- Re-engagement: daily 11:00
- Re-audit emails: daily 22:00
- Follow-up: daily 10:00
- Blog publish: daily 10:00

**Email channel:** Resend (100/day free tier, 50 per run)
**Pipeline defaults:** 50 discovery, 80 audit, 30 campaigns per run

---

## Key Architecture Decisions

- **Supabase Auth** — Google OAuth + email/password, HMAC cookies removed
- **Direct pg Pool** — `lib/db.ts` connects to Supabase PostgreSQL via pooler
- **Email-first outreach** — Resend for delivery, DeepSeek V3 for content
- **Artist-side fee** — 20% added on top of CPM, creators earn 100%
- **Email confidence scoring** — verified/high/medium, all three tiers auto-send (MX-verified pre-send)
- **Pre-send verification** — MX record + disposable domain + syntax check
- **Bounce tracking** — Resend webhook → auto-blocks bounced addresses
- **Bandcamp subdomain → email** — Scraped from page text, websites, Instagram, SoundCloud, Twitter/X, Google
- **Streaming links** — Spotify API + Apple Music iTunes API → direct links
- **Server-rendered homepage** — Stats and campaign grid from DB (no JS needed)
- **`n` artifact fix** — Bandcamp HTML artifact stripping from scraped emails

---

## Key Files

| File | Purpose |
|------|---------|
| `app/c/[id]/page.tsx` | Campaign detail — metadata, JSON-LD, server component, streaming links |
| `app/c/[id]/CampaignDetailClient.tsx` | Campaign page client — hero, CTAs, how-to, donations, listen links |
| `components/HomePageClient.tsx` | Homepage — hero, campaigns grid, problem/solution, testimonials |
| `app/api/admin/outreach/route.ts` | All outreach actions (discover, audit, create_campaign, email, reaudit, enrich) |
| `app/api/cron/outreach-pipeline/route.ts` | Autonomous pipeline (discover → audit → campaign → enrich) |
| `app/api/cron/email-outreach/route.ts` | Email sending cron (3 per run, verification, audience sync) |
| `lib/outreach.ts` | Artist audit + email scraping + AI outreach messages |
| `lib/discovery.ts` | Multi-channel discovery (Bandcamp API + Reddit + YouTube) |
| `lib/email-outreach.ts` | Email generation (DeepSeek + template) + Resend sending + audience sync |
| `lib/email-verify.ts` | MX record check + disposable domain + syntax validation |
| `lib/streaming-links.ts` | Spotify/Apple Music API search → exact track links |
| `lib/fees.ts` | Fee calculations (20% artist-side, 100% creator) |
| `lib/supabase/server.ts` | Supabase server client + getUser/isAdmin |
| `lib/supabase/middleware.ts` | Session refresh middleware |
| `lib/supabase/client.ts` | Browser client for client components |
| `app/auth/callback/route.ts` | OAuth code exchange + new user → onboarding redirect |
| `app/onboarding/page.tsx` | Role selection + profile setup (artist/creator flow) |
| `app/api/auth/me/route.ts` | Session + profile GET/PATCH, triggers welcome email #1 |
| `app/api/me/action/route.ts` | Record user action (claim, submit) for re-engagement |
| `app/api/cron/welcome-sequence/route.ts` | Welcome email #2-3 sequence (day 2, day 5) |
| `app/api/cron/reengage/route.ts` | Re-engagement emails for dormant users (3+ days) |
| `components/OnboardingBanner.tsx` | Browse page banner for non-onboarded users |
| `components/ActionTracker.tsx` | Dashboard progress tracker (onboard→create→submit→earn) |
| `lib/engagement.ts` | Welcome emails, re-engagement, action tracking |
| `app/api/cron/creator-discovery/route.ts` | Creator discovery (TikTok Puppeteer → HTTP → Reddit) |
| `lib/creator-discovery.ts` | TikTok + Reddit creator discovery (Puppeteer + HTTP) |
| `app/api/webhooks/resend/route.ts` | Resend bounce/complaint webhook handler |

---

## Important Rules

- **CPM source of truth:** `campaign.cpm_rate_cents` — never hardcode
- **Creator earnings:** Full CPM, no deduction (fee is artist-side `CPM × 1.20`)
- **Email sending:** Only verified-confidence emails, MX check pre-send
- **Campaign count:** `campaign_claims` table (cumulative)
- **OG images:** Root layout must NOT set `openGraph.images`
- **Image fallback:** DB binary → external URL → `/images/og-image.jpg`
- **Session cookies:** Supabase manages via `@supabase/ssr`
- **TypeScript:** `npx tsc --noEmit` must pass with zero errors before commit
