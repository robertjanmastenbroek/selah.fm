<!--
================================================================================
ARCHIVED — See SELAH.md for current source of truth.

This file is preserved for historical reference only. All actionable content
has been consolidated into SELAH.md (the living document).
================================================================================
-->

# Artist Bio System — Deep Research & Plan
**Date:** 2026-06-03
**Goal:** World-class (top 0.01%) AI-generated artist bios optimized for SEO & LLMO
**Target:** 1M+ artists, each with a unique Rolling Stone-quality feature article

---

## Table of Contents
1. [SEO Word Count Research](#1-seo-word-count-research)
2. [Feature Article Structure](#2-feature-article-structure)
3. [LLMO/GEO Citation Research](#3-llmogeo-citation-research)
4. [Schema.org for Artists](#4-schemaorg-for-artists)
5. [Cost & Scale Analysis](#5-cost--scale-analysis)
6. [Data Sources](#6-data-sources)
7. [The Interview-to-Article Workflow](#7-the-interview-to-article-workflow)
8. [Article Template](#8-article-template)
9. [Opportunity Scoring & Targeting](#9-opportunity-scoring--targeting)
10. [Implementation Roadmap](#10-implementation-roadmap)

---

## 1. SEO Word Count Research

### Backlinko Study (2024) — 11.8M Google Search Results
Source: backlinko.com/search-engine-ranking

- Average word count of #1 result: **1,447 words**
- Average word count of page 2: 902 words
- Correlation: "Very slight" — not a direct ranking factor
- Content >3,000 words gets more backlinks
- No ranking advantage beyond ~2,000 words

### RankTracker (2025)
Source: ranktracker.com/blog/content-length-statistics-2025/

- 1,500–2,500 words consistently outperform shorter content
- Confirms Backlinko's 1,447-word average

### SERPmantics (2025)
Source: serpmantics.com/en/seo-article-length/

| Query Type | Optimal Word Count |
|-----------|-------------------|
| Simple informational | 800–1,500 |
| Commercial/competitive | 1,500–2,500 |
| Comprehensive guides | 2,500+ |

**Verdict for artist bios: 1,200–1,800 words** — hits the 1,447-word sweet spot, readable, cost-effective.

---

## 2. Feature Article Structure

### Music Journalism Feature Article Anatomy
Sources: AAFT journalism guide, Writers Online

1. **LEDE** (100–200 words) — Scene-setting hook
2. **NUT GRAPH** (50–100 words) — Thesis, why this artist matters
3. **BODY** (800–1,200 words) — Background, breakthrough, sound, quotes
4. **KICKER** (50–100 words) — Memorable close

### Rolling Stone's Style
- Voice: Authoritative but accessible
- Pacing: Short paragraphs (2–4 sentences)
- Quotes: At least 3–5 attributed quotes per feature
- Details: Specific album names, song titles, venue names, dates, numbers
- Comparisons: "[Artist] is the lovechild of [Influence A] and [Influence B]"

---

## 3. LLMO/GEO Citation Research

### Princeton GEO Paper (2024)
Source: arxiv.org/html/2311.09735v3

- Structured, authoritative content is **40% more likely to be cited** by generative engines

### GEO-SFE Paper (2025) — Princeton
Source: arxiv.org/html/2603.29979

| Content Feature | Citation Impact |
|----------------|----------------|
| Hierarchical headings (H2/H3) | +22% |
| Q&A / FAQ blocks in visible HTML | +40% |
| Bullet points with concrete data | +18% |
| Schema.org markup | +35% |
| Numbered lists with statistics | +25% |
| Inline quotes from the subject | +30% |
| Verifiable facts (dates, counts, names) | +45% |

### 9 Strategies That Lift Citations 40%
Source: xseek.io/learnings/which-generative-engine-optimization-strategies-actually-work

1. FAQPage schema — 40% lift
2. Table formatting — 25% lift
3. Statistical claims with sources — 30% lift
4. Q&A blocks in visible content — 35% lift
5. Author schema — 20% lift
6. Clear entity hierarchy — 22% lift
7. Fresh content signals — 18% lift
8. Internal links to authority pages — 15% lift
9. Bullet-pointed key takeaways — 18% lift

---

## 4. Schema.org for Artists

### Minimal Viable Graph
Source: quickcreator.io/blog/schema-markup-best-practices-structured-data-ai-seo/

```
@graph: [
  { @type: "Article", headline, description, author, datePublished },
  { @type: "MusicGroup", name, genre, album, track, aggregateRating },
  { @type: "FAQPage", mainEntity: [3-5 Q&A pairs] },
  { @type: "BreadcrumbList", itemListElement }
]
```

### Priority

| Schema | Priority |
|--------|----------|
| Article | P0 |
| MusicGroup | P0 |
| FAQPage | P0 |
| BreadcrumbList | P0 |
| MusicAlbum, MusicRecording | P1 |
| AggregateRating | P1 |

---

## 5. Cost & Scale Analysis

### DeepSeek V4 Flash Pricing
Source: api-docs.deepseek.com/quick_start/pricing-details-usd/

| Metric | Cost |
|--------|------|
| Input (cache hit) | $0.14 / 1M tokens |
| Input (cache miss) | $0.28 / 1M tokens |
| Output | $0.28 / 1M tokens |

### Cost Per Article: ~$0.005 (cache miss)

| Step | Input | Output | Cost |
|------|-------|--------|------|
| Data assembly | 500 | 300 | $0.0002 |
| Interview gen | 2,000 | 1,500 | $0.001 |
| Article composition | 4,000 | 2,500 | $0.002 |
| SEO self-critique | 3,000 | 500 | $0.001 |
| **Total** | **9,500** | **4,800** | **~$0.005** |

### Scale Costs

| Scale | Articles | API Cost |
|-------|----------|----------|
| Pilot | 1,000 | ~$5 |
| Existing artists | 2,000 | ~$10 |
| Pipeline artists | 10,000 | ~$50 |
| Scraped artists | 100,000 | ~$500 |
| **1M artists** | **1,000,000** | **~$5,000** |

---

## 6. Data Sources

### Existing (2,000 artists)
- discovered_artists, artist_profiles, artist_audits, artist_metrics, artist_tracks

### Scrapeable

| Source | Est. Artists | Access |
|--------|-------------|--------|
| Bandcamp | 5M+ | HTML scrape (no API key) |
| Deezer | 10M+ | Public API (free) |
| Spotify | 8M+ | API (needs approved app) |
| SoundCloud | 30M+ | API (free tier) |
| Wikipedia | Millions | Freely scrapeable, CC BY-SA 3.0 |

**Ethical rule:** Scrape factual data only (listeners, genres, track counts). Never copy existing bios. Generate original content via AI.

---

## 7. The Interview-to-Article Workflow

### The Core Innovation

Instead of writing a bio directly from data, the system:
1. **Conducts an AI interview** — Generates 5 questions in Rolling Stone's style
2. **Generates answers** — In the artist's voice, based on available data
3. **Writes the article** — From the interview transcript
4. **SEO self-critique** — Reviews for gaps

### Step 1: Data Assembly

```typescript
const artistData = {
  name: "Overly Digital",
  genres: ["electronic", "ambient"],
  monthly_listeners: 13200,
  total_streams: 58700,
  top_tracks: ["Neon Dreams", "Digital Rain", "Pixel Heart"],
  location: "Berlin, Germany"
};
```

### Step 2: Interview (DeepSeek prompt)

```
"Generate 5 interview questions about [ARTIST] in Rolling Stone style.
Cover: origin story, creative process, influences, breakthrough, future."
```

### Step 3: Answers (DeepSeek prompt)

```
"You are [ARTIST]. Answer these questions in your authentic voice.
Give detailed, quotable answers (2-4 paragraphs each)."
```

### Step 4: Article (DeepSeek prompt)

```
"Write a 1,200-1,800 word Rolling Stone feature using this interview.
Structure: LEDE → NUT GRAPH → BODY (background, breakthrough, sound, future) → KICKER
Include 3+ direct quotes. Short paragraphs. Specific details."
```

### Step 5: SEO Review (DeepSeek prompt)

```
"Review this article for SEO/LLMO gaps. Check: keyword in H1, 3+ H2s,
FAQ content, internal links, concrete numbers, schema opportunities."
```

---

## 8. Article Template

```markdown
# [Artist Name]: The [Adjective] Story of [City]'s [Genre] Breakout

**[LEDE]** Scene-setting paragraph. Shows a moment.

**[NUT GRAPH]** Who they are, why they matter now.

**[BACKGROUND]** Where they come from, early influences. "[Quote]."

**[BREAKTHROUGH]** Key moment or release. "[Quote]."

**[SOUND & INFLUENCES]** Genre, comparisons. "[Quote]."

**[CURRENT WORK & FUTURE]** What they're doing now. "[Quote]."

**[KICKER]** Memorable close that echoes the lede.
```

---

## 9. Opportunity Scoring & Targeting

### Spotify Artist Distribution (2026)
Source: Dynamoi, "Spotify Monthly Listeners Distribution [2026 Data]"

| Percentile | Monthly Listeners | Artists | Competition |
|------------|------------------|---------|-------------|
| Top 0.1% | 1,000,000+ | ~12,000 | Extreme |
| Top 0.5% | 100,000–1M | ~60,000 | Very High |
| Top 2% | 5,000–100,000 | ~240,000 | Medium |
| Top 5% | 1,000–5,000 | ~600,000 | Low-Medium |
| Top 14% | 10–1,000 | ~1.5M | Very Low |
| Bottom 86% | 0–10 | ~9.5M | None |

Source: Music Business Worldwide — only 19% of Spotify artists have >1,000 monthly listeners

### The Sweet Spot

**Target: 1,000–50,000 monthly listeners**

| Factor | Why |
|--------|-----|
| Search volume | Enough to generate traffic (100–1,000 searches/month) |
| Competition | Few dedicated sites rank for these artists |
| Content depth | Enough data to write a substantive article |
| Indexability | Google indexes unique, high-quality content |
| LLM citation | LLMs need sources — if Selah.fm is the best, we get cited |

### Artists to AVOID

| Category | Reason |
|----------|--------|
| Mega-stars (Taylor Swift, Drake) | Wikipedia dominates, 100+ competing pages |
| Nano-artists (<10 listeners) | Zero search volume, no data |
| Dead artists (inactive 2+ yrs) | Stagnant search, no new content |
| Bot/fake artists | No real fan base |

### Target Categories

| Category | Listeners | Priority |
|----------|-----------|----------|
| Rising indie | 5,000–50,000 | P0 |
| Niche genre | 1,000–20,000 | P0 |
| Local scene | 500–10,000 | P1 |
| Comeback artist | 1,000–100,000 | P1 |

### Opportunity Score Formula

```
Score = (Search Volume × Relevance) / (Competition × Effort)
```

### SQL Scoring Query

```sql
SELECT da.id, da.artist_name, da.monthly_listeners,
  LEAST(100, (
    COALESCE(CASE
      WHEN da.monthly_listeners > 50000 THEN 35
      WHEN da.monthly_listeners > 10000 THEN 30
      WHEN da.monthly_listeners > 5000 THEN 25
      WHEN da.monthly_listeners > 1000 THEN 15
      WHEN da.monthly_listeners > 100 THEN 5
      ELSE 0 END, 0)
    +
    COALESCE(CASE
      WHEN da.genres::text ILIKE '%ambient%' THEN 25
      WHEN da.genres::text ILIKE '%jazz%' THEN 25
      WHEN da.genres::text ILIKE '%experimental%' THEN 25
      WHEN da.genres::text ILIKE '%indie%' THEN 20
      WHEN da.genres::text ILIKE '%folk%' THEN 20
      WHEN da.genres::text ILIKE '%punk%' THEN 20
      WHEN da.genres::text ILIKE '%electronic%' THEN 15
      WHEN da.genres::text ILIKE '%metal%' THEN 15
      WHEN da.genres::text ILIKE '%rock%' THEN 10
      WHEN da.genres::text ILIKE '%pop%' THEN 5
      ELSE 10 END, 0)
    +
    CASE WHEN aa.bio IS NULL THEN 20 WHEN LENGTH(aa.bio) < 200 THEN 15 ELSE 0 END
  )) as opportunity_score
FROM discovered_artists da
LEFT JOIN artist_audits aa ON aa.discovered_artist_id = da.id
WHERE da.monthly_listeners BETWEEN 100 AND 100000
HAVING opportunity_score >= 40
ORDER BY opportunity_score DESC, da.monthly_listeners DESC;
```

### Genre Difficulty (Hardcoded Weights)

| Genre | Weight | Why |
|-------|--------|-----|
| ambient, jazz, experimental | 25 | Very low competition |
| indie, folk, punk | 20 | Low competition, good volume |
| electronic, metal | 15 | Moderate |
| rock | 10 | High |
| pop, hip-hop | 5 | Extreme competition |

### Score Tiers

| Score | Action |
|-------|--------|
| 80–100 | Generate bio immediately |
| 60–80 | Next batch |
| 40–60 | Add to queue |
| 20–40 | Collect more data |
| 0–20 | Skip |

### Traffic Projection (1,000 artists)

| Tier | Artists | Traffic/Artist | Total/Month |
|------|---------|---------------|-------------|
| Gold (10K–50K listeners) | 200 | 250 | 50,000 |
| Silver (5K–10K) | 300 | 75 | 22,500 |
| Bronze (1K–5K) | 500 | 25 | 12,500 |
| **Total** | **1000** | | **85,000** |

### ROI

| Metric | Value |
|--------|-------|
| API cost for 1,000 bios | ~$5 |
| Est. monthly traffic after 6 months | 85,000 visits |
| Est. monthly LLM citations | 8,000 |
| Revenue potential (at $0.10 RPM) | $8,500/mo |
| **ROI per $1 on API** | **$1,700x** |

---

## 10. Implementation Roadmap

| Phase | What | Cost | Time |
|-------|------|------|------|
| 1 — Test | 10 bios, manual review | ~$0.05 | 1 day |
| 2 — Pilot | 200 bios for top-scored artists | ~$1 | 3 days |
| 3 — Existing DB | 2,000 bios for all browse artists | ~$10 | 1 week |
| 4 — Pipeline | 10,000 bios + scrape Bandcamp/Deezer | ~$50 | 2 weeks |
| 5 — Scale | 100,000+ bios, automated pipeline | ~$500 | 1 month |
| 6 — Full | 1M+ artists | ~$5,000 | 2-3 months |

### Success Metrics

| Metric | Current | Phase 2 | Phase 6 |
|--------|---------|---------|---------|
| Artists with bios | ~500 | 2,000 | 1,000,000 |
| Avg word count | ~100 | 1,400 | 1,400 |
| Indexed artist pages | ~100 | 1,500 | 500,000+ |
| LLM citations | ~0 | 50+ | 10,000+ |
| Organic traffic | ~0 | 200/day | 10,000+/day |
