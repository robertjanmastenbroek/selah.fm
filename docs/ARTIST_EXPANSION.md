# Artist Database Expansion — Research Notes
## Goal: All artists worldwide with 10K+ monthly listeners

### Target
~288,000 artists with 10+ tracks and 10,000+ monthly listeners

### Data Sources
- **Deezer API** (free, no auth) — best for bulk sourcing
  - `https://api.deezer.com/search/artist?q=genre:"pop"&limit=100`
  - `https://api.deezer.com/artist/{id}/top?limit=50` (tracks)
  - Returns: name, picture (500x500), fans count, top tracks with album art
  - Rate limit: ~50 req/s sustained
  - Estimated API time: ~3 hours for 288K artists
- **Spotify API** — needs OAuth client credentials
  - Better data (monthly listeners, genres, popularity)
  - SPOTIFY_CLIENT_ID is already in .env.local (needs SECRET uncommented)
- **iTunes/Wikipedia** — fallbacks for images

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
