# Selah.fm — Strategic Roadmap
**Version:** 3.1 · **Created:** 2026-06-02 · **Live metrics:** 16 users · $35 deposited · $2.08 paid · 16 blog posts

> Full 10-field audit completed June 2, 2026. Prioritized by effort/impact for a solo developer.
> Each item includes exact files to modify, acceptance criteria, and testing steps.
> **Status legend:** ⬜ pending · 🟡 in progress · ✅ done

---

## 🚨 Phase 0: Critical (this week)

### 1. ✅ Fix stats tracking — show accurate deposits and payouts
- **Field:** Data & Analytics
- **Effort:** 1 hour
- **Files:** `app/api/stats/route.ts`, `components/HomePageClient.tsx`
- **Acceptance:** Homepage shows "$35 Funded by artists" and "$2 Paid to creators" as separate counters
- **Test:** `curl https://selah.fm/api/stats` returns accurate `totalDepositedCents` and `totalPaidCents`
- **Status:** ✅ DONE

### 2. ✅ Replace fabricated testimonials with "What you could earn" scenarios
- **Field:** Legal & Community
- **Effort:** 30 minutes
- **Risk:** FTC false advertising violation. Real-sounding fake testimonials are illegal.
- **Files:** `components/HomePageClient.tsx` (lines ~229-260)
- **What to do:** Replace the 4 testimonial cards with 3-4 "Example scenario" cards that show math:
  - "Example: $200 budget at $10,000/1M CPM = 20,000 verified views"
  - "Example: Creator makes 3 Reels, earns $340 from 340,000 total views"
  - "Example: Artist deposits $100, approves 5 videos, reaches 200K people"
  - Label clearly: "What's possible" or "Example scenario" — NEVER attribute to a fake person
- **Acceptance:** No fabricated names/photos on the site. All scenario cards labeled "Example."
- **Test:** Visit homepage, verify no fake testimonials with fake names

### 3. ✅ Google Search Console — already verified
- **Field:** SEO
- **Status:** ✅ DONE
- **Verification:** `sitemap.xml` returns 200 with blog posts, tools, campaigns, and main pages. `robots.txt` references sitemap correctly. Search Console property is verified.
- **No action needed.** Check Search Console weekly for impressions, clicks, and average position data.

### 4. ✅ Add `/api/health` endpoint
- **Field:** Engineering
- **Effort:** 30 minutes
- **File to create:** `app/api/health/route.ts`
- **What it does:** Check database connectivity, return last cron run time, return HTTP 200 if healthy
- **Acceptance:** `curl https://selah.fm/api/health` returns `{ status: "ok", db: "connected", lastCron: "..." }`
- **Test:** Deploy, curl the endpoint, verify 200 response

---

## 🔥 Phase 1: Foundation (next 2 weeks)

### 5. ✅ Browse page — add filters, sorting, search
- **Field:** Product & UX
- **Effort:** 4-6 hours
- **Files:** `app/browse/page.tsx`, `components/BrowseClient.tsx`, `app/api/campaigns/route.ts`
- **What to build:**
  - Filter chips: Genre, Platform (TikTok/Reels/Shorts), CPM range ($500-1K, $1K-5K, $5K+)
  - Sort dropdown: Newest, Highest CPM, Most Funded, Most Views
  - Search bar: search by track title or artist name
  - URL query params: `?genre=pop&platform=tiktok&sort=highest_cpm` (shareable, crawlable)
- **Acceptance:** User can filter 2,564 campaigns down to 5 matching their criteria. URL updates with filter state. Back button works.
- **Test:** Apply genre filter, verify results change. Copy URL, open in new tab, verify same filters applied. Sort by highest CPM, verify ordering.

### 6. ✅ Event tracking — CTA clicks, signup funnel, campaign joins
- **Field:** Analytics
- **Effort:** 3 hours
- **File to create:** `app/api/analytics/event/route.ts`
- **File to modify:** `components/HomePageClient.tsx`, `app/login/page.tsx`, `app/c/[id]/CampaignDetailClient.tsx`, `app/onboarding/page.tsx`
- **What to track:**
  - `cta_click`: which CTA was clicked (promote_artist, earn_creator, browse, join_campaign)
  - `signup_start`: email entered on signup form
  - `signup_complete`: successful signup (email or Google)
  - `onboarding_complete`: onboarding finished
  - `campaign_join_click`: "Join campaign" clicked on /c/[id]
  - `video_submit_start`: user pasted link in EarnModal
  - `video_submit_complete`: submission created successfully
- **How:** Fire-and-forget POST to `/api/analytics/event` with `{ event, path, metadata }`. Store in `analytics_events` table (create if needed).
- **Acceptance:** Events table has rows within 10 minutes of deploy. Can query: "How many people clicked Promote vs Earn this week?"
- **Test:** Click "Promote your music" on homepage, verify event appears in DB

### 7. ✅ Browse before signup — allow video link pasting without login
- **Field:** CRO
- **Effort:** 3 hours
- **Files:** `components/EarnModal.tsx`
- **What to change:**
  - Currently: opens modal → checks auth → shows "Sign in to submit" gate
  - New flow: opens modal → shows full submission form → user pastes link → clicks submit → THEN sign-in gate (or create account to save)
  - Key: let the user start the action BEFORE asking for commitment. They've already invested effort (finding a campaign, pasting a link) — they're more likely to sign up at that point.
- **Acceptance:** User can browse campaigns, open EarnModal, paste a video link, see a preview — all before signing in. Sign-in gate only appears when they click "Submit."
- **Test:** Open campaign page in incognito, click "Join campaign," verify form is usable without auth. Click submit without signing in, verify sign-in prompt appears.

### 8. ✅ Pause auto-campaign generation (outreach pipeline)
- **Field:** Growth
- **Effort:** 5 minutes
- **File to modify:** `app/api/cron/dispatcher/route.ts`
- **What to do:** Comment out or remove the outreach-pipeline workers in the dispatcher (UTC hours 0, 6, 12, 18). Leave blog-pipeline and email-outreach running.
- **Why:** 2,563 unclaimed campaigns with zero activity signals a ghost town. Stop generating more until you have real creator activity. After the curated launch (item 10), re-enable with a lower rate.
- **Acceptance:** No new campaigns created for 24 hours. Blog pipeline still runs. Email outreach still runs.
- **Test:** Wait one cron cycle, query `SELECT COUNT(*) FROM campaigns WHERE created_at > NOW() - INTERVAL '2 hours'` — should return 0.

### 9. ✅ Cookie consent banner + age gate on signup
- **Field:** Legal
- **Effort:** 2 hours
- **Files:** `app/layout.tsx` (add banner component), `app/login/page.tsx` (add age check)
- **What to build:**
  - Cookie consent: small fixed banner at bottom, "This site uses cookies for analytics and authentication. [Accept] [Learn more → /privacy]". Stores consent in localStorage.
  - Age gate: on signup form, add a simple "I am 13 years or older" checkbox. Required to submit. Link to COPPA info in privacy policy.
- **Acceptance:** First visit shows cookie banner. Signup form requires age checkbox. Both persist across pages.
- **Test:** Open in incognito, verify cookie banner appears. Try to sign up without checking age box, verify it's required.

### 10. ⬜ Curated launch preparation — find 5 artists + 20 creators
- **Field:** Growth
- **Effort:** 20 hours (manual outreach, not code)
- **This is a manual process, not a code task:**
  1. **Find 5 artists** (your network, Reddit r/WeAreTheMusicMakers, Discord music servers):
     - Have a released track on Spotify/Apple Music
     - Willing to deposit $20-100 into a campaign
     - Understand this is a new platform, early adopter pricing
  2. **Find 20 creators** (TikTok, Instagram Reels, YouTube Shorts):
     - 1K-50K followers
     - Already make music-related content (dance, lip-sync, reaction)
     - Pitch: "Earn money for videos you're already making. Test campaign: $20 budget, you keep what you earn."
  3. **Set up 5 real campaigns** with actual budgets ($20-100 each)
  4. **Coordinate a 2-week sprint:** everyone submits videos in the same week
  5. **Document everything** — screenshots, videos, earnings — for blog content and social proof
- **Acceptance:** 5 real campaigns with real budgets. 10+ real video submissions. 1+ approved and paid out. Real testimonial quotes collected.
- **Test:** Check that all 5 campaigns have real artist names, real track data, and non-zero budgets.

---

## 📅 Phase 2: Momentum (next 30 days)

### 11. ⬜ Creator outreach pipeline — scrape + DM creators
- **Field:** Growth
- **Effort:** 8 hours
- **Files to create:** `lib/creator-discovery.ts`, `app/api/cron/creator-pipeline/route.ts`
- **What to build:**
  - Scrape TikTok/Reels for creators using trending sounds in your target genres
  - Filter by: engagement rate > 3%, last post < 7 days, 1K-100K followers
  - Store in `discovered_creators` table (exists, 20 entries)
  - DM template: "Hey [name]! I saw your [song] Reel — great energy. We're running a campaign for [artist]'s track '[title]' and paying creators per view. Want in? selah.fm/c/[slug]"
- **Acceptance:** Pipeline discovers 50+ creators per run, DMs sent automatically
- **Test:** Run pipeline manually, verify creator records created, verify DM templates formatted correctly

### 12. ⬜ In-app notification bell
- **Field:** Product & UX
- **Effort:** 4 hours
- **Files to create:** `components/NotificationBell.tsx`
- **Files to modify:** `components/TopNav.tsx` (add bell icon)
- **What to build:**
  - Bell icon in top nav with unread count badge
  - Dropdown showing last 10 notifications (submission approved, payout sent, new submission on your campaign)
  - Mark as read on click
  - Reuse existing `notifications` table and `/api/notifications` (check if route exists)
- **Acceptance:** After a submission is approved, the creator sees a notification badge. After a creator submits to your campaign, the artist sees a notification.
- **Test:** Trigger a notification via DB insert, verify bell badge appears, verify clicking marks as read

### 13. ⬜ Creator profile pages — portfolio of submissions
- **Field:** Product & Community
- **Effort:** 6 hours
- **File to create:** `app/creators/[id]/page.tsx`
- **What to build:**
  - Public profile: avatar, bio, platforms (TikTok/IG/YouTube handles)
  - Past submissions grid: video thumbnails, track promoted, views earned, amount earned
  - Total earnings counter
  - "Hire this creator" or "Invite to campaign" CTA
- **Acceptance:** `/creators/[id]` shows a creator's full portfolio. Artists can browse creators before launching campaigns.
- **Test:** Create test submissions for a user, visit their profile, verify all submissions visible

### 14. ⬜ Blog pillar pages — topical clusters for SEO
- **Field:** SEO
- **Effort:** 6 hours
- **Files to create:** `app/guides/[slug]/page.tsx` or manual pages
- **What to build:**
  - `/guides/music-promotion` — comprehensive music promotion guide, links to all related blog posts
  - `/guides/creator-earnings` — how creators earn on different platforms, CPM comparisons
  - `/guides/cpm-rates` — CPM rate guide for artists, how to set rates, industry benchmarks
  - Each pillar page: 2,000+ words, links to 5-10 related posts, links FROM related posts back to pillar
- **Acceptance:** Each pillar page is live, has FAQ schema, and links bidirectionally to blog posts
- **Test:** Visit each guide URL, verify it loads, verify interlinking to blog posts

### 15. ⬜ Sentry or error monitoring for cron failures
- **Field:** Engineering
- **Effort:** 2 hours
- **What to do (Sentry — free tier):**
  1. Sign up at sentry.io (free: 5K errors/month)
  2. `npm install @sentry/nextjs`
  3. Run `npx @sentry/wizard -i nextjs` to configure
  4. Add `SENTRY_DSN` to Railway env vars
- **Acceptance:** Cron failures appear in Sentry dashboard within seconds. Email alerts configured for new errors.
- **Test:** Temporarily break the blog pipeline (e.g., wrong DB query), verify error appears in Sentry

### 16. ⬜ PWA manifest — mobile install support
- **Field:** Product & UX
- **Effort:** 2 hours
- **Files to create:** `public/manifest.json`, `app/manifest.ts`
- **What to do:**
  - Create manifest.json with name, icons, theme_color (#0F0F23), display: standalone
  - Add `<link rel="manifest" href="/manifest.json">` to root layout
  - Add basic service worker for offline support (cache static assets)
- **Acceptance:** Android Chrome shows "Install app" prompt. iOS Safari shows "Add to Home Screen" in share menu.
- **Test:** Open on mobile Chrome, verify install prompt. Open on iOS Safari, verify share menu option.

### 17. ⬜ DMCA/copyright policy + takedown procedure
- **Field:** Legal
- **Effort:** 2 hours
- **File to create:** `app/dmca/page.tsx`
- **What to include:**
  - Copyright infringement notification procedure (DMCA compliant)
  - Contact email for takedown requests: `copyright@selah.fm`
  - Counter-notification procedure
  - Statement: "Selah.fm respects intellectual property rights. If you believe your copyrighted work has been used without permission, contact us."
- **Acceptance:** `/dmca` page loads, footer links to it, copyright@selah.fm email set up (forward to your email)
- **Test:** Visit /dmca, verify all required DMCA sections present

### 18. ⬜ Improve Terms of Service — marketplace-specific policies
- **Field:** Legal
- **Effort:** 4 hours
- **File to modify:** `app/tos/page.tsx`
- **What to do (self-serve — no lawyer needed yet):**
  - Use a template generator (Termly.io has a free ToS generator for basic coverage)
  - Add Selah.fm-specific sections manually:
    - **Payment terms:** How artists deposit, how CPM is calculated, how platform fee works (20%), Stripe fees
    - **Refund policy:** Clear statement: unspent campaign budget is refundable minus Stripe fees. Spent budget (paid to creators) is non-refundable.
    - **Content ownership:** Creators own their videos. Artists own their music. Selah.fm claims no ownership.
    - **Dispute resolution:** How payout disputes work. Artist can reject submissions before payout. Creators can appeal rejections.
    - **CPM rate changes:** CPM locks when first submission arrives. New campaign needed for different rate.
    - **Platform liability:** Selah.fm is a marketplace, not a party to creator-artist transactions.
  - Add a "Last updated" date at the top
  - Link to `/privacy`, `/dmca`, `/content-guidelines` from within the ToS
- **Acceptance:** ToS covers all marketplace-specific scenarios. Refund policy is unambiguous. No contradictions with actual platform behavior.
- **Test:** Read through as if you were an artist depositing $50. Read through as a creator submitting a video. Verify every question you'd have is answered.

---

## 🎯 Phase 3: Scale (next 90 days)

### 19. ⬜ Referral flywheel — prominent everywhere
- **Field:** Growth
- **Effort:** 4 hours
- **Files to modify:** `app/dashboard/page.tsx`, `app/settings/page.tsx`, `components/HomePageClient.tsx`
- **What to build:**
  - Dashboard: "Share Selah.fm, earn 5% bonus" card with copyable link
  - Post-payout email: "You just earned $X! Share Selah.fm with other creators and get a 5% bonus on their first deposit"
  - Settings: referral stats (clicks, signups, deposits, bonus earned)
  - Banner on homepage for logged-in users: "Your referral link: selah.fm/login?ref=you@email.com"
- **Acceptance:** Referral link visible in 3 places. Post-payout email includes referral prompt. Referral stats page works.
- **Test:** Share referral link, sign up with a different email, verify referral record created

### 20. ⬜ Social sharing incentives — "Share your earnings"
- **Field:** Community
- **Effort:** 2 hours
- **Files to modify:** `app/earnings/page.tsx`, `components/EarnModal.tsx` (success state)
- **What to build:**
  - After payout: "Share your earnings" button with pre-filled tweet:
    "Just got paid $X for making a TikTok with [track] on @selahfm 🎵💰 selah.fm"
  - After submission approved: "Your video was approved! Share it:" with link to the video
- **Acceptance:** After a payout, user sees a share button. Clicking opens X/Twitter with pre-filled text.
- **Test:** Approve a test submission, verify success state includes share button

### 21. ⬜ Programmatic SEO pages — genre, artist, platform
- **Field:** SEO
- **Effort:** 6 hours
- **Files to create:** `app/genre/[slug]/page.tsx`, `app/artist/[slug]/page.tsx`, `app/platform/[slug]/page.tsx`
- **What to build:**
  - `/genre/pop` — all pop campaigns, with H1: "Pop Music Promotion Campaigns | Earn as a Creator"
  - `/genre/hip-hop` — same, for hip-hop
  - `/artist/[artist_name]` — all campaigns by this artist
  - `/platform/tiktok` — all campaigns accepting TikTok submissions
  - Each page: server-rendered, crawlable, with structured data
  - Generate from existing campaign data (genres in `discovered_artists.genres` or `artist_audits.genres`)
- **Acceptance:** `/genre/pop` returns a page with 10+ pop campaigns. Google indexes it within 1 week.
- **Test:** Visit genre pages, verify campaigns listed, verify no 404s

### 22. ⬜ SSL verification — `rejectUnauthorized: true`
- **Field:** Security
- **Effort:** 1 hour
- **File to modify:** `lib/db.ts`
- **What to do:**
  1. Download Supabase's CA certificate (available in Supabase dashboard → Settings → Database)
  2. Add to `lib/db.ts`: `ssl: { rejectUnauthorized: true, ca: fs.readFileSync('...') }`
  3. Test locally and on Railway
- **Acceptance:** Database connections still work, SSL certificate is validated
- **Test:** `node -e "require('./lib/db')"` connects successfully. Intentionally wrong CA cert should fail.

### 23. ⬜ Content Security Policy header
- **Field:** Security
- **Effort:** 3 hours
- **File to modify:** `next.config.js`
- **What to add:**
  - CSP header allowing scripts from: self, supabase.co, stripe.com, googletagmanager.com, google-analytics.com
  - CSP header allowing images from: self, supabase.co, pexels.com, images.pexels.com, data:
  - Start with `Content-Security-Policy-Report-Only` mode first, monitor violations, then enforce
- **Acceptance:** CSP header present on all responses. No functional breakage. Console shows CSP reports instead of errors.
- **Test:** Check response headers in devtools, verify CSP present. Test all major pages for broken resources.

### 24. ⬜ Retargeting pixel — Meta + Google
- **Field:** CRO
- **Effort:** 1 hour
- **Files to modify:** `app/layout.tsx`
- **What to add:**
  - Meta Pixel (base code in `<head>`)
  - Track PageView on all pages, ViewContent on campaign pages, InitiateCheckout on donation/checkout
  - Google Ads remarketing tag
- **Acceptance:** Meta Events Manager shows PageView events within 1 hour. Custom events fire on campaign pages.
- **Test:** Visit campaign page, check Meta Pixel Helper extension, verify ViewContent event fired

### 25. ⬜ A/B testing infrastructure
- **Field:** Analytics
- **Effort:** 4 hours
- **Files to create:** `lib/ab-test.ts`, `middleware.ts` (modify)
- **What to build:**
  - Cookie-based variant assignment: `ab_experiment_name=variant_a`
  - Middleware reads cookie, sets `x-ab-variant` header
  - Components read variant via header or client-side cookie
  - Simple: just variant A/B, no complex multi-arm yet
- **Acceptance:** Can run a test like "Homepage CTA: 'Promote your music' vs 'Start a campaign'" and see which variant in analytics
- **Test:** Set up a test with 2 variants, verify cookies set, verify both variants visible on refresh

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
| Blog traffic/day | unknown | 20 visits | 200 visits |
| Page views/week | 465 | 1,000 | 5,000 |
| Referrals | 0 | 5 | 25 |

---

## ⚡ Quick wins (under 30 min each, do anytime)

| # | Action | File(s) |
|---|--------|---------|
| Q1 | Add `<title>` tags to all auth pages (login, onboarding, settings) — currently rely on layout default | `app/login/page.tsx`, etc. |
| Q2 | Add `rel="noopener noreferrer"` to all external links in blog posts (already done via renderBotContent, verify) | `components/SupportWidget.tsx` |
| Q3 | ✅ `/robots.txt` verified — exists, references sitemap, disallows /api/ and private routes | `public/robots.txt` |
| Q4 | ✅ `sitemap.xml` verified — includes blog posts, tools, main pages, returns 200 | `app/sitemap.ts` |
| Q5 | Add a "Last updated" date to the blog index page | `app/blog/page.tsx` |
| Q6 | Verify all 4 SEO tools at /tools/* return HTTP 200 | `app/tools/` |
| Q7 | Set up a `copyright@selah.fm` forward to your email | DNS/email provider |
| Q8 | Add `humans.txt` at `/humans.txt` with credits (fun, low-effort SEO signal) | `public/humans.txt` |

---

## 🔁 Recurring tasks

| Frequency | Task |
|-----------|------|
| Daily | Check Sentry/error logs for cron failures |
| Weekly | Review analytics events: signup funnel, CTA clicks, campaign joins |
| Weekly | Check Google Search Console: new impressions, clicks, average position |
| Weekly | Review blog pipeline output: were 2 posts published? Any errors? |
| Monthly | Update this roadmap — mark completed items, re-prioritize remaining |
| Monthly | Review DeepSeek costs: support chat + blog pipeline |
| Monthly | Check Stripe dashboard: deposits, payouts, disputes |

---

## 📝 Notes

- **Before every commit:** `npx tsc --noEmit` must pass with zero errors
- **After every Railway deploy:** Verify homepage loads, blog page loads, campaign page loads
- **Database migrations:** Always add `IF NOT EXISTS` and use the auto-enable RLS trigger (already active)
- **The curated launch (item #10) is the most important task.** Everything else amplifies what happens after you have proof the marketplace works. Prioritize it above feature work.
