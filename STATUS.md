# Selah.fm — Status & Reference
**Version:** 1.0 · **Live:** https://selah.fm · **Launched:** 2026-05-11

---

## Current State — Production Ready

Selah.fm is live with real Stripe payments, one active campaign, and all core flows operational.

### Recent Changes (2026-05-11)

| Change | Impact |
|--------|--------|
| SEO slug support for campaigns | `/c/artist-song-1234` instead of `/c/uuid` |
| Dual-role system (artist + creator) | Everyone can create campaigns AND submit to them |
| Base64 stripping from OG images | WhatsApp/iMessage link previews work |
| Welcome page → login → onboarding flow | New users go through onboarding before dashboard |
| Stripe Connect capability fix | `card_payments` + `transfers` for US accounts |
| Search-as-you-type on Browse | Filters update as you type (300ms debounce) |
| Homepage server-rendered | Proper SEO metadata on landing page |
| Zero TypeScript errors | Clean build |

### What's Solid

| Area | Status |
|------|--------|
| Campaign creation → checkout → funding | ✅ |
| CPM-based creator marketplace | ✅ |
| Stripe Elements (deposits + donations) | ✅ |
| Webhook processing (payment_intent.succeeded) | ✅ |
| Creator submissions with platform verification | ✅ |
| Artist review + approve/reject with undo | ✅ |
| Stripe Connect payouts (80/20 split) | ✅ |
| Campaign page (60/40 split, LiveTicker, MediaCarousel) | ✅ |
| Browse page with search + filters | ✅ |
| Artist + Creator profiles | ✅ |
| Dashboard with campaign management | ✅ |
| AI support chat | ✅ |
| Admin panel (users, campaigns, submissions, payouts, emails, support chats) | ✅ |
| SEO metadata + JSON-LD schemas | ✅ |
| Empty states, error handling, toast system with undo | ✅ |
| Mobile responsive | ✅ |
| 45 API endpoints | ✅ |
| E2E test suite (44 tests, 100% passing) | ✅ |
| Zero TypeScript errors | ✅ |
| Dual-role (everyone is both artist + creator) | ✅ |
| Referral bonus auto-credit on deposit | ✅ |

### Database
- 1 real campaign (Merhav Yah)
- 2 real users (Robert-Jan as artist + creator)
- Clean production database

### Stripe
- Live keys configured
- Webhook: `https://selah.fm/api/stripe/webhook`
- Connect onboarding for creator payouts
- Capabilities: `transfers` + `card_payments`

---

## What's Next

- View verification automation
- Creator dashboard analytics
- Email campaigns (Resend drip sequences)
- Social proof widgets
- Referral program automation

---

## API Endpoints — 45 Total

| Area | Count | Status |
|------|-------|--------|
| Auth | 9 | ✅ |
| Campaigns | 4 | ✅ |
| Submissions | 2 | ✅ |
| Review | 1 | ✅ |
| Stripe | 4 | ✅ |
| Support | 2 | ✅ |
| Artists | 2 | ✅ |
| Creators | 2 | ✅ |
| Notifications | 2 | ✅ |
| Messages | 2 | ✅ |
| Earnings | 1 | ✅ |
| Analytics | 1 | ✅ |
| Admin | 6 | ✅ |
| Other | 7 | ✅ |

---

## Testing

```bash
npx tsc --noEmit     # zero errors
node e2e/test.js     # 44 tests, 100% passing
```
