# Selah.fm — World-Class Roadmap (June 2026)
**Synthesized from:** BIO_ENGINE_RESEARCH.md, BIO_ENGINE_REFINEMENTS.md, SELAH_FM_COMPETITIVE_AUDIT.md, CHAT_MASTER_PLAN.md
**Target:** Top 0.01% — artist pages that rank like Wikipedia, engage like Yelp, and monetize like Patreon

---

## Table of Contents
1. [The Strategy](#1-the-strategy)
2. [What's Already Done ✅](#2-whats-already-done)
3. [Phase 0: Content Foundation](#3-phase-0-content-foundation)
4. [Phase 1: Entity Graph & Page Expansion](#4-phase-1-entity-graph--page-expansion)
5. [Phase 2: Community Layer](#5-phase-2-community-layer)
6. [Phase 3: UGC & Backlinks](#6-phase-3-ugc--backlinks)
7. [Phase 4: Scale & Automation](#7-phase-4-scale--automation)
8. [Total Cost & Timeline](#8-total-cost--timeline)
9. [Files to Create](#9-files-to-create)
10. [Success Metrics](#10-success-metrics)

---

## 1. The Strategy

### The Problem We're Solving

Selah.fm has the **plumbing** — artist profiles, campaigns, messaging, payments — but not the **content** or **community**. 

| How the top 8 directory sites win | How Selah.fm compares |
|------------------------------------|----------------------|
| Wikipedia: 6M articles, each unique | 90% of artists have 0 words of bio |
| Yelp: 200M reviews = UGC per page | No reviews, no ratings |
| Crunchbase: News integration per company | No freshness signals |
| Zillow: 100M property pages, each unique | 1 template for all artists |
| IMDb: 250M ratings = engagement density | No engagement metrics |
| Discogs: 400K users cataloging collections | No community participation |
| AllMusic: Professional editorial content | No editorial quality floor |
| **Selah.fm: 2K artists with good plumbing** | **No content, no community** |

### The Thesis

We win by doing what no music platform has done: **combine artist discovery with fan community, creator monetization, and SEO-optimized content at scale.**

Spotify has artist pages but no fan community.
Bandcamp has music sales but no creator monetization.
Instagram has fan engagement but no SEO pages.
Selah.fm can have all three.

### The 5-Layer Architecture

```
Layer 5: Community ← NEW (Phase 2)
  └── Fan reviews, photos, discussion boards, "meet other fans"
  └── Creates unique UGC per page, freshness signals, and backlinks
      
Layer 4: Monetization ← DONE
  └── Campaigns, wallet, checkout, submissions, payouts
  └── What brings artists and creators to the platform

Layer 3: Content ← PLANNED (Phase 0-1)
  └── AI-generated bios for all artists, track pages, genre pages
  └── What makes pages rank in Google and get cited by LLMs

Layer 2: Entity Graph ← PLANNED (Phase 0-1)
  └── Dense internal linking, similar artists, Wikidata sameAs
  └── What Google needs to see to trust our pages

Layer 1: Data ← DONE
  └── 2K artist profiles, tracks, submissions, metrics
  └── The foundation everything else is built on
```

---

## 2. What's Already Done ✅

### Platform Plumbing
- ✅ Artist profiles with server-rendered pages
- ✅ Campaign system with CPM rates and budgets
- ✅ Submission/approval workflow
- ✅ Checkout + Stripe integration
- ✅ Artist wallet with balance + transactions
- ✅ Messaging system with chat widget
- ✅ User auth (Google OAuth + email)
- ✅ Dashboard with 4 tabs + profile editor

### SEO Basics (Score: 6/10)
- ✅ Server-rendered with force-dynamic
- ✅ MusicGroup + FAQPage + BreadcrumbList schema
- ✅ Dynamic FAQPage (4-5 Q&A per artist)
- ✅ Enriched meta descriptions with track names + CPM
- ✅ Canonical URLs + Open Graph + Twitter cards
- ✅ Thin-content noindex logic
- ✅ Sitemap with artist pages
- ✅ 404 slug fallback (name-based search)
- ✅ Sitemap lastmod type fix

### Browse & Discovery
- ✅ Browse shows artists with real Spotify profile images
- ✅ Artist search with LEFT JOIN fix
- ✅ Campaign cross-links on artist pages
- ✅ Related artists section
- ✅ Track-level campaign badges

### Pipeline & Data
- ✅ ILIKE → exact match fix (prevents compilation flooding)
- ✅ 50-track cap per artist in pipeline
- ✅ Track import from Spotify/Bandcamp/Deezer/iTunes
- ✅ Blog pipeline with fetch timeout + anti-detection
- ✅ Blog publish cron (09:00 + 15:00 UTC)

### Growth
- ✅ Earnings leaderboard at /earnings
- ✅ Newsletter lead magnet with CPM Cheat Sheet
- ✅ CI fix (missing Supabase env vars)

### Documents Created
- ✅ BIO_ENGINE_RESEARCH.md — Full bio system research
- ✅ BIO_ENGINE_REFINEMENTS.md — 10 gaps + tone + placement
- ✅ BIO_ENGINE_DATA_RESEARCH.md — Data quality, genre detection, number honesty
- ✅ BIO_UNIQUENESS_ARCHITECTURE.md — Composable component system, 507B combinations
- ✅ SELAH_FM_COMPETITIVE_AUDIT.md — 30 gaps, 8 competitors
- ✅ SELAH_ROADMAP.md — Full 6-week execution plan (this document)
- ✅ CHAT_MASTER_PLAN.md — Messaging architecture
- ✅ CHAT_AUDIT.md — Messenger bugs and fixes
- ✅ ARTIST_PAGE_RESEARCH.md — Artist page gaps
- ✅ ARTIST_SEO_LLMO_PLAN.md — SEO/LLMO execution plan
- ✅ ARTIST_UX_AUDIT.md — UX improvements
- ✅ AUTH_ONBOARDING_AUDIT.md — Auth flow audit

---

## 3. Phase 0: Content Foundation
**Cost: ~$15**  
**Time: 6h dev**  
**Impact: 2K pages go from 0 words to 1,800 words of unique content**

### Why First
Every competitor analysis agrees: **unique content per page is the foundation.** Wikipedia has 6M unique articles. Yelp has 200M unique reviews. We have 2K pages with 0 words of bio. Nothing else matters until this is fixed.

### Sub-Phase 0a: Bio Engine Architecture (25h)

The bio engine uses a **composable component system** — each bio is assembled from independently generated modular slots with varying angles, tones, and opening styles. No two bios share the same generation path.

**Architecture (507 billion possible combinations per artist):**

- **50+ angles** — narrative frame (Discovery, Slow Build, Craftsman, Scene, DIY Story, etc.)
- **8 tones** — Profile, Review, Feature, Data, Listener, Journalist, Fan, Critic
- **65+ opening hooks** — Scene-setting, Direct statement, Question, Data-led, Metaphorical, etc.
- **50+ sound descriptors** — Vibe, texture, emotion, craft, movement framings
- **50+ journey framings** — Growth arc, Catalog arc, Audience arc, Craft arc, etc.
- **50+ significance framings** — Value-based, Quality-based, Audience-based, Future-based
- **50+ Selah.fm CTAs** — Join the community, Support directly, Create content, etc.
- **Sliding frequency window** — words overused in recent 200 bios are avoided, no permanent bans
- **Self-improvement** — generate 3 variations per artist, keep highest-scoring, learn from patterns
- **Quality scoring** — word count, name presence, banned words, sentence variety, cosine similarity < 0.4

**8 new library files (see Files to Create below)**

| # | Task | Files | Hours | Cost |
|---|------|-------|-------|------|
| 0.1a | **Build composable bio engine** — 8 lib files with angle/tone/opening/descriptor/journey/closing/scorer modules | `lib/bio-*.ts` | 12h | $0 |
| 0.1b | **Rewrite /api/artist/bio endpoint** — single-prompt → multi-slot composable generation | `app/api/artist/bio/route.ts` | 3h | $0 |
| 0.1c | **Build batch cron** — 100 artists/night, 3 variations each, keep best | `app/api/cron/generate-artist-bios/route.ts`, `app/api/cron/dispatcher/route.ts` | 3h | ~$0.05 API |
| 0.1d | **Test + iterate** — generate 50 bios, check quality scores, adjust | Various | 7h | ~$0.01 API |
| 0.2 | **Expand internal links to 15+ per page.** Update `getArtistLinks()` to include genre pages, tool pages, blog posts, campaign pages, and similar artists. | `lib/internal-links.ts`, `app/artist/[slug]/page.tsx` | 1h | $0 |
| 0.3 | **Add sameAs to schema.** For each artist, check if they have a Wikipedia/Wikidata entry. If so, add `sameAs` links to the MusicGroup schema. This unlocks Knowledge Panel eligibility. | `app/artist/[slug]/page.tsx` | 1h | $0 |
| 0.4 | **Add author byline + Person schema.** Every artist page gets "By Selah.fm Music Team" and a corresponding Person schema entry. | `app/artist/[slug]/page.tsx` | 30min | $0 |
| 0.5 | **Algorithmic similar artists.** Replace genre-only matching with a similarity score: genre overlap + track count + listener count + geography. | `lib/artist-content.ts`, `app/artist/[slug]/page.tsx` | 30min | $0 |

### Deliverables
- Every artist page has unique 300-1,800 word bio
- Every artist page has 15+ internal links to genre, tools, blog, campaigns
- Every artist page has sameAs → Wikidata/Wikipedia (if entries exist)
- Every artist page has "By Selah.fm Music Team" author byline
- Similar artists section uses algorithmic scoring

### Acceptance Criteria
- [ ] 2,000 artists have bios stored in `artist_audits` table
- [ ] Bios are displayed on artist page as formatted HTML
- [ ] Artist page has ≥15 internal links
- [ ] sameAs property in MusicGroup schema links to Wikidata
- [ ] Person schema present with author name
- [ ] Similar artists show scores, not just same-genre

---

## 4. Phase 1: Entity Graph & Page Expansion
**Cost: $0**  
**Time: 8h dev**  
**Impact: 19K+ new indexable pages + entity graph density**

### Why Second
Once all artist pages have content, we need to **multiply** them. Track-level pages give us 19K+ new URLs. Genre pages capture search traffic for "buy [genre] music" queries. City pages capture "[city] musicians" local queries.

### Work Items

| # | Task | Files | Hours |
|---|------|-------|-------|
| 1.1 | **Track-level SEO pages** at `/artist/[slug]/tracks/[id]`. Each page has MusicRecording schema, cover art, title, CPM, campaign status, fan reviews, comments, similar tracks. Sitemap includes all track pages. | `app/artist/[slug]/tracks/[id]/page.tsx`, `app/sitemap.ts` | 3h |
| 1.2 | **Genre landing pages.** `/browse/genre/[genre]` becomes a full SEO page with genre description, top artists list, related genres, schema markup (MusicGenre). | `app/browse/genre/[genre]/page.tsx` | 2h |
| 1.3 | **City/geography pages.** `/artists/[city]` pages listing artists by location. Uses artist location data from `discovered_artists`. Schema: City entity. | `app/artists/[city]/page.tsx` | 2h |
| 1.4 | **Blog ↔ artist cross-linking.** Blog pipeline adds links to related artists in blog posts. Artist pages link to blog posts that mention them. | `lib/blog-engine.ts`, `app/artist/[slug]/page.tsx` | 30min |
| 1.5 | **Latest submissions widget.** Dynamic section on artist pages showing recent verified submissions. Freshness signal — every new submission updates the page. | `app/artist/[slug]/ArtistProfileClient.tsx` | 30min |

### Deliverables
- 19K+ individual track pages with MusicRecording schema
- 20+ genre landing pages with editorial content
- 50+ city pages (where location data exists)
- Blog posts link to artists; artist pages link to blog posts
- "Latest videos" section appears on every artist page

### Acceptance Criteria
- [ ] `/artist/[slug]/tracks/[id]` renders with MusicRecording schema
- [ ] Sitemap includes all track pages
- [ ] Genre page has MusicGenre schema, description, top artists
- [ ] City page lists artists by location
- [ ] Blog posts have artist links in body
- [ ] Artist page shows latest submissions

---

## 5. Phase 2: Community Layer
**Cost: ~$5/month (Supabase storage)**  
**Time: 16h dev**  
**Impact: Unique UGC per page, freshness signals, competitive moat**

### Why Third
This is our **competitive differentiator.** No other music platform has fan reviews, photos, discussion boards, and track pages combined. This solves the content uniqueness problem permanently — every artist page becomes unique because fans create the content.

### Work Items

| # | Task | Files | Hours |
|---|------|-------|-------|
| 2.1 | **Fan review system.** 5-star rating + written review. One review per user per artist/track. API: `POST /api/reviews`, `GET /api/reviews?artist_id=X`. Display highest-rated on artist page. | `app/api/reviews/route.ts`, `components/ReviewSection.tsx`, migration: `fan_reviews` table | 4h |
| 2.2 | **Fan photo uploads.** Users upload concert photos (max 10MB). Gallery view on artist page. Uses existing ImageUpload component. Alt text for SEO. | `components/FanPhotoGallery.tsx`, `app/api/photos/route.ts` | 3h |
| 2.3 | **Discussion boards per artist.** Threaded discussions on every artist page. Uses existing `page_comments` table with `artist_id` support. Sort by newest. | `components/ArtistDiscussion.tsx`, modify `page_comments` table | 3h |
| 2.4 | **Track pages with reviews.** Each track page gets its own review section. Reviews on track pages show in track context (not just artist context). | `app/artist/[slug]/tracks/[id]/page.tsx`, `components/TrackReviewSection.tsx` | 2h |
| 2.5 | **"Meet other fans" feature.** On artist page, show list of recent reviewers/followers. Click to start a chat (uses existing messaging system). "3 other people love this artist." | `components/FanList.tsx`, `app/artist/[slug]/ArtistProfileClient.tsx` | 2h |
| 2.6 | **Artist response system.** Artists can reply to fan reviews. Reply appears below the review. Notification sent to fan when artist responds. | `app/api/reviews/[id]/respond/route.ts`, `components/ArtistReviewResponse.tsx` | 2h |

### Deliverables
- Every artist page has 5-star reviews
- Every artist page has fan photo gallery
- Every artist page has discussion board
- Every track page has reviews
- "Meet other fans" section on every artist page
- Artists can respond to reviews

### Acceptance Criteria
- [ ] POST/GET reviews API works with 5-star rating
- [ ] Photos upload to Supabase storage, display in gallery
- [ ] Discussion board shows threaded comments
- [ ] Track page shows track-specific reviews
- [ ] "Meet other fans" shows user list with click-to-chat
- [ ] Artist response shows below review

---

## 6. Phase 3: UGC & Backlinks
**Cost: $0**  
**Time: 8h dev**  
**Impact: Viral growth loop — fans create content, share it, generate backlinks**

### Why Fourth
Once the community layer exists, we need to **amplify** it. Every review, photo, and discussion is a potential backlink source. Shareable cards, embed badges, and social optimization turn user actions into SEO signals.

### Work Items

| # | Task | Files | Hours |
|---|------|-------|-------|
| 3.1 | **"Made on Selah.fm" embed badge.** Copy-paste snippet for artists to embed on their websites. Shows their artist stats + link back. Backlink from every artist website. | `components/EmbedBadge.tsx`, `app/api/embed/[slug]/route.tsx` | 2h |
| 3.2 | **Social sharing optimization.** Per-page custom share text. "Support [artist] on Selah.fm — earn per view making TikTok videos." Auto-generated share cards with artist photo + stats. | `lib/social-share.ts`, `app/artist/[slug]/page.tsx` | 1h |
| 3.3 | **Google Indexing API integration.** Submit new/updated pages for immediate indexing. 200/day limit — use for highest-priority pages (new bios, new tracks, new reviews). | `lib/google-indexing.ts`, `app/api/cron/submit-to-google/route.ts` | 1h |
| 3.4 | **IndexNow protocol.** Submit new pages to Bing/Yandex on creation. Simpler than Google's API — just a URL ping. | `lib/index-now.ts`, `app/api/webhooks/page-created/route.ts` | 30min |
| 3.5 | **Sitemap prioritization.** Dynamic priority based on content quality. Pages with bios get priority 0.9. Pages with reviews get 0.8. Pages with tracks only get 0.5. | `app/sitemap.ts` | 30min |
| 3.6 | **Shareable review cards.** When a user leaves a review, they get a shareable image card. "I reviewed [Artist] on Selah.fm! ⭐⭐⭐⭐⭐" — perfect for Instagram/Twitter. | `app/api/reviews/[id]/share-card/route.tsx` | 2h |
| 3.7 | **Review highlight on homepage.** "Latest reviews from the community" section on `/` homepage. Fresh content signal for Google's homepage crawl. | `app/page.tsx` | 1h |

### Deliverables
- Embed badge generates backlinks from artist websites
- Every page has unique share text + share card
- New pages indexed within 1 hour (Google) + immediately (Bing)
- Sitemap prioritizes pages with real content
- Review cards are shareable on social media
- Homepage shows latest community activity

### Acceptance Criteria
- [ ] Embed badge renders on external site, links back to Selah.fm
- [ ] OG tags have per-page custom descriptions
- [ ] Google Indexing API returns success for submitted pages
- [ ] IndexNow ping returns 200
- [ ] Sitemap shows different priority values
- [ ] Review card image generates and is shareable
- [ ] Homepage shows latest 5 reviews

---

## 7. Phase 4: Scale & Automation
**Cost: ~$10/month (scrapers)**  
**Time: 10h dev**  
**Impact: Self-sustaining growth — new artists discovered, created, and populated automatically**

### Why Last
Scale only matters after the product is proven. Phase 0-3 builds the engine. Phase 4 adds fuel.

### Work Items

| # | Task | Files | Hours |
|---|------|-------|-------|
| 4.1 | **Programmatic artist creation cron.** Weekly cron: scrape Bandcamp new releases → auto-create discovered_artists + artist_profiles + first track. Scale from 2K to 100K+ artists. | `app/api/cron/discover-artists/route.ts` | 3h |
| 4.2 | **Press/news scraping cron.** Weekly cron: scrape Google News for each artist → add "In the news" section to artist page. Freshness signal + authority links. | `app/api/cron/scrape-artist-news/route.ts` | 2h |
| 4.3 | **Public API v1.** Read-only API for artist data. `/api/v1/artists`, `/api/v1/artists/[slug]`. Powers third-party apps → backlinks from every app. | `app/api/v1/[...path]/route.ts` | 3h |
| 4.4 | **Google News sitemap.** Sitemap specifically for blog posts. Required for Google News inclusion. | `app/google-news-sitemap.ts` | 30min |
| 4.5 | **Template differentiation.** Artists with campaigns get a different layout than artists without. Artists with reviews get a "community" tab. Artists with 0 tracks get a "claim this page" prompt. | `app/artist/[slug]/ArtistProfileClient.tsx` | 1h |
| 4.6 | **Email notification: "Your review got a reply."** When an artist responds to a fan review, send email. Drives re-engagement. | `app/api/cron/review-notifications/route.ts` | 30min |

### Deliverables
- Auto-discovery of new artists from Bandcamp
- "In the news" section on artist pages
- Public API for third-party developers
- Google News sitemap for blog
- Different templates for different artist types
- Notification emails for review engagement

### Acceptance Criteria
- [ ] Weekly cron creates 50+ new artist profiles
- [ ] Artist page shows Google News mentions
- [ ] `GET /api/v1/artists` returns paginated artist list
- [ ] Google News sitemap validates
- [ ] Artist with 0 tracks shows "Claim this page" CTA
- [ ] Artist with campaigns shows campaign-focused layout
- [ ] Email sent when artist responds to review

---

## 8. Total Cost & Timeline

### Effort Summary

| Phase | What | Dev Hours | API/Infra Cost | New Pages | Dependencies |
|-------|------|-----------|---------------|-----------|-------------|
| **0a** | Bio Engine Architecture | 25h | ~$0.06 API | 2K+ unique bios | None — can start now |
| **0b** | Entity Graph + Schema | 3h | $0 | sameAs, Person schema, links | Phase 0a (bios exist) |
| **1** | Entity Graph & Pages | 8h | $0 | 19K+ (tracks + genres + cities) | Phase 0 (content exists) |
| **2** | Community Layer | 16h | ~$5/month (storage) | Ongoing UGC per page | Phase 1 (track pages exist) |
| **3** | UGC & Backlinks | 8h | $0 | ~1K embeds (viral) | Phase 2 (UGC exists) |
| **4** | Scale & Automation | 10h | ~$10/month (scrapers) | 50+/week new artists | Phase 0-3 (engine proven) |
| **Total** | | **70h** | **~$15 one-time + $15/month** | **~25K+ pages → 1M+** | |

### Timeline

```
Week 1: Phase 0 (Content Foundation)
  Mon-Tue: Bio generation pipeline + batch generate 2K bios
  Wed: Internal linking expansion
  Thu: sameAs/Wikidata integration
  Fri: Author byline + similar artists algorithm

Week 2-3: Phase 1 (Entity Graph & Pages)
  Mon-Tue: Track-level SEO pages (19K new URLs)
  Wed: Genre landing pages
  Thu: City/geo pages
  Fri: Blog cross-linking + submissions widget

Week 3-4: Phase 2 (Community Layer)
  Mon-Tue: Fan review system
  Wed: Photo uploads + gallery
  Thu: Discussion boards
  Fri: Track reviews + "Meet other fans" + Artist responses

Week 4-5: Phase 3 (UGC & Backlinks)
  Mon: Embed badge
  Tue: Social sharing
  Wed: Google Indexing API + IndexNow
  Thu: Sitemap prioritization + share cards
  Fri: Homepage review highlight

Week 5-6: Phase 4 (Scale & Automation)
  Mon: Programmatic artist creation cron
  Tue: Press/news scraping cron
  Wed: Public API v1
  Thu: Google News sitemap + template differentiation
  Fri: Review notification emails

Total: 6 weeks to world-class
```

### What Each Phase Unlocks

| Phase | Unlocks |
|-------|---------|
| **0** | First Google rankings for artist names. LLM citations for Selah.fm artist data. |
| **1** | 10× more indexed pages. Rank for track titles and genre queries. Local artist SEO. |
| **2** | Unique, irreproducible page content. Competitive moat. Return visits. Fan-to-fan virality. |
| **3** | Backlinks from artist websites. Faster indexing. Social media traffic. Homepage freshness. |
| **4** | Infinite artist discovery. Press authority signals. Third-party developer ecosystem. Self-sustaining growth. |

---

## 9. Files to Create

### Phase 0: Content Foundation
| File | Purpose |
|------|---------|
| `app/api/cron/generate-artist-bios/route.ts` | Batch bio generation cron (100/night) |
| `app/api/artist/bio/route.ts` | Bio generation API (composable multi-slot) |
| `lib/bio-angles.ts` | 50+ angle definitions + selection criteria |
| `lib/bio-openings.ts` | 65+ opening hook templates by type |
| `lib/bio-descriptors.ts` | 50+ sound description framings |
| `lib/bio-journeys.ts` | 50+ journey/narrative framings |
| `lib/bio-closings.ts` | 50+ Selah.fm closing CTAs |
| `lib/bio-scorer.ts` | Quality scoring: word count, banned words, cosine similarity, auto-regenerate |
| `lib/bio-vocabulary.ts` | Sliding frequency window tracker — bans words used in 3+ of last 200 bios |
| `lib/bio-schema.ts` | Schema markup generator (MusicGroup, sameAs, Person) |
| `lib/bio-tone.ts` | 8 tone definitions (Profile, Review, Feature, Data, Listener, Journalist, Fan, Critic) |
| `supabase/migrations/..._artist_articles.sql` | New table for articles with quality scores |

### Phase 1: Entity Graph & Pages
| File | Purpose |
|------|---------|
| `app/artist/[slug]/tracks/[id]/page.tsx` | Track-level SEO page |
| `app/browse/genre/[genre]/page.tsx` | Genre landing page (upgrade from filter) |
| `app/artists/[city]/page.tsx` | City artist listing page |

### Phase 2: Community Layer
| File | Purpose |
|------|---------|
| `app/api/reviews/route.ts` | Fan review CRUD |
| `components/ReviewSection.tsx` | Review display component |
| `components/FanPhotoGallery.tsx` | Photo gallery component |
| `app/api/photos/route.ts` | Photo upload endpoint |
| `components/ArtistDiscussion.tsx` | Discussion board component |
| `components/TrackReviewSection.tsx` | Track-level reviews |
| `components/FanList.tsx` | "Meet other fans" component |

### Phase 3: UGC & Backlinks
| File | Purpose |
|------|---------|
| `components/EmbedBadge.tsx` | "Made on Selah.fm" embed snippet |
| `app/api/embed/[slug]/route.tsx` | Embed badge server route |
| `lib/social-share.ts` | Social sharing utilities |
| `lib/google-indexing.ts` | Google Indexing API client |
| `app/api/cron/submit-to-google/route.ts` | Periodic URL submission |
| `app/api/reviews/[id]/share-card/route.tsx` | Shareable review card image |

### Phase 4: Scale & Automation
| File | Purpose |
|------|---------|
| `app/api/cron/discover-artists/route.ts` | Auto-create artists from Bandcamp |
| `app/api/cron/scrape-artist-news/route.ts` | Google News scraping cron |
| `app/api/v1/[...path]/route.ts` | Public read-only API |
| `app/google-news-sitemap.ts` | Google News sitemap |
| `app/api/cron/review-notifications/route.ts` | Review reply email notification |

---

## 10. Success Metrics

### By Phase

| Phase | Metric | Target | Timeline |
|-------|--------|--------|----------|
| **0** | Artists with bios ≥ 300 words | 1,000 | Week 1 |
| **0** | Artist page internal links | ≥ 15/page | Week 1 |
| **0** | Artist pages with sameAs/Wikidata | 500 | Week 1 |
| **1** | Indexable track pages | 10,000 | Week 2-3 |
| **1** | Genre pages with content | 20 | Week 2-3 |
| **1** | City pages | 50 | Week 2-3 |
| **2** | Artist pages with ≥ 1 review | 500 | Week 3-4 |
| **2** | Total fan reviews | 2,000 | Week 3-4 |
| **2** | Fan photos uploaded | 500 | Week 3-4 |
| **3** | Embed badges installed | 100 | Week 4-5 |
| **3** | Google Indexing API submissions/day | 200 | Week 4-5 |
| **4** | New artists discovered/week | 50 | Week 5+ |
| **4** | API v1 requests/month | 10,000 | Week 5+ |

### By 3 Months

| Metric | Current | Target |
|--------|---------|--------|
| Total indexable pages | ~2,500 | 25,000+ |
| Monthly organic visits | ~0 | 10,000+ |
| Domain Authority | ~0 | 15+ |
| Artists with bios | ~500 | 2,000+ |
| Total fan reviews | 0 | 5,000+ |
| Fan photos uploaded | 0 | 2,000+ |
| Artist discussion threads | 0 | 1,000+ |
| Embed badges installed | 0 | 500+ |
| API requests/month | 0 | 50,000+ |
| Google Knowledge Panels linked | 0 | 500+ |
