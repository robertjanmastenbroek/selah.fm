# Artist Database Expansion — Research Notes
## Goal: All artists worldwide with 10K+ monthly listeners

### Target
~288,000 artists with 10+ tracks and 10,000+ monthly listeners

### SEO / LLMO Low-Hanging Fruit Strategy

**The insight:** Not all 288K artists are equally valuable for SEO/LLMO. The "low-hanging fruit" are artists who:

1. **Are actively searched on Google** — have Wikipedia pages, Songkick/Setlist.fm profiles, active social media
2. **Have low competition** — their name doesn't already return 10+ well-optimized pages
3. **Have content to promote** — at least 5+ tracks on streaming, some social following
4. **Match our creator audience** — genres that TikTok/Reels creators actually want to make content for

**Priority tiers for SEO value:**

| Tier | Artist type | Est. count | SEO potential | Effort |
|------|------------|------------|---------------|--------|
| **A** | Indie with 50K-500K listeners, active social, niche genre | ~30K | ★★★★★ | Low |
| **B** | Emerging 10K-50K listeners, 3+ tracks, any genre | ~150K | ★★★★ | Low |
| **C** | Catalog artists, <10K listeners, 1-2 tracks | ~100K | ★★ | Medium |
| **D** | Major label (top 100K) | ~8K | ★ | High (competitive) |

**Target for Phase 1:** Tiers A + B = ~180K artists

### Deezer API Research

**Key endpoints:**

| Endpoint | Returns | Best for | Rate limit |
|----------|---------|----------|------------|
| `search/artist?q={genre}&index=N` | Artist names, images, fan count | Genre-based bulk sourcing | ~50 req/s |
| `genre/{id}/artists` | Top artists in genre | Genre charts (major artists only) | ~50 req/s |
| `artist/{id}` | Artist details, fan count, albums | Individual enrichment | ~50 req/s |
| `artist/{id}/top?limit=50` | Top tracks with album art | Track sourcing | ~50 req/s |
| `editorial/0/selection` | Curated album releases | New music discovery | ~50 req/s |

**Deezer genre IDs for SEO targeting:**

| Genre | Deezer ID | SEO priority | Why |
|-------|-----------|-------------|-----|
| Pop | 132 | ★★★ | High volume, but competitive |
| Rap/Hip Hop | 116 | ★★★★ | High creator demand, mid competition |
| Rock | 152 | ★★★ | Mid volume, low competition |
| Alternative | 85 | ★★★★★ | Low competition, passionate fanbase |
| Electro | 106 | ★★★★★ | Perfect for our existing base |
| R&B | 165 | ★★★★ | High creator demand |
| Dance | 113 | ★★★★ | TikTok-friendly |
| Metal | 152? | ★★★ | Low competition, loyal fans |
| Jazz | 129 | ★★ | Low volume |
| Classical | 104 | ★ | Low creator demand |

**Deezer search quirks:**
- `genre:132` syntax only returns ~4 results per genre — not useful for bulk
- Keyword search like `?q=electronic+artist&limit=100` returns up to 100 per page, with pagination via `&index=N`
- Search for genre names directly: `?q=indie+rock&limit=100` — this is the best approach
- Returns `nb_fan` (fans count) which correlates to Spotify monthly listeners (~fans/3 ≈ monthly listeners)
- Can filter by fan count: results with `nb_fan > 500` are likely in the 10K-50K bracket

**Estimated yield by genre search (indie/emerging):**

| Search query | Est. total results | Est. with 1K+ fans | Quality |
|-------------|-------------------|-------------------|---------|
| "indie" | 5,000+ | 800+ | High — low competition keywords |
| "indie rock" | 3,000+ | 500+ | High |
| "bedroom pop" | 2,000+ | 300+ | Very high — trending SEO term |
| "electronic" | 10,000+ | 2,000+ | High — our core genre |
| "singer songwriter" | 5,000+ | 800+ | High |
| "lo-fi" | 3,000+ | 400+ | Medium |
| "punk" | 3,000+ | 400+ | Medium |
| "post-rock" | 2,000+ | 200+ | Very high — low competition |
| "shoegaze" | 1,500+ | 150+ | Very high — niche with search demand |
| "hyperpop" | 1,000+ | 200+ | Very high — trending |
| **Total Phase 1** | **~35,500** | **~5,750** | |

**Strategy:** Search Deezer by niche genre keywords (not broad genres). Each search returns 100 artists per page, paginated. Pages 1-3 have the most relevant results. Total: ~360 API calls for the first wave, ~30 seconds.

### Current Infrastructure
- `lib/artist-content.ts` — AI bio generator (DeepSeek)
- `app/api/artist/bio/route.ts` — bio generation endpoint
- `app/api/cron/generate-artist-bios/route.ts` — batch bio cron (100/night)
- `lib/bio-vocabulary.ts` — vocabulary diversity tracking
- `lib/web-research.ts` — Reddit RSS scraping for artist discovery
- Image sourcing via Deezer API (proven: 25/27 missing found in one pass)

### Bio Generation Cost
- DeepSeek V4 Flash: $0.14/M input tokens, $0.42/M output tokens
- 288K bios × ~500 tokens × ~$0.14 = ~$20K
- Cost saving options:
  - Shorter bios (50 words): -66%
  - Cheaper model (open-source): variable
  - Deezer's built-in descriptions: free
  - Only bio for searched artists: delayed generation
  - Batch: 30,000 artists/night via cron

### Pipeline Phases (future)
1. Source: Deezer chart API by genre (1-2 days)
2. Tracks: top 25 per artist + draft campaigns (1-2 days)
3. Enrich: images (free), bios (cost decision)
4. Launch: dedup, index, sitemap

### Storage Scale
- 290K artists: fine for PostgreSQL
- 4.3M tracks: needs index on artist_id
- 4.3M campaigns: needs partitioning or archive strategy
