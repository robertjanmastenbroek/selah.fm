# Selah.fm

https://selah.fm — CPM marketplace for music promotion.

Artists set a CPM rate. Creators earn per verified view. No labels. No black-box ads. Open source.

## Quick Start

```bash
cp .env.local.example .env.local    # fill in required env vars
npm install
npx next dev                        # http://localhost:3000
```

### Required Env Vars

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_DATABASE_URL` | Supabase PostgreSQL pooler URL |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client-side key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_URL` | Public URL (https://selah.fm) |
| `RESEND_API_KEY` | Email sending (Resend) |
| `RESEND_AUDIENCE_ID` | Resend audience for marketing list |
| `DEEPSEEK_API_KEY` | AI outreach emails + blog generation |
| `CRON_SECRET` | Cron job auth |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Streaming link enrichment |

## Architecture

- **Framework:** Next.js 14 (App Router), TypeScript
- **Auth:** Supabase Auth (Google OAuth + email/password via `@supabase/ssr`)
- **Database:** Supabase PostgreSQL (pooler, 27 tables)
- **Payments:** Stripe Elements + Connect
- **Fee model:** 20% added on artist CPM, creators earn full CPM
- **Styling:** Tailwind CSS, Framer Motion, shadcn/ui
- **AI:** DeepSeek V3 (outreach emails, blog generation, support chatbot)
- **Email:** Resend (transactional + audience sync)
- **Discovery:** Bandcamp API (20 genres, 5 pages) + Reddit JSON + YouTube Data API
- **Cron:** Railway (pipeline every 30 min, email every 30 min)

## Key Features

### Email Outreach Pipeline (Fully Autonomous)
- Discover 1,900–4,800 artists/day from Bandcamp/Reddit/YouTube
- Scrape emails from 6 sources (Bandcamp text, websites, Instagram, SoundCloud, Twitter/X, Google)
- MX record verification + disposable domain filter + bounce webhook
- DeepSeek-generated personalized outreach emails
- 100 emails/day via Resend (free tier)
- Auto-sync to Resend audience for marketing

### Campaign Pages
- 1,238 live campaign pages with cover art, streaming links, CPM display
- Listen links: Bandcamp, YouTube, Spotify, Apple Music, SoundCloud
- Server-rendered metadata + JSON-LD schemas
- Creator submission flow with Stripe Connect payouts

### Admin Dashboard (`/admin/outreach`)
- Pipeline stats: discovered, audited, campaigns, outreach, claimed
- Batch audit, create campaigns, send emails per artist
- Email re-scraping, streaming link enrichment

### SEO Tools
- CPM Calculator, Creator Earnings Estimator, Promotion Budget Planner
- Blog system with DeepSeek article generation
- FAQ with AI support chatbot

## Project Structure

```
app/
├── page.tsx                 # Homepage (server-rendered stats)
├── c/[id]/                  # Campaign detail (UUID or slug)
├── browse/                  # Campaign browser
├── dashboard/               # Artist dashboard
├── review/                  # Submission review
├── earnings/                # Creator earnings
├── login/                   # Google OAuth + email/password
├── admin/outreach/          # Outreach pipeline dashboard
├── api/cron/                # Pipeline + email cron jobs
├── api/webhooks/resend/     # Bounce/complaint webhook
├── api/admin/               # Admin API endpoints
└── auth/callback/           # Supabase OAuth callback

lib/
├── db.ts                    # pg Pool (Supabase)
├── supabase/                # Server + client + middleware
├── outreach.ts              # Artist audit + email scraping
├── discovery.ts             # Multi-channel discovery
├── email-outreach.ts        # Email generation + Resend + audience
├── email-verify.ts          # MX check + disposable filter
├── streaming-links.ts       # Spotify/Apple Music API
├── fees.ts                  # Fee calculations
├── blog-engine.ts           # AI blog generation
└── analytics.ts             # GA tracking
```

## API — 55+ Endpoints

| Area | Count |
|------|-------|
| Auth | 5 |
| Campaigns | 4 |
| Submissions | 2 |
| Review | 1 |
| Stripe | 5 |
| Support | 2 |
| Admin/Outreach | 18 |
| Cron (pipeline + email) | 2 |
| Webhooks | 1 |
| Blog/Cron | 3 |
| Tools/SEO | 4 |
| Other | 8 |

## Testing

```bash
npx tsc --noEmit     # must pass with zero errors
```

## Deployment

Auto-deployed on `git push origin main` via Railway.
