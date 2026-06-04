<!--
================================================================================
ARCHIVED — See SELAH.md for current source of truth.

This file is preserved for historical reference only. All actionable content
has been consolidated into SELAH.md (the living document).
================================================================================
-->

# Bio Uniqueness at Scale — Architecture Design

## The Core Concept: Composable Component System

Instead of generating a complete bio from one prompt (which produces templated results), we build each bio from **independently generated modular components** that are assembled randomly.

## The Zillow Insight

Zillow's 5.2M pages aren't unique because of clever writing. They're unique because **every page has different data** — different prices, photos, tax records, school districts. The template is identical; the DATA makes each page unique.

**For our bios, the data is the uniqueness driver.** Two artists with different track counts, stream numbers, genres, and campaign activity will get fundamentally different bios — even from the same prompt — because the data shapes the narrative.

But to truly scale uniqueness, we need to vary more than just the data.

## The Composable Bio Architecture

### Component Hierarchy

```
BIO = Angle + [Slot 1] + [Slot 2] + [Slot 3] + [Slot 4] + [Slot 5]

Each SLOT is filled by 1 of 50+ independent paragraph templates.
Each TEMPLATE is shaped by injected artist data.
Each TEMPLATE selects from interchangeable micro-components.
```

### Angles (50+) — The Narrative Frame

The angle determines the entire bio's structure, not just the first paragraph.

| # | Angle | Focus | Best For |
|---|-------|-------|----------|
| 1 | **The Discovery** | "You haven't heard of them yet, but you will." | Low-data artists |
| 2 | **The Slow Build** | "Patience, persistence, and a growing catalog." | Artists with tracks but low numbers |
| 3 | **The Scene** | "Part of a new wave of [genre] artists." | Good genre data |
| 4 | **The Craftsman** | "Every track is meticulously built." | Artists with 10+ tracks |
| 5 | **The Collaborator** | "Creators love working with them." | Artists with active campaigns |
| 6 | **The DIY Story** | "No label, no shortcuts. Just music." | Independent artists |
| 7 | **The Numbers Don't Lie** | "The data shows what the music delivers." | Artists with strong stream/follower data |
| 8 | **The Evolution** | "Their sound has grown across [X] tracks." | Artists with a long catalog |
| 9 | **The Community Magnet** | "Fans and creators rally around their music." | Artists with submissions + supporters |
| 10 | **The Hidden Gem** | "Under-discovered but overdelivering." | Artists with quality signals but low listeners |
| 11 | **The Fresh Voice** | "A new sound entering the scene." | New artists (few tracks) |
| 12 | **The Genre Explorer** | "Refusing to be boxed in by one sound." | Artists with multiple genres |
| 13 | **The Comeback** | "After time away, they returned with purpose." | If we detect a gap between tracks |
| 14 | **The Fan Favorite** | "Listeners keep coming back." | Artists with good stream:listener ratio |
| 15 | **The Momentum Builder** | "Every release builds on the last." | Artists releasing steadily |
| 16 | **The Visual Artist** | "Their sound has a visual dimension." | Artists with good cover art |
| 17 | **The Late Bloomer** | "They found their voice later." | Any artist (positive framing) |
| 18 | **The Experimenter** | "Pushing boundaries without losing the thread." | Artists with varied-sounding tracks |
| 19 | **The Minimalist** | "Less is more in their world." | Artists with few but high-quality tracks |
| 20 | **The Maximalist** | "Every track is a world of its own." | Artists with detailed/complex art |
| 21 | **The Night Owl** | "Music made in the small hours." | Atmospheric/ambient genres |
| 22 | **The Storyteller** | "Every track tells a story." | Artists with lyrical/personal tracks |
| 23 | **The Producer-Artist** | "They create their own sonic universe." | Artists who produce their own work |
| 24 | **The Genre-Bender** | "Fusing influences into something new." | Multi-genre artists |
| 25 | **The Local Hero** | "Making waves from [city]." | Artists with location data |
| 26 | **The Internet Native** | "Born in the age of streaming." | Younger artists |
| 27 | **The Analog Soul** | "Warm, human, unfiltered." | Genre hints at organic/acoustic |
| 28 | **The Digital Alchemist** | "Electronic sounds with emotional weight." | Electronic genre artists |
| 29 | **The Mood Architect** | "They build atmosphere, not just songs." | Ambient/atmospheric |
| 30 | **The Groove Merchant** | "Rhythm is their language." | Dance/rhythmic genres |
| 31+ | _(extensible — add 20 more)_ | | |

### Slot Templates (50+ per slot)

**Slot 1: Opening Hook** (50+ variations of how to start)

Not just "In a musical landscape..." — but varied dramatically:

| Type | Example | Count |
|------|---------|-------|
| **Scene-setting** | "The first time you hear [Artist], something shifts." | 10 |
| **Direct statement** | "[Artist] makes music that doesn't rush." | 10 |
| **Question** | "What does it take to build an audience in 2026?" | 5 |
| **Data-led** | "Fifteen tracks. Over 150K streams. One independent artist." | 5 |
| **Comparative** | "If you like [genre], you already know this sound." | 5 |
| **Metaphorical** | "Think of [Artist]'s catalog as a photo album." | 5 |
| **Time-based** | "In the [time] since their first track appeared..." | 5 |
| **Place-based** | "From [city], sounds emerge that feel much bigger." | 5 |
| **Process-focused** | "The way [Artist] builds a track says everything." | 5 |
| **Audience-focused** | "The people listening to [Artist] know something." | 5 |
| **Contrast** | "In an era of algorithms, [Artist] trusts the music." | 5 |
| **Quote-like** | "Some music asks to be heard. This one asks to be felt." | 5 |

**Total: ~65 unique opening styles, each producing different text when data is injected.**

**Slot 2: Sound Description** (50+ framings of "what the music sounds like")

Avoids genre-specific language when genre data is missing. Uses vibe, feeling, and craft.

| Type | Examples |
|------|----------|
| **Vibe-based** | "a contemplative quality" / "an energetic pulse" / "a cinematic sweep" |
| **Texture-based** | "layered and detailed" / "stripped and honest" / "warm and immersive" |
| **Emotion-based** | "melancholy with a thread of hope" / "joyful without being simple" |
| **Craft-based** | "meticulously arranged" / "built around a central idea" / "unfolds like a conversation" |
| **Listener-focused** | "rewards repeated listens" / "reveals something new each time" |
| **Reference-based** | "draws from a wide palette" / "carries echoes of [influence-if-known]" |
| **Space-based** | "breathes in the quiet moments" / "fills every corner of a room" |
| **Movement-based** | "builds and releases with intention" / "never sits still" |
| **Contrast-based** | "gentle melodies over complex rhythms" / "digital sounds with human warmth" |
| **Time-based** | "unhurried, patient, unfolding on its own schedule" |

**Slot 3: Journey/Narrative** (50+ framings of the artist's story)

| Type | Framing |
|------|---------|
| **Growth arc** | "From their first track to their latest..." |
| **Catalog arc** | "Across [X] tracks, a clear evolution..." |
| **Audience arc** | "Listeners are finding them in increasing numbers..." |
| **Craft arc** | "Each release refines their approach..." |
| **Platform arc** | "On Selah.fm, [X] creators have made content for their tracks..." |
| **Quality arc** | "Rather than flooding platforms, they focus each track..." |
| **Discovery arc** | "Word is spreading organically..." |
| **Consistency arc** | "Year after year, the music keeps coming..." |
| **Breakthrough arc** | "One track changed everything..." |
| **Milestone arc** | "[X] streams marks a turning point..." |

**Slot 4: "Why Them" / Significance** (50+ framings)

| Type | Framing |
|------|---------|
| **Value-based** | "In a world of fast content, they offer something slower." |
| **Quality-based** | "Not every artist makes music that lasts. This one does." |
| **Audience-based** | "The people who find [Artist] tend to stay." |
| **Market-based** | "There's a gap in the [genre] scene that they're filling." |
| **Personal-based** | "This is music made because it had to be made." |
| **Future-based** | "If their trajectory continues, the next chapter will be even stronger." |
| **Community-based** | "They're not just building a catalog — they're building a community." |
| **Craft-based** | "This is what happens when an artist trusts their instincts." |
| **Time-based** | "In [X] years, we'll look back at this as the beginning." |

**Slot 5: Selah.fm Connection** (50+ CTAs)

| Type | CTA |
|------|-----|
| **Join the community** | "[Artist] is part of a growing community on Selah.fm..." |
| **Support directly** | "Support [Artist] on Selah.fm and help fund their next track..." |
| **Create content** | "Creators earn per view making videos for [Artist]'s tracks..." |
| **Discover more** | "Explore [Artist]'s catalog on Selah.fm..." |
| **Be part of the story** | "Every stream, every video, every share helps build..." |
| **The platform mission** | "Selah.fm connects independent artists with creators who amplify their music..." |
| **Join the movement** | "Thousands of artists and creators are building something new on Selah.fm..." |

---

## Uniqueness Calculation

Per bio:
1. **1 angle** selected from **50+** = 50 options
2. **1 opening** from **65+** = 65 options
3. **2-3 sound descriptors** from **50+** = ~125,000 combinations (50×50×50)
4. **1 journey framing** from **50+** = 50 options
5. **1 significance framing** from **50+** = 50 options
6. **1 CTA** from **50+** = 50 options

**Theoretical combinations:** 50 × 65 × 125,000 × 50 × 50 × 50 = **~507 billion combinations**

**Realistic combinations (with data shaping):** Because each component also gets artist-specific data (name, tracks, streams, genre), the actual output text varies continuously. Even the same angle + opening combination produces different text for different artists.

**For 10,000 artists with our ~2,000 current artists:** Even with only current data, every bio can be completely unique across all artists. No two bios will share the same generation path.

---

## Implementation Architecture

### Flow

```
1. SELECT angle ← based on artist data (which angle fits best)
2. SELECT opening ← randomly from 65, filtered by data availability
3. GENERATE sound description ← AI call with specific prompt for this slot
4. GENERATE journey ← AI call with specific prompt for this slot  
5. GENERATE significance ← AI call with specific prompt for this slot
6. GENERATE CTA ← randomly selected + data-injected
7. ASSEMBLE → complete bio
8. REVIEW → quality score (150+ words? Artist name present? No fake data?)
```

### Key Design Principle: Each Slot is a Separate AI Call

Instead of one prompt generating 500 words (which creates templated structure), each slot gets its own focused mini-prompt:

```typescript
// Example: Opening slot prompt
const openingPrompt = `Write a 2-3 sentence opening paragraph for a profile about
independent artist "${name}". The angle is: "${angle}". They have ${trackCount}
tracks and ${streamStr} streams.

Style: ${openingStyle} // e.g., "Scene-setting", "Direct statement", "Question"
Tone: Warm but not flowery. Specific but not technical.

Rules:
- Do NOT mention genre unless given
- Do NOT use the word "landscape," "realm," "journey," "discover," or "prolific"
- End with a sentence that transitions naturally into their music
- Write in third person
```

### Vocabulary Rotation

Maintain a banned-words list that grows with each bio generated. When a word appears too frequently across bios, add it to the banned list for future generations.

**Banned words after first 100 bios:** landscape, realm, journey, discover, prolific, testament, tapestry, craft, sonic, auditory, musical journey, burgeoning, ever-evolving, compelling, resonate.

Each new bio must avoid all previously-used-overused words. This forces continuous vocabulary renewal.

### Quality Scoring

Each generated bio gets scored before saving:
- ✅ 250+ words (-10 points if under)
- ✅ Artist name appears in first 100 words
- ✅ No banned words used
- ✅ No exact match to any existing bio (cosine similarity < 0.4)
- ✅ No invented data (cross-check all numbers against DB)
- ✅ At least 3 different sentence lengths
- ✅ Selah.fm mentioned in last paragraph

Pass threshold: 70/100. If a bio scores below 70, regenerate with different component selections.

---

## File Changes

| File | Change |
|------|--------|
| `app/api/artist/bio/route.ts` | Replace single-prompt with multi-slot composable system |
| `lib/bio-angles.ts` | 50+ angle definitions with selection criteria |
| `lib/bio-openings.ts` | 65+ opening hook templates |
| `lib/bio-descriptors.ts` | 50+ sound description framings |
| `lib/bio-journeys.ts` | 50+ journey/narrative framings |
| `lib/bio-closings.ts` | 50+ Selah.fm CTAs |
| `lib/bio-vocabulary.ts` | Banned words tracker + rotation system |
| `lib/bio-scorer.ts` | Quality scoring with auto-regenerate on fail |
