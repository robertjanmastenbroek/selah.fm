# Selah.fm — Status & Reference
**Last updated:** 2026-05-10 · **Versions:** 30
**Live:** https://selah.fm · **Admin:** https://selah.fm/admin

---

## Current Status

| Category | Status |
|----------|--------|
| Pages built | ✅ 22/22 |
| API routes live | ✅ 28/28 |
| E2E tests | ✅ 44/44 (100%) |
| Google OAuth | ✅ Live |
| YouTube view verification | ✅ Auto-verified |
| Google Analytics | ✅ 6 conversion events |
| Stripe payments | ⚠️ Test mode (needs `sk_live_`) |
| SMTP email | ⚠️ Not configured (logs to console) |
| Spotify artist data | ⚠️ Not configured (shows "0 monthly") |
| Social OAuth (TikTok/IG/YT/FB) | ⚠️ Infrastructure built, keys not set |
| CRON_SECRET | ⚠️ Not set |

### v30 — Security & Polish (2026-05-10)
- bcrypt password hashing (replaced SHA-256) — 12 salt rounds
- Stripe webhook signature verification enforced in all environments
- Rate limiting on campaign create, submissions, review, Stripe checkout
- Admin middleware with server-side session validation
- Real-time platform stats API (`/api/stats`) replacing hardcoded trust metrics
- Full analytics page with live data: platform breakdown, monthly trends, recent submissions
- Root loading.tsx, error.tsx, not-found.tsx, global-error.tsx — zero dead ends
- Page transitions via layout-level AnimatePresence (respects prefers-reduced-motion)
- Skip-to-content + aria-live region for accessibility
- Onboarding persistence via localStorage — survives page refresh
- E2E suite expanded to 43 tests: API health, stats, 404, a11y, mobile login
- Ripple effect hook for micro-reward interactions

### Config Tasks Remaining (Zero Code Changes)

| Priority | Task | Blocking? | How |
|----------|------|:---:|-----|
| 🔴 | Switch Stripe to live mode | Yes | Railway: `STRIPE_SECRET_KEY=sk_live_...`, `STRIPE_WEBHOOK_SECRET=whsec_...` |
| 🟡 | Configure SMTP for email | No | Resend (100/day free) or Brevo (300/day free). Railway: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| 🟡 | Set Spotify API keys | No | developer.spotify.com → Client ID + Secret. Railway: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` |
| 🟡 | Set TikTok OAuth keys | No | Railway: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` |
| 🟡 | Set Instagram OAuth keys | No | Railway: `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` |
| 🟡 | Set CRON_SECRET | No | Railway: `CRON_SECRET=<random-string>` |

---

## What Was Built (29 Versions)

| # | Feature | # | Feature |
|---|---------|---|---------|
| 1 | Splitter page (/) | 16 | Content Guidelines (9 sections) |
| 2 | Artist landing (7 sections) | 17 | Admin dashboard (6 sub-pages) |
| 3 | Creator landing (7 sections) | 18 | Notifications (DB-backed, bell badge) |
| 4 | Browse campaigns (3-col grid) | 19 | Chat/messages (REST polling) |
| 5 | Artists directory | 20 | Email system (nodemailer, 4 templates) |
| 6 | Artist profile | 21 | Campaign defaults (auto-generated) |
| 7 | Creators directory | 22 | View verification (YouTube/TikTok/IG) |
| 8 | Creator profile | 23 | Stripe Connect (onboarding + payout) |
| 9 | Campaign detail | 24 | Rate limiting (auth endpoints) |
| 10 | Dashboard (wizard + stats) | 25 | SEO (sitemap, robots, OG, JSON-LD) |
| 11 | Review page (approve/reject/undo) | 26 | Error boundaries + toast system |
| 12 | Earnings page (balance + history) | 27 | Design system (DeepSeek Blue, grain) |
| 13 | Settings (social handles) | 28 | E2E tests (34 scenarios, 97%) |
| 14 | Login (role selector + Google) | 29 | Google Analytics (6 conversion events) |
| 15 | Onboarding (artist 3 / creator 5 steps) | | |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (Neon Serverless) |
| Auth | Google OAuth + email/password (HMAC session cookies) |
| Payments | Stripe (Checkout + Connect) |
| Email | Nodemailer (SMTP — Resend, Brevo, or any provider) |
| Analytics | Google Analytics (6 conversion events) |
| View Verification | YouTube Data API v3 + TikTok oEmbed |
| Artist Data | Spotify Web API (client credentials) |
| Deployment | Railway (auto-deploy on push to main) |
| Testing | Playwright E2E (43 tests) |

---

## Module Registry

```
selah.fm/
├── app/                        # Next.js App Router (16 pages + 26 API routes)
│   ├── admin/                  # Admin dashboard (6 pages: overview, users, campaigns, submissions, payouts, seed)
│   ├── api/                    # REST API endpoints
│   │   ├── admin/              # Admin API (overview, users, seed, migrate, setup-webhook)
│   │   ├── artists/            # Artist directory + profile API
│   │   ├── auth/               # Auth (login, signup, logout, me)
│   │   ├── campaigns/          # Campaign CRUD
│   │   ├── connect/            # Social OAuth (TikTok, Instagram, YouTube, Facebook)
│   │   ├── creators/           # Creator directory + profile API
│   │   ├── cron/               # YouTube view auto-update
│   │   ├── debug/              # Debug endpoint
│   │   ├── earnings/           # Creator earnings
│   │   ├── health/             # Health check
│   │   ├── messages/           # Chat system
│   │   ├── notifications/      # User notifications
│   │   ├── oauth/              # Google OAuth callback
│   │   ├── referral/           # Referral system
│   │   ├── review/             # Artist review (approve/reject)
│   │   ├── stripe/             # Stripe checkout, webhook, payout, connect
│   │   ├── submissions/        # Submission create + list
│   │   └── verify/             # View verification (YouTube/TikTok/IG)
│   ├── artists/                # Artist directory + profile pages
│   ├── browse/                 # Campaign discovery
│   ├── c/[id]/                 # Campaign detail
│   ├── content-guidelines/     # Content policy
│   ├── creators/               # Creator directory + profile pages
│   ├── dashboard/              # Artist campaign management
│   ├── earnings/               # Creator earnings page
│   ├── login/                  # Login/signup with role selector
│   ├── onboarding/             # 1-question-per-screen wizard
│   ├── privacy/                # Privacy policy
│   ├── review/                 # Artist review page
│   ├── settings/               # Profile + social settings
│   ├── tos/                    # Terms of service
│   ├── welcome-artists/        # Artist landing (7 sections)
│   ├── welcome-creators/       # Creator landing (7 sections)
│   ├── globals.css             # Design system (dark mode + animations)
│   ├── layout.tsx              # Root layout (grain texture, GA, error boundary)
│   ├── page.tsx                # Splitter page (/)
│   └── sitemap.ts              # Sitemap generator
├── components/                 # React components (17 files)
│   ├── TopNav.tsx              # Main navigation (glassmorphism, dropdown, chat)
│   ├── BottomNav.tsx           # Mobile bottom nav
│   ├── ChatWidget.tsx          # Chat/messaging widget (10s polling)
│   ├── MessageButton.tsx       # "Message" button on profiles
│   ├── NotificationBell.tsx    # Notification bell + dropdown
│   ├── CampaignCover.tsx       # Campaign cover images + gradient fallback
│   ├── CampaignSearch.tsx      # Campaign filter widget
│   ├── CreatorAvatar.tsx       # Avatar (images + gradient initials)
│   ├── CreatorSubmissions.tsx  # Creator portfolio display
│   ├── SocialIcons.tsx         # TikTok, Instagram, YouTube, Spotify vectors
│   ├── ImageUpload.tsx         # Drag-and-drop image upload
│   ├── ErrorBoundary.tsx       # React error boundary
│   ├── States.tsx              # EmptyState + ErrorState components
│   ├── Toast.tsx               # Toast notification system
│   ├── Skeleton.tsx            # Skeleton loader
│   └── ui/                     # shadcn/ui primitives (12 components)
├── lib/                        # Shared utilities (15 files)
│   ├── db.ts                   # PostgreSQL client (Neon serverless)
│   ├── db/                     # Database artifacts (schema, seed, migrations)
│   ├── auth.ts                 # Session management (HMAC cookies)
│   ├── admin.ts                # Admin authorization (email list)
│   ├── email.ts                # Nodemailer email system (4 templates)
│   ├── analytics.ts            # Google Analytics event tracking (6 events)
│   ├── spotify.ts              # Spotify Web API (artist followers)
│   ├── fees.ts                 # Fee calculation engine
│   ├── defaults.ts             # Auto-generated campaign requirements
│   ├── notifications.ts        # Notification creation utility
│   ├── rate-limit.ts           # In-memory rate limiter
│   ├── useDebounce.ts          # Debounce hook
│   ├── utils.ts                # Tailwind class merging
│   └── validation.ts           # Input validation + sanitization
├── types/index.ts              # Shared TypeScript types
├── e2e/test.js                 # Playwright E2E tests (43 scenarios)
├── middleware.ts               # Next.js middleware (admin session check)
├── next.config.js              # Security headers, image domains, env
├── tailwind.config.js          # Dark mode design tokens
└── railway.json                # Railway deployment config
```

---

## Complete API Reference

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | None | Create account (email/password + role) |
| POST | `/api/auth/login` | None | Login with email/password |
| POST | `/api/auth/logout` | Session | Logout |
| GET | `/api/auth/me` | Session | Current user |
| PATCH | `/api/auth/me` | Session | Update profile (social handles, bio, CPM, user_type) |
| GET | `/api/oauth/google` | None | Google OAuth callback |

### Marketplace
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/campaigns` | None | List campaigns (search, filter, paginate) |
| POST | `/api/campaigns` | Session (artist) | Create campaign |
| GET | `/api/campaigns/[id]` | None | Campaign detail |
| PATCH | `/api/campaigns/[id]` | Session (owner) | Pause/resume campaign |
| GET | `/api/artists` | None | Artist directory |
| GET | `/api/artists/[id]` | None | Artist profile + campaigns |
| GET | `/api/creators` | None | Creator directory |
| GET | `/api/creators/[id]` | None | Creator profile + submissions |

### Submissions & Review
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/submissions` | None | List submissions (by campaignId) |
| POST | `/api/submissions` | Session (creator) | Submit content (URL + platform) |
| POST | `/api/review` | Session (artist/owner) | Approve/reject submission (403 if not owner, 400 if budget exhausted) |
| POST | `/api/verify` | None | Verify video views (YouTube API / TikTok oEmbed) |

### Payments
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/stripe` | Session | Create Stripe Checkout session |
| POST | `/api/stripe/webhook` | Stripe sig | Webhook handler (checkout.session.completed) |
| POST | `/api/stripe/payout` | Internal | Process creator payout (auto on approval) |
| GET | `/api/stripe/connect` | Session | Stripe Connect onboarding link |

### Chat & Notifications
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/messages` | Session | List conversations or messages (?userId=) |
| POST | `/api/messages` | Session | Send message |
| PATCH | `/api/messages` | Session | Mark messages read |
| GET | `/api/notifications` | Session | List notifications + unread count |
| PATCH | `/api/notifications` | Session | Mark notifications read |

### Social Connect
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/connect?platform=` | None | OAuth redirect (tiktok, instagram, youtube, facebook) |
| GET | `/api/connect/callback` | Session | OAuth callback handler |

### Other
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/earnings` | Session | Creator earnings summary |
| GET | `/api/health` | None | Health check (200 / 503) |
| GET | `/api/cron?secret=` | CRON_SECRET | Update YouTube view counts for pending submissions |
| GET/POST | `/api/admin/seed` | Admin | Seed demo data (3 artists, 5 creators, 6 campaigns) |
| GET | `/api/admin/migrate` | Admin | Run DDL migrations |
| GET | `/api/admin/overview` | Admin | Platform metrics |
| GET | `/api/admin/users` | Admin | User list |

---

## Database Schema

### Tables
| Table | Key Columns | Notes |
|-------|------------|-------|
| `users` | id UUID PK, email UNIQUE, password_hash, user_type, display_name, bio, genres, preferred_cpm_cents, tiktok_handle, instagram_handle, youtube_handle, facebook_handle, profile_image_url, stripe_customer_id, stripe_connect_id, acceptance_rate | Core identity |
| `campaigns` | id UUID PK, artist_id FK→users, track_title, track_url, cpm_rate_cents, total_budget_cents, budget_remaining_cents, platforms TEXT[], status, cover_art_url, requirements, recommended_hashtags | Campaign metadata |
| `submissions` | id UUID PK, campaign_id FK→campaigns, creator_id FK→users, content_url, platform, review_status, payout_status, views_verified, payout_amount_cents, rejection_feedback | Creator submissions |
| `notifications` | id UUID PK, user_id FK→users, type, message, read, link | In-app notifications |
| `messages` | id UUID PK, sender_id FK→users, receiver_id FK→users, campaign_id FK→campaigns, content, read | Chat messages |
| `payouts` | id UUID PK, submission_id FK→submissions, amount_cents, status | Payout tracking |
| `referrals` | referrer_id FK→users, referred_email, status | Referral tracking |

### Triggers
- **Budget update**: Fires on `UPDATE submissions` when `payout_status` changes to 'paid'. Deducts `payout_amount_cents` from `campaigns.budget_remaining_cents`. Auto-completes campaign when budget reaches zero.

---

## Integration Points

### Stripe
- **Checkout**: `POST /api/stripe` creates a session for campaign deposits
- **Webhook**: `POST /api/stripe/webhook` handles `checkout.session.completed`. Signature verification via `STRIPE_WEBHOOK_SECRET` in production
- **Connect**: `GET /api/stripe/connect` creates Express Connect account + onboarding link
- **Payout**: `POST /api/stripe/payout` transfers to creator's Connect account. Auto-triggered on review approval. Gracefully handles missing Connect (non-critical failure)

### Email (Nodemailer)
- **Transport**: SMTP (defaults to Resend `smtp.resend.com:587`)
- **Templates**: welcome, submission_approved, submission_rejected, payout_processed
- **Triggers**: Signup → welcome. Approval → approved. Rejection → rejected. Payout → processed.
- **Graceful degradation**: If `SMTP_PASS` not set, emails are logged to console but not sent. Never blocks API response.

### Google Analytics
- **Tag**: GA4 base script injected in root layout via `NEXT_PUBLIC_GA_ID`
- **Events**: 6 conversion events + 2 engagement events fired via `lib/analytics.ts`
- **Conversion events**: `sign_up`, `login`, `create_campaign`, `fund_campaign`, `submit_content`, `approve_submission`, `connect_stripe`
- **Engagement events**: `connect_social`, `save_settings`

### View Verification
- **YouTube**: Data API v3 (`YOUTUBE_API_KEY`). Returns `autoVerified: true` with view count. Extracts ID from watch/shorts/embed URLs.
- **TikTok**: oEmbed endpoint (public). Returns metadata but NOT view count. Marks `pendingVerification: true`.
- **Instagram**: Manual only. Returns `pendingVerification: true`.
- **Cron**: `GET /api/cron?secret=CRON_SECRET` updates YouTube view counts for pending submissions.

### OAuth / Social Connect
- **Google**: Standard OAuth2 flow. Creates user on first login. Only sends NEW users to onboarding.
- **Social**: `GET /api/connect?platform=tiktok|instagram|youtube|facebook` → OAuth redirect. Callback at `/api/connect/callback` saves handle to profile.

### Chat System
- **Architecture**: REST-based with 10-second polling. No WebSocket/SSE.
- **Entry points**: ChatWidget in TopNav + MessageButton on profiles.
- **Initiating**: `window.dispatchEvent(new CustomEvent('open-chat', ...))` opens chat to specific user.

### Spotify Artist Data
- **Auth**: Client credentials (app-level). One Client ID + Secret works for all artists.
- **Flow**: Artist enters `spotify.com/track/ID` → lookup track → get artist → fetch follower count.
- **Graceful**: Missing keys → displays "0 monthly listeners" without error.

---

## Security Notes

| Area | Status |
|------|--------|
| Broken Access Control | ✅ Ownership checks on review (403), admin guard on admin routes |
| Cryptographic Failures | ✅ bcrypt (12 rounds) for password hashing |
| Injection | ✅ Tagged template SQL prevents injection; input validation on all routes |
| Rate Limiting | ✅ Auth (10/min), campaigns (5/min), submissions (10/min), review (30/min), Stripe (10/min) |
| Stripe Webhooks | ✅ Signature verified via STRIPE_WEBHOOK_SECRET (required) |
| Session | ⚠️ Fallback to 'selah-secret' if `NEXTAUTH_SECRET` not set. Ensure strong random secret in Railway. |

### Known Limitations (Not MVP Blocking)
- No password reset flow
- No email verification on signup
- No WebSocket/SSE for real-time chat (10s polling works)
- No Stripe payout idempotency keys
- No image optimization (next/image)
- No CSRF tokens on state-changing endpoints
- No structured error logging (console.error only)

---

## Environment Variables

| Variable | Required | Purpose |
|----------|:---:|---------|
| `DATABASE_URL` | 🔴 | PostgreSQL connection (Neon) |
| `NEXTAUTH_SECRET` | 🔴 | Session HMAC secret |
| `NEXTAUTH_URL` | 🔴 | Base URL for OAuth redirects |
| `GOOGLE_CLIENT_ID` | 🔴 | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | 🔴 | Google OAuth |
| `STRIPE_SECRET_KEY` | 🔴 | Stripe API key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 🔴 | Stripe frontend key |
| `STRIPE_WEBHOOK_SECRET` | 🟡 | Webhook signature verification |
| `NEXT_PUBLIC_GA_ID` | 🟡 | Google Analytics measurement ID |
| `YOUTUBE_API_KEY` | 🟡 | YouTube Data API v3 |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | 🟡 | Email delivery |
| `CRON_SECRET` | 🟡 | Protects /api/cron endpoint |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | 🟢 | Spotify artist data |
| `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` | 🟢 | TikTok OAuth |
| `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET` | 🟢 | Instagram OAuth |
| `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` | 🟢 | YouTube OAuth |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | 🟢 | Facebook OAuth |

---

## E2E Test Coverage

```
🧪 Selah.fm E2E Test Suite v13  —  43/43 passing (100%)
─────────────────────────────────────────────────
1. Public Pages      8/8   ✅  Landing, browse, artists, creators, login, TOS/privacy, guidelines, open source
2. Welcome Pages     2/2   ✅  Artist welcome, creator welcome
3. Navigation        4/4   ✅  Campaigns, artists, creators nav links, logo link
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

## Manual Verification Gate

Click through on https://selah.fm before launch:

- [ ] `/` — Splitter page, both cards visible, hover effects
- [ ] `/login` — Signup with role selector, Google button
- [ ] `/onboarding` — Artist (3 steps) + Creator (5 steps), confetti
- [ ] `/browse` — Cards load, click → detail, join button
- [ ] `/artists` — Cards load, click → profile, social badges
- [ ] `/artists/[id]` — Profile, stats, campaign list, social icons
- [ ] `/creators` — Cards load, click → profile
- [ ] `/creators/[id]` — Profile, hire button, message button
- [ ] `/c/[id]` — Campaign detail: cover, stats, platforms, requirements
- [ ] `/dashboard` — Campaign wizard, pause/resume, stats
- [ ] `/review` — Status tabs, approve/reject, undo
- [ ] `/earnings` — Balance, submission history, Stripe Connect
- [ ] `/settings` — Social handles save, avatar, platform status
- [ ] `/content-guidelines` — All 9 sections render
- [ ] `/admin` — Admin-only access, all 6 sub-pages
- [ ] Chat — Bell opens ChatWidget, messages send
- [ ] Notifications — Bell shows badge, mark read
- [ ] Mobile (375px) — All pages reflow without overflow
- [x] `node e2e/test.js` → 34/34 (100%)

---

## Deployment

Pushes to `main` auto-deploy to Railway via Nixpacks.

```bash
# Build: npm run build (Next.js static + server)
# Start: npm start
# Health: GET https://selah.fm
# Rollback: Railway dashboard → Deployments → Rollback
```

### Post-Launch Monitoring
- Monitor error rates first 48 hours
- Watch for failed webhooks in Stripe Dashboard
- Review first 10 real signups manually
- Set up uptime monitoring (uptimerobot.com free tier)
