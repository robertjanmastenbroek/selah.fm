# Selah.fm

**CPM marketplace for music promotion.** Artists set budgets and CPM rates. Creators make TikToks, Reels, and Shorts. Artists review and approve every submission. Creators get paid for verified views. Fans donate to campaigns.

🌐 [selah.fm](https://selah.fm) · 📊 [Status](./STATUS.md) · ⭐ [GitHub](https://github.com/robertjanmastenbroek/selah.fm)

---

## How It Works

```
Artist:  Create campaign → Set CPM + budget → Deposit via Stripe
Creator: Browse campaigns → Pick track → Make content → Submit link
Artist:  Review video → Approve or reject
Creator: Get paid per verified view (80% of CPM)
Fan:     Browse campaign → Donate any amount → Support the track
```

**Fee structure:** 20% platform fee on creator payouts. Stripe processing on deposits (2.9% + $0.30). Donations: 100% added to budget (fees handled at payout).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| Database | PostgreSQL (Neon Serverless) |
| Auth | Google OAuth + email/password (bcrypt) |
| Payments | Stripe (Elements + Connect + Webhooks) |
| Email | Resend HTTP API |
| AI Support | DeepSeek Chat API |
| Analytics | Google Analytics |
| View Verification | YouTube Data API v3 + TikTok oEmbed |
| Artist Data | Spotify Web API |
| Deployment | Railway (auto-deploy on push) |
| Testing | Playwright E2E (44 tests) |

---

## Project Structure

```
selah.fm/
├── app/                    # Next.js App Router pages + API routes
│   ├── page.tsx            # Landing page
│   ├── layout.tsx          # Root layout (metadata, GA, footer)
│   ├── browse/             # Campaign discovery
│   ├── c/[id]/             # Campaign detail + donate
│   ├── artists/[id]/       # Artist profile
│   ├── creators/[id]/      # Creator profile
│   ├── dashboard/          # Artist dashboard (create/manage campaigns)
│   ├── review/             # Review submissions
│   ├── earnings/           # Creator earnings + payout history
│   ├── settings/           # Profile settings
│   ├── analytics/          # Creator analytics
│   ├── onboarding/         # Artist onboarding wizard
│   ├── login/              # Auth page (Google + email)
│   ├── admin/              # Admin panel (overview, users, emails, manage)
│   ├── api/                # API routes (45 endpoints)
│   │   ├── auth/           # Login, signup, logout, me, verify-email, reset-password
│   │   ├── campaigns/      # CRUD + support (donations)
│   │   ├── submissions/    # Creator submissions
│   │   ├── stripe/         # Payments, webhooks, payouts, connect
│   │   ├── artists/        # Artist directory + profiles
│   │   ├── creators/       # Creator directory + profiles
│   │   ├── oauth/          # Google OAuth callback
│   │   ├── admin/          # Admin endpoints (manage, emails, seed, migrate)
│   │   ├── messages/       # Chat
│   │   ├── notifications/  # In-app notifications
│   │   ├── ratings/        # Creator ratings
│   │   ├── bugs/           # Bug reports
│   │   ├── referral/       # Referral system
│   │   ├── support/        # AI support chat
│   │   ├── connect/        # Social OAuth (TikTok, Instagram, YouTube)
│   │   ├── spotify/        # Spotify metadata
│   │   └── cron/           # Scheduled tasks (view verification)
│   ├── welcome-artists/    # Artist landing page
│   ├── welcome-creators/   # Creator landing page
│   ├── faq/                # FAQ
│   ├── tos/                # Terms of Service
│   ├── privacy/            # Privacy Policy
│   ├── content-guidelines/ # Content guidelines
│   ├── open-source/        # Open source info
│   └── report-bug/         # Bug report form
├── components/             # React components (38)
│   ├── TopNav.tsx          # Universal header
│   ├── BottomNav.tsx       # Mobile bottom nav
│   ├── CampaignCover.tsx   # Cover image with fallback
│   ├── StripePaymentModal.tsx # Stripe Elements payment modal
│   ├── PaymentSuccess.tsx  # Post-payment confirmation
│   ├── SubmissionsFeed.tsx # Submission list with ratings
│   ├── CreatorAvatar.tsx   # Avatar with initials fallback
│   ├── ImageUpload.tsx     # Profile/campaign image upload
│   ├── ChatWidget.tsx      # Real-time chat
│   ├── SupportWidget.tsx   # AI support chat
│   ├── MessageButton.tsx   # "Message" button
│   ├── CampaignSearch.tsx  # Search + filter bar
│   ├── RatingPrompt.tsx    # Star rating component
│   ├── SocialIcons.tsx     # Platform badges + social SVGs
│   ├── ErrorBoundary.tsx   # React error boundary
│   ├── PageTransition.tsx  # Page transition animation
│   ├── Toast.tsx           # Toast notification system
│   └── ui/                 # shadcn/ui primitives (Button, Input, etc.)
├── lib/                    # Shared libraries
│   ├── auth.ts             # Session management (HMAC cookies)
│   ├── db.ts               # PostgreSQL client (Neon serverless)
│   ├── db/
│   │   ├── schema.sql      # Full database schema
│   │   └── migrations/     # Schema migrations
│   ├── constants.ts        # Admin emails, fee config
│   ├── rate-limit.ts       # In-memory rate limiter
│   ├── swr-config.ts       # SWR fetch configuration
│   ├── analytics.ts        # Google Analytics event tracking
│   └── utils.ts            # cn() helper, formatting
├── e2e/                    # Playwright E2E tests (44 tests)
├── public/                 # Static assets (logos, images)
└── types/                  # TypeScript type definitions
```

---

## API Overview

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account (email/password + role) |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| PATCH | `/api/auth/me` | Update profile |
| POST | `/api/auth/verify-email` | Verify email token |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/oauth/google` | Google OAuth callback |

### Marketplace
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List campaigns (search, filter, paginate, sort) |
| POST | `/api/campaigns` | Create campaign (artist only) |
| GET | `/api/campaigns/[id]` | Campaign detail |
| PATCH | `/api/campaigns/[id]` | Pause/resume campaign |
| GET | `/api/artists` | Artist directory |
| GET | `/api/artists/[id]` | Artist profile + campaigns |
| GET | `/api/creators` | Creator directory |
| GET | `/api/creators/[id]` | Creator profile + submissions |

### Submissions & Review
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/submissions` | List submissions (by campaign or creator) |
| POST | `/api/submissions` | Submit content (creator only) |
| POST | `/api/review` | Approve / reject submission |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stripe` | Create Stripe checkout session |
| POST | `/api/stripe/webhook` | Stripe webhook handler |
| POST | `/api/stripe/payout` | Process creator payout |
| GET | `/api/stripe/connect` | Stripe Connect onboarding |
| POST | `/api/campaigns/[id]/support` | Fan donation |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/earnings` | Creator earnings + payout history |
| GET | `/api/analytics` | Creator analytics |
| GET | `/api/stats` | Public platform stats |
| GET | `/api/health` | Health check (DB connectivity) |
| GET | `/api/cron` | YouTube view auto-update |
| GET/POST | `/api/messages` | Chat messages |
| GET/PATCH | `/api/notifications` | In-app notifications |
| POST | `/api/support` | AI support chat |
| GET/POST | `/api/bugs` | Bug reports |
| GET/PATCH | `/api/referral` | Referral system |
| GET | `/api/admin/*` | Admin endpoints (overview, users, emails, manage, seed, migrate) |
| GET | `/api/spotify` | Spotify artist metadata |
| GET | `/api/sitemap` | XML sitemap |

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0A0A0A` | Page background |
| Primary | `#5B7FFF` (light blue) | CTAs, active states |
| Accent | `#1E3A8A` (deep navy) | DONATE button, brand |
| Progress | `#5B7FFF → #1E3A8A` | Circle progress gradient |
| Text | `#F0F0F0` / `#8C8C8C` | Primary / muted |
| Success | `#10B981` | Confirmation |
| Error | `#EF4444` | Validation |
| Font | Inter | System font stack |
| Radius | `rounded-2xl` | Cards, modals |
| Animation | Framer Motion `spring(400,30)` | Bars, modals |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or [Neon](https://neon.tech) free tier)
- Stripe account
- Google Cloud Console (for OAuth)

### Environment Variables

```bash
# ── Critical (required) ──────────────────────────────────────
DATABASE_URL=postgresql://...          # PostgreSQL connection
NEXTAUTH_SECRET=...                    # Random 32-byte secret
NEXT_PUBLIC_URL=https://selah.fm       # Production domain
GOOGLE_CLIENT_ID=...                   # Google OAuth client ID
GOOGLE_CLIENT_SECRET=...               # Google OAuth client secret
STRIPE_SECRET_KEY=sk_live_...          # Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=... # Stripe publishable key

# ── Recommended ─────────────────────────────────────────────
NEXT_PUBLIC_GA_ID=G-XXXXXXXX           # Google Analytics
RESEND_API_KEY=re_...                  # Email (Resend API)
DEEPSEEK_API_KEY=sk-...               # AI support chat
CRON_SECRET=...                        # Protects /api/cron
RESEND_AUDIENCE_ID=...                 # Email audience sync

# ── Optional ────────────────────────────────────────────────
YOUTUBE_API_KEY=...                    # View verification
SPOTIFY_CLIENT_ID=...                  # Artist metadata
SPOTIFY_CLIENT_SECRET=...
TIKTOK_CLIENT_KEY=...                  # Creator verification
INSTAGRAM_APP_ID=...                   # Instagram OAuth
YOUTUBE_CLIENT_ID=...                  # YouTube OAuth
FACEBOOK_APP_ID=...                    # Facebook OAuth
```

### Install & Run

```bash
npm install
npm run dev          # http://localhost:3000
```

### Database

```bash
psql $DATABASE_URL -f lib/db/schema.sql   # Create tables
# Run any pending migrations:
curl https://selah.fm/api/admin/migrate
```

### Test

```bash
node e2e/test.js                          # 44 tests against production
TEST_URL=http://localhost:3000 node e2e/test.js  # Against local
```

---

## Deployment

Push to `main` → Railway auto-deploys. Health check at `/api/health`.

## License

MIT — fully open source. [github.com/robertjanmastenbroek/selah.fm](https://github.com/robertjanmastenbroek/selah.fm)
