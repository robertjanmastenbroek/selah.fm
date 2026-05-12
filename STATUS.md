# Selah.fm — Status & Reference
**Version:** 1.0 · **Live:** https://selah.fm · **Updated:** 2026-05-12

---

## Current State — Production Ready

Selah.fm is live with real Stripe payments, a published blog, interactive tools, and all core flows operational.

### What We Built (May 9–12, 2026)

#### Core Platform
| Area | Status |
|------|--------|
| Campaign creation → checkout → funding | ✅ |
| CPM-based creator marketplace | ✅ |
| Stripe Elements (deposits + donations) | ✅ |
| Webhook processing + referral auto-credit | ✅ |
| Creator submissions with platform verification | ✅ |
| Artist review + approve/reject with 4s undo | ✅ |
| Stripe Connect payouts (80/20 split) | ✅ |
| Campaign detail page (60/40 split, LiveTicker, MediaCarousel, Share) | ✅ |
| Browse page with search-as-you-type (300ms debounce) | ✅ |
| Artist + Creator profiles with hire flow | ✅ |
| Dashboard with campaign management + inline edit | ✅ |
| Welcome landing pages → login → onboarding flow | ✅ |
| Earnings page with Stripe Connect setup | ✅ |
| Analytics page (platform breakdown, monthly trends) | ✅ |
| AI support chat + FAQ (40+ entries) | ✅ |
| Report-a-bug form | ✅ |
| Admin panel (users, campaigns, submissions, payouts, emails, support chats, blog, content) | ✅ |
| SEO: JSON-LD schemas, OG/Twitter metadata, canonical URLs, sitemap | ✅ |
| SEO campaign slugs (`/c/artist-song-1234`) | ✅ |
| Dual-role system (everyone is both artist + creator) | ✅ |
| Google Analytics: server-side Measurement Protocol | ✅ |
| 55+ API routes · 44 E2E tests · Zero TypeScript errors | ✅ |
| Mobile responsive · Empty states · Error handling · Toast notifications | ✅ |

#### Blog System
| Area | Status |
|------|--------|
| DeepSeek article generation with founder voice | ✅ |
| Anti-AI-detection guardrails (7 patterns broken, 30 banned words) | ✅ |
| SEO template: ToC + Key Takeaways + FAQ + bulleted lists | ✅ |
| Pexels image cache → local domain, never broken images, dedup | ✅ |
| Blog post page with typography + related posts + CTA | ✅ |
| Admin preview → editor → publish/schedule workflow | ✅ |
| Content Hub: unified pipeline visualization | ✅ |
| Generate from Voice: interview library → blog post in one click | ✅ |
| Blog listing page + footer link | ✅ |
| Sitemap with blog posts (priority 0.9) | ✅ |
| 1 published post (Worlds Collide founder story) | ✅ |

#### Interview Studio
| Area | Status |
|------|--------|
| Voice-powered interview capture (browser SpeechRecognition) | ✅ |
| 52 topics across 9 categories | ✅ |
| Context-aware question generation (avoids repeats) | ✅ |
| Voice library: 220 chunks, 45 answers, 5 sessions | ✅ |
| Coverage tracking with category progress bars | ✅ |
| Audio activity visualization (sound waves + silent pulsing dot) | ✅ |
| Answer persistence (saved immediately to DB) | ✅ |

#### Data-Driven SEO Tools
| Area | Status |
|------|--------|
| CPM Calculator — live DB data, platform comparison, interactive sliders | ✅ |
| Creator Earnings Estimator — monthly earnings with 3-platform comparison | ✅ |
| Promotion Budget Planner — what $10-$500 buys at live CPM | ✅ |
| Old 46 thin SEO pages removed + 301 redirects in place | ✅ |
| Tools in sitemap (weekly, priority 0.8) | ✅ |

### Known Issues

| Issue | Status |
|-------|--------|
| Inbound email (Resend webhook → admin inbox) | ⚠️ Endpoint rewritten, needs subdomain DNS + testing |
| View verification automation | 📋 Planned |
| Email campaigns (Resend drip sequences) | 📋 Planned |
| Marketing / User acquisition | 🔴 In research phase |

### Database
- 1 live campaign (Merhav Yah, $0.10 CPM, $25 budget)
- 1 published blog post
- Voice library: 220 chunks, ~45 answers across 5 sessions
- Migrations: 001–010 applied

### Stripe
- Live keys, webhook, Connect configured
- Capabilities: `transfers` + `card_payments`

### Google Analytics
- Property: G-K0T51LCSCT
- Server-side Measurement Protocol (GA_API_SECRET configured)
- Events: sign_up, login, create_campaign, fund_campaign, donation, submit_content, approve_submission

---

## API Endpoints — 55+ Total

| Area | Count | Status |
|------|-------|--------|
| Auth | 9 | ✅ |
| Campaigns | 4 | ✅ |
| Submissions | 2 | ✅ |
| Review | 1 | ✅ |
| Stripe | 5 | ✅ |
| Support | 2 | ✅ |
| Artists | 2 | ✅ |
| Creators | 3 | ✅ |
| Notifications | 2 | ✅ |
| Messages | 2 | ✅ |
| Earnings | 1 | ✅ |
| Analytics | 1 | ✅ |
| Admin | 12 | ✅ |
| Blog/Cron | 3 | ✅ |
| Interview | 1 | ✅ |
| Other | 5 | ✅ |

---

## Testing

```bash
npx tsc --noEmit       # zero errors
node e2e/test.js       # 44 tests, 100% passing
```

## What's Next (Priority Order)

1. **Marketing engine** — user acquisition strategy (100 users/day target) — **current focus**
2. View verification automation
3. Email drip campaigns (Resend)
4. Voice library expansion (interview more topics)
5. Blog publishing (answer remaining 27 interviews, generate posts, set up cron)
