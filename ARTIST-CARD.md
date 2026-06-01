# Selah.fm — Artist Card

**The cross-platform artist dashboard.** 27 platforms, live metrics, shareable PNG.

---

## Why This Exists

Spotify Wrapped is once a year. Chartmetric costs $10/month. No free tool shows an artist ALL their numbers across streaming AND social media in one beautiful, shareable card.

Selah.fm Artist Card does that. For free. For every artist we discover.

**Strategic value:**
- **Top of funnel** — brings artists + fans + creators to selah.fm
- **SEO engine** — 2,157 pages indexed, each ranking for "[artist name] monthly listeners"
- **Shareable** — one-click PNG → Instagram story → free Selah.fm branding
- **Conversion path** — every card links to the artist's campaign page
- **Outreach hook** — "Hey, we built your artist dashboard. 27 platforms in one place."

---

## Platforms Tracked (27 total)

### Streaming — Live Metrics (5)
| # | Platform | Metric | Method |
|---|----------|--------|--------|
| 1 | Spotify | Monthly listeners, followers, popularity, artist image | Public API |
| 2 | YouTube | Subscribers, total views | YouTube Data API |
| 3 | Deezer | Fan count | Public API |
| 4 | SoundCloud | Followers, track plays | Page scrape |
| 5 | JioSaavn | Fan count | Unofficial API |

### Streaming — Presence Only (4)
| # | Platform | Shows |
|---|----------|-------|
| 6 | Apple Music | "Available" badge |
| 7 | Amazon Music | "Available" badge |
| 8 | Tidal | "Available" badge |
| 9 | Pandora | "Available" badge |

### Regional Streaming (7)
| # | Platform | Region |
|---|----------|--------|
| 10 | Audiomack | Africa/Global |
| 11 | Boomplay | Africa |
| 12 | Anghami | Middle East |
| 13 | KKBOX | Taiwan/Asia |
| 14 | NetEase | China |
| 15 | QQ Music | China |
| 16 | Yandex Music | Russia |

### Social Media (7)
| # | Platform | Metric |
|---|----------|--------|
| 17 | Instagram | Followers |
| 18 | TikTok | Followers |
| 19 | YouTube | Subscribers |
| 20 | Facebook | Page likes |
| 21 | Twitter/X | Followers |
| 22 | Threads | Followers |
| 23 | Twitch | Followers |

### Community (4)
| # | Platform | Metric |
|---|----------|--------|
| 24 | Bandcamp | Fans |
| 25 | Claro Música | "Available" badge |
| 26 | Gaana | "Available" badge |
| 27 | Wynk | "Available" badge |

---

## URL Structure

```
selah.fm/artists/[slug]     — Public artist card
selah.fm/artists             — Browse all artists (future)
```

---

## SEO Per Page

**Title:** `[Artist Name] Stats — Spotify Listeners, Social Followers & Streaming Data | Selah.fm`

**Meta:** `See [Artist Name]'s complete music & social stats: Spotify monthly listeners, Instagram followers, TikTok followers, YouTube subscribers + 23 more platforms. Updated daily. Free by Selah.fm.`

**Keywords:** `[artist name] spotify monthly listeners`, `[artist name] instagram followers`, `[artist name] streaming stats`

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
| 1 | DB tables + Spotify/Deezer pipeline + cron | Day 1 |
| 2 | Artist card page + counter animations + Spotify image | Day 2 |
| 3 | Campaign page → artist card links | Day 3 |
| 4 | YouTube + SoundCloud pipeline | Day 4 |
| 5 | Social media scraping (IG, TikTok) | Day 5-6 |
| 6 | PNG export + shareability | Day 7 |
| 7 | Remaining platforms + sitemap | Day 8-10 |

---

## Traffic Flywheel

```
Artist discovers card → shares on Instagram → fans see it → 
some are creators → browse campaigns → make videos → earn →
tell other creators → more artists discover Selah.fm →
Google indexes 2,157 pages → organic search traffic →
more artists discover us → (repeat)
```

## Why It Beats Spotify

- 27 platforms vs 1
- Public (no login) vs requires login
- Includes social media vs streaming only
- Daily updates vs weekly
- Shareable PNG vs no sharing
- Links to monetization vs no monetization
