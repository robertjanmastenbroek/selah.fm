<!--
================================================================================
ARCHIVED — See SELAH.md for current source of truth.

This file is preserved for historical reference only. All actionable content
has been consolidated into SELAH.md (the living document).
================================================================================
-->

# Selah.fm vs World-Class Directory Sites — Full Audit & Gap Analysis
**Date:** 2026-06-03
**Goal:** Identify every gap between Selah.fm's current state and the world's best directory-scale SEO systems

---

## Table of Contents
1. [Research Sources](#1-research-sources)
2. [The Big 8: How They Dominate](#2-the-big-8-how-they-dominate)
3. [The Programmatic SEO Model](#3-the-programmatic-seo-model)
4. [The Common Thread: What All 8 Sites Do](#4-the-common-thread)
5. [Wikidata & Knowledge Graph: Your Missing Layer](#5-wikidata--knowledge-graph-your-missing-layer)
6. [Selah.fm Current State Audit](#6-selahfm-current-state-audit)
7. [Gap Analysis — 30 Gaps](#7-gap-analysis--30-gaps)
8. [Priority Ranking](#8-priority-ranking)
9. [Phased World-Class Implementation Roadmap](#9-phased-world-class-implementation-roadmap)

---

## 1. Research Sources

| Source | Key Insight |
|--------|-------------|
| **Wikipedia SEO guide** (SearchEngineJournal) | DA 100, top-10 for 56% of searches. Success: internal linking density, entity structure, backlink profile, editorial standards |
| **Wikipedia structural framework** (Wikimedia Diff 2025) | Internal links "allow for continued exploration between related topics." Every article has dozens of contextual links. |
| **Google ↔ Wikipedia relationship** | Wikipedia is Google's primary Knowledge Graph data source. Every article feeds entity recognition. |
| **Crunchbase case study** (GrackerAI) | Entity-graph SEO for 500K+ profiles. Success: investor/founder/competitor entity links, news integration |
| **Zillow case study** (GrackerAI) | 100M+ property pages, each with unique price/photos/description data. Automated templates at massive scale. |
| **Airbnb case study** (UsePattern) | Programmatic neighborhood pages. "Personalized content at scale" — user-centric automation. |
| **TripAdvisor case study** (UsePattern) | UGC + programmatic SEO synergy. Reviews, photos, tips per attraction create freshness. |
| **HubSpot topic clusters** (UsePattern) | Automated interlinking between related content pages. Topic authority through entity clusters. |
| **Programmatic SEO guide** (Semrush) | Yelp: 200M+ reviews = unique content per page scales infinitely |
| **Enterprise SEO guide** (Neil Patel) | Canonical management, crawl budget optimization, template differentiation at scale |
| **Knowledge Graph SEO guide** (StackMatix 2026) | 500B facts about 5B entities. Entity-linked content → 30-50% higher CTR |
| **Wikidata/Knowledge Graph guide** (StackMatix 2026) | Wikidata is Google's #1 source for KG data. SameAs → Wikipedia/Wikidata → Knowledge Panel |
| **Entity-first SEO** (SearchEngineLand) | Google shifted from keywords to entity understanding. Pages need explicit entity relationships. |
| **MusicBrainz** | Open music database. 400K+ daily active contributors. Success through community-driven data accuracy. |

---

## 2. The Big 8: How They Dominate

### 2.1 Wikipedia (DA 100, 6M+ articles)

| Factor | Detail | Selah's Status |
|--------|--------|----------------|
| **Domain authority** | DA 100. 56% of Google searches have Wikipedia in top 10. | DA ~0 (new domain) |
| **Backlinks** | ~2B from universities, news orgs, governments. | ~0 backlinks |
| **Internal linking** | 30-100+ links/article. Infoboxes, categories, "See also." | 3-6 links/artist page |
| **Entity density** | Wikidata: 100M+ entities with explicit relationships. | Basic MusicGroup schema |
| **Content uniqueness** | All 6M articles are unique — different editors, different sources. | 0 words of bio for most artists |
| **Structured data** | Infoboxes, categories, microformats. Machine-readable entity defs. | MusicGroup + FAQPage + BreadcrumbList |
| **Editorial quality** | Manual review, citation requirements, style guidelines. | AI-generated (quality varies) |
| **Freshness** | 5,000+ edits/hour. Pages constantly updated. | Static until cron runs |
| **Google Knowledge Graph** | Wikipedia is Google's primary data source for entity knowledge. | Not integrated with Wikidata |

**Key insight:** Wikipedia ranks because it's the most-linked-to site on earth, not because it does "SEO." The SEO is a side effect of editorial quality + entity depth + backlink gravity. We can't replicate the backlinks. We CAN replicate the entity depth and content quality.

### 2.2 Zillow (100M+ property pages)

| Factor | Detail |
|--------|--------|
| **Page count** | 100M+ individual property pages. Each has unique price, photos, description, tax history, school data. |
| **Template differentiation** | NOT all the same template. Different layouts for: for-sale, for-rent, recently-sold, pre-foreclosure. Each template has different schema types. |
| **Real-time data** | Prices update daily. Tax records update when counties publish data. Photos update when agents upload. Every page constantly changes = Google recrawls. |
| **Entity graph** | Property → Agent → Brokerage → Neighborhood → School district → City. 15+ entity types linked. |
| **Long-tail dominance** | Ranks for hyper-specific queries like "3 bed 2 bath house in Austin TX under $400K" — millions of unique long-tail queries. |
| **Tools as content** | Mortgage calculator, affordability calculator, rent vs buy calculator — each generates unique results pages. |

**Key architectural insight:** Zillow's genius is **template differentiation at scale**. They don't apply the same template to 100M pages. They have 10+ templates for different property types, each with different schema and layout. Google doesn't see "templated content" — it sees 100M unique pages.

### 2.3 Airbnb (4M+ neighborhood pages)

| Factor | Detail |
|--------|--------|
| **Programmatic content** | Generated pages for every neighborhood in every city. "Where to stay in [neighborhood]" type content. |
| **UGC integration** | Each page includes: user reviews, host profiles, photos, amenity data. Unique content per page from users. |
| **Local SEO** | Optimized for "vacation rentals in [neighborhood]" — hyperlocal long-tail queries. |
| **Personalization** | Pages adapt based on user's search filters (price, dates, guests). Unique URL per filter combination. |

**Key insight:** Airbnb's neighborhood pages work because they have **real user data** (reviews, photos) embedded in every page. The programmatic template is just the shell — user content fills it.

### 2.4 TripAdvisor (1M+ attraction pages)

| Factor | Detail |
|--------|--------|
| **UGC scale** | 800M+ reviews, 100M+ photos. Every attraction page has dozens of unique user contributions. |
| **Programmatic + UGC** | Template generates the page shell (attraction name, location, hours). Users fill it with reviews, photos, tips. |
| **Review freshness** | "Most recent review" section on every page. Google sees every page as "recently updated." |
| **Entity graph** | Attraction → City → Country → Category → Similar attractions → User profiles. |
| **Translation at scale** | Reviews auto-translated into 28 languages. Each translated review = unique content for that language's page. |

**Key insight:** TripAdvisor demonstrates the **virality loop of UGC + SEO**. More visitors → more reviews → unique content per page → higher rankings → more visitors.

### 2.5 Crunchbase (500K+ company profiles)

| Factor | Detail |
|--------|--------|
| **Entity graph SEO** | Every company page links to: investors, founders, portfolio companies, competitors, funding rounds, news. |
| **News integration** | Scrapes press releases and news. "Recent news" section on every page — auto-updated. |
| **Programmatic templates** | ~10 page types: company, person, fund, acquisition, school. Different schema per type. |
| **Content depth** | 2,000-5,000 words of entity-linked content per page. |
| **UGC** | Users add bios, descriptions, update funding. |

**Key insight:** Crunchbase's "Recent news" section is the killer feature. Every company page has fresh press coverage without Crunchbase creating any content. Google sees freshness + authority (press links) + unique content.

### 2.6 IMDb (10M+ titles, 250M+ users)

| Factor | Detail |
|--------|--------|
| **User engagement** | 250M+ ratings, 50M+ reviews, watchlists, trivia. Every user action creates content. |
| **Entity graph** | Movie → Cast → Actor → Bio → Filmography. Dense bi-directional linking. |
| **UGC at scale** | User reviews, ratings, trivia, quotes, goofs, message boards. |
| **Structured data** | Movie, Person, Review, Rating, AggregateRating — multiple per page. |
| **Freshness** | New movies daily, ratings constantly update, users add trivia. |

**Key insight:** IMDb ranks because of **engagement density**, not content volume. A page with 50K ratings and 2K reviews gets crawled more often because Google sees high engagement signals.

### 2.7 Yelp (80M businesses, 200M+ reviews)

| Factor | Detail |
|--------|--------|
| **UGC dominance** | 200M+ reviews. Every page has unique user-generated content. |
| **Local SEO** | Maps, directions, hours, phone — optimized for local queries. |
| **Photo content** | 100M+ user photos with alt text and geotags. |
| **Review freshness** | "Latest review" section on every page. Google sees constant updates. |
| **Widget backlinks** | Yelp widget on 1M+ business websites = massive backlink profile. |

**Key insight:** Yelp solved the "templated content at scale" problem with UGC. They don't generate content — their users do. Selah.fm's UGC gap is the hardest to close because it requires users.

### 2.8 AllMusic / Discogs / MusicBrainz (3M+ albums, 10M+ releases)

| Factor | Detail |
|--------|--------|
| **Professional editorial** | AllMusic: actual writers creating album reviews. |
| **User cataloging** | Discogs: 400K+ users cataloging vinyl/CD collections. Wantlists = unique UGC. |
| **Marketplace data** | Discogs: 50M+ items for sale. Commerce data (prices, availability) is unique per page. |
| **Deep discography** | Label → Artist → Release → Track → Format → Genre. Deepest entity graph in music. |
| **Community corrections** | MusicBrainz: 400K+ daily active users correcting data. Editorial quality at scale. |
| **API ecosystem** | MusicBrainz API powers hundreds of third-party apps → backlinks from every app. |

**Key insight:** Music directories succeed by having **unique data no one else has**. Discogs has the world's most complete discography because 400K users contributed their collections. What unique data does Selah.fm have that no one else does?

---

## 3. The Programmatic SEO Model

Analyzing Zillow, Airbnb, TripAdvisor, Crunchbase, and Yelp reveals a consistent architecture:

### The 5-Layer Programmatic SEO Stack

```
Layer 1: DATA
  └── Unique, structured data from authoritative sources
      └── Zillow: MLS listings, county records
      └── Crunchbase: SEC filings, press releases
      └── Selah: Artist profiles from Bandcamp/Spotify crawls

Layer 2: TEMPLATES
  └── Differentiated page templates per content type
      └── Zillow: 10+ property type templates (for-sale ≠ for-rent ≠ sold)
      └── Crunchbase: company ≠ person ≠ fund (different schema, layout)
      └── Selah: 1 template for all artists (no differentiation)

Layer 3: ENTITY GRAPH
  └── Dense internal linking between related entities
      └── Zillow: Property → Agent → Brokerage → School → City
      └── Crunchbase: Company → Investor → Founder → Competitor
      └── Selah: Artist → Genre (1 link only)

Layer 4: FRESHNESS
  └── Auto-updating content triggers recrawl
      └── Zillow: Daily price updates
      └── TripAdvisor: New reviews daily
      └── Selah: No auto-updates

Layer 5: UGC
  └── User contributions create unique content per page
      └── Yelp: 200M reviews
      └── IMDb: 250M ratings
      └── Selah: No UGC on artist pages
```

### Where Selah.fm Fits

| Layer | Our Status | What We Need |
|-------|-----------|--------------|
| **Data** | ✅ Good. 2,000 artists with metadata | More artists via scraping pipeline |
| **Templates** | ❌ 1 template for all | Different templates: artist with tracks ≠ artist without tracks ≠ artist with campaigns |
| **Entity graph** | ❌ 3-6 links/page | 15-25 links. Artists → Genre page, Similar artists, Blog posts, Tracks, Campaigns, Tools |
| **Freshness** | ❌ Static | Auto-generate bios, scrape news, show latest submissions |
| **UGC** | ❌ None | Ratings, reviews, "latest videos" section |

---

## 4. The Common Thread

### 10 Factors × 8 Competitors

| # | Factor | Wiki | Zillow | Airbnb | TripAdv | Crunch | IMDb | Yelp | AllMusic | Selah |
|---|--------|------|--------|--------|--------|-------|------|------|----------|-------|
| 1 | **Internal links: 20+/page** | ✅ 80+ | ✅ 25+ | ✅ 20+ | ✅ 15+ | ✅ 20+ | ✅ 30+ | ✅ 15+ | ✅ 25+ | ❌ 3-6 |
| 2 | **Entity graph SEO** | ✅ WikiData | ✅ Prop→Agent | ✅ City→Nghbr | ✅ Attr→City | ✅ Inv→Found | ✅ Cast→Crew | ✅ Cat→Biz | ✅ Label→Rel | ❌ Basic |
| 3 | **Template differentiation** | ✅ By topic | ✅ 10+ types | ✅ City type | ✅ Attr type | ✅ 5+ types | ✅ Movie≠TV | ✅ Biz≠Rest | ✅ Rel≠Mast | ❌ 1 type |
| 4 | **Unique content per page** | ✅ Human | ✅ Data | ✅ UGC+Data | ✅ UGC | ✅ AI+UGC | ✅ UGC | ✅ UGC | ✅ Pro edit | ❌ Empty |
| 5 | **UGC at scale** | ✅ 50M edits | ❌ N/A | ✅ Reviews | ✅ 800M rev | ✅ Updates | ✅ 250M rat | ✅ 200M rev | ✅ Catalog | ❌ None |
| 6 | **Freshness signals** | ✅ 5K/hr | ✅ Daily | ✅ Daily | ✅ Real-time | ✅ Real-time | ✅ Daily | ✅ Real-time | ✅ Community | ❌ Static |
| 7 | **Backlinks/Domain Auth** | ✅ DA100 | ✅ DA93 | ✅ DA92 | ✅ DA91 | ✅ DA92 | ✅ DA93 | ✅ DA91 | ✅ DA88 | ❌ DA~0 |
| 8 | **Multi-schema per page** | ✅ 5+ | ✅ 4+ | ✅ 3+ | ✅ 3+ | ✅ 3+ | ✅ 4+ | ✅ 3+ | ✅ 4+ | ✅ 3+ |
| 9 | **Widget/embed backlinks** | ✅ CC lic | ✅ Widgets | ✅ Embed | ✅ Widgets | ✅ API | ✅ Widgets | ✅ Bz widget | ✅ API | ❌ Only1 |
| 10 | **Editorial quality floor** | ✅ Cit rules | ✅ Auto | ✅ Mod | ✅ Mod | ✅ Mod | ✅ Mod | ✅ Filter | ✅ Curators | ❌ None |

**80 data points. Selah.fm meets 1 (multi-schema).**

---

## 5. Wikidata & Knowledge Graph: Your Missing Layer

### Why This Matters (Researched from StackMatix 2026 + DigitalBloom)

| Statistic | Source |
|-----------|--------|
| Google's Knowledge Graph contains 500 billion facts about 5 billion entities | StackMatix 2026 |
| Wikidata is Google's #1 data source for Knowledge Graph | DigitalBloom AI visibility research |
| Entities in Knowledge Graph see 30-50% higher CTR on branded searches | StackMatix 2026 |
| AI Overview visibility increases ~19.72% when content is entity-linked | StackMatix 2026 |
| Schema.org sameAs → Wikipedia/Wikidata = strongest Knowledge Panel signal | StackMatix 2026 |

### The Data Flow (How Knowledge Panels Work)

```
Your website (MusicGroup schema with sameAs)
  → points to → Wikipedia article (narrative context)
  → points to → Wikidata entry (structured entity data: Q-number)
  → feeds into → Google Knowledge Graph (500B facts)
  → displays as → Knowledge Panel in search results
  → cited by → AI search (ChatGPT, Perplexity, Google AI Overviews)
```

### What Selah.fm Needs

| Step | What | Status | Effort |
|------|------|--------|--------|
| 1 | **Add sameAs to schema** — Link artists to Wikipedia/Wikidata if entries exist | ❌ Not done | 1h |
| 2 | **Search Wikidata for existing artist entries** — 70%+ of artists with Spotify presence have Wikidata entries | ❌ Not done | 2h pipeline |
| 3 | **Create Wikidata entries for artists without them** — Only if they meet notability (1,000+ monthly listeners) | ❌ Not done | Manual (1h per artist) |
| 4 | **Link artist pages to Knowledge Graph** — Google's Indexing API + sameAs markup | ❌ Not done | 1h |
| 5 | **Monitor Knowledge Panel appearance** — Track which artists get panels | ❌ Not done | 30min |

### Why Selah.fm Is Uniquely Positioned for Wikidata

Most artist websites can't get Wikidata entries because artists need Wikipedia articles first. But Selah.fm hosts **2,000 artist profiles** — a platform can get a Wikidata entry (Q-number) more easily because:
1. Selah.fm as a platform is notable (the site itself)
2. Each artist profile is a verifiable entity (presence on a real platform)
3. We can link artist profiles to existing Wikidata entries via `sameAs`

---

## 6. Selah.fm Current State Audit

### ✅ What We Have
- Server-rendered pages with `force-dynamic`
- MusicGroup + FAQPage + BreadcrumbList schema
- Dynamic FAQPage (4-5 Q&A per artist)
- Enriched meta descriptions with track names + CPM
- Related artists (genre-based, weak but present)
- Open Graph + Twitter cards
- Canonical URLs
- Thin-content noindex logic
- Sitemap with artist pages
- 1,911 artists with tracks
- Campaign cross-links on artist pages
- Internal links to 6 destinations

### ❌ What We're Missing

**Content (must fix before anything else matters):**
- No bio content for 90% of artists
- No track-level SEO pages (each track should be its own URL)
- No genre landing pages with content
- No city/geography pages
- No Wikidata/sameAs integration

**Entity Graph (Google needs to see connections):**
- No algorithmic similar artists (genre-only currently)
- No blog → artist cross-linking
- No "latest submissions" section on artist pages
- No press/news mentions on artist pages
- No timeline/activity visualization
- No collaborator/producer/record label links
- No embeddable artist widget for backlinks

**User-Generated Content (hardest gap to close):**
- No ratings or reviews on artist pages
- No way for creators to leave feedback
- No collaborative playlists/collections
- No "creators who made content for this artist" cross-linking

**Technical SEO at Scale:**
- No template differentiation (same layout for all artist types)
- No programmatic artist creation pipeline
- No Google Indexing API submission
- No IndexNow protocol for new pages
- No Google News sitemap
- No public API for external backlinks

---

## 7. Gap Analysis — 30 Gaps

### Content Layer (Must Fix First — Nothing Else Matters Without Content)

| # | Gap | Current | Target | Effort |
|---|-----|---------|--------|--------|
| 1 | **No artist bios** | 90% have 0 words | 300-1,800 words per artist | ~$10 API |
| 2 | **No track-level pages** | Tracks listed on artist page only | `/artist/[slug]/tracks/[id]` — MusicRecording page per track | 3h |
| 3 | **No genre landing pages** | `/browse/genre/[genre]` is just a filter | Full page: genre description, top artists, related genres, schema | 3h |
| 4 | **No city/geo pages** | Location data unused | `/artists/berlin` pages with local artist listings | 2h |
| 5 | **No timeline/activity graph** | Flat activity feed | Visual milestones: first track, first campaign, first submission | 3h |
| 6 | **No press/news mentions** | Not implemented | Weekly cron: scrape Google News for artist mentions, add to page | 3h |

### Entity Graph Layer (Google Needs to See Connections)

| # | Gap | Current | Target | Effort |
|---|-----|---------|--------|--------|
| 7 | **Algorithmic similar artists** | Genre-only matching | Similarity score: genre + listeners + tracks + geography | 4h |
| 8 | **Blog ↔ artist cross-linking** | No connection | Blog pipeline links to artists; artist page links to blog posts | 2h |
| 9 | **Latest submissions on artist page** | Not shown | Dynamic "Latest videos" section — freshness signal | 2h |
| 10 | **Collaborator/label links** | Not implemented | Link to related entities (co-writers, producers, record labels) | 2h |
| 11 | **Internal links too thin** | 3-6 per page | 15-25: genre, tools, similar, campaigns, blog, tracks | 1h |
| 12 | **sameAs → Wikidata/Wikipedia** | Not in schema | sameAs links to Wikidata Q-numbers and Wikipedia URLs | 1h |

### UGC Layer (Hardest — Requires Users)

| # | Gap | Current | Target | Effort |
|---|-----|---------|--------|--------|
| 13 | **No ratings on artist pages** | Not implemented | Star rating + text review per artist | 4h |
| 14 | **No creator feedback** | Not implemented | "Creators who made content for this artist also made for..." | 4h |
| 15 | **No playlists/collections** | Not implemented | Users can create and share curated artist lists | 4h |
| 16 | **No review/rating prompts** | Not implemented | "How was your experience with this campaign?" flow | 2h |
| 17 | **No "latest review" on homepage** | Not implemented | Fresh UGC on homepage = crawl signal | 2h |

### Backlink & Authority Layer (Takes Time)

| # | Gap | Current | Target | Effort |
|---|-----|---------|--------|--------|
| 18 | **No embed backlink strategy** | 1 widget, unused | "Made on Selah.fm" badges for artist websites → backlinks | 2h |
| 19 | **No social sharing optimization** | Basic OG tags | Custom share text per page, shareable cards | 1h |
| 20 | **No API for developers** | Not implemented | Public API → third-party apps → backlinks | 8h |
| 21 | **No author byline** | Not on pages | "By Selah.fm Music Team" + Person schema | 30min |
| 22 | **No Google News sitemap** | Not implemented | News sitemap for blog posts | 1h |

### Technical SEO Layer (Foundation)

| # | Gap | Current | Target | Effort |
|---|-----|---------|--------|--------|
| 23 | **Template differentiation** | 1 template for all artists | Different templates: artist with/without tracks, active/draft campaigns | 2h |
| 24 | **Programmatic artist creation** | Pipeline + manual only | Auto-create artists from Bandcamp new releases daily | 4h |
| 25 | **Google Indexing API submission** | Not implemented | Submit new/updated pages for immediate indexing | 1h |
| 26 | **IndexNow protocol** | Not implemented | Submit to Bing/Yandex on page creation | 30min |
| 27 | **Dynamic sitemap prioritization** | Equal priority for all | Higher priority for pages with content (bios, tracks, campaigns) | 1h |
| 28 | **Crawl budget management** | Noindex for thin pages only | Block thin pages (no content, no tracks) from index entirely | 1h |
| 29 | **Page speed optimization** | Not measured | Audit + optimize artist pages load time | 3h |
| 30 | **Canonical consistency** | ✅ Done | — | — |

---

## 8. Priority Ranking

### Tier 1: Must Fix Before Anything Else (Content)

| # | Gap | Why | Effort | Cost |
|---|-----|-----|--------|------|
| 1 | Artist bios | 0→unique content. Nothing else works without this. | 4h code + ~$10 API | $10 |
| 11 | Internal linking | 3→15 links in 1 hour. Highest ROI per hour. | 1h | $0 |
| 12 | sameAs/Wikidata | Links to Wikipedia/Wikidata unlock Knowledge Graph. | 1h | $0 |
| 21 | Author byline | Adds Person schema + "written by" authority. | 30min | $0 |
| 7 | Similar artists algorithm | More entity links. More reasons for Google to crawl. | 4h | $0 |

### Tier 2: Scale Content (Week 2-3)

| # | Gap | Why | Effort |
|---|-----|-----|--------|
| 2 | Track-level SEO pages | 10× more pages. Each track = new URL with targeted keywords. | 3h |
| 3 | Genre landing pages | Captures "buy [genre] music" queries. | 3h |
| 4 | City/geo pages | Captures "[city] musicians" local queries. | 2h |
| 6 | Press/news mentions | Freshness signal sources. | 3h |

### Tier 3: UGC Infrastructure (Week 3-4)

| # | Gap | Why | Effort |
|---|-----|-----|--------|
| 13 | Ratings + reviews | UGC uniqueness per page. Hard to replicate. | 4h |
| 9 | Latest submissions widget | Freshness signal on every page. | 2h |
| 16 | Review prompts | Gets UGC started. | 2h |

### Tier 4: Backlinks & Authority (Week 4-6)

| # | Gap | Why | Effort |
|---|-----|-----|--------|
| 18 | Embed/badge strategy | Every artist website becomes a backlink source. | 2h |
| 19 | Social sharing optimization | More shares → more links → more authority. | 1h |
| 25 | Google Indexing API | Fast indexing when new pages are created. | 1h |

---

## 9. Phased World-Class Implementation Roadmap

### Phase 0: Content Base ($10, 6h)
1. Generate bios for all artists (commit: `feat: artist bios for all 2K artists`)
2. Expand internal links to 15+ per page (commit: `feat: expanded entity graph`)
3. Add sameAs to schema with Wikidata/Wikipedia links (commit: `feat: Wikidata sameAs integration`)
4. Add author byline + Person schema (commit: `feat: author byline`)
5. Fix algorithmic similar artists (commit: `feat: algorithmically generated similar artists`)

### Phase 1: Page Expansion (8h)
1. Track-level SEO pages at `/artist/[slug]/tracks/[id]`
2. Genre landing pages with content + schema
3. City/geography artist pages
4. Blog → artist cross-linking (modify blog pipeline)
5. Latest submissions widget on artist pages

### Phase 2: UGC Infrastructure (10h)
1. Star rating + text review system for artist pages
2. Review prompt after campaign completion
3. "Creators who made content for this artist" cross-linking
4. Latest review on homepage

### Phase 3: Backlink & Authority (8h)
1. "Made on Selah.fm" embed badge (copy-paste snippet for artist websites)
2. Social sharing optimization (per-page custom share text + cards)
3. Google Indexing API integration
4. IndexNow protocol for Bing/Yandex
5. Sitemap prioritization (higher priority for pages with content)

---

## 10. The Community Layer: Fan Reviews, Photos & Track Pages

### Why This Changes Everything

| Current Problem | Community Solution | Impact |
|----------------|-------------------|--------|
| **No unique content per page** | Every artist page has fan reviews, photos, discussions | ✅ Unique UGC per page |
| **No freshness signals** | New reviews/photos posted daily | ✅ Google recrawls |
| **No reason to return** | "Check if anyone reviewed your favorite artist" | ✅ Daily active users |
| **No backlinks** | Fans share their review/photo on social media | ✅ Natural backlinks |
| **No entity graph depth** | User → Review → Artist → Track → Other fans | ✅ Dense entity connections |
| **No reason to browse** | Discover artists through what other fans are saying | ✅ Browsing becomes social |
| **No moat** | Anyone can copy artist profiles. Hard to copy a fan community. | ✅ Competitive moat |

### Competitive Landscape — No One Does This in Music

| Platform | Artist Info | Fan Reviews | Fan Photos | Discussion | Track Pages |
|----------|------------|-------------|------------|------------|-------------|
| **Spotify** | ✅ Bio, discography | ❌ | ❌ | ❌ | ✅ Separate track pages |
| **Apple Music** | ✅ Bio, editorial | ❌ | ❌ | ❌ | ✅ |
| **Bandcamp** | ✅ Album pages | ✅ Comments | ❌ | ❌ | ❌ |
| **SoundCloud** | ✅ Track pages | ✅ Comments | ❌ | ❌ | ✅ |
| **AllMusic** | ✅ Professional reviews | ❌ | ❌ | ❌ | ✅ |
| **Discogs** | ✅ Discography | ❌ | ❌ | ✅ Marketplace | ✅ Release pages |
| **RateYourMusic** | ✅ | ✅ Album reviews | ❌ | ❌ | ✅ |
| **Selah.fm (proposed)** | ✅ Bio + campaigns | ✅ 5-star + text | ✅ Concert photos | ✅ Fan discussions | ✅ Track pages |

**RateYourMusic** is the closest competitor — they have album reviews and ratings. But they:
- Don't have track-level pages
- Don't have fan photos
- Don't have real-time chat
- Don't have a creator monetization layer

### Proposed Features

#### 1. Track-Level Pages (`/artist/[slug]/tracks/[id]`)
Each track (campaign) gets its own SEO-optimized page with:
- MusicRecording schema
- Cover art, title, CPM rate
- Campaign status (active/pending)
- Who created content for this track
- Fan reviews specific to this track
- Comments/discussion
- "Similar tracks" — other tracks by the same artist or in the same genre

**Why this matters for SEO:** 1,911 artists × ~10 tracks each = **19,000+ new indexable pages**. Each with unique keywords (track name, artist name, genre).

#### 2. Fan Reviews (5-star + written)
On every artist page and track page:
```
★★★★★ "I've been following this artist since their first release!"
— @username, June 3, 2026
"Concert photo included..." 🖼️
```

**Why 5-star matters:** AggregateRating schema needs a numeric rating. Currently we have `supporter_count` but no rating value. With 5-star reviews, we can add:
```json
{
  "@type": "AggregateRating",
  "ratingValue": "4.5",
  "ratingCount": "47",
  "bestRating": "5"
}
```

#### 3. Fan Photos
Users can upload photos from concerts, meetups, or just their favorite album art:
- Each photo gets its own lightbox view
- Photos appear on the artist page in a gallery
- "Photos from fans" section
- Users get notified when someone likes their photo
- Photos have alt text for SEO: "Fan photo of [Artist] live at [Venue]"

#### 4. Artist Discussion Boards
A section on each artist page:
```
💬 Discussion
└─ @user1: "Anyone going to their show next week?"
   └─ @user2: "Yes! I'll be there!"
└─ @user3: "Just discovered this artist through a campaign. Amazing!"
```

**Why discussion boards matter:** 
- They're unique per artist (can't exist anywhere else)
- They keep users on the page longer
- They create a reason to return ("check if anyone replied")
- They build community — which is a competitive moat

#### 5. "Meet Other Fans" Feature
- Users who review/follow the same artist see each other in a "fans" section
- Click on a fellow fan → send a chat message (existing messaging system)
- "4 other people are fans of this artist. Start a conversation."

#### 6. Artist Response System
Artists can respond to fan reviews:
```
★★★★★ "Love this track!"
👤 [Artist Name] replied: "Thank you so much! More coming soon. ❤️"
```

**Why this matters:** This creates a social feedback loop. Fans review → artist responds → fan feels seen → more engagement.

### Implementation Architecture

```sql
-- New tables needed
CREATE TABLE track_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id)
);

CREATE TABLE fan_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES discovered_artists(id) ON DELETE CASCADE,
  track_id UUID REFERENCES campaigns(id) ON DELETE CASCADE, -- nullable
  rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, artist_id, track_id) -- one review per user per artist/track
);

-- Extend page_comments for fan discussions
-- Already exists, just need to add artist_id support
```

### How This Changes the Entity Graph

```
Before:
  Artist → Genre (1 link)

After:
  Artist → Tracks (10+ links)
  Artist → Fan Reviews (unique content)
  Artist → Fan Photos (visual content)
  Artist → Discussion Board (community)
  Artist → Similar Artists (algorithmic)
  Artist → Wikipedia/Wikidata (sameAs)
  Track → MusicRecording Schema
  Track → Fan Reviews
  Track → Similar Tracks
  User → Review → Artist (user-generated link)
  User → Photo → Artist
  User → Discussion → Other Fans
```

### The Virality Loop

```
Fan leaves review/photo on artist page
  → Artist responds (notification)
  → Fan shares on social media ("I reviewed this artist!")
  → New people visit Selah.fm
  → They leave their own reviews/photos
  → Artist page gets more content
  → Google crawls more often
  → Artist page ranks higher
  → More organic traffic
  → More fans leave reviews
  → More new people visit...
```

### User Stories (Acceptance Criteria)

| Story | User Type | Value |
|-------|-----------|-------|
| "I want to tell people how much I love this artist" | Fan | Expression |
| "I want to see what other fans are saying about this artist" | Fan | Social proof |
| "I want to share my concert photos" | Fan | Expression + memory |
| "I want to find other people who like the same music" | Fan | Community |
| "I want to chat with someone who reviewed the same artist" | Fan | Connection |
| "I want to see what people think of my track" | Artist | Feedback |
| "I want to thank my fans for their support" | Artist | Engagement |
| "I want to find new music through what friends are reviewing" | Fan | Discovery |
| "I want to rate and review individual songs, not just artists" | Fan | Specificity |

### Cost & Effort Estimate

| Component | Dev Time | API/Infra Cost | Schema Impact |
|-----------|----------|---------------|---------------|
| Track pages (template + route) | 3h | $0 | +19K pages |
| Fan review system (CRUD + UI) | 4h | $0 | +unique content |
| Photo upload (storage + gallery) | 3h | ~$5/mo (Supabase storage) | +visual content |
| Discussion boards | 3h | $0 | +UGC per page |
| "Meet other fans" feature | 2h | $0 | +community |
| Artist response system | 1h | $0 | +engagement loop |
| **Total** | **16h** | **~$5/month** | **~20K+ pages** |

### Comparison: Community Cost vs Traditional SEO Cost

| SEO Tactic | Cost | Result |
|-----------|------|--------|
| Writing 2K bios (AI) | ~$10 API | 2K pages with text |
| Buying 100 backlinks | ~$5,000 | 100 links (risky) |
| 1 guest post | ~$500 | 1 link |
| **Building fan community (our proposal)** | **~$5/month** | **Ongoing UGC + backlinks + community** |

Community is the **cheapest SEO investment with the highest long-term return**.

### Where This Fits in the Roadmap

```
Phase 1: Track pages + reviews (Week 2-3)
  ├── Track-level SEO pages (3h)
  ├── 5-star rating + written review system (4h)
  └── AggregateRating schema enrichment (30min)

Phase 2: Community features (Week 3-4)
  ├── Fan photo uploads + gallery (3h)
  ├── Discussion boards per artist (3h)
  ├── Artist response system (1h)
  └── "Meet other fans" feature (2h)

Phase 3: Social amplification (Week 4-5)
  ├── Shareable review cards (1h)
  ├── "Read reviews" widget for embeds (2h)
  ├── Review highlight on homepage (1h)
  └── Email notification: "Someone reviewed your favorite artist" (2h)
```

---

### Total Cost to World-Class

| Phase | Dev Time | API/Services Cost | New Pages |
|-------|----------|-------------------|-----------|
| 0 — Content | 6h | ~$10 (DeepSeek) | 2,000 (bios) |
| 1 — Pages | 8h | $0 | ~10,000 (tracks) + ~20 (genres) |
| 2 — UGC | 10h | $0 | Ongoing (user-generated) |
| 3 — Backlinks | 8h | $0 | ~1,000 (embeds, phase 1) |
| 4 — Scale | 10h | ~$10/month (scrapers) | Ongoing (new artists) |
| **Total** | **~42h** | **~$20 one-time** | **~12,000+ pages → 1M+** |
