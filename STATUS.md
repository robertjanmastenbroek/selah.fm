# Selah.fm — Status & Reference
**Last updated:** 2026-05-10 · **Version:** 30
**Live:** https://selah.fm · **Admin:** https://selah.fm/admin

---

## Current Status

| Category | Status |
|----------|--------|
| Pages built | ✅ 28/28 |
| API routes live | ✅ 41/41 |
| E2E tests | ✅ 44/44 (100%) |
| Google OAuth | ✅ Live |
| YouTube view verification | ✅ Auto-verified |
| Google Analytics | ✅ 6 conversion events |
| Stripe payments | ⚠️ Test mode (needs `sk_live_` to go live) |
| Email delivery | ✅ Resend API configured (info@selah.fm, support@selah.fm) |
| Support AI | ✅ DeepSeek-powered chat widget (keyword fallback) |
| Spotify artist data | ⚠️ Not configured (shows fallback) |
| Social OAuth (TikTok/IG/YT/FB) | ⚠️ Infrastructure built, keys not set |
| CRON_SECRET | ⚠️ Not set |

---

## v30 Features (Current)

### Core Platform
- **28 pages** — Browse, artists, creators (server-rendered ISR), campaign detail with crowdfunding, dashboard with campaign wizard + editing, review with undo, earnings with Stripe Connect, analytics with live charts, settings, onboarding with localStorage persistence, login/signup (bcrypt + Google OAuth), FAQ (35 questions), content guidelines, report bug, terms, privacy, open source, 404, error pages
- **41 API routes** — Auth (login, signup, logout, me, Google OAuth), campaigns (CRUD + support + spotify), submissions, review (with undo), Stripe (checkout, webhook, Connect, payouts), earnings, stats, analytics, referral, creators, artists, messages, notifications, bugs, support (DeepSeek AI), admin (overview, users, campaigns, submissions, payouts, seed, migrate, manage, setup-webhook), cron, health, debug
- **Social links** — Instagram (@selahfm), TikTok (@selah.fm), X (@selah_fm), GitHub in global footer + landing page
- **Logo system** — 4 SVGs: favicon (32×32), icon mark (120×120), horizontal lockup (120×40), OG social image (1200×630)

### Security
- bcrypt password hashing (12 rounds)
- Stripe webhook signature verification enforced in all environments
- Rate limiting: auth (10/min), campaigns (5/min), submissions (10/min), review (30/min), Stripe checkout (10/min)
- Admin middleware with server-side session validation
- No credentials in git history (remediated credential leak in `fix-db.js`)

### Performance
- Shared SWR config with 30s dedup across all pages
- Preconnect hints for GTM, Analytics, OAuth, Stripe
- Cache-Control headers: 1yr immutable for `_next/static/*`, 1wk for images/fonts
- Font: Inter with `display:swap` + `preload`
- Grain texture via CSS `body::after` pseudo-element (0 DOM nodes)
- `loading="lazy"` on all below-fold images
- Page transitions with `prefers-reduced-motion` respect

### Polish
- Animated page transitions (AnimatePresence, 150ms crossfade)
- Micro-reward animations: breathe, pulseGlow, shimmer, ripple hook
- Accessibility: skip-to-content, aria-live region, `<main id="main-content">` landmark
- Error states: friendly illustrations, never blames user, never raw technical messages
- Empty states: illustrations with clear next-step CTAs on every page
- Onboarding: full localStorage persistence across refresh
- Campaign editing: inline form with all fields, budget auto-adjusts
- Campaign crowdfunding: fans donate via Stripe, supports Share button + supporter list
- Referrals: bonus fires on first deposit (10% split 50/50), not on signup
- Responsive: all pages work at 375px width, touch targets ≥ 44px

---

## Config Tasks for MVP Launch

| Priority | Task | How |
|----------|------|-----|
| 🔴 | Switch Stripe to live mode | Railway: `STRIPE_SECRET_KEY=sk_live_...`, `STRIPE_WEBHOOK_SECRET=whsec_...`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...` |
| 🟡 | Verify Resend DNS | Confirm TXT/DKIM records show green in resend.com/dashboard |
| 🟡 | Set CRON_SECRET | Railway: `CRON_SECRET=<random-string>` |
| 🟢 | Set Spotify API keys | Railway: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` (optional, for artist stats) |

---

## MVP Launch Checklist

### Pre-Launch (Zero Code Changes)
- [ ] Switch Stripe keys to live mode (above)
- [ ] Verify Resend email DNS is green
- [ ] Run `node e2e/test.js` and confirm 44/44
- [ ] Click through Manual Verification Gate below
- [ ] Create one test campaign with live Stripe → confirm webhook fires
- [ ] Sign up as creator → submit to test campaign → approve → confirm payout

### Manual Verification Gate
Click through on https://selah.fm:
- [ ] `/` — Landing page: hero, How It Works, Trust section, social links, GitHub
- [ ] `/login` — Signup form, Google button, referral banner
- [ ] `/onboarding` — 3 artist steps / 5 creator steps, localStorage persistence
- [ ] `/browse` — Campaign cards load, click → detail page, join/submit flow
- [ ] `/artists` — Cards, search, click → profile
- [ ] `/creators` — Cards, search, click → profile, Hire button
- [ ] `/c/[id]` — Campaign detail: cover, stats, budget bar, crowdfunding, share, FAQ
- [ ] `/dashboard` — Campaign list, stats, New wizard, Edit form, pause/resume, funding
- [ ] `/review` — Approve/reject submissions, undo support
- [ ] `/earnings` — Balance, Stripe Connect setup, submission history
- [ ] `/settings` — Profile, social handles, CPM rate
- [ ] `/analytics` — Platform breakdown, monthly chart, recent submissions
- [ ] `/faq` — 35 questions, accordion open/close
- [ ] `/content-guidelines` — All sections
- [ ] `/admin` — Admin access, overview stats, users, campaigns, submissions, payouts
- [ ] Mobile (375px) — All pages reflow without horizontal overflow
- [ ] Chat widget — Opens, sends message, receives AI response
- [ ] Notification bell — Badge, mark read
- [x] `node e2e/test.js` → 44/44 (100%)

### Post-Launch
- [ ] Monitor error rates for first 48 hours
- [ ] Watch for failed webhooks in Stripe Dashboard
- [ ] Review first 10 real signups manually
- [ ] Set up uptime monitoring (uptimerobot.com free tier)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (Railway) |
| Auth | Google OAuth + email/password (bcrypt + HMAC session cookies) |
| Payments | Stripe (Checkout + Connect + webhooks) |
| Email | Resend HTTP API (info@selah.fm, support@selah.fm) |
| AI Support | DeepSeek Chat API + keyword fallback |
| Analytics | Google Analytics (GTAG, 6 conversion events) |
| View Verification | YouTube Data API v3 + TikTok oEmbed |
| Artist Data | Spotify Web API (client credentials) |
| Deployment | Railway (auto-deploy on push to main) |
| Testing | Playwright E2E (44 scenarios, 100%) |

---

## Module Registry

```
selah.fm/
├── app/                        # Next.js App Router (28 pages + 41 API routes)
│   ├── admin/                  # Admin dashboard (6 pages)
│   │   ├── page.tsx            # Overview (platform stats)
│   │   ├── users/              # User management
│   │   ├── campaigns/          # Campaign management
│   │   ├── submissions/        # Submission management
│   │   ├── payouts/            # Payout management
│   │   └── seed/               # Seed demo data
│   ├── api/                    # REST API endpoints
│   │   ├── admin/              # Admin API (overview, users, manage, seed, migrate, setup-webhook)
│   │   ├── analytics/          # Creator analytics
│   │   ├── artists/            # Artist directory + profile
│   │   ├── auth/               # Auth (login, signup, logout, me)
│   │   ├── bugs/               # Bug reports
│   │   ├── campaigns/          # Campaign CRUD + support + spotify
│   │   ├── connect/            # Social OAuth callback
│   │   ├── creators/           # Creator directory + profile + hire
│   │   ├── cron/               # YouTube view auto-update
│   │   ├── debug/              # Debug endpoint
│   │   ├── earnings/           # Creator earnings
│   │   ├── health/             # Health check
│   │   ├── messages/           # Chat system
│   │   ├── notifications/      # User notifications
│   │   ├── oauth/              # Google OAuth callback
│   │   ├── referral/           # Referral system
│   │   ├── review/             # Artist review (approve/reject)
│   │   ├── stats/              # Platform stats
│   │   ├── stripe/             # Stripe checkout, webhook, payout, connect
│   │   ├── submissions/        # Submission create + list
│   │   ├── support/            # AI support chat (DeepSeek)
│   │   └── verify/             # View verification
│   ├── artists/                # Artist directory + profile
│   ├── browse/                 # Campaign discovery
│   ├── c/[id]/                 # Campaign detail
│   ├── content-guidelines/     # Content policy
│   ├── creators/               # Creator directory + profile
│   ├── dashboard/              # Campaign management
│   ├── earnings/               # Creator earnings
│   ├── faq/                    # FAQ (35 questions)
│   ├── login/                  # Login/signup
│   ├── onboarding/             # Wizard with localStorage
│   ├── open-source/            # Open source page
│   ├── privacy/                # Privacy policy
│   ├── report-bug/             # Bug report form
│   ├── review/                 # Artist review with undo
│   ├── settings/               # Profile settings
│   ├── tos/                    # Terms of service
│   ├── welcome-artists/        # Artist landing
│   ├── welcome-creators/       # Creator landing
│   ├── error.tsx               # Error boundary
│   ├── global-error.tsx        # Global error handler
│   ├── layout.tsx              # Root layout
│   ├── loading.tsx             # Loading state
│   ├── not-found.tsx           # Custom 404
│   └── page.tsx                # Landing page
├── components/                 # React components (34 files)
│   ├── TopNav.tsx              # Main navigation
│   ├── BottomNav.tsx           # Mobile bottom nav
│   ├── ChatWidget.tsx          # Chat/messaging
│   ├── MessageButton.tsx       # "Message" button
│   ├── NotificationBell.tsx    # Notification bell
│   ├── CampaignCover.tsx       # Campaign covers + gradients
│   ├── CampaignSearch.tsx      # Campaign filter
│   ├── CreatorAvatar.tsx       # Avatar component
│   ├── CreatorSubmissions.tsx  # Creator portfolio
│   ├── SocialIcons.tsx         # Platform icon SVGs
│   ├── ImageUpload.tsx         # Drag-and-drop upload
│   ├── ImageCropper.tsx        # Image crop tool
│   ├── ErrorBoundary.tsx       # React error boundary
│   ├── PageErrorBoundary.tsx   # Per-page error boundary
│   ├── PageTransition.tsx      # Animated route transitions
│   ├── Toast.tsx               # Toast notifications
│   ├── RippleButton.tsx        # Ripple effect button
│   ├── SupportWidget.tsx       # AI support chat bubble
│   ├── useRipple.ts            # Ripple micro-interaction hook
│   └── ui/                     # shadcn/ui primitives (12 components)
├── lib/                        # Shared utilities
│   ├── db.ts                   # PostgreSQL client
│   ├── db/                     # Schema, seeds, migrations
│   ├── auth.ts                 # Session management (HMAC)
│   ├── constants.ts            # Admin emails, platform constants
│   ├── swr-config.ts           # Shared SWR fetcher + config
│   ├── analytics.ts            # GA event tracking (6 events)
│   ├── spotify.ts              # Spotify Web API
│   ├── fees.ts                 # Fee calculation
│   ├── defaults.ts             # Auto-generated campaign defaults
│   ├── rate-limit.ts           # In-memory rate limiter
│   ├── validation.ts           # Input validation + sanitization
│   └── utils.ts                # Tailwind class merging
├── types/index.ts              # Shared TypeScript types
├── e2e/test.js                 # Playwright E2E (44 scenarios)
├── middleware.ts               # Admin session middleware
├── next.config.js              # Security headers, image domains
├── tailwind.config.js          # Design tokens + animations
└── railway.json                # Railway config
```

---

## E2E Test Coverage

```
🧪 Selah.fm E2E Test Suite v13  —  44/44 passing (100%)
─────────────────────────────────────────────────
1. Public Pages      8/8   ✅  Landing, browse, artists, creators, login, TOS/privacy, guidelines, open source
2. Welcome Pages     2/2   ✅  Artist welcome, creator welcome
3. Navigation        4/4   ✅  Campaigns, artists, creators nav links, logo link (handles auth state)
4. Browse            3/3   ✅  Loads, campaign count, create button
5. Artists           1/1   ✅  Page loads
6. Creators          1/1   ✅  Page loads
7. Auth              4/4   ✅  Google button, email form, signup toggle, role selector
8. Protected Pages   6/6   ✅  Dashboard, review, earnings, settings, analytics, onboarding
9. Campaign Detail   1/1   ✅  Missing ID shows "not found"
10. 404              1/1   ✅  Custom 404 page renders
11. Mobile           3/3   ✅  375px: landing, browse, login
12. SEO              2/2   ✅  Sitemap XML + robots.txt
13. API Health       2/2   ✅  Health check 200, stats endpoint returns data
14. Accessibility    2/2   ✅  Skip-to-content link, main landmark
─────────────────────────────────────────────────
```

Run: `TEST_URL=https://selah.fm node e2e/test.js`

---

## Environment Variables

| Variable | Required | Purpose |
|----------|:---:|---------|
| `DATABASE_URL` | 🔴 | PostgreSQL connection |
| `NEXTAUTH_SECRET` | 🔴 | Session HMAC secret |
| `NEXTAUTH_URL` | 🔴 | Base URL (https://selah.fm) |
| `GOOGLE_CLIENT_ID` | 🔴 | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | 🔴 | Google OAuth |
| `STRIPE_SECRET_KEY` | 🔴 | Stripe API key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 🔴 | Stripe frontend key |
| `STRIPE_WEBHOOK_SECRET` | 🔴 | Webhook signature verification |
| `RESEND_API_KEY` | 🟡 | Email delivery (info@, support@) |
| `DEEPSEEK_API_KEY` | 🟡 | AI support chat |
| `NEXT_PUBLIC_GA_ID` | 🟡 | Google Analytics |
| `YOUTUBE_API_KEY` | 🟡 | YouTube view verification |
| `CRON_SECRET` | 🟡 | Protects /api/cron |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | 🟢 | Spotify artist stats |
| `DATABASE_PRIVATE_URL` | 🟢 | Railway internal DB (saves egress) |
| `NEXT_PUBLIC_URL` | 🟢 | Base URL fallback |

---

## Deployment

```bash
# Build: npm run build
# Start: npm start
# Health: GET https://selah.fm/api/health
# Auto-deploy: Push to main → Railway triggers redeploy
```
