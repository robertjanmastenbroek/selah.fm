# Selah.fm — Status & Reference
**Last updated:** 2026-05-11 · **Live:** https://selah.fm

---

## Current State

All core features built, tested, deployed. 44/44 E2E tests pass. TypeScript zero errors. Stripe test payments flowing end-to-end.

### What's Working End-to-End

| Flow | Status |
|------|--------|
| Artist creates campaign | ✅ Dashboard wizard with ImageUpload, GalleryUpload, requirements template, drive link |
| Artist edits campaign | ✅ Full edit form with animated save confirmation |
| Artist deposits funds | ✅ `/checkout?type=deposit` — Stripe Elements, PaymentIntent, webhook |
| Fan donates to campaign | ✅ `/checkout?type=donation` — presets + custom, name/email capture, share CTA |
| Webhook processes payments | ✅ `payment_intent.succeeded` → budget update + donation record + live ticker |
| Creator browses campaigns | ✅ `/browse` with search, sort by popularity |
| Creator submits video | ✅ EarnModal with platform selector, resource pack, earnings preview |
| Artist reviews submission | ✅ Approve/reject with undo (4s), budget deduction, auto-payout |
| Creator gets paid | ✅ Stripe Connect transfer, notification |
| Campaign page renders | ✅ 60/40 desktop split, LiveTicker, MediaCarousel, donations, submissions |
| Share campaign | ✅ ShareModal with native share API + brand logos |
| Support | ✅ AI chatbot on FAQ page + floating widget |

---

## Today's Changes (2026-05-11)

### Payments — Fixed & Hardened
- `automatic_payment_methods` added to both PaymentIntent creation endpoints
- Webhook now correctly references `stripe_payment_intent_id` column
- Database: `stripe_payment_intent_id` + `payment_intent_id` columns added
- Stripe Elements `paymentMethodOrder`: Apple Pay → Google Pay → card
- Regional wallets auto-detected by Stripe (iDEAL for NL, Apple Pay for Safari, Google Pay for Chrome)

### Checkout Page — Complete Redesign
- Big amount input with dollar sign prefix, 0.00 default
- 6 preset buttons (50, 100, 200 recommended, 300, 500, 1000) above input
- Campaign progress circle (72px) with stats
- First name / Last name / Email capture
- Live ticker showing recent activity
- Payment section slides in after amount entered
- Success overlay with share CTA ("Share this campaign")
- Trust signals: SSL encrypted, secure, powered by Stripe

### Campaign Page
- MediaCarousel for gallery images + YouTube videos (horizontal snap-scroll)
- Donations section redesigned (desktop sidebar + mobile) — premium cards, gradient avatars
- SubmissionsFeed polished — clickable cards, platform badges, earnings display, hover arrow
- Google Drive resource pack: prominent bordered card with download icon
- Requirements: "Use template" button in create + edit forms

### Dashboard
- Campaign cards clickable → navigate to campaign page
- Edit form: animated save (spinner → spring checkmark → floating emerald badge → auto-close)
- Google Drive field added to edit form (was only in creation)
- GalleryUpload component for multi-image carousel upload

### Performance
- HTML payload: stripped base64 images (1.1MB → <100KB)
- ISR: campaign pages revalidate every 5s + client refresh after mount
- webpack splitChunks: 50KB min, 200KB max
- AVIF + WebP image formats
- YouTube remote patterns
- React.cache() deduplication for data fetching
- Analytics lazy-loaded (3s delay or first interaction)
- SVG favicon (185KB vector with transparent background)

### Navigation
- FAQ & Support link in hamburger menu + footer
- Messages link in hamburger menu
- Privacy + Terms links in footer

### Core Loop Audit
- Budget now deducted on approval (was missing entirely — critical bug fixed)
- Budget check/deduction uses gross amount (was incorrectly using net)
- Undo restores budget: computes gross from net/0.8

---

## API Endpoints — 45 Total

| Area | Endpoints | Status |
|------|----------|--------|
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

## E2E Tests — 44/44 (100%)

```bash
node e2e/test.js
npx tsc --noEmit
```
