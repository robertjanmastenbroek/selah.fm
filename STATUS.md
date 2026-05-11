# Selah.fm — Status & Reference
**Version:** 1.0 · **Live:** https://selah.fm · **Launched:** 2026-05-11

---

## Current State — Production Ready

Selah.fm is live with real Stripe payments, one active campaign, and all core flows operational.

### What We Built (May 9–11, 2026)

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
| Earnings page with Stripe Connect setup + success banner | ✅ |
| Analytics page (platform breakdown, monthly trends, recent subs) | ✅ |
| AI support chat + FAQ (40+ entries) | ✅ |
| Report-a-bug form | ✅ |
| Admin panel (users, campaigns, submissions, payouts, emails, support chats) | ✅ |
| SEO: JSON-LD schemas, OG/Twitter metadata, canonical URLs, sitemap | ✅ |
| SEO campaign slugs (`/c/artist-song-1234` instead of UUIDs) | ✅ |
| OG image base64 stripped — WhatsApp/iMessage previews work | ✅ |
| Homepage server-rendered with metadata | ✅ |
| Empty states, error states, toast notifications with undo | ✅ |
| Dual-role system — everyone is both artist + creator | ✅ |
| Google Analytics: server-side Measurement Protocol for all key events | ✅ |
| 55+ API routes | ✅ |
| 44 E2E tests (100% passing) | ✅ |
| Zero TypeScript errors | ✅ |
| Mobile responsive | ✅ |

### Known Issues

| Issue | Status |
|-------|--------|
| Inbound email (Resend webhook → admin inbox) | ⚠️ Endpoint rewritten, needs subdomain DNS + testing |
| View verification automation | 📋 Planned |
| Email campaigns (Resend drip sequences) | 📋 Planned |

### Database
- 1 live campaign (Merhav Yah)
- Clean production database on Railway/Neon
- Migrations: 001–009 applied

### Stripe
- Live keys, webhook, Connect all configured
- Capabilities: `transfers` + `card_payments`

### Google Analytics
- Property: G-K0T51LCSCT
- Server-side tracking via Measurement Protocol (GA_API_SECRET configured)
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
| Admin | 10 | ✅ |
| Other | 11 | ✅ |

---

## Testing

```bash
npx tsc --noEmit       # zero errors
node e2e/test.js       # 44 tests, 100% passing
node e2e/test-ga-events.js  # GA format verification
node e2e/test-ga-final.js   # End-to-end GA signup+login
```
