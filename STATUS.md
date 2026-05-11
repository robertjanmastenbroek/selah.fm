# Selah.fm — Status & Reference
**Last updated:** 2026-05-11 · **Live:** https://selah.fm

---

## Current State — Production Ready

All core features built, tested, deployed. 44/44 E2E tests pass. TypeScript zero errors.

### Recent Work (Today)

**Campaign Edit Polish**
- Save button: spinner → spring checkmark "Saved" → auto-close with floating confirmation badge
- Edit form includes all fields: cover image, track title, campaign headline, Spotify URL, Google Drive link, CPM lock info, max payout, min video length, hashtags, caption requirements, requirements template, YouTube video URL, gallery carousel uploader, platform selector, FTC toggle
- Campaign page cache: 5s revalidation + client-side refresh after mount — edits appear live instantly

**Google Drive / Resource Pack**
- Creator resource pack front-and-center in EarnModal (always visible, download card when available, amber warning when missing)
- Campaign page: prominent bordered card with download icon and detailed description
- Dashboard creation wizard: comprehensive amber info box listing exactly what to include (.wav, .mp3, cover art, reference videos, brand assets) with social proof
- Edit form: Google Drive field added (was only in creation wizard before)

**Gallery Carousel**
- MediaCarousel component: horizontal snap-scroll with dot indicators
- Image cards → tap to open full-screen lightbox
- Video cards → YouTube thumbnail with play button → opens embedded player
- GalleryUpload component in edit form: drag-drop ImageUpload for multiple images, YouTube URL inputs with auto-thumbnails
- Backward-compatible with legacy URL arrays and new GalleryItem[] format

**Submissions**
- Server-side status filtering: `?status=pending|approved|rejected` — rejected submissions never reach the review page client
- Review page + SubmissionsFeed now use server-side filtering (no client-side races)

**Dashboard**
- Campaign cards clickable → navigate to campaign page
- Inner buttons (Review, Edit, Add budget) use stopPropagation

**Requirements Template**
- "Use template" button in both creation wizard and edit form fills a comprehensive guide (audio usage, video format, content ideas, must-include, prohibited, tips)
- Auto-inserts artist's required hashtags

---

## Core Infrastructure Loop — Need Final Polish

These four components are the engine. Each needs zero-defect completeness:

| Component | Current State | Priority |
|-----------|--------------|----------|
| **Payments** (Stripe deposits + donations) | ✅ Working. Stripe Elements embedded. Webhook handles payment_intent.succeeded. Full gross amount added to budget. | Audit edge cases |
| **Submissions** | ✅ Working. Server-side status filter. Rate limited. Platform verification. Ticker events. | Audit edge cases |
| **Reviews** | ✅ Working. Approve/reject with undo (4s window). Auto-payout on approval. Notifications sent. | Audit edge cases |
| **Payouts** | ✅ Working. Stripe Connect auto-payout. 80/20 split. Max payout cap. Budget check. | Audit edge cases |

---

## API Endpoints — 45 Total

| Area | Endpoints | Status |
|------|----------|--------|
| Auth | 9 (signup, login, logout, me, verify-email, forgot-password, reset-password, oauth/google, google callback) | ✅ |
| Campaigns | 4 (list, create, detail, update) | ✅ |
| Submissions | 2 (list, create) | ✅ |
| Review | 1 (approve/reject) | ✅ |
| Stripe | 4 (checkout, webhook, payout, connect) | ✅ |
| Support | 2 (campaign support/donate, FAQ bot) | ✅ |
| Artists | 2 (list, profile) | ✅ |
| Creators | 2 (list, profile) | ✅ |
| Notifications | 2 (list, update) | ✅ |
| Messages | 2 (list, send) | ✅ |
| Earnings | 1 | ✅ |
| Analytics | 1 | ✅ |
| Admin | 6 (overview, users, emails, manage, seed, migrate) | ✅ |
| Other | 7 (health, stats, sitemap, spotify, ratings, bugs, referral) | ✅ |

---

## E2E Tests — 44/44 (100%)

```bash
node e2e/test.js  # 44 tests, all passing
npx tsc --noEmit  # zero errors
```
