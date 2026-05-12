# Selah.fm — Status & Reference
**Version:** 1.0 · **Live:** https://selah.fm · **Updated:** 2026-05-12

---

## Current State — Production Ready

Selah.fm is live with real Stripe payments, a published blog, and all core flows operational.

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
| Admin panel (users, campaigns, submissions, payouts, emails, support chats, blog) | ✅ |
| SEO: JSON-LD schemas, OG/Twitter metadata, canonical URLs, sitemap | ✅ |
| SEO campaign slugs (`/c/artist-song-1234`) | ✅ |
| Dual-role system (everyone is both artist + creator) | ✅ |
| Google Analytics: server-side Measurement Protocol | ✅ |
| 55+ API routes · 44 E2E tests · Zero TypeScript errors | ✅ |
| Mobile responsive · Empty states · Error handling · Toast notifications | ✅ |

#### Blog System
| Area | Status |
|------|--------|
| Batch blog engine (monthly 30-post cycles) | ✅ |
| DeepSeek article generation with founder voice | ✅ |
| Anti-AI-detection guardrails (7 patterns broken) | ✅ |
| SEO template: ToC + Key Takeaways + FAQ + bulleted lists | ✅ |
| Image validation + fallback (never broken images) | ✅ |
| Blog post page with typography + related posts + CTA | ✅ |
| Admin preview → editor → publish workflow | ✅ |
| Blog listing page | ✅ |
| 469 keyword database across 6 content pillars | ✅ |
| Sitemap with blog posts (priority 0.9) | ✅ |
| 1 published post (Worlds Collide founder story) | ✅ |

#### Interview Studio
| Area | Status |
|------|--------|
| Voice-powered interview capture (browser SpeechRecognition) | ✅ |
| 52 topics across 9 categories | ✅ |
| Context-aware question generation (avoids repeats) | ✅ |
| Voice library: 140 chunks across 3 topics | ✅ |
| Coverage tracking with progress bars | ✅ |
| Answer persistence (saved immediately to DB) | ✅ |

#### OG Image
| Area | Status |
|------|--------|
| Midjourney-generated social sharing image | ✅ |
| 1200×630 JPEG, 145KB | ✅ |
| Applied to: homepage, campaign pages, blog fallback | ✅ |

### Known Issues

| Issue | Status |
|-------|--------|
| Inbound email (Resend webhook → admin inbox) | ⚠️ Endpoint rewritten, needs subdomain DNS + testing |
| View verification automation | 📋 Planned |
| Email campaigns (Resend drip sequences) | 📋 Planned |
| Marketing/User acquisition | 🔴 Starting now |

### Database
- 1 live campaign (Merhav Yah)
- 1 published blog post
- Voice library: 140 chunks, 3 topics covered
- Migrations: 001–010 applied

### Stripe
- Live keys, webhook, Connect all configured
- Capabilities: `transfers` + `card_payments`

### Google Analytics
- Property: G-K0T51LCSCT
- Server-side Measurement Protocol (GA_API_SECRET configured)
- Events: sign_up, login, create_campaign, fund_campaign, donation, submit_content, approve_submission

### Blog System
- Published: 1 post (Worlds Collide founder story)
- 30 interviews in May 2026 batch (3 answered, 27 pending)
- Daily cron at 09:00 UTC via Railway cron (needs setup)

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

1. **Marketing engine** — automated user acquisition (100 users/day target)
2. View verification automation
3. Email drip campaigns (Resend)
4. Voice library expansion (interview more topics)
5. Blog batch answer + generate + publish flow
