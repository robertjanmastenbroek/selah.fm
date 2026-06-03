# Artist Data Enrichment — What We Can Source & How

## Current State

| Data Point | Artists with it | Source |
|-----------|----------------|--------|
| Artist name | 2,157 | Pipeline |
| Track titles | 1,911 (has tracks) | artist_tracks |
| Track dates | 1,911 | artist_tracks.created_at |
| Bandcamp URL | ~2,000 | social_links |
| Spotify ID | ~500 | discovered_artists |
| Instagram handle | 0 | Not collected |
| Location | 0 | Not collected |
| Genre | 2,157 (but unreliable) | discovered_artists.genres |
| Campaign/submission data | varies | Our unique data! |

## What We Can Build Today

### 1. Location from Bandcamp Pages
Bandcamp artist pages often include location in the HTML. We can scrape it.

```
GET https://{artist}.bandcamp.com
→ Look for: <meta name="description" content="...from {city}, {country}..."
→ Or: <p class="location">{city}, {country}</p>
→ Store in: discovered_artists.metadata → location
```

**Effort:** 2h for a cron that processes 100/night
**Hit rate:** ~30% of Bandcamp artists have location data

### 2. Genre from Track Titles (AI Inference)
Feed track titles to DeepSeek and ask what genre they suggest.

```
Prompt: "Based on these track titles by {artist}, what genre(s) would you
expect their music to be? Only answer with genre names, comma-separated.
If uncertain, say 'unknown'.
Tracks: {track titles}"
```

**Effort:** 1h — add to the bio generation pipeline
**Hit rate:** ~60% — track titles are often genre-hinting

### 3. Career Timeline (Already in DB)
First track date → career length. Latest track → recent activity.
These are UNUSED in bios right now but in the DB.

**Effort:** 30min — add to bio data context
**Hit rate:** 100% for artists with tracks

### 4. Social Stats from Bandcamp Pages
Bandcamp pages include follower counts in the HTML.

```
GET https://{artist}.bandcamp.com
→ Look for: <span class="followers">{count} followers</span>
```

**Effort:** 1h — add to the existing Bandcamp scraper
**Hit rate:** ~80% of Bandcamp pages

### 5. Instagram Followers (If Handle Known)
We don't have Instagram handles. We could:
- Ask artists to link Instagram during onboarding (done ✅)
- But we have 0 handles for existing 2,157 artists
- Can't scrape without handles

**Effort:** N/A until handles are collected
**Hit rate:** 0% currently

---

## Implementation Plan

### Phase 0: Use What We Already Have (1h, today)

Add to the bio data context:
- 🟢 Track titles (we have them — use for genre + detail)
- 🟢 Career timeline (first/last track date — in DB)
- 🟢 Campaign/submission stats (our unique data — already in bios)
- 🟢 Track count (already used)

### Phase 1: Bandcamp Data Enrichment Cron (3h, this week)

New cron that processes 100 artists/night:
1. Fetch Bandcamp page HTML
2. Extract: location, follower count, genre tags
3. Store in `discovered_artists.metadata` JSONB
4. Also extract album art, bio snippet

### Phase 2: AI Genre Inference (1h, this week)

Add to bio generation pipeline:
1. Before generating bio, ask DeepSeek to infer genre from track titles
2. Use inferred genre in the prompt if DB genre is null
3. Store inferred genre in `discovered_artists.metadata`

---

## Database Changes

Add to `discovered_artists.metadata` JSONB:

```json
{
  "location": {
    "city": "Amsterdam",
    "country": "Netherlands",
    "source": "bandcamp"
  },
  "bandcamp": {
    "followers": 230,
    "album_count": 3,
    "genre_tags": ["electronic", "ambient"]
  },
  "inferred_genre": "electronic",
  "career": {
    "first_track_at": "2024-01-15",
    "latest_track_at": "2026-03-20",
    "career_days": 795,
    "days_since_last_track": 76
  }
}
```

---

## Impact on Bio Quality

| Data Added | Impact | Why |
|-----------|--------|-----|
| City/country | HIGH | "From Amsterdam, their sound blends..." — instantly more specific |
| Track titles | HIGH | "Tracks like 'Living Water' and 'Albaster Oil' showcase..." — concrete |
| Career timeline | MEDIUM | "Over 2 years of releasing music..." — time context |
| Bandcamp followers | MEDIUM | Adds another data point for the "numbers" angle |
| Inferred genre | HIGH | Removes the vague "their music" — can say "electronic artist" |
| Campaign/submission data | HIGH (already used) | Our unique differentiator |
