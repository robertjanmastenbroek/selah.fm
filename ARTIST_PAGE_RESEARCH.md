# Selah.fm Artist Pages — Deep Research Report
**Date:** 2026-06-03
**Scope:** Full audit of `/artist/[slug]` — SEO, LLMO, UX, competitors
**Current state:** Recently redesigned (12 gaps closed), but substantial opportunities remain

---

## TABLE OF CONTENTS
1. [Live Site Verification](#1-live-site-verification)
2. [Current Architecture](#2-current-architecture)
3. [Competitor Analysis](#3-competitor-analysis)
4. [SEO Deep Dive](#4-seo-deep-dive)
5. [LLMO Deep Dive](#5-llmo-deep-dive)
6. [UX Deep Dive](#6-ux-deep-dive)
7. [Technical Issues Found](#7-technical-issues-found)
8. [Priority Ranking](#8-priority-ranking)

---

## 1. Live Site Verification

### Method
- Attempted `GET https://selah.fm/artist/hildegunn-iseth` — responded **"Artist not found"**
- Google indexed paths: `/artist` (list/search), `/artist/[slug]` — no `selah.fm/artist/*` in SERP results

### Implications
- **Artist pages may not be rendering correctly for many slugs** — the `hildegunn-iseth` slug exists in the pipeline (campaign exists at `/c/hildegunn-iseth-meandering-faae`) but the artist page returns 404
- **Crawl budget is being wasted** — if pages 404 for crawlers, Google won't index them
- This could be a slug-mismatch between `campaign_claims` → `artist_profiles` → `discovered_artists`

### Verdict: **RED — Artist pages may not be live for most artists.** This kills ALL SEO value regardless of markup.

---

## 2. Current Architecture

### Page Structure (app/artist/[slug]/)

```
page.tsx                    — Server component, data fetching, server schema, metadata
├── ArtistProfileClient.tsx — Client component, all UI
│   ├── Cover banner (track art or gradient)
│   ├── Profile photo + name + verified badge + genre chips
│   ├── Stats bar (Tracks | Videos | Views | Raised)
│   ├── Dual CTAs (Support / Make a Video)
│   ├── About section (bio text)
│   ├── Track list with sorting (CPM / Newest)
│   ├── Activity feed
│   ├── Recent submissions gallery + reactions
│   ├── Comments section (threaded, likes, reports)
│   ├── [RIGHT COLUMN] Related artists
│   ├── [RIGHT COLUMN] Embed widget
│   ├── [RIGHT COLUMN] Claim page prompt
│   ├── [RIGHT COLUMN] Cross-links (3 generic links)
│   └── Sticky mobile CTA bar
├── ArtistCardClient.tsx — Orphaned component (439 lines, not imported)
└── embed/route.tsx — Server-rendered iframe embed

Supporting files:
├── lib/artist-content.ts     — AI bio generator (EXISTS but NEVER CALLED)
├── lib/artist-metrics.ts     — Metrics crawling/refresh
├── lib/internal-links.ts     — Cross-link generator (WIRED but GENERIC)
├── components/ArtistCard.tsx  — Reusable card (used in browse + related)
├── components/ArtistEmbed.tsx — Embed widget UI
├── components/ActivityFeed.tsx
├── components/PageComments.tsx
└── components/SubmissionReactions.tsx
```

### Schema Markup (JSON-LD in page.tsx)
```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "MusicGroup", name, genre, image, identifier },
    ...tracks.map(t => ({ "@type": "MusicRecording", name, byArtist, image })),
    { "@type": "BreadcrumbList", ... },
    { "@type": "FAQPage", mainEntity: [2 GENERIC question/answer pairs] }
  ]
}
```

### Metadata (generateMetadata)
- Title: `{name} — Music Promotion & Fan Community | Selah.fm`
- Description: `Support {name} on Selah.fm. {track count} available. {genres} artist. Donate, make videos, and earn per view.`
- Noindex only for thin artists (0 tracks OR 0 activity)
- Canonical URL, Open Graph, Twitter cards

---

## 3. Competitor Analysis

### 3.1 Direct Music Promotion Competitors

| Platform | Artist Page Features | Our Gaps |
|----------|---------------------|----------|
| **SubmitHub** | Link-in-bio landing page, curator stats, feedback history, custom domains, analytics | We don't have artist-specific analytics dashboard |
| **Groover** | Profile completion score, Spotify data integration, bio + banner + social links, curator stats | We don't show profile completion or prompt artists what's missing |
| **BeatStars** | Pro Page: customizable storefront, SEO title/desc per page, tags, track player, license tiers | We don't let artists customize their page title/desc per-track |
| **Bandcamp** | Each track = its own SEO page, fan messaging, merch integration, comments on tracks, wishlist | We don't have per-track SEO pages, no merch |
| **SoundCloud** | Track-first layout, activity as content (reposts, likes), waveform player, playlist grouping | Our tracks are a list, not a player |
| **Patreon** | Tiered membership, posts feed, community tab, earnings showcase, "Join for free" | No membership tier, no earnings transparency |
| **Spotify for Artists** | Bio, monthly listeners graph, top cities, playlist adds, real-time stats | No real-time stats dashboard on artist page |

### 3.2 What Top Music Platforms Do That We Don't

**BeatStars Pro Page SEO:**
- Producers set custom page title, meta description, and tags per page
- Track-level SEO (each beat has its own indexable URL with custom title)
- "Type Beat" naming convention for search

**Bandcamp:**
- Every track is a separate SEO page with unique description
- Fan can "wishlist" tracks (engagement metric)
- Comments on individual tracks (not just artist-level)
- Artist can pin tracks to top

**SoundCloud:**
- Waveform player embedded in artist page
- Playlist-able: artists group tracks into playlists
- Repost system = activity as content
- "Similar artists" based on listening patterns (not just same genre)

**Groover:**
- Profile completeness prompt: "Add a bio to increase your chances"
- Connected Spotify data: shows monthly listeners + top tracks from API
- Curator feedback visible on artist profile

### 3.3 Cross-Industry Patterns Applicable to Artist Pages

| Platform | Pattern | Selah Adaptation |
|----------|---------|-----------------|
| **Airbnb** | Trust architecture (Superhost badge, response rate, review transparency) | ✅ Verified badge done, missing response rate or creator stats |
| **GoFundMe** | Emotional progress bar + social proof | ❌ Missing donation goal / progress toward goal on artist page |
| **YouTube** | Channel tabs (Videos/Shorts/Live/About) + Subscribe button | ✅ Banner + profile photo pattern done, missing tab navigation for content types |
| **Patreon** | Tiered membership + earnings showcase | ❌ No tier system, no earnings shown |
| **Kickstarter** | Two-column: content left, rewards right | ✅ Partially done, but the right column could be more action-oriented |
| **LinkedIn** | Profile completeness indicator + skills endorsements | ❌ No "complete your profile" prompt |
| **Pinterest** | Visual-first discovery + save/board system | ❌ No "save artist" or collection feature |

---

## 4. SEO Deep Dive

### 4.1 What's Excellent ✅

- Server-rendered with `force-dynamic`
- Canonical URLs on every page
- Open Graph + Twitter cards with images
- BreadcrumbList schema
- FAQPage schema (even if generic)
- MusicGroup + MusicRecording schemas
- Thin-content noindex logic
- Alternates (canonical) set

### 4.2 What's Critical Missing 🚨

#### **P0 — Artist pages may return 404 for most slugs**
- Live test of `hildegunn-iseth` returned "Artist not found"
- This artist has a campaign at `/c/hildegunn-iseth-meandering-faae`
- If the slug doesn't match between `campaign_claims.claimed_by` and `artist_profiles.slug`, the server query `WHERE ap.slug = ${slug}` returns 0 rows
- **Impact:** 2,000+ potential pages returning 404 → Google wastes crawl budget → zero indexing

#### **P1 — Meta descriptions are keyword-poor**
- Current: "Support {name} on Selah.fm. {track count} available. {genres} artist."
- Missing: track names, listener count, CPM rates, call to action with keywords
- Example improvement: "Support indie electronic artist {name} with {track count} tracks including {top_track}. Earn ${CPM}/1M views making TikToks and Reels. Donate, create, and earn per view."

#### **P1 — Sitemap `lastmod` has a type error**
```sql
MAX(GREATEST(at.updated_at, da.updated_at, COALESCE(da.comment_count, 0))) as lastmod
```
- `da.comment_count` is an integer, not a date
- `GREATEST` mixing date and integer types returns NULL or causes SQL error
- This means ALL artist sitemap entries have `lastModified: new Date()` (falls back to now)
- Google can't determine freshness → lower crawl priority

#### **P2 — FAQPage has only 2 hardcoded questions**
- Same questions for EVERY artist: "How do I support X?" and "How do I make a video for X?"
- No genre-specific, track-specific, or artist-specific questions
- Google shows FAQ rich results for pages with 2+ Q&A pairs, but these generic questions won't match any real search queries

#### **P2 — MusicGroup schema lacks `description` and `aggregateRating`**
- Schema has `name`, `genre`, `image`, `identifier` but NO `description`
- Google Knowledge Panels use `description` from schema
- No `aggregateRating` even though we have supporter counts and donation data

#### **P3 — No hreflang or international targeting**
- All pages serve in English only
- Music is inherently global — artists from non-English speaking countries could benefit from hreflang

#### **P3 — Internal linking is thin**
- `getArtistLinks()` returns 3 generic links: browse, welcome-creators, CPM calculator
- No blog post cross-links
- No campaign page cross-links
- No genre page cross-links beyond the genre tag links

#### **P3 — No "Article" or "WebPage" schema alongside MusicGroup**
- Google prefers having the page type + the entity type
- Artist page should have both `@type: "WebPage"` and a `mainEntity` pointing to the MusicGroup

### 4.3 SEO Score: 6/10

| Criteria | Score | Notes |
|----------|-------|-------|
| Server rendering | 10/10 | `force-dynamic`, no client-only rendering |
| Canonical URLs | 10/10 | Every page has canonical |
| Structured data | 7/10 | Good schemas but missing description, rating, thin FAQ |
| Meta tags | 5/10 | Descriptions are too generic, no H1 optimization |
| Sitemap | 4/10 | Type error kills freshness signals |
| Internal links | 4/10 | Only 3 generic links per page |
| Page speed | 7/10 | Client component hydration, but server HTML is fast |
| Crawlability | 3/10 | Possible 404 issues for many slugs |
| Open Graph | 8/10 | OG + Twitter present, but descriptions are weak |

---

## 5. LLMO Deep Dive

### 5.1 What LLMs Need

Based on the GEO research from Chartlex and 2pointagency:

1. **Concrete, verifiable facts** — Vague bios are useless to LLMs. They need numbers: "10,000 monthly listeners", "3 tracks on Spotify", "genre: indie electronic"
2. **Structured data** — Schema.org markup helps LLMs understand entity relationships
3. **Q&A format** — FAQPage schema AND inline Q&A blocks are highly citable
4. **Explicit entity labels** — Clear genre labels, collaborator names, location data
5. **Authority signals** — Press mentions, blog coverage, playlist features
6. **Fresh content** — Recent activity, new tracks, updated bios

### 5.2 Current State

| LLMO Signal | Status | Impact |
|-------------|--------|--------|
| Factual data (listeners, tracks) | ✅ Present in schema + UI | LLMs can cite numbers |
| FAQPage schema | ⚠️ Generic, 2 questions only | Won't match real queries |
| Entity labels (genre) | ✅ Genre chips + schema | Good |
| Authority signals | ❌ None | No press/awards section |
| Freshness indicators | ⚠️ Activity feed exists but no date markers | Weak |
| AI-generated bio content | ❌ `generateArtistBio()` exists but NEVER CALLED | Biggest gap |
| Inline Q&A blocks | ❌ Only in schema, not in visible page content | Schema-only |
| "Quick facts" section | ❌ Not built | Missed opportunity |
| Collaborator information | ❌ Not shown | LLMs cite collaborations |
| Location data | ❌ Not in schema or UI | Important for local queries |

### 5.3 LLMO Score: 3/10

The artist pages are nearly invisible to LLMs because:
1. Most artists have empty bios → nothing to cite
2. FAQPage is generic → won't match specific queries
3. No inline Q&A → LLMs prefer visible Q&A over schema-only
4. No press/awards → no authority signals

---

## 6. UX Deep Dive

### 6.1 What's Excellent ✅

- Full-width cover banner with vignette overlay (YouTube-style)
- Profile photo overlapping banner
- Stats bar with real numbers
- Dual CTAs for the two user types (supporters vs creators)
- Verified badge with activity-based visibility
- Genre color-coded chips
- Track sorting (CPM / Newest)
- Activity feed
- Recent submissions gallery
- Threaded comments with likes + report
- Related artists
- Embed widget
- Sticky mobile CTA bar
- Submit video modal

### 6.2 What's Missing 🚨

#### **P1 — No campaign-activity connection**
- Artist page shows tracks, but NOT which tracks have active campaigns
- No "Active campaigns" section showing "Support {name} by joining these 3 campaigns"
- This is the PRIMARY monetization pathway — it's buried

#### **P1 — Follow is localStorage-only**
- Follows don't persist across devices
- No server-side follow tracking
- No follow notifications
- No "artists you follow" section on homepage/dashboard

#### **P2 — No streaming player**
- Tracks shown as cards, not playable
- No Spotify/YouTube embed player
- Users can't preview the music before committing

#### **P2 — No social proof at the top**
- "Donate $X raised" is in the CTA button — buried
- GoFundMe shows "$12,345 raised of $20,000" at the TOP
- We show stats in a grid (good) but the donation count could be more prominent

#### **P3 — No tab-based navigation for content types**
- YouTube uses tabs: Videos / Shorts / Live / About
- We stack everything vertically — long page, user must scroll
- Tabs would: Videos | Activity | About | Comments

#### **P3 — No artist-content relationship shown**
- Which blog posts mention this artist?
- Which campaigns are they in?
- A "Digital presence" section showing all mentions across the platform

#### **P3 — Orphaned ArtistCardClient component**
- `app/artist/[slug]/ArtistCardClient.tsx` (439 lines) is not imported by any page
- It contains the `MetricCard`, `useCountUp` hook, and full metrics dashboard
- This represents WASTED code that should either be wired in or deleted

### 6.3 UX Score: 7/10

The redesign is solid. The main gaps are around:
- Making the donation/monetization pathway visible
- Persisting follows server-side
- Adding track previews
- Better content organization (tabs vs scroll)

---

## 7. Technical Issues Found

### P0 — Critical

| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| Artist page 404 for known slugs | `app/artist/[slug]/page.tsx` SQL query | ALL SEO value nullified | Investigate slug mismatch between `artist_profiles` and `campaign_claims`; add fallback query that searches by artist name; add logging for 404s |
| Sitemap `lastmod` type error | `app/sitemap.ts` line ~77 | All artist URLs show `now()` as lastmod | Fix SQL: replace `COALESCE(da.comment_count, 0)` with `da.updated_at` |

### P1 — High

| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| `ArtistCardClient.tsx` orphaned | `app/artist/[slug]/ArtistCardClient.tsx` | 439 lines dead code, confused import paths | Delete or wire into a route (e.g., `/artist/[slug]/card`) |
| Bio generator not wired | `lib/artist-content.ts` | 2,000+ pages with empty bios, $140 opportunity cost | Add to cron dispatcher at 00:00 UTC, or call on-demand when artist page is viewed without a bio |
| Meta descriptions too generic | `page.tsx` `generateMetadata()` | Low CTR in SERPs | Enrich with track name, CPM rate, listener count |
| FAQPage too generic | `page.tsx` JSON-LD | Won't match real search queries | Generate dynamically using `generateArtistBio().faq` or fallback to genre-specific Q&A |

### P2 — Medium

| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| No music player | ArtistProfileClient.tsx | Users can't preview tracks | Add Spotify embed for tracks with Spotify URLs |
| Follow not server-persisted | ArtistProfileClient.tsx | User loses follows on cache clear | Add `artist_follows` table + API + migration |
| No campaign cross-links | Both page.tsx + ArtistProfileClient.tsx | Missed conversion opportunity | Query campaigns for this artist, show "Active campaigns" section |
| `getArtistLinks()` too thin | lib/internal-links.ts | Poor internal link graph | Add blog post and campaign cross-links |
| Schema missing `description` + `aggregateRating` | page.tsx JSON-LD | No Knowledge Panel optimization | Add dynamic description + rating from stats |
| No hreflang | page.tsx | Missed international traffic | Default to "en" with `x-default` |

### P3 — Low

| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| Tab-based navigation missing | ArtistProfileClient.tsx | Long scroll, poor mobile UX | Add YouTube-style tabs: Videos | Activity | About | Comments |
| Streaming stats not shown | ArtistProfileClient.tsx | Rich data from `artist_metrics` not surfaced | Show top metric cards (monthly listeners, followers) |
| No sidebar on desktop for CTAs | ArtistProfileClient.tsx | Mobile has sticky bar, desktop doesn't | Add sticky sidebar card (Airbnb/Kickstarter pattern) |

---

## 8. Priority Ranking

### Immediate Fixes (Fix Today)

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| **CRITICAL** | Debug artist page 404s for known slugs | 1 hour | Unblocks ALL artist SEO |
| **CRITICAL** | Fix sitemap lastmod type error | 15 min | Fixes freshness signals for Google |
| **HIGH** | Wire up `generateArtistBio()` to cron | 1 hour | 2,000+ pages get body content |
| **HIGH** | Enrich meta descriptions with track/CPM data | 30 min | Better CTR in SERPs |
| **HIGH** | Fix orphaned ArtistCardClient component | 15 min | Clean up dead code |
| **HIGH** | Make FAQPage schema dynamic per artist | 1 hour | Rich result eligibility for real queries |

### High-Impact Next (Within 2 Days)

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| **HIGH** | Serve AI bios on demand (generate on page view if missing) | 1 hour | 2,000+ pages indexed with rich content |
| **HIGH** | Add campaign cross-links to artist pages | 1 hour | Direct conversion pathway |
| **HIGH** | Expand `getArtistLinks()` with blog + campaign links | 30 min | Better internal link graph |
| **HIGH** | Add Server-persisted follow system (table + API + migration) | 2 hours | User retention + notification infrastructure |
| **MEDIUM** | Add `description` + `aggregateRating` to MusicGroup schema | 15 min | Knowledge Panel optimization |

### Strategic (This Week)

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| **MEDIUM** | Add inline Q&A blocks to visible page content | 2 hours | LLM citation hooks |
| **MEDIUM** | Add track preview (Spotify embed) | 2 hours | Better UX, longer dwell time |
| **MEDIUM** | Add tab-based navigation | 3 hours | Better mobile UX |
| **LOW** | Add streaming stats/metrics to artist page | 2 hours | Rich data surface |
| **LOW** | Add "Quick facts" section with verifiable data | 1 hour | LLM-friendly structure |

---

## Appendix: Quick Wins (Sub-30 Minute Fixes)

1. **Fix sitemap lastmod** — Replace `da.comment_count` with `da.updated_at`
2. **Fix meta description** — Add `$X/1M views` and top track name
3. **Add `description` to MusicGroup schema** — From bio or fallback
4. **Add `aggregateRating` to MusicGroup schema** — From supporter count
5. **Delete orphaned `ArtistCardClient.tsx`** or add `export { default }` pattern
6. **Expand `getArtistLinks()`** — Add 2 more relevant links
7. **Add track-level campaign badge** — Show which tracks have active campaigns
