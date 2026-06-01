# Selah.fm — Artist Card

**The cross-platform artist dashboard.** 27 platforms, live metrics, shareable PNG.

**Scraping strategy:** Public APIs for Spotify/Deezer/YouTube. **crawl4ai** (Docker on Railway) for everything else — Instagram, TikTok, Facebook, Twitter/X, SoundCloud, Bandcamp, Audiomack, Boomplay, and presence verification across 20+ platforms. One unified scraper instead of 20 individual scraping scripts. Stealth mode, anti-bot detection, JS rendering, all handled by crawl4ai.

---

## Scraping Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Railway                                                  │
│                                                           │
│  ┌──────────────────┐    ┌──────────────────────────┐   │
│  │ selah.fm (Next)  │───▶│ crawl4ai (Docker)         │   │
│  │ /api/crawl        │    │ FastAPI :8000             │   │
│  │ /api/cron/refresh │    │ Playwright + Chromium     │   │
│  │ artist-metrics    │    │ Stealth mode + JS render  │   │
│  └──────┬───────────┘    └──────────────────────────┘   │
│         │                          │                      │
│         │ API calls                │ Scrapes:             │
│         ▼                          ▼                      │
│  ┌──────────────┐          ┌──────────────────────┐     │
│  │ Spotify API   │          │ Instagram profiles    │     │
│  │ Deezer API    │          │ TikTok profiles       │     │
│  │ YouTube API   │          │ Facebook/X profiles   │     │
│  └──────────────┘          │ SoundCloud profiles   │     │
│                             │ Bandcamp pages        │     │
│                             │ Audiomack/Boomplay    │     │
│                             │ + 14 presence checks  │     │
│                             └──────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

**Method split:**

| Method | Platforms | Why |
|--------|-----------|-----|
| **Public API** | Spotify, Deezer, YouTube, JioSaavn | Free, fast, reliable, no scraping needed |
| **crawl4ai** | Instagram, TikTok, Facebook, Twitter/X, SoundCloud, Bandcamp, Audiomack, Boomplay, Threads, Twitch | No public follower APIs |
| **crawl4ai** | Apple Music, Amazon, Tidal, Pandora, iHeart, Napster, Anghami, KKBOX, NetEase, QQ, Yandex, Claro, Gaana, Wynk | Presence verification (search → yes/no) |

---

## Why This Exists

Spotify Wrapped is once a year. Chartmetric costs $10/month. No free tool shows an artist ALL their numbers across streaming AND social media in one beautiful, shareable card.

---

## Platforms Tracked (27 total)

### Streaming — Live Metrics (5)
| # | Platform | Metric | Method |
|---|----------|--------|--------|
| 1 | Spotify | Monthly listeners, followers, popularity, artist image | Public API |
| 2 | YouTube | Subscribers, total views | YouTube Data API |
| 3 | Deezer | Fan count | Public API |
| 4 | SoundCloud | Followers, track plays | crawl4ai scrape |
| 5 | JioSaavn | Fan count | Unofficial API |

### Streaming — Presence Only (4)
| 6 | Apple Music | 7 | Amazon Music | 8 | Tidal | 9 | Pandora |
All via crawl4ai search verification.

### Regional Streaming (7)
| 10 | Audiomack | 11 | Boomplay | 12 | Anghami | 13 | KKBOX |
| 14 | NetEase | 15 | QQ Music | 16 | Yandex Music |
All via crawl4ai scrape/presence check.

### Social Media (8)
| 17 | Instagram | 18 | TikTok | 19 | YouTube | 20 | Facebook |
| 21 | Twitter/X | 22 | Threads | 23 | Twitch | 24 | Bandcamp |
All via crawl4ai scrape (follower counts from public profiles).

### Regional Presence (3)
| 25 | Claro Música | 26 | Gaana | 27 | Wynk |
All via crawl4ai presence verification.

---

## URL Structure

```
selah.fm/artists/[slug]     — Public artist card
selah.fm/artists             — Browse all artists (future)
```

## SEO Per Page

**Title:** `[Artist Name] Stats — Spotify Listeners, Social Followers & Streaming Data | Selah.fm`
**Meta:** `See [Artist Name]'s complete music & social stats: Spotify monthly listeners, Instagram followers, TikTok followers, YouTube subscribers + 23 more platforms. Updated daily. Free by Selah.fm.`
**Structured Data:** MusicGroup + InteractionCounter + FAQPage

---

## Database

### artist_profiles
```sql
CREATE TABLE artist_profiles (
  artist_id UUID PRIMARY KEY REFERENCES discovered_artists(id),
  slug VARCHAR(200) UNIQUE,
  spotify_image_url VARCHAR(500),
  total_followers INTEGER DEFAULT 0,
  total_platforms INTEGER DEFAULT 0,
  last_refreshed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### artist_metrics
```sql
CREATE TABLE artist_metrics (
  id BIGSERIAL PRIMARY KEY,
  artist_id UUID REFERENCES discovered_artists(id),
  platform VARCHAR(50),
  metric_name VARCHAR(50),
  value INTEGER,
  previous_value INTEGER,
  change_pct DECIMAL(5,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Implementation Phases

| # | What | Time |
|---|------|------|
| 1 | DB tables + Spotify/Deezer pipeline + cron ✅ DONE | Day 1 |
| 2 | Artist card page + counter animations ✅ DONE | Day 2 |
| 3 | Deploy crawl4ai Docker to Railway | Day 3 |
| 4 | Build /api/crawl proxy + crawl4ai-based scraper | Day 4 |
| 5 | Instagram + TikTok + Facebook + Twitter/X metrics | Day 5 |
| 6 | SoundCloud + Bandcamp + YouTube metrics | Day 6 |
| 7 | Remaining platforms + presence verification | Day 7-8 |
| 8 | PNG export + shareability | Day 9 |
| 9 | Campaign page → artist card links + sitemap | Day 10 |

---

## Why It Beats Spotify

- 27 platforms vs 1
- Public (no login) vs requires login
- Includes social media vs streaming only
- Daily updates vs weekly
- Shareable PNG vs no sharing
- Links to monetization vs no monetization
