# Selah.fm — README

https://selah.fm — CPM marketplace for music promotion.

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

## Architecture

- **Framework:** Next.js 14 (App Router), TypeScript
- **Database:** PostgreSQL (Neon, Railway)
- **Payments:** Stripe Elements + Connect (80/20 split)
- **Styling:** Tailwind CSS, Framer Motion, shadcn/ui
- **Email:** Resend

## Project Structure

```
app/
├── page.tsx              # Landing
├── layout.tsx            # Root layout + SEO
├── c/[id]/               # Campaign detail
├── browse/               # Campaign browser
├── dashboard/            # Artist dashboard
├── checkout/             # Unified Stripe checkout
├── review/               # Submission review
├── earnings/             # Creator earnings
├── artists/[id]/         # Artist profile
├── creators/[id]/        # Creator profile
├── login/                # Auth
├── faq/                  # FAQ + support chat
├── settings/             # User settings
└── admin/                # Admin panel
    ├── page.tsx          # Overview
    ├── users/            # User management
    ├── campaigns/        # Campaign management
    ├── submissions/      # Submission management
    ├── payouts/          # Payout management
    ├── emails/           # Email inbox + compose
    └── support-chats/    # Chat history

lib/
├── db.ts                 # Database pool
├── auth.ts               # Session management
├── data.ts               # Data fetching layer
├── db/schema.sql         # Database schema
└── db/migrations/        # Migration files

components/
├── TopNav.tsx            # Header navigation
├── Toast.tsx             # Toast notification system
├── States.tsx            # EmptyState + ErrorState
├── LiveTicker.tsx        # Real-time donation ticker
├── EarnModal.tsx         # Creator submission modal
├── MediaCarousel.tsx     # Image/video carousel
├── CampaignCover.tsx     # Campaign cover image
├── GalleryUpload.tsx     # Multi-image upload
├── SocialIcons.tsx       # Platform badges
├── SupportWidget.tsx     # AI chat widget
├── CircleProgress.tsx    # Circular progress bar
├── CreatorAvatar.tsx     # Creator avatar
├── SubmissionsFeed.tsx   # Approved submissions feed
└── CheckoutForm.tsx      # Stripe Elements wrapper
```

## API — 45 Endpoints

| Area | Endpoints |
|------|-----------|
| Auth | signup, login, logout, me, magic-link, google oauth, signup/finalize, auth/google |
| Campaigns | GET list, POST, GET/PATCH by id |
| Submissions | GET list, POST |
| Review | POST approve/reject |
| Stripe | create-payment-intent, webhook, connect-login, connect-refresh, support, payout |
| Support | chat POST, chat GET |
| Artists | list, detail |
| Creators | list, detail |
| Notifications | list, mark-read |
| Messages | list, send |
| Earnings | summary |
| Analytics | stats |
| Admin | overview, manage, users, campaigns, submissions, payouts, emails, support-chats, seed(disabled) |
| Other | live-ticker, stats/totals, oauth/google, admin/emails/inbound |

## Testing

```bash
npx tsc --noEmit     # type check
node e2e/test.js     # 44 E2E tests
```

## Deployment

Auto-deployed on `git push origin main` via Railway.
