# Selah.fm — v1.0 🚀

**CPM marketplace for music promotion.** Artists set CPM rates and fund campaigns via Stripe. Creators make TikToks, Reels, and Shorts. Artists review and approve every submission. Creators get paid for verified views. Fans donate to campaigns.

🌐 [selah.fm](https://selah.fm) · 📊 [Status](./STATUS.md) · ⚡ [Performance](./PERFORMANCE.md)

---

## How It Works

```
Artist:  Create campaign → Set CPM + budget → Deposit via Stripe
Creator: Browse campaigns → Pick track → Make content → Submit link
Artist:  Review video → Approve or reject
Creator: Get paid per verified view (80% of CPM)
Fan:     Browse campaign → Donate any amount → Support the track
```

---

## Tech Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · PostgreSQL (Neon) · Stripe (Elements + Connect + Webhooks) · Google OAuth · Resend · Railway

---

## Project Structure

```
selah.fm/
├── app/                    # 28 pages + 45 API routes
│   ├── browse/             # Campaign discovery
│   ├── c/[id]/             # Campaign detail + donate
│   ├── artists/[id]/       # Artist profile
│   ├── creators/[id]/      # Creator profile
│   ├── dashboard/          # Artist dashboard (create/manage campaigns)
│   ├── review/             # Review submissions
│   ├── earnings/           # Creator earnings + payouts
│   ├── settings/           # Profile settings
│   ├── analytics/          # Creator analytics
│   ├── onboarding/         # Artist onboarding
│   ├── login/              # Auth (Google + email)
│   └── api/                # 45 endpoints (auth, campaigns, submissions, stripe, admin, etc.)
├── components/             # 40+ React components
│   ├── EarnModal.tsx       # Enterprise-grade submission modal
│   ├── MediaCarousel.tsx   # Gallery image/video carousel
│   ├── GalleryUpload.tsx   # Multi-image upload with ImageUpload
│   ├── ImageUpload.tsx     # Drag-drop with crop
│   ├── LiveTicker.tsx      # Real-time event scroller
│   ├── StripePaymentModal  # Embedded Stripe Elements
│   └── ...
├── lib/                    # DB, auth, validation, rate-limit, analytics
├── e2e/                    # 44 Playwright tests
└── public/                 # Static assets
```

---

## Key Features

- **Campaign pages** — 60/40 desktop split, LiveTicker, EarnModal, MediaCarousel, Share modal with native APIs
- **Dashboard** — Create/edit campaigns with ImageUpload, GalleryUpload, requirements template, Google Drive field
- **EarnModal** — Auth gating, earnings preview, official platform logos, creator resource pack
- **Payments** — Stripe Elements embedded, full gross amount to budget, donations at `/c/[id]/donate`
- **Reviews** — Approve/reject with 4s undo window, auto-payout on approval
- **SEO** — JSON-LD schemas, OG/Twitter metadata, dynamic sitemap, keyword table

---

## Getting Started

```bash
npm install
# Set DATABASE_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
# STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env.local
npm run dev
```

### Test

```bash
node e2e/test.js                          # 44 tests
TEST_URL=http://localhost:3000 node e2e/test.js
```

### Deploy

Push to `main` → Railway auto-deploys.

---

## Environment Variables

```bash
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...                    # openssl rand -base64 32
NEXT_PUBLIC_URL=https://selah.fm
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
# Optional: RESEND_API_KEY, DEEPSEEK_API_KEY, CRON_SECRET, YOUTUBE_API_KEY, SPOTIFY_CLIENT_ID/SECRET
```
