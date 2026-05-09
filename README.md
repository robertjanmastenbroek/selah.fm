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
| Deployment | Railway |
| Testing | Playwright E2E |
| Automation | Python orchestrator + DeepSeek AI agents |

---

## Project Structure

```
selah.fm/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/                # REST API endpoints
│   │   ├── auth/           # Authentication (signup, login, logout, me)
│   │   ├── campaigns/      # Campaign CRUD
│   │   ├── submissions/    # Submission create + list
│   │   ├── review/         # Artist review (approve/reject)
│   │   ├── creators/       # Creator directory + hire
│   │   ├── earnings/       # Creator earnings
│   │   ├── notifications/  # User notifications
│   │   ├── stripe/         # Stripe checkout, webhooks, payouts, connect
│   │   └── verify/         # YouTube view verification
│   ├── browse/             # Campaign discovery
│   ├── c/[id]/             # Campaign detail
│   ├── creators/           # Creator marketplace
│   ├── dashboard/          # Artist campaign management
│   ├── earnings/           # Creator earnings page
│   ├── review/             # Artist review page
│   ├── analytics/          # Content analytics
│   ├── settings/           # User profile settings
│   └── login/              # Login + signup page
├── components/             # React components
│   ├── TopNav.tsx          # Main navigation header
│   ├── BottomNav.tsx       # Mobile bottom nav
│   ├── NotificationBell.tsx # Real-time notifications
│   ├── Toast.tsx           # Toast notification system
│   ├── ErrorBoundary.tsx   # React error boundary
│   ├── ImageUpload.tsx     # Drag-and-drop image upload
│   ├── CampaignSearch.tsx  # Campaign filter/search
│   └── ui/                 # shadcn/ui components
├── lib/                    # Shared utilities
│   ├── db.ts               # PostgreSQL client (Neon serverless)
│   ├── db/schema.sql       # Full database schema
│   ├── db/migrations/      # Migration scripts
│   ├── db/seed.sql         # Demo data seeder
│   ├── fees.ts             # Fee calculation engine
│   ├── notifications.ts    # Notification creation utility
│   ├── validation.ts       # Input validation + sanitization
│   └── utils.ts            # Tailwind class merging
├── types/                  # Shared TypeScript types
│   └── index.ts            # User, Campaign, Submission, Notification types
├── e2e/                    # End-to-end tests
│   └── test.js             # Playwright test suite (25+ tests)
├── agents/                 # AI agent instruction files
│   ├── selah-master.md     # Strategic overseer
│   ├── selah-improve.md    # Continuous improvement
│   ├── selah-monitor.md    # Site health monitoring
│   └── selah-outreach.md   # Artist/creator outreach
├── autonomous/             # Autonomous agent system
│   ├── agent.py            # DeepSeek-powered improvement agent
│   ├── cron_runner.py      # Cron-based task runner
│   └── task_queue.py       # Priority task queue with file locking
├── orchestrator.py         # Build plan + task manager
├── outreach_agent.py       # Instagram/TikTok DM automation
├── image_generator.py      # Midjourney image generation
└── build_loop.py           # Continuous build + deploy pipeline
```

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
DATABASE_URL=postgresql://...          # PostgreSQL connection
NEXTAUTH_SECRET=...                    # Random 32-byte secret
NEXTAUTH_URL=https://selah.fm          # Your domain
GOOGLE_CLIENT_ID=...                   # Google OAuth
GOOGLE_CLIENT_SECRET=...               # Google OAuth
STRIPE_SECRET_KEY=sk_test_...          # Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=... # Stripe publishable key
YOUTUBE_API_KEY=...                    # For view verification (optional)
```

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

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET/POST | `/api/campaigns` | List / create campaigns |
| GET | `/api/campaigns/[id]` | Campaign detail |
| GET/POST | `/api/submissions` | List / submit content |
| POST | `/api/review` | Approve / reject submission |
| GET | `/api/creators` | Creator directory |
| GET | `/api/earnings` | Creator earnings |
| GET/PATCH | `/api/notifications` | Get / mark read notifications |
| POST | `/api/stripe` | Create checkout session |
| POST | `/api/stripe/payout` | Process creator payout |
| GET | `/api/stripe/connect` | Stripe Connect onboarding |

---

## Autonomous Agents

Selah.fm uses a fleet of AI agents for continuous improvement:

```bash
python3 orchestrator.py status    # View build progress
python3 autonomous/agent.py once  # Run one improvement cycle
python3 autonomous/agent.py plan  # Show improvement areas
```

---

## Design System

- **Colors:** Midnight background, Sacred Gold (#C9A84C) accent
- **Typography:** Inter (sans-serif)
- **Components:** shadcn/ui (Card, Button, Input, Badge, Progress, Skeleton)
- **Animations:** slide-up, fade-in via Tailwind keyframes

---

## License

Private — all rights reserved.
