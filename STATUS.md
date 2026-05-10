# Selah.fm — Status & Reference
**Last updated:** 2026-05-11 · **Version:** 34
**Live:** https://selah.fm · **Admin:** https://selah.fm/admin

---

## V1.0 Launch Readiness

### Core Value Loop ✅ Complete

| Step | Feature | Status |
|------|---------|:------:|
| 1 | Artist signs up, creates campaign with budget + track | ✅ |
| 2 | Artist deposits funds via Stripe Elements | ✅ |
| 3 | Creator discovers campaign, submits video link | ✅ |
| 4 | Artist reviews video, approves/rejects | ✅ |
| 5 | Views verified, creator paid via Stripe Connect | ✅ |
| 6 | Fans donate to campaigns via crowdfunding | ✅ |
| 7 | Share + viral growth loop | ✅ |

### V1.0 Spec Checklist

| Category | Feature | Status |
|----------|---------|:------:|
| **Auth** | Google OAuth signup/login | ✅ |
| | Email/password with bcrypt | ✅ |
| | Email verification (Resend) | ✅ |
| | Password reset self-service | ✅ |
| | Session management (HMAC) | ✅ |
| **Artist** | Create campaign with budget/CPM | ✅ |
| | Inline campaign editing (all fields) | ✅ |
| | Fund campaign (Stripe Elements, on-platform) | ✅ |
| | Review submissions with undo | ✅ |
| | Two-way rating (rate creators) | ✅ |
| | Dashboard with stats | ✅ |
| **Creator** | Browse campaigns with search/filter | ✅ |
| | Video submission (TikTok/Reels/Shorts) | ✅ |
| | Earnings dashboard with Stripe Connect | ✅ |
| | Analytics (platform breakdown, monthly trends) | ✅ |
| | Two-way rating (rate artists) | ✅ |
| **Campaign** | GoFundMe-inspired layout | ✅ |
| | Media carousel (cover, video, share graphics) | ✅ |
| | Two-column desktop hero with stats sidebar | ✅ |
| | Circle progress + live stats | ✅ |
| | Submissions feed (social proof) | ✅ |
| | Trust footer (three-column) | ✅ |
| | Sticky CTA on mobile | ✅ |
| **Donations** | Dedicated donate page | ✅ |
| | Stripe Elements (on-platform, no redirect) | ✅ |
| | Celebration/confetti success screen | ✅ |
| | Live donation ticker | ✅ |
| | Supporter list with messages | ✅ |
| **Sharing** | Share modal with copy link | ✅ |
| | Social platform buttons | ✅ |
| | Pre-written share copy | ✅ |
| | "Create Video" CTA inside share modal | ✅ |
| **Email** | Resend API (info@selah.fm, support@selah.fm) | ✅ |
| | Welcome email, verification email, password reset | ✅ |
| | Donation notification email | ✅ |
| | Admin inbox (read, reply, compose with images) | ✅ |
| | Email logs with delivery status | ✅ |
| **Admin** | Overview dashboard | ✅ |
| | User management | ✅ |
| | Campaign management | ✅ |
| | Submission management | ✅ |
| | Payout management | ✅ |
| | Bug tracking with auto-detection | ✅ |
| | Support chat logs viewer | ✅ |
| | Email inbox (send + receive) | ⚠️ Needs MX record |
| **Compliance** | Terms of Service | ✅ |
| | Privacy Policy | ✅ |
| | Content Guidelines | ✅ |
| | FAQ (35 questions) | ✅ |
| **Security** | bcrypt passwords (12 rounds) | ✅ |
| | Stripe webhook signature verification | ✅ |
| | Rate limiting (auth, campaigns, submissions, review, stripe) | ✅ |
| | Admin middleware with server-side auth | ✅ |
| | No credentials in git history | ✅ |
| **Anti-abuse** | URL validation for submissions | ✅ |
| | Review/approval gate for all content | ✅ |
| | Manual rejection with feedback | ✅ |
| **Payments** | Stripe Checkout (deposit + donation) | ✅ |
| | Stripe Connect (creator payouts) | ✅ |
| | Stripe webhook for PaymentIntents | ✅ |
| | Referral bonuses on first deposit | ✅ |
| **Performance** | Shared SWR config (30s dedup) | ✅ |
| | Cache-Control headers | ✅ |
| | Lazy loading on images | ✅ |
| | Preconnect hints | ✅ |
| | CSS grain texture (0 DOM nodes) | ✅ |
| **Testing** | E2E test suite | ✅ 44/44 |
| **SEO** | Dynamic sitemap (campaigns, artists, creators) | ✅ |
| | OG metadata per campaign page | ✅ |
| | robots.txt | ✅ |

### Status: 57/58 features complete (98%)

### One Remaining Gap

| # | Gap | Why not critical for V1 |
|---|-----|------------------------|
| 1 | **URL malware scanning** | All submissions pass through artist review before going public. Artists are the human antivirus — they watch every video before approving. Add automated scanning in V1.1 when volume demands it. |

---

## Platform Metrics

| Metric | Count |
|--------|-------|
| Pages | 28 |
| API routes | 41 |
| Components | 35 |
| E2E tests | 44/44 (100%) |
| Git commits | 280+ |

---

## Config Tasks for V1.0 Launch

| Priority | Task | How |
|----------|------|-----|
| 🔴 | Switch Stripe to live mode | Railway: `STRIPE_SECRET_KEY=sk_live_...`, `STRIPE_WEBHOOK_SECRET=whsec_...`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...` |
| 🔴 | Set up Stripe webhook for live | Stripe Dashboard → Webhooks → `https://selah.fm/api/stripe/webhook` listening for `payment_intent.succeeded` |
| 🟡 | Add Resend MX record | Resend dashboard → Domains → selah.fm → MX record. Add to Namecheap Advanced DNS. Enables receiving emails at info@ and support@. |
| 🟡 | Run `/api/admin/migrate` | Creates new tables (campaign_donations, email_logs, inbound_emails, etc.) |
| 🟡 | Set `RESEND_AUDIENCE_ID` | From resend.com/audiences — enables user sync for broadcast emails |
| 🟢 | Set `CRON_SECRET` | Random string in Railway — protects `/api/cron` |
| 🟢 | Set Spotify API keys | Optional — enables monthly listeners stat on campaign pages |

---

## Module Registry

```
selah.fm/
├── app/ (28 pages + 41 API routes)
│   ├── admin/ (6 pages: overview, users, campaigns, submissions, payouts, emails, bugs, chats, seed)
│   ├── api/ (41 route files)
│   ├── artists/ (directory + profile)
│   ├── browse/ (campaign discovery, server-rendered)
│   ├── c/[id]/ (campaign detail + donate page)
│   ├── creators/ (directory + profile)
│   ├── dashboard/ (artist campaign management + editing)
│   ├── earnings/ (creator earnings + Stripe Connect)
│   ├── faq/ (35 questions)
│   ├── login/ (auth + signup + verification + password reset)
│   ├── onboarding/ (localStorage persistence)
│   ├── review/ (artist review with undo)
│   ├── settings/ (profile management)
│   ├── analytics/ (creator dashboard)
│   ├── content-guidelines/ + privacy/ + tos/
│   ├── open-source/ + report-bug/
│   ├── welcome-artists/ + welcome-creators/
│   ├── sitemap.ts (dynamic, DB-driven)
│   └── error.tsx, global-error.tsx, loading.tsx, not-found.tsx
├── components/ (35 files)
│   ├── TopNav, BottomNav, CampaignCover, CampaignSearch
│   ├── ChatWidget, NotificationBell, SupportWidget
│   ├── ImageUpload, ImageCropper, CreatorAvatar
│   ├── StripePaymentModal, PaymentSuccess
│   ├── SubmissionsFeed, VideoEmbed
│   ├── RatingPrompt, RippleButton, useRipple
│   ├── SocialIcons, ShareModal (inline)
│   └── ErrorBoundary, PageErrorBoundary, PageTransition, Toast
├── lib/
│   ├── db.ts, auth.ts, validation.ts, email-templates.ts
│   ├── swr-config.ts, analytics.ts, spotify.ts, fees.ts, defaults.ts
│   └── rate-limit.ts, constants.ts, utils.ts, resend-audience.ts
├── e2e/test.js (44 scenarios, 100%)
├── middleware.ts (admin session guard)
├── next.config.js (security headers, cache, image domains)
└── tailwind.config.js (design tokens + animations)
```

---

## E2E Test Coverage (44/44)

```
1. Public Pages      8/8   ✅
2. Welcome Pages     2/2   ✅
3. Navigation        4/4   ✅
4. Browse            3/3   ✅
5. Artists           1/1   ✅
6. Creators          1/1   ✅
7. Auth              4/4   ✅
8. Protected Pages   6/6   ✅
9. Campaign Detail   1/1   ✅
10. 404              1/1   ✅
11. Mobile           3/3   ✅
12. SEO              2/2   ✅
13. API Health       2/2   ✅
14. Accessibility    2/2   ✅
```

---

## Environment Variables

| Variable | Required | Purpose |
|----------|:---:|---------|
| `DATABASE_URL` / `DATABASE_PRIVATE_URL` | 🔴 | PostgreSQL |
| `NEXTAUTH_SECRET` | 🔴 | Session HMAC |
| `NEXTAUTH_URL` | 🔴 | Base URL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | 🔴 | Google OAuth |
| `STRIPE_SECRET_KEY` | 🔴 | Stripe API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 🔴 | Stripe frontend |
| `STRIPE_WEBHOOK_SECRET` | 🔴 | Webhook verification |
| `RESEND_API_KEY` | 🟡 | Email delivery |
| `DEEPSEEK_API_KEY` | 🟡 | AI support chat |
| `NEXT_PUBLIC_GA_ID` | 🟡 | Google Analytics |
| `YOUTUBE_API_KEY` | 🟡 | YouTube view verification |
| `CRON_SECRET` | 🟡 | Protects /api/cron |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | 🟢 | Spotify stats |
| `RESEND_AUDIENCE_ID` | 🟢 | User sync for broadcasts |
