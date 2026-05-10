# Selah.fm

**CPM marketplace for music promotion.** Artists set budgets and CPM rates. Creators make TikToks, Reels, and Shorts. Artists review and approve every submission. Creators get paid for verified views.

🌐 [selah.fm](https://selah.fm)

---

## How It Works

```
Artist:  Create campaign → Set CPM + budget → Deposit via Stripe
Creator: Browse campaigns → Pick track → Make content → Submit link
Artist:  Review video → Approve or reject
Creator: Get paid per verified view (80% of CPM)
```

**Fee structure:** 20% platform fee on creator payouts. Stripe processing on deposits (2.9% + $0.30). No hidden costs.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (Neon Serverless) |
| Auth | Google OAuth + email/password |
| Payments | Stripe (Checkout + Connect) |
| Email | Nodemailer (SMTP — Resend, Brevo, or any provider) |
| Analytics | Google Analytics (6 conversion events) |
| View Verification | YouTube Data API v3 + TikTok oEmbed |
| Artist Data | Spotify Web API (client credentials) |
| Deployment | Railway |
| Testing | Playwright E2E (43 tests) |

---

## Project Structure

See [STATUS.md](./STATUS.md) for the full module registry, API reference, database schema, security notes, and deployment instructions.

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or [Neon](https://neon.tech) free tier)
- Stripe account
- Google Cloud Console (for OAuth)

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
# ── Critical (required for core functionality) ──────────────────
DATABASE_URL=postgresql://...          # PostgreSQL connection (Neon)
NEXTAUTH_SECRET=...                    # Random 32-byte secret for session HMAC
NEXTAUTH_URL=https://selah.fm          # Your production domain
GOOGLE_CLIENT_ID=...                   # Google OAuth client ID
GOOGLE_CLIENT_SECRET=...               # Google OAuth client secret
STRIPE_SECRET_KEY=sk_live_...          # Stripe secret key (live mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=... # Stripe publishable key

# ── Recommended (enhances features) ────────────────────────────
NEXT_PUBLIC_GA_ID=G-XXXXXXXX           # Google Analytics measurement ID
YOUTUBE_API_KEY=...                    # YouTube Data API v3 (auto view verification)
SMTP_HOST=smtp.resend.com              # Email provider (Resend free: 100/day)
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_...                       # Resend API key (or any SMTP password)
SMTP_FROM=noreply@selah.fm
CRON_SECRET=...                        # Protects /api/cron endpoint

# ── Optional (social proof + OAuth) ────────────────────────────
SPOTIFY_CLIENT_ID=...                  # Spotify Web API (artist follower counts)
SPOTIFY_CLIENT_SECRET=...
TIKTOK_CLIENT_KEY=...                  # TikTok OAuth (creator verification)
TIKTOK_CLIENT_SECRET=...
INSTAGRAM_APP_ID=...                   # Instagram OAuth
INSTAGRAM_APP_SECRET=...
YOUTUBE_CLIENT_ID=...                  # YouTube OAuth (creator channel connect)
YOUTUBE_CLIENT_SECRET=...
FACEBOOK_APP_ID=...                    # Facebook OAuth
FACEBOOK_APP_SECRET=...
```

**Note:** The platform runs without optional env vars — features gracefully degrade. Missing SMTP logs emails to console instead of sending. Missing Spotify shows "0 monthly listeners." Missing YouTube API key falls back to manual view verification.

### Install & Run

```bash
npm install
npm run dev          # Development server at http://localhost:3000
```

### Database Setup

```bash
# Run schema
psql $DATABASE_URL -f lib/db/schema.sql

# Run migrations (if upgrading)
psql $DATABASE_URL -f lib/db/migrations/001_creator_profiles.sql

# Seed demo data
psql $DATABASE_URL -f lib/db/seed.sql
```

### Build & Deploy

```bash
npm run build        # Production build
npm start            # Production server
```

Deploys to Railway automatically on `git push`.

### Run Tests

```bash
# Against production
node e2e/test.js

# Against local
TEST_URL=http://localhost:3000 node e2e/test.js
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
| PATCH | `/api/auth/me` | Update profile (social handles, bio, CPM) |
| GET | `/api/oauth/google` | Google OAuth callback |

### Marketplace
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List campaigns (search, filter, paginate) |
| POST | `/api/campaigns` | Create campaign (artist only) |
| GET | `/api/campaigns/[id]` | Campaign detail |
| PATCH | `/api/campaigns/[id]` | Pause/resume campaign (owner only) |
| GET | `/api/artists` | Artist directory |
| GET | `/api/artists/[id]` | Artist profile + campaigns |
| GET | `/api/creators` | Creator directory |
| GET | `/api/creators/[id]` | Creator profile + submissions |

### Submissions & Review
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/submissions` | List submissions (by campaign) |
| POST | `/api/submissions` | Submit content (creator only) |
| POST | `/api/review` | Approve / reject submission (artist/owner only) |
| POST | `/api/verify` | Verify video views (YouTube API / TikTok oEmbed) |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stripe` | Create Stripe checkout session |
| POST | `/api/stripe/webhook` | Stripe webhook handler |
| POST | `/api/stripe/payout` | Process creator payout (auto on approval) |
| GET | `/api/stripe/connect` | Stripe Connect onboarding |

### Social Connect
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/connect` | OAuth redirect (TikTok, Instagram, YouTube, Facebook) |
| GET | `/api/connect/callback` | OAuth callback handler |

### Chat & Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/messages` | List / send chat messages |
| PATCH | `/api/messages` | Mark messages read |
| GET | `/api/notifications` | List notifications + unread count |
| PATCH | `/api/notifications` | Mark notifications read |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/earnings` | Creator earnings |
| GET | `/api/health` | Health check |
| GET | `/api/cron` | YouTube view auto-update (requires CRON_SECRET) |
| GET/POST | `/api/admin/seed` | Seed demo data (admin only) |
| GET | `/api/admin/overview` | Platform metrics (admin only) |
| GET | `/api/admin/users` | User list (admin only) |

---

## Design System

- **Colors:** Midnight background, Sacred Gold (#C9A84C) accent
- **Typography:** Inter (sans-serif)
- **Components:** shadcn/ui (Card, Button, Input, Badge, Progress, Skeleton)
- **Animations:** slide-up, fade-in via Tailwind keyframes

---

## License

Private — all rights reserved.
