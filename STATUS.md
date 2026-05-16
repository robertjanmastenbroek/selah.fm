# Selah.fm — Status & Reference
**Version:** 2.0 · **Live:** https://selah.fm · **Updated:** 2026-05-16

---

## Current State (May 2026)

| Area | Status |
|------|--------|
| Auth | Supabase Auth (Google OAuth + email/password) |
| Database | Supabase PostgreSQL (27 tables, 1,800+ artists) |
| Outreach | Automated email pipeline (Resend, 100 emails/day capacity) |
| Campaigns | 1,238 active campaigns (auto-generated from Bandcamp) |
| Fee model | 20% added on artist CPM, creators earn full CPM |
| Email verification | MX record check + disposable domain filter + Resend webhook |
| Streaming links | Spotify/Apple Music/YouTube links on every campaign page |
| Homepage | Server-rendered stats (1.2K active campaigns, 6 creators) |

---

## Pipeline Status

| Table | Rows | Notes |
|-------|------|-------|
| discovered_artists | 1,877 | Multi-channel: Bandcamp (14 genres, 5 pages) + Reddit + YouTube |
| artist_audits | 3,192 | Email scraping (Bandcamp, Instagram, SoundCloud, Twitter/X, Google) |
| campaigns (active) | 1,238 | All auto-generated, unclaimed |
| campaign_claims | 708 | UUID claim codes |
| outreach_log (email) | 111 | Sent via Resend, bounce-tracked via webhook |
| verified emails | 67 | Real emails found on artist pages (2% hit rate) |

**Cron schedule:** Pipeline every 30 min, Email every 30 min (offset 5 min)
**Email channel:** Resend (100/day free tier, 3 per run × 48 runs)
**Pipeline defaults:** 100 discovery, 200 audit, 50 campaigns per run

---

## Key Architecture Decisions

- **Supabase Auth** — Google OAuth + email/password, HMAC cookies removed
- **Direct pg Pool** — `lib/db.ts` connects to Supabase PostgreSQL via pooler
- **Email-first outreach** — Resend for delivery, DeepSeek V3 for content
- **Artist-side fee** — 20% added on top of CPM, creators earn 100%
- **Email confidence scoring** — verified/high/medium/low/guess, only verified auto-send
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
| `app/auth/callback/route.ts` | OAuth code exchange (x-forwarded-host for Railway) |
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
