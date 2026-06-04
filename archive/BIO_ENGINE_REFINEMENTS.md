<!--
================================================================================
ARCHIVED — See SELAH.md for current source of truth.

This file is preserved for historical reference only. All actionable content
has been consolidated into SELAH.md (the living document).
================================================================================
-->

# Bio Engine — Gaps & Refinements
**Date:** 2026-06-03
**Based on:** Review of BIO_ENGINE_RESEARCH.md + user feedback

---

## 1. Anti-Detection: Making AI Bios Feel Human

### The Problem
Google can detect and penalize AI-generated content. Our bios need to read like a human wrote them.
Race conditions: every biogap "sounds the same" if we use the same prompt template.

### Solutions

**Sentence structure variability:**
- Mix of simple, compound, and complex sentences
- Occasional sentence fragments for emphasis ("The room goes dark. Then: magic.")
- Vary sentence opening patterns (not every sentence with "The" or "He/She")
- Use rhetorical questions, asides, and parentheticals

**Vocabulary diversity:**
- Maintain a curated list of ~200 music-descriptive words
- Rotate through them per-article — never use the same adjective twice in one bio
- Pull from actual published music journalism (get a corpus of Rolling Stone, Pitchfork, NME articles)

**Pacing variation:**
- Some sections: short, punchy paragraphs (2-3 sentences)
- Other sections: flowing, descriptive paragraphs (4-6 sentences with details)
- Alternate between "telling" and "showing" — concrete scene vs abstract reflection

**Perplexity and burstiness targets:**
- Target: GPT-2 output detector score < 50% (i.e., the detector can't confidently say "this is AI")
- Burstiness: randomize paragraph length distribution to match human writing
- Sentence length: 15-35 words per sentence avg, with outliers (2-word sentences, 60-word sentences)

**Implementation: prompt engineering approach:**
```
At the end of generation, rewrite 3 random paragraphs to use different
sentence structures and vocabulary than the surrounding paragraphs.
Vary paragraph length. Include one sentence that is less than 5 words,
and one sentence that is over 40 words. Use contractions naturally.
Avoid starting more than 2 consecutive sentences with the same word.
```

---

## 2. Image Sourcing: Official Artist Photos

### Strategy
Scrape the artist's official profile image from their streaming platform pages (no API keys needed). Use the image as the bio's hero image and the artist page's profile photo.

### Sources (HTML Scrape, No API Key Required)

| Platform | Method | Reliability |
|----------|--------|-------------|
| **Spotify** | Open graph meta tags on artist page | High — og:image always available |
| **Bandcamp** | og:image or album art | Medium — may be album art, not artist photo |
| **Deezer** | Artist page HTML has JSON-LD with picture URL | High |
| **SoundCloud** | og:image on artist page | Medium |
| **Instagram** | Scrape not possible (JS-rendered) | N/A |

### Scrape Flow

```
1. Check if artist has a spotify_id in discovered_artists → scrape:
   GET https://open.spotify.com/artist/{spotify_id}
   → Extract og:image from <meta property="og:image">

2. Fallback: scrape Bandcamp artist page
   GET {bandcamp_url}
   → Extract og:image

3. Fallback: scrape Deezer
   GET https://api.deezer.com/artist/{deezer_id}
   → JSON response has picture_medium, picture_big fields
   (Deezer doesn't require API key for basic endpoints)

4. Last resort: use existing spotify_image_url from artist_profiles
```

### Ethical note
We're extracting publicly available og:image meta tags — standard social sharing data that sites explicitly expose for embedding. This is legally and ethically fine. We're not scraping copyrighted content, we're extracting URLs that point to the artist's own promotional images.

### Implementation
```typescript
async function scrapeArtistImage(artist: {
  spotify_id?: string;
  bandcamp_url?: string;
  deezer_id?: string;
}): Promise<string | null> {
  if (artist.spotify_id) {
    const html = await fetch(`https://open.spotify.com/artist/${artist.spotify_id}`);
    const match = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/);
    if (match) return match[1];
  }
  // ... fallbacks ...
  return null;
}
```

---

## 3. Internal Linking Strategy

### Why It Matters
- +15% LLM citation rate for pages with internal links (GEO-SFE study)
- Distributes page authority across the site
- Keeps users on Selah.fm longer

### Auto-Link Rules

Every bio should include links to:
1. `/browse/genre/{primary_genre}` — "browse more [genre] artists"
2. `/tools/cpm-calculator` — "calculate creator earnings"
3. `/blog` — "read more about music promotion"
4. Campaign page for the artist's tracks (if exists) — "support [artist] on Selah.fm"

### Implementation
```typescript
const internalLinks = [
  { text: `browse more ${genre} artists`, url: `/browse/genre/${genre}` },
  { text: 'calculate creator earnings', url: '/tools/cpm-calculator' },
  { text: 'read about music promotion on Selah.fm', url: '/blog' },
];

// Insert naturally into the article body at paragraph breaks
// Never more than 3 internal links per article
// Vary the anchor text per article (not all bios say the same thing)
```

---

## 4. Freshness: Verifiable Recent Activity

### The Problem
We can't make up news. But we CAN reference verifiable facts about the artist from their public profiles.

### What We Can SAFELY Reference

| Data Point | Source | How to Verify |
|-----------|--------|---------------|
| Last track release date | artist_tracks table | Check created_at field |
| Social media activity | Instagram/TikTok scrape | Last post date (if we can scrape it) |
| Streaming milestones | artist_profiles.total_streams | Already in our DB |
| Number of tracks | artist_tracks count | Already in our DB |
| Artist's location | discovered_artists data | If available from social links |
| Collaborations | artist_tracks metadata | If tagged in our system |

### What We CANNOT Reference (Don't Make Up)
- ❌ New album announcements
- ❌ Tour dates
- ❌ Studio sessions
- ❌ Personal life events
- ❌ Interviews they never gave
- ❌ Awards they never won

### Safe Bio Framing
Instead of "Artist is working on a new album" (could be false):
- "With X tracks already released on Selah.fm..."
- "Building a growing fanbase of Y monthly listeners..."
- "Since releasing their first track on [platform] in [year]..."

**Golden rule: Every factual claim must trace to a database field or a verifiable source with a URL.**

---

## 5. Quality Scoring (Automated)

### Automated Review Checklist (Score 0-100)

| Criterion | Max Points | How to Measure |
|-----------|-----------|----------------|
| Word count | 10 | Target 1,200-1,800 words |
| Uniqueness vs other bios | 20 | Cosine similarity < 0.3 to other bios |
| Sentence variety | 10 | Mix of short/medium/long sentences |
| Vocabulary diversity | 10 | Type-token ratio > 0.5 |
| Keyword presence | 10 | Artist name + genre in first 100 words |
| Internal links | 10 | At least 2 internal links |
| Concrete numbers | 10 | At least 3 verifiable numbers |
| Quote count | 10 | At least 2 attributed quotes |
| No hallucinated claims | 10 | Cross-check all facts against DB |
| Schema correctness | 10 | Valid JSON-LD with required types |
| **Total** | **100** | Pass if score >= 70 |

### Implementation
```typescript
async function scoreBio(article: string, artistData: ArtistData): Promise<number> {
  const checks = {
    wordCount: countWords(article) >= 1200 ? 10 : 5,
    uniqueness: await getCosineSimilarity(article, existingBios) > 0.3 ? 0 : 20,
    sentenceVariety: analyzeSentenceLengths(article),
    vocabularyDiversity: typeTokenRatio(article) > 0.5 ? 10 : 5,
    keywordPresence: article.includes(artistData.name) && article.includes(artistData.genres[0]) ? 10 : 0,
    internalLinks: (article.match(/selah\.fm/g) || []).length >= 2 ? 10 : 0,
    concreteNumbers: (article.match(/\d+[,]\d+|\d+/g) || []).length >= 3 ? 10 : 5,
    quotes: (article.match(/"[^"]+"/g) || []).length >= 2 ? 10 : 0,
    factualAccuracy: await verifyFacts(article, artistData) ? 10 : 0,
    schemaValid: true, // checked separately
  };
  return Object.values(checks).reduce((a, b) => a + b, 0);
}
```

---

## 6. Data-Poor Fallback Templates

### What to Do When We Have Minimal Data

| Data Available | Bio Type | Length | Effort |
|---------------|----------|--------|--------|
| Name + genre only | Spotlight blurb | 200-300 words | Minimal |
| Name + genre + tracks | Short profile | 500-800 words | Low |
| Name + genre + tracks + listeners | Standard bio | 1,200-1,800 words (full) | Full |
| Name + genre + tracks + listeners + social | Feature article | 1,500-2,500 words | Premium |

### Data-Poor Template (200 words)
```markdown
# [Artist]: [Genre] Artist on Selah.fm

[Artist] is a [genre] artist making waves with their distinctive sound.
With a growing presence on Selah.fm, they offer creators the opportunity
to earn by making videos featuring their tracks.

Their music blends [influence description based on genre].
[If tracks exist: Their track "[track name]" showcases their style.]

Browse their catalog, support their work, or create content featuring
their music.
```

---

## 7. Crawl Budget Strategy

### For 1M Artist Pages

| Tactic | Implementation |
|--------|---------------|
| **Sitemap priority** | Artist pages: priority 0.8 (very important) |
| **Sitemap freshness** | Daily updates. lastmod = bio_generated_at |
| **IndexNow protocol** | Submit new bio URLs to Bing/Yandex immediately |
| **Google Indexing API** | Submit new URLs for immediate indexing (limit: 200/day) |
| **Incremental crawl** | Publish 100 new bios/day — Google crawls 100/day = 36,500/year |
| **Internal linking** | Every new bio linked from genre page = Google discovers it faster |
| **Social signals** | Auto-tweet new bios from @selahfm |
| **RSS feed** | Generate RSS feed of new artist bios (Google reads RSS) |

### Phased Crawl Strategy

| Phase | Pages/Day | Indexing Method | Time to Index |
|-------|-----------|----------------|---------------|
| 1 (100 bios) | All at once | Indexing API + sitemap | 1-2 days |
| 2 (2,000 bios) | 100/day | Sitemap + internal links | 2-3 weeks |
| 3 (10,000 bios) | 200/day | Sitemap + RSS + social | 2 months |
| 4 (100,000 bios) | 1,000/day | Sitemap (prioritize highest-scored) | 6 months |
| 5 (1M bios) | 5,000/day | Only submit scored >= 60 to sitemap | Ongoing |

---

## 9. A/B Testing (Not for Bios — For UX)

### Where to A/B Test on Selah.fm

| Page | What to Test | Success Metric |
|------|-------------|----------------|
| **Artist page** | Bio position (collapsed vs expanded, above vs below tracks) | Time on page, scroll depth |
| **Artist page** | CTA button text ("Donate" vs "Support" vs "Fund") | Click rate |
| **Browse page** | Card layout (grid vs list) | Click rate, bounce rate |
| **Checkout** | Amount presets ($5, $10, $25 vs $10, $25, $50) | Conversion rate, avg amount |
| **Homepage** | Hero message ("Support independent artists" vs "Earn per view") | Signup rate |
| **Dashboard** | Tab order (Overview first vs Campaigns first) | Engagement |

### Implementation
Use a simple `enableABTest()` utility:
```typescript
const abTestVariant = getABVariant('artist-bio-position', ['expanded', 'collapsed']);
// Store variant in cookie, keep consistent per user
```

---

## 10. Tone: Positive, Hopeful, Complimentary

### The "Compliment" Philosophy

Every bio should read like **a compliment the artist would be proud to share**. Think:
- A friend introducing them at a show
- A blogger who genuinely discovered something good
- A music teacher praising a student's progress

### Tone Rules

| DO | DON'T |
|----|-------|
| "Their music captures a feeling of..." | "This artist is predicted to..." |
| "Building a dedicated audience of..." | "Despite having only X listeners..." |
| "With a sound that blends..." | "Their sound is derivative of..." |
| "A distinctive voice in the genre..." | "One of many artists in the genre..." |
| "Creators are responding to their tracks..." | "They haven't received many submissions yet..." |

### The Shareability Test

Before publishing, ask: **"Would the artist share this on their Instagram?"**

If the answer is yes, it's good. If the answer is "this sounds like AI," rewrite.

---

## Bio Placement: Making It Prominent

### Current State (Bad)
The artist page shows:
1. Cover banner → profile photo → name → genre tags → stats bar → CTAs
2. THEN → "About" section with bio text (below the fold, often hidden)

### Proposed (Better)
The bio should be:
1. **Above the fold** — right below the name/genre tags, before stats
2. **Structured for scanning** — bold key phrases, subheadings
3. **A dedicated "story" section** — not just a paragraph of text

### Layout Proposal

```
┌──────────────────────────────────────────────┐
│  [Cover Banner]                              │
│  ┌──────┐                                    │
│  │ Photo │ [Name]  ✓ Verified                │
│  │       │ [genre tags]                      │
│  └──────┘ ┌────────────────────────────────┐ │
│           │  The Story of [Artist Name]    │ │
│           │                                │ │
│           │  Scene-setting paragraph...    │ │
│           │                                │ │
│           │  Background paragraph...       │ │
│           │                                │ │
│           │  "A memorable quote..."        │ │
│           │                                │ │
│           │  Influences paragraph...       │ │
│           │                                │ │
│           │  Read more ↓                   │ │
│           └────────────────────────────────┘ │
│  [Stats bar: Tracks | Submissions | Views |  │
│   Raised]                                    │
│  [CTA: Donate | Create | Submit]             │
│  [Tracks list...]                            │
└──────────────────────────────────────────────┘
```

### Implementation
The ArtistProfileClient needs a "Featured Story" section that shows the bio prominently as a magazine-style article, not as a collapsed paragraph. The bio text should be formatted with HTML (headings, bold, quotes) rather than plain text.

---

## Summary: Updated Implementation Plan

| Phase | What | New Elements |
|-------|------|-------------|
| **0** | Scrape artist images from Spotify/Bandcamp (no API) | Image sourcing |
| **1** | Build data assembler → interview → article pipeline | Anti-detection prompts, quality scoring |
| **2** | Add SEO self-critique + internal linking | Link generator, crawl strategy |
| **3** | Add image to bio + schema markup | Scraped artist photo |
| **4** | Wire bio to artist page (prominent placement) | Layout redesign |
| **5** | Batch generate 100 bios | Quality scoring, data-poor fallback |
| **6** | Scale to 2,000+ bios | Crawl budget, sitemap updates |
