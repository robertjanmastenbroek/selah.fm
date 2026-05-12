# Selah.fm — README

https://selah.fm — CPM marketplace for music promotion.

Artists set a budget. Creators earn per verified view. No labels. No black-box ads.

## Quick Start

```bash
cp .env.example .env.local    # fill in DATABASE_URL, STRIPE_SECRET_KEY, etc.
npm install
npx next dev                  # http://localhost:3000
```

### Required Env Vars

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | Stripe secret key (test/live) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client-side key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXTAUTH_SECRET` | Session signing key |
| `NEXT_PUBLIC_URL` | Public URL (https://selah.fm) |
| `RESEND_API_KEY` | Email sending |
| `DEEPSEEK_API_KEY` | AI blog + interview generation |
| `PEXELS_API_KEY` | Blog image sourcing (free) |
| `GA_API_SECRET` | Google Analytics Measurement Protocol |

## Architecture

- **Framework:** Next.js 14 (App Router), TypeScript
- **Database:** PostgreSQL (Neon, Railway)
- **Payments:** Stripe Elements + Connect (80/20 split)
- **Styling:** Tailwind CSS, Framer Motion, shadcn/ui
- **AI:** DeepSeek API (blog generation, interview questions)
- **Images:** Pexels API → local cache
- **Email:** Resend

## Project Structure

```
app/
├── page.tsx              # Landing (server + client split for SEO)
├── layout.tsx            # Root layout + SEO + footer
├── c/[id]/               # Campaign detail (UUID or slug)
├── browse/               # Campaign browser (search-as-you-type)
├── dashboard/            # Inline campaign management
├── checkout/             # Unified Stripe checkout
├── review/               # Submission review (approve/reject + undo)
├── earnings/             # Creator earnings + Stripe Connect
├── artists/[id]/         # Artist profile
├── creators/[id]/        # Creator profile
├── login/                # Auth (email + Google OAuth)
├── onboardi
├── welcome-artists/      # Artist landing page
├── welcome-creators/     # Creator landing page
├── faq/                  # 40+ FAQ entries + AI chat
├── open-source/          # Open source landing page
├── settings/             # User settings + roles
├── claim/[code]/         # Campaign claim page (outreach pipeline)
├── blog/                 # Public blog (listing + post pages)
├── tools/[slug]/         # Interactive SEO tools (CPM calculator, etc.)
└── admin/                # Admin panel
    ├── page.tsx          # Overview dashboard
    ├── users/            # User management
    ├── campaigns/        # Campaign management
    ├── submissions/      # Submission management
    ├── payouts/          # Payout management
    ├── emails/           # Email inbox + compose
    ├── support-chats/    # Chat history
    ├── outreach/          # Outreach pipeline dashboard (discover → audit → campaign → outreach)
    ├── blog/             # Blog dashboard + batch detail
    ├── blog/post/[id]/   # Blog post editor (preview → publish)
    ├── blog-generator/   # Generate from voice library (one-click)
    ├── source-questions/ # Browse real Reddit questions + batch generate
    ├── content/          # Content Hub (unified pipeline)
    └── interview/        # Interview Studio (voice capture)

lib/
├── db.ts                 # Database pool (Neon serverless)
├── auth.ts               # Session management
├── data.ts               # Data fetching layer
├── analytics.ts          # Client-side GA tracking
├── analytics-server.ts   # Server-side GA Measurement Protocol
├── blog-engine.ts        # DeepSeek article generation + question sourcing
├── blog-images.ts        # Pexels image fetch → local cache → dedup
├── db/schema.sql         # Database schema
└── db/migrations/        # 001–010 migration files

components/
├── TopNav.tsx            # Header navigation
├── Toast.tsx             # Toast notification system
├── States.tsx            # EmptyState + ErrorState
├── LiveTicker.tsx        # Real-time donation ticker
├── EarnModal.tsx         # Creator submission modal
├── MediaCarousel.tsx     # Image/video carousel
├── CampaignCover.tsx     # Campaign cover image
├── GalleryUpload.tsx     # Multi-image upload
├── SocialIcons.tsx       # Platform badges (TikTok, Reels, Shorts)
├── SupportWidget.tsx     # AI chat widget
├── CircleProgress.tsx    # Circular progress bar
├── CampaignSearch.tsx    # Search + filter component
├── ToolCalculators.tsx   # Interactive CPM/earnings/budget calculators
└── ui/                   # shadcn/ui primitives
```

## Key Features

### Core Marketplace
- Artists create campaigns with track, budget, CPM rate, and requirements
- Creators browse campaigns, submit videos with platform links
- Artists review submissions, approve with one click, undo within 4 seconds
- Stripe handles deposits (Elements) and payouts (Connect)
- 80/20 revenue split via Stripe Connect

### Dual Role System
- Every user is both artist AND creator by default
- Toggle roles in Settings — no separate accounts needed
- Campaign creation: uses is_artist flag
- Creator submissions: uses is_creator flag

### SEO
- Campaign detail pages accessible via UUID or SEO slug (`/c/artist-song-1234`)
- JSON-LD schemas (Organization, WebApplication, Article, FAQ)
- OG/Twitter metadata on every page
- Sitemap with dynamic content (campaigns, artists, creators, blog posts, tools)
- Server-rendered homepage with metadata

### Blog System
- DeepSeek-powered article generation in founder's authentic voice
- Anti-AI-detection guardrails: 30 banned words, 7 pattern breakers, sentence-length variation
- Pexels image sourcing → local cache → never broken images
- Content Hub: Interview → Voice Library → Blog Engine → Published pipeline
- Generate from Voice: type a topic → pulls voice chunks → generates draft → opens in editor

### Interview Studio
- 52 topics across 9 categories (Life, Faith, Music, Business, Marketing, Creator Economy, Mindset, Tech, Philosophy)
- Browser voice input (SpeechRecognition API) with audio activity visualization
- Context-aware question generation avoids repeating covered topics
- Voice library: 220+ chunks stored with metadata for blog generation

### Interactive SEO Tools
- CPM Calculator: live DB data, platform comparison table, Budget↔Views sliders
- Creator Earnings Estimator: monthly earnings comparison across platforms
- Promotion Budget Planner: what $10–$500 buys at current marketplace rates

### Google Analytics
- Server-side Measurement Protocol for all key events
- Events: sign_up, login, create_campaign, fund_campaign, donation, submit_content, approve_submission

## API Endpoints — 55+ Total

| Area | Count |
|------|-------|
| Auth | 9 |
| Campaigns | 4 |
| Submissions | 2 |
| Review | 1 |
| Stripe | 5 |
| Support | 2 |
| Artists | 2 |
| Creators | 3 |
| Notifications | 2 |
| Messages | 2 |
| Earnings | 1 |
| Analytics | 1 |
| Admin | 12 |
| Blog/Cron | 3 |
| Interview | 1 |
| Other | 5 |

## Testing

```bash
npx tsc --noEmit     # zero errors
node e2e/test.js     # 44 E2E tests, 100% passing
```

## Deployment

Auto-deployed on `git push origin main` via Railway.
