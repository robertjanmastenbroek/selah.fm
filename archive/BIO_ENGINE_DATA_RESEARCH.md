<!--
================================================================================
ARCHIVED — See SELAH.md for current source of truth.

This file is preserved for historical reference only. All actionable content
has been consolidated into SELAH.md (the living document).
================================================================================
-->

# Bio Engine — Data Quality & Improvement Research

## Problems Found

### 1. Genre Data is Unreliable
**What happened:** The bio said "alternative rock" and "sturdy guitar work" for Robert-Jan Mastenbroek, who makes electronic music.

**Root cause:** The `discovered_artists.genres` column has wrong data. Many artists in the DB have null or incorrect genres.

**Solutions researched:**

| Solution | Effort | Reliability | Notes |
|----------|--------|-------------|-------|
| **Genre Guru API** (genreguru.com) | Medium | High | Upload audio file → AI detects genre. Needs audio files. $0.10/analysis. |
| **Let AI infer from artist name + track titles** | Low | Medium | Prompt: "Based on the artist name and track titles, what genre do they likely play?" |
| **Spotify API genre endpoint** | Low (if key) | High | GET /v1/artists/{id} returns genres array. But Spotify key may be restricted. |
| **Vague sonic descriptions** (no genre) | Zero code | Safe | Don't mention specific genre. Use "their sound" or "their music" instead of "their rock sound." |
| **MusicBrainz genre data** | Medium | Medium | MB has genre tags per artist. Free API. |

**Recommendation:** Use a tiered approach:
1. If DB genre is non-null and has valid values, use it (but qualify: "their [genre]-infused sound")
2. If DB genre is null, ask AI to infer from artist name + track titles
3. If AI can't infer, use vague language: "their distinctive sound"

### 2. Numbers are Untrustworthy
**What happened:** Streams, followers, and listener counts come from crawlers that may count unrelated YouTube views, Bandcamp plays, etc.

**Solutions:**

| Problem | Fix |
|---------|-----|
| Exact numbers sound official but might be wrong | Round to nearest K or use "over X" format |
| YouTube views counted as "streams" | Differentiate: "YouTube views" vs "streams" |
| Crawler data might be stale | Add last_scraped_at to number display |
| Numbers don't tell the whole story | Use qualitative framing: "a dedicated following" |

**Implementation in prompt:**
```
DATA USAGE RULES (critical):
- If you use numbers, round them: "over 150K streams" not "149,850 streams"
- If data seems low, don't highlight it. Say "a growing audience" instead.
- If you're not confident about a fact, don't mention it.
- NEVER write "132 followers" or any exact small number.
```

### 3. Missing Instagram Data
**Robert-Jan has 290K Instagram followers that our system doesn't know about.**

**Options researched:**

| Method | Feasibility | Risk |
|--------|-------------|------|
| **Scrape Instagram page HTML** | Low — Instagram is JS-rendered, no usable HTML | Account ban risk |
| **Instagram Graph API** | Medium — requires business account + app approval | API limits |
| **Add Instagram handle field (done)** and ask artists to link manually | High — we already have it | Low |
| **Cron job using Instagram Basic Display API** | Medium — read-only, requires user token per artist | Complex |

**Recommendation:** For now, add a "Connect Instagram" button on the dashboard's profile tab. When artists link their Instagram, we store the follower count. Until then, the bio engine should NOT claim to know how many followers an artist has — it should say "a growing social following" or similar.

### 4. Not Long Enough for SEO/LLMO
**Current output:** 236 words.  **Target:** 400-800 words.

**To make it longer without padding:**
- Add subheadings in the schema (H2 → H3 transitions help LLMs parse)
- Include a "Quick Facts" section in the bio itself (structured data in visible text)
- Expand the "why they matter" section with more context about their genre/scene
- Add a paragraph about the artist's presence on Selah.fm specifically

---

## Updated Prompt Rules

### Data Quality Rules (New)
```
DATA INTEGRITY RULES (MANDATORY):
1. Only use data that came with this prompt. Do not invent any numbers.
2. Round all numbers: "over 150K streams" not "149,850 streams"
3. If a number is small (followers < 10K, listeners < 5K), don't mention it.
   Instead say "a growing audience" or "a dedicated following."
4. If genre is uncertain, don't specify it. Say "their music" instead of
   "their rock sound."
5. Never write sentences like "With only X followers" — always be positive.
6. Never invent album names, track names, tour dates, or collaborations.
7. Never include fake quotes from the artist.
```

### Genre Detection Logic (New)
Before writing the bio, the engine should check:
1. Is `genres` array non-null and non-empty? → Use it but qualify
2. Is `genres` null? → Ask AI to infer from:
   - Artist name (some names hint at genre)
   - Track titles (if available)
   - Artist description on Selah.fm (if any)
3. Can't infer? → Use "their music" / "their sound" generically

### Length Rules (Updated)
```
LENGTH BY TIER:
- Full (50K+ listeners): 600-900 words (was 400-800)
- Standard (5K-50K listeners): 350-600 words (was 200-400)
- Short (<5K listeners or no data): 200-350 words (was 150-250)

SEO requirement: Every bio must include the artist name and primary
keywords (genre, "music", "artist") in the first 150 words.
```

### Keyword Strategy (New)
Instead of writing generic bios, the engine should target search keywords:

**Primary keywords per artist:**
- `[Artist Name] music`
- `[Artist Name] [genre]`
- `listen to [Artist Name]`
- `[genre] artist [year]`
- `new [genre] music`

These should appear naturally in the first paragraph and the meta description.

---

## Instagram Data Sourcing

### Short-term fix
Add Instagram follower scrape to the bio generation pipeline:
1. Artist has `instagram_handle` in `discovered_artists`
2. Try to fetch `https://www.instagram.com/{handle}/` (may not work — JS-rendered)
3. If that fails, don't mention Instagram followers
4. Fallback: say "a strong social media presence"

### Long-term fix
Build a dedicated cron that:
1. Uses Instagram's Basic Display API (read-only, no approval needed for basic scope)
2. Refreshes follower counts weekly
3. Stores in `artist_metrics` table

---

## Implementation Plan

| Fix | Prompt Change | Code Change | Effort |
|-----|--------------|-------------|--------|
| Data quality rules | ✅ New prompt section | None | 15min |
| Round numbers | ✅ "over X format" | None | 5min |
| Hide small numbers | ✅ "growing audience" | None | 5min |
| Genre inference | New prompt logic | Ask AI to infer from name + tracks | 1h |
| Longer bios | Increase max_tokens | Change word count targets | 10min |
| Keyword strategy | Add to prompt | Per-artist keyword generation | 1h |
| Instagram scraping | Dependent on API | API call to Instagram Basic Display | 2h |
| Vague sonic descriptions | "their music" fallback | Conditional prompt section | 10min |
