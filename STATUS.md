# Selah.fm — Status & Reference
**Last updated:** 2026-05-11 · **Version:** 36
**Live:** https://selah.fm · **Admin:** https://selah.fm/admin

---

## V1.0 Launch Readiness — 98% Complete

All core features are built, tested, and deployed. Two items remain before full launch confidence.

### Core Value Loop (7/7) ✅

| Step | Status |
|------|:------:|
| Artist creates campaign with budget | ✅ |
| Artist deposits via Stripe Elements (on-platform) | ✅ |
| Creator discovers campaign + submits video link | ✅ |
| Artist reviews video + approves (with undo) | ✅ |
| Views verified, creator paid via Stripe Connect | ✅ |
| Fans donate to campaign via crowdfunding | ✅ |
| Share + viral growth loop | ✅ |

### Platform Metrics

| Metric | Count |
|--------|-------|
| Pages | 28 |
| API routes | 45 |
| Components | 38 |
| E2E tests | 44/44 (100%) |
| TypeScript errors | 0 |
| Git commits | 290+ |

---

## Recent Work (Last 24h)

### UX Polish
- Campaign page redesigned to GoFundMe-inspired layout (hero full-viewport, CTA pinned to bottom, centered title)
- Horizontal progress bar removed globally — circle progress only (light→dark blue gradient)
- Browse cards simplified (no subtitle, no counts, no hashtags, no buttons — full-card clickable)
- Sticky bottom bar permanently dismissed after scrolling past More Campaigns
- Share modal rewritten with official brand SVG logos (WhatsApp, Facebook, X, Instagram, Email, Copy Link)

### Bugs Fixed
- Google OAuth login broken — `type` vs `user_type` column mismatch across 3 auth routes (oauth/google, login, signup)
- Google OAuth redirects using internal proxy URL instead of public domain
- SupportWidget removed from global layout

### SEO
- Campaign pages: full OG/Twitter metadata + JSON-LD `MusicPlaylist` schema with pricing
- Browse page: OG/Twitter metadata
- Creator/Artist profiles: dynamic `layout.tsx` with `Person` JSON-LD schema
- Sitemap includes dynamic routes (campaigns, artists, creators)

### New Features
- Admin emails page (`/admin/emails`) with compose form + email log
- Auth middleware protecting all auth-required routes
- Profile picture upload + Google OAuth auto-import on re-login

---

## Remaining Work — Priority Ordered

### 🔴 Before Public Launch

| # | Task | Effort |
|---|------|--------|
| 1 | **Stripe: switch to live keys** — replace `sk_test_`, `pk_test_`, `whsec_test_` with live equivalents, verify webhook signing secret matches Stripe dashboard | 30 min |
| 2 | **Run migrations on production** — `GET /api/admin/migrate` to apply any pending schema changes | 5 min |
| 3 | **Set production env vars** — `RESEND_API_KEY`, `DEEPSEEK_API_KEY`, `CRON_SECRET`, `RESEND_AUDIENCE_ID` | 10 min |
| 4 | **Test full payment flow** — deposit via Stripe (live), donation, payout via Connect | 30 min |

### 🟡 Nice-to-Have Before Launch

| # | Task | Effort |
|---|------|--------|
| 5 | **Landing page SEO polish** — the root page is `'use client'` so it lacks server-side metadata; add a `layout.tsx` or convert to server component with metadata | 30 min |
| 6 | **Error page polish** — the custom 404 page exists but could be more helpful (friendly illustration, back button, suggested links) | 20 min |
| 7 | **Rate limiting on auth endpoints** — login and signup have rate limiting; verify it's enabled on forgot-password and reset-password too | 15 min |
| 8 | **Email verification enforcement** — signup sends verification email but login doesn't check `email_verified` flag; add warning on unverified login | 20 min |

### 🟢 Post-Launch Iteration

| # | Task | Effort |
|---|------|--------|
| 9 | **Creator dashboard analytics** — the `/analytics` page exists but could show richer data (trends, platform breakdown charts) | 2h |
| 10 | **Artist Spotify integration** — `/api/campaigns/[id]/spotify` exists but only returns monthly listeners; could show top tracks, related artists | 1h |
| 11 | **View verification automation** — TikTok oEmbed works for public videos; YouTube Data API v3 for auto-verification; add Instagram API when available | 3h |
| 12 | **Email campaigns** — use Resend audience to send onboarding drip, weekly digest, campaign performance reports | 4h |
| 13 | **A/B testing framework** — add Vercel Analytics or PostHog for conversion funnel tracking | 2h |
| 14 | **Mobile app** — PWA wrapper with push notifications via Firebase | 8h |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    selah.fm (Next.js 14)                 │
├─────────────────────────────────────────────────────────┤
│  Pages (28)           API Routes (45)     Components (38)│
│  ├─ / (landing)       ├─ /api/auth/*      ├─ TopNav      │
│  ├─ /browse           ├─ /api/campaigns/* ├─ BottomNav   │
│  ├─ /c/[id]           ├─ /api/submissions ├─ CampaignCover│
│  ├─ /c/[id]/donate    ├─ /api/stripe/*    ├─ ShareModal   │
│  ├─ /artists/[id]     ├─ /api/artists/*   ├─ StripeModal  │
│  ├─ /creators/[id]    ├─ /api/creators/*  ├─ Submissions  │
│  ├─ /dashboard        ├─ /api/earnings    ├─ Toast        │
│  ├─ /review           ├─ /api/analytics   ├─ Chat         │
│  ├─ /earnings         ├─ /api/messages    ├─ Messages     │
│  ├─ /settings         ├─ /api/notifications├─ CreatorAvatar│
│  ├─ /analytics        ├─ /api/support     ├─ RatingPrompt │
│  ├─ /onboarding       ├─ /api/bugs        ├─ ImageUpload  │
│  ├─ /login            ├─ /api/referral    ├─ CampaignSearch│
│  ├─ /faq              ├─ /api/admin/*     ├─ PaymentModal  │
│  ├─ /welcome-artists  ├─ /api/oauth/*     ├─ ErrorBoundary│
│  ├─ /welcome-creators ├─ /api/connect/*   ├─ PageTransition│
│  ├─ /open-source      ├─ /api/cron        └─ ...          │
│  ├─ /privacy          ├─ /api/stats       │
│  ├─ /tos              ├─ /api/health      │
│  ├─ /content-guidelines├─ /api/ratings    │
│  ├─ /report-bug       ├─ /api/spotify     │
│  ├─ /admin (overview, │ └─ /api/sitemap    │
│  │   users, emails,   │                    │
│  │   manage, seed)    │                    │
│  └─ /404              │                    │
├─────────────────────────────────────────────────────────┤
│  Database (PostgreSQL/Neon)        External Services     │
│  ├─ users                         ├─ Stripe (payments)   │
│  ├─ campaigns                     ├─ Resend (email)      │
│  ├─ submissions                   ├─ Google OAuth        │
│  ├─ view_snapshots                ├─ YouTube Data API    │
│  ├─ payouts                       ├─ TikTok oEmbed       │
│  ├─ notifications                 ├─ Spotify Web API     │
│  ├─ messages                      ├─ DeepSeek API (AI)   │
│  ├─ referrals                     ├─ Google Analytics    │
│  ├─ bugs                          └─ Railway (hosting)   │
│  ├─ email_logs                    │
│  ├─ ratings                       │
│  └─ campaign_stats (view)         │
└─────────────────────────────────────────────────────────┘
```

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0A0A0A` | Page background |
| Surface | `bg-white/[0.03]` | Cards, modals |
| Border | `border-white/[0.06]` | Subtle separation |
| Primary | `#5B7FFF` (light blue) | CTAs, active states |
| Accent | `#1E3A8A` (deep navy) | DONATE button, brand elements |
| Gradient | `#5B7FFF → #1E3A8A` | Circle progress (0%→100%) |
| Text | `#F0F0F0` | Primary text |
| Muted | `#8C8C8C` | Secondary text |
| Success | `#10B981` (emerald) | Confirmation, earnings |
| Error | `#EF4444` (red) | Validation, failures |
| Font | Inter | System font stack |
| Radius | `rounded-2xl` | Cards, modals |
| Animation | Framer Motion `spring(400,30)` | Sticky bars, modals |

---

## Testing

```bash
# Full E2E suite (44 tests) against production
node e2e/test.js

# Against local
TEST_URL=http://localhost:3000 node e2e/test.js

# TypeScript check
npx tsc --noEmit
```

All 44 tests pass. Coverage: landing page, browse, artists, creators, login/signup, auth redirects, campaign detail, 404, mobile breakpoints, sitemap, robots.txt, health check, stats API, accessibility (skip-to-content, main landmark).

---

## Config for Go-Live

| Pri | Task |
|-----|------|
| 🔴 | Switch Stripe to live: `sk_live_`, `pk_live_`, `whsec_` in Railway |
| 🔴 | Verify Stripe webhook endpoint in dashboard → `https://selah.fm/api/stripe/webhook` |
| 🟡 | Run `GET /api/admin/migrate` |
| 🟡 | Set `RESEND_API_KEY`, `DEEPSEEK_API_KEY` |
| 🟢 | Set `CRON_SECRET`, `RESEND_AUDIENCE_ID` |
| 🟢 | Verify Google OAuth redirect URIs in Cloud Console include `https://selah.fm/api/oauth/google` |
| 🟢 | Run `GET /api/admin/seed` for demo data (optional) |
