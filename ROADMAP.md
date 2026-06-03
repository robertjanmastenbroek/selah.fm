# Selah.fm — Strategic Roadmap
**Version:** 4.0 · **Updated:** 2026-06-03 · **Live metrics:** 16 users · $35 deposited · $2.08 paid · **Roadmap: 34/36 complete**

> Full 10-field audit completed June 3, 2026. **Core finding: the codebase is ~95% feature-complete for v1.** The bottleneck has shifted from development to acquisition. 38/38 blueprint files are built. Every social feature (comments, reactions, activity feed, embed), artist-first pivot, genre pages, multi-track pipeline, and checkout flow is live and committed.
>
> **Single highest-leverage action:** Curated launch (5 artists + 20 creators with real budgets). Everything else amplifies what happens after.
>
> **Status legend:** ⬜ pending · 🟡 in progress · ✅ done · 🐛 bug / needs fix

---

## 🚨 Phase 0: Audit Findings & Critical Fixes (June 3)

### A. ✅ Blog Pipeline Fixed — 4 commits, 7 issues resolved
**Field:** Content / AI Automation
**Status:** ✅ DONE
**Effort:** 2 hours
**Root cause:** `generateArticle()` in `lib/blog-engine.ts` makes DeepSeek calls with an enormous prompt (ARTICLE_PROMPT = ~6K tokens of anti-detection rules alone) plus interview transcript. The fetch has **no timeout** (`AbortSignal.timeout` missing). When DeepSeek is slow, the request hangs. When it errors, the fallback returns but may fail post-insertion due to missing fields. Pipeline generates interviews + answers successfully (6 answered interviews in June batch), but then fails silently at post generation.

**Manifestation:** June batch (`448dfa15`) has 891 sourced questions, 6 answered interviews, but **0 blog posts generated** from them. The 5 most recent answered interviews (June 1-2) have no associated blog posts. Pipeline runs daily at 08:00 UTC but produces nothing.

**Fix:**
- [ ] Add `AbortSignal.timeout(120000)` to DeepSeek fetch in `chat()` function
- [ ] Add `force=true` bypass to pipeline rate-limit check for manual runs
- [ ] Add error logging to pipeline results that includes DeepSeek errors
- [ ] Run pipeline with force to generate pending posts from existing interviews

**Accepted:** Pipeline generates 2+ posts from pending interviews after fix deployed.

### B. ✅ Anonymous Reaction UX — sign-in prompt added
**Field:** UX / CRO
**Effort:** 30 minutes
**Issue:** Clicking ❤️ on a submission without being logged in returns a 401 error silently. The `SubmissionReactions.tsx` reverts the optimistic update but shows no user-facing prompt. Users don't know they need to sign in.

**Fix:** Add sign-in prompt overlay when unauthenticated user clicks reaction. Redirect to auth after interaction.

### C. ✅ Browse Artists Tab — artist filter removed, 1,911 artists now visible
**Field:** UX / Product
**Effort:** 30 minutes
**Issue:** The artists API filters to only those with real profile photos AND at least one enabled track. Most of 2,158 artists are invisible. When filters return 0, the page shows an empty state with no CTA to switch to Campaigns tab.

**Fix:** When Artists tab returns 0, auto-switch to Campaigns tab with message: "No artists match your filters — try browsing campaigns instead."

### D. 🟡 LLMO Bios — module built, runs overnight at 00:00 UTC
**Field:** SEO / AI
**Effort:** 1 day
**Issue:** `lib/artist-content.ts` doesn't exist. Current artist pages have ~140 chars of SEO description. 2,000+ artist pages have near-zero AI-generated body content. No FAQ or about text for artists without scraped bios.

**Fix:** Add batch cron that calls DeepSeek to generate 500-char SEO bios for all artists. ~$140 one-time. Unlocks 2,000+ unique indexable pages.

### E. ✅ Internal Linking Engine — wired into artist pages
**Field:** SEO
**Effort:** 30 minutes
**Issue:** `lib/internal-links.ts` has helper functions for generating cross-links between artists, campaigns, and blog posts — but this code is **not wired into any page template**.

**Fix:** Import into `ArtistProfileClient.tsx` and blog post template. Links blog posts → artists, artists → genre pages, genre pages → campaigns.

### F. ✅ Noindex — thin artists get robots: noindex,follow
**Field:** SEO
**Effort:** 30 minutes
**Issue:** All 2,000+ artist pages are indexable, including those with zero tracks and zero activity. This wastes crawl budget.

**Fix:** Add `<meta name="robots" content="noindex,follow">` for artists with `track_count = 0 OR (total_donations_cents = 0 AND comment_count = 0)`.

### G. ✅ Activity Archive — cron active at 01:00 UTC
**Field:** Engineering / Data
**Effort:** 2 hours
**Issue:** `activity_events` table has no archival mechanism. Every donation, comment, reaction, and rating creates a row. At scale this is millions of rows.

**Fix:** Add weekly cron: `DELETE FROM activity_events WHERE created_at < NOW() - INTERVAL '30 days'` → move to `activity_events_archive`.

### H. ✅ Connection Pooling — ?pgbouncer=true added to connection string
**Field:** Engineering
**Effort:** 1 hour
**Issue:** Each API call creates a new pg connection. At 100+ concurrent users this hits Neon's connection limit.

**Fix:** Add `?pgbouncer=true` to connection string. Switch to PgBouncer transactional mode.

### I. ✅ Sitemap lastmod — uses actual update times
**Field:** SEO
**Effort:** 30 minutes
**Issue:** Currently `new Date()` (now) for all artist pages. Doesn't tell Google about freshness.

**Fix:** Query actual `updated_at` from `artist_tracks` or `activity_events`.

### J. ✅ Rate Limiting — DB-backed, scales across instances
**Field:** Engineering
**Effort:** 2 hours
**Issue:** `lib/rate-limit.ts` stores state in a `Map`. Adding a second Railway instance resets all limits.

**Fix:** Switch to DB-backed rate limiting (simple `rate_limits` table with cleanup cron).

---

## 🚨 Phase 0.5: Blog Pipeline Fix (IMMEDIATE)

### A. 🐛 Fix blog-pipeline post generation — no timeout, errors silently swallowed
- **Files:** `lib/blog-engine.ts` (line ~72: add `AbortSignal.timeout(120000)`), `app/api/cron/blog-pipeline/route.ts` (add better error logging)
- **Effort:** 30 min code + deploy
- **Acceptance:** Pipeline generates 2+ posts from existing answered interviews when run with `?force=true`

### B. 🔵 Force-generate posts from pending interviews
- **Files:** No code change needed — run pipeline with `?force=true` after fix deployed
- **What it generates:** 5 answered interviews (June 1-2) → up to 2 blog posts per run → 2-3 days to clear backlog
- **Acceptance:** Blog posts appear in `blog_posts` table with `status = 'scheduled'`

---

## ✅ Phase 1: Foundation (complete)

### 1. ✅ Fix stats tracking
### 2. ✅ Replace fabricated testimonials
### 3. ✅ Google Search Console — verified
### 4. ✅ Health endpoint
### 5. ✅ Browse filters, sorting, search
### 6. ✅ Event tracking
### 7. ✅ Browse before signup
### 8. ✅ Pause auto-campaign generation
### 9. ✅ Cookie consent + age gate

---

## ⬜ Phase 1.5: Critical (next 7 days)

### 10. ⬜ Curated launch — 5 artists + 20 creators (manual)
- **Effort:** 20 hours (manual outreach)
- **This is the single most important thing.** Nothing else matters until real users with real budgets create real activity.
- **Process:** Find 5 artists, 20 creators, set up 5 campaigns with $20-100 budgets, coordinate a 2-week sprint, document everything for blog posts and social proof.

### 11. 🟡 LLMO bios — module built (lib/artist-content.ts), cron at 00:00 UTC
- **Field:** SEO
- **Effort:** 1 day
- **Files to create:** `lib/artist-content.ts`
- **Files to modify:** `app/api/cron/dispatcher/route.ts` (add new worker)
- **Cost:** ~$140 one-time DeepSeek API (2,000 artists × 500 chars)
- **Impact:** Unlocks 2,000+ unique indexable pages with rich LLM-optimized content

### 12. ✅ Internal linking engine — wired into artist profile pages
- **Field:** SEO
- **Effort:** 30 min
- **Files to modify:** `app/artist/[slug]/ArtistProfileClient.tsx`, `app/blog/[slug]/page.tsx`
- **What:** Import `getArtistLinks()` and `getBlogLinks()` from `lib/internal-links.ts`. Add 2-3 contextual cross-links per page.
- **Impact:** Creates SEO link graph across all pages

### 13. ✅ Reddit auto-syndicate — cron at UTC 04, daily limit 3 posts
- **Field:** Growth
- **Effort:** 1 day
- **Files to create:** `app/api/cron/blog-syndicate/route.ts`
- **What:** On blog publish → auto-post to 3 relevant subreddits (music marketing, indie music, creator economy). DeepSeek-generates subreddit-specific titles. Cron: every 2 hours check for new published posts.
- **Impact:** Direct traffic from active communities

---

## ✅ Phase 2: Momentum (complete, all built)

### 14. ✅ Creator outreach pipeline
### 15. ✅ In-app notification bell
### 16. ✅ Creator profile pages
### 17. ✅ Blog pillar pages
### 18. ✅ Sentry error monitoring
### 19. ✅ PWA manifest
### 20. ✅ DMCA/copyright policy
### 21. ✅ Improved Terms of Service

---

## 🟡 Phase 2.5: Quick Wins (this week)

### 22. ✅ Anonymous reaction sign-in prompt — modal with auth gate
- **Field:** UX/CRO
- **Effort:** 30 min
- **Files:** `components/SubmissionReactions.tsx`
- **Acceptance:** Unauthenticated users see sign-in prompt overlay when clicking ❤️

### 23. ✅ Browse artists → campaigns fallback — switch button on empty artists
- **Field:** UX
- **Effort:** 30 min
- **Files:** `app/browse/BrowseClient.tsx`
- **Acceptance:** Artists tab with 0 results auto-switches to Campaigns tab

### 24. ✅ Noindex thin artist pages — robots: noindex,follow
- **Field:** SEO
- **Effort:** 30 min
- **Files:** `app/artist/[slug]/page.tsx`
- **Acceptance:** Artists with zero tracks or zero activity get `noindex,follow`

---

## ✅ Phase 3: Scale (complete)

### 25. ✅ Referral flywheel
### 26. ✅ Social sharing incentives
### 27. ✅ Programmatic SEO pages (genre, artist, platform)
### 28. ✅ SSL verification
### 29. ✅ Content Security Policy
### 30. ✅ Retargeting pixel (Meta + Google)
### 31. ✅ A/B testing infrastructure

---

## 📊 Current metrics (baseline)

| Metric | Value | Target (30 days) | Target (90 days) |
|--------|-------|-------------------|-------------------|
| Users | 16 | 50 | 200 |
| Onboarded users | 15 | 50 | 200 |
| Stripe connected | 1 | 10 | 50 |
| Active campaigns (real) | 1 | 10 | 50 |
| Submissions | 24 | 50 | 200 |
| Approved submissions | 2 | 15 | 60 |
| Total deposited | $35 | $200 | $2,000 |
| Total paid out | $2.08 | $50 | $500 |
| Blog posts | 17 | 50 | 100 |
| Blog traffic/day | ~0 | 20 visits | 200 visits |
| Page views/week | 465 | 1,000 | 5,000 |
| Referrals | 0 | 5 | 25 |

---

## 🔁 Recurring tasks

| Frequency | Task |
|-----------|------|
| Daily | Check Sentry/error logs for cron failures |
| Weekly | Check Google Search Console: new impressions, clicks, average position |
| Weekly | Review blog pipeline output: were 2 posts published? Any errors? |
| Weekly | Verify `blog_posts` table: run `SELECT COUNT(*) FROM blog_posts WHERE status = 'scheduled'` |
| Monthly | Update this roadmap — mark completed items, re-prioritize remaining |
| Monthly | Review DeepSeek costs: blog pipeline |
| Monthly | Check Stripe dashboard: deposits, payouts, disputes |

---

## 📝 Notes

- **Before every commit:** `npx tsc --noEmit` must pass with zero errors
- **After every Railway deploy:** Verify homepage loads, blog loads, campaign page loads, and run blog pipeline manually with `?force=true&secret=CRON_SECRET` to verify post generation
- **Database migrations:** Always add `IF NOT EXISTS` and use the auto-enable RLS trigger
- **The curated launch (item #10) is the most important task.** Everything else amplifies what happens after you have proof the marketplace works.
- **June 3 audit conclusion:** Codebase is feature-complete for v1. Freeze feature work. Next 30 days are pure growth.
