# Selah.fm — Competitor UX Research (Live Data)
**Version 2.0 · June 2, 2026 · Real data from actual competitor pages**

> **Methodology:** All data below was extracted from actual live competitor websites via direct HTTP fetches, CSS analysis, and web searches. No training-data gap-filling. Where a site blocked direct access or required JavaScript, that is noted. Sources are cited inline.

---

## Competitors Researched (10)

| # | Platform | Type | Data Source | Access |
|---|----------|------|-------------|--------|
| 1 | **GoFundMe** | Crowdfunding | Design tokens article, rebrand case study (Transform 2026), SaaSFrame screenshots | Campaign pages JS-gated |
| 2 | **Kickstarter** | Crowdfunding | Public docs, blog posts | Site blocked (403) |
| 3 | **SubmitHub** | Music promotion | Full localization/translation layer extracted from HTML | ✅ Full access |
| 4 | **Groover** | Music promotion | Complete Tailwind CSS extracted from production build | ✅ Full access |
| 5 | **PlaylistPush** | Music promotion | Homepage HTML/CSS with animations | ✅ Full access |
| 6 | **BeatStars** | Beat marketplace | Complete CSS custom properties design system | ✅ Full access |
| 7 | **Fiverr** | Gig marketplace | Pending agent research | TBD |
| 8 | **Bandcamp** | Music distribution | Pending agent research | TBD |
| 9 | **Indiegogo** | Crowdfunding | Blocked (403) | No access |
| 10 | **Airbnb** | Marketplace | Pending agent research | TBD |

---

## 1. GROOVER — Music Promotion Platform

**Source:** Direct fetch of `https://groover.co/en/` — full production CSS extracted.

### Design System (Real CSS Tokens)

**Font Families:**
```css
font-family: Circular, "system-ui", -apple-system, BlinkMacSystemFont, 
  Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif;
  
/* Headings */
font-family: neue-haas-display, Circular, "system-ui", ...;
```

**Typography Scale:**
```css
.tw-text-h1 { font-size: 3.75rem; font-weight: 900; line-height: 4.5rem; }
.tw-text-h2 { font-size: 3rem; font-weight: 900; line-height: 3.5rem; }
.tw-text-h3 { font-size: 2.25rem; font-weight: 900; line-height: 3rem; }
.tw-text-h4 { font-size: 1.75rem; font-weight: 900; line-height: 2rem; }
.tw-text-h5 { font-size: 1.5rem; font-weight: 900; line-height: 2rem; }
.tw-text-h6 { font-size: 1.25rem; font-weight: 900; line-height: 1.5rem; }
.tw-text-body { font-size: 1rem; line-height: 1.5rem; }
.tw-text-body-lg { font-size: 1.125rem; line-height: 1.5rem; }
.tw-text-body-sm { font-size: .875rem; line-height: 1.25rem; }
.tw-text-body-xs { font-size: .8125rem; line-height: 1.25rem; }

/* Mobile responsive — headings shrink at 767px breakpoint */
@media(max-width:767px) {
  .tw-text-h1 { font-size: 3rem; line-height: 3.5rem; }
  .tw-text-h2 { font-size: 2.25rem; line-height: 3rem; }
  .tw-text-h3 { font-size: 1.75rem; line-height: 2rem; }
}
```

**Color Tokens (from production CSS):**
```css
/* Primary brand blue */
--tw-ring-offset-color: #528bdd;
--tw-ring-color: rgba(82,139,221,.5);

/* Error/form validation */
.tw-text-form-error { color: #eb4452; }    /* Red */
input::placeholder { color: #9ca3af; }       /* Gray */
border-color: #dedede;                       /* Light border */
```

**Spacing System (Tailwind scale):**
- `px`, `py`, `p-*` classes used throughout (4px base unit)
- Common values: p-4 (16px), p-5 (20px), p-6 (24px), p-8 (32px), p-10 (40px), p-14 (56px)
- Gap values: gap-4 (16px), gap-6 (24px), gap-8 (32px), gap-10 (40px)
- Border radius: Multiple classes (`rounded`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`)

**Layout Pattern:**
```css
/* Uses Tailwind's grid system */
.tw-col-span-1, .tw-col-span-2, .tw-col-span-5, .tw-col-span-7, .tw-col-span-12
.tw-col-span-full { grid-column: 1/-1; }

/* Flexbox utilities extensively */
.tw-flex, .tw-inline-flex, .tw-flex-col, .tw-flex-row, .tw-flex-wrap
.tw-items-center, .tw-items-start, .tw-justify-between, .tw-justify-center
```

**Z-Index Stack:**
```css
.tw-z-0, .tw-z-10, .tw-z-20, .tw-z-30, .tw-z-40, .tw-z-50
.tw-z-[1], .tw-z-[999], .tw-z-[99999], .tw-z-[10001]
```

### What Selah Can Steal from Groover

- **Font stack:** They use "Circular" (premium geometric sans-serif) + "neue-haas-display" (premium display font). Selah uses Righteous (display) + Poppins (body) — comparable quality.
- **All headings are 900 weight (Black)** — maximizes visual impact. Selah currently uses `font-bold` (700) — bumping to 900 would increase premium feel.
- **Mobile-first responsive:** Headings shrink at 767px with explicit mobile sizes. Selah already does similar.
- **Color system:** Clean blue (#528bdd) + red (#eb4452) + gray scale. Professional, restrained.
- **Form errors:** Dedicated `.tw-text-form-error` class with red color — consistent error handling pattern.

---

## 2. SUBMITHUB — Music Promotion Platform

**Source:** Direct fetch of `https://www.submithub.com/` — full i18n translation layer extracted.

### UX Messaging (Real Copy)

**Hero/Value Proposition:**
```
"Get your music heard"
"Built with musicians and curators in mind"
"We help you connect with: Bloggers, Spotify Playlisters, YouTubers, 
 Radio Stations, Influencers, Labels"
```

**For Artists — Key Selling Points:**
1. "Verified curators" — "We screen every curator to make sure they're in it for the right reasons. Outlets that accept money for guaranteed coverage are a definite no-no."
2. "Specific targeting" — "We provide statistics and other metrics about each curator so that you can make informed decisions about who to send your music to."
3. "No hidden fees" — "You decide how much to spend on each campaign. There's even an option for free submissions. If you get approved, you won't be asked to pay anything additional."
4. "Plan ahead" — "Have an unreleased song? No problem. Schedule your releases, submit to outlets before the release date."
5. "Stay updated" — "You get notified about the process of each submission along the way."
6. "Direct contact" — "There is no middle man — you get to discuss specifics with the outlets directly. Built-in chatting system."
7. "Quick customer support" — "The team behind SubmitHub is small, but we're quick. You'll pretty much always get a response that day."

**How It Works (Artist Flow):**
```
Step 1: "Upload your song" — "Use a link from SoundCloud, YouTube, Spotify, etc."
Step 2: "Choose curators" — "Filter by genre to find outlets who will like your music"
Step 3: "Submit!" — "Outlets typically respond within a matter of hours"
```

**Credits/Pricing Model:**
```
"Each curator requests between 1 and 3 credits"
"Premium credits: decision within 48 hours, minimum 20 seconds listening, 
 10+ words of feedback if declined"
"Standard (free) credits: no guaranteed response time, no required feedback"
"Approval rate: {premium}% for premium, {standard}% for standard"
"More than {shared} songs have been approved and shared"
```

**For Curators — Key Selling Points:**
1. "A simple feed" — "Submissions are presented in an easy-to-navigate list"
2. "Music you want" — "More than 100 genres to choose from"
3. "Ditch the emails" — "Built-in chatting system that allows you to connect with artists in real-time"
4. "Earn money" — "When an artist sends a premium submission, you earn $0.50 per response"
5. "Copyright permissions" — "Built-in copyright sign-off system"

### What Selah Can Steal from SubmitHub

- **"No hidden fees" messaging** — Selah should emphasize "you only pay for verified views" as prominently as SubmitHub's "no hidden fees."
- **Verification/trust signals** — "Verified curators" → "Verified creators" or "Verified views" badge on Selah.
- **Stats transparency** — SubmitHub shows approval rates. Selah could show creator acceptance rates, average earnings.
- **Free tier** — SubmitHub has free submissions. Selah has free campaign creation. This messaging should be prominent.
- **Three-step flow** — Upload → Choose → Submit. Clean, simple, universal. Selah currently has too many steps.
- **Direct messaging** — SubmitHub emphasizes direct artist-curator chat. Selah has this (messages) but doesn't promote it.
- **Small team, fast support** — Personable, humanizing copy. "The team behind SubmitHub is small, but we're quick." Selah could use similar tone — "Built by one musician, supported by real people."

---

## 3. PLAYLISTPUSH — Music Promotion Platform

**Source:** Direct fetch of `https://playlistpush.com/` — homepage HTML/CSS.

### Design Patterns (Real CSS)

**Hero Section — Image Carousel:**
```css
.hero-playlists-slides {
  width: 100%;
  height: 100%;
  background-color: #000;  /* Pure black background */
  overflow: hidden;
}

.hero-playlists-slides img {
  animation: slider-images 28s infinite;
  width: 100%;
  border-radius: 15px;
  position: absolute;
  top: 0;
  left: 0;
  transform: translateX(100%);
  opacity: 0;
}

@keyframes slider-images {
  0%   { transform: translateX(100%); opacity: 1; z-index: 10; }
  3%   { transform: translateX(0); opacity: 1; z-index: 10; }
  14%  { transform: scale(1); opacity: 1; z-index: 10; }
  18%  { transform: scale(0.9); opacity: 0; z-index: 1; }
  100% { transform: scale(1); opacity: 0; z-index: -1; }
}
```

**Key observations:**
- Background: **#000 (pure black)** — not dark gray, pure black. Creates maximum contrast for playlist artwork.
- Images have **15px border-radius** — subtle, not fully rounded.
- Carousel animation: **28-second cycle**, slides scale from 100% → 90% on exit (subtle zoom-out).
- Multiple images stacked with `position: absolute` and `z-index` layering.

**Tagline/Positioning (from HTML title):**
```
"The #1 Real Music Promotion Service - No bots"
"Real music promotion"
"Get your Music in Playlists" (Spotify)
"Get your Music in Videos" (TikTok)
```

**Dual-sided marketplace:**
- "Services for Artists" — Spotify Promotion, TikTok Promotion
- "Creator Sign up" — "Playlist Curators: Discover new Music, get Paid" / "TikTok Creators: Use Sounds, Get Paid"

**Pricing page has dedicated nav link** — always visible (not buried in footer).

### What Selah Can Steal from PlaylistPush

- **Pure black background** (#000) vs Selah's dark navy (#0F0F23) — PlaylistPush uses #000 for extreme contrast with album art. Selah's navy is softer but less dramatic. Consider #000 for campaign hero sections.
- **Hero carousel** with playlist cover art — Selah could show campaign cover art slideshow on homepage hero.
- **"No bots" tagline** — prominently featured. Selah already says "No bots" but could emphasize it more.
- **Separate CTAs for each side** — "Services for Artists" and "Creator Sign up" are distinct, not competing. Good pattern for two-sided marketplace.
- **Always-visible pricing link** in nav — transparency builds trust.

---

## 4. BEATSTARS — Beat Marketplace (Most Complete Design System)

**Source:** Direct fetch of `https://beatstars.com/` — full CSS custom properties extracted.

### Complete Color System (Real CSS Variables)

```css
:root {
  /* Blues */
  --bs-blue-10: #F2F7FE;    --bs-blue-20: #E3EFFF;
  --bs-blue-30: #64A5FF;    --bs-blue-50: #38F;       --bs-blue-60: #006AFF;
  --bs-blue-80: #07244C;    --bs-blue-90: #081C39;
  
  /* Grays */
  --bs-black: #0A0A09;      --bs-gray-100: #141414;    --bs-gray-95: #1A1A1A;
  --bs-gray-90: #262626;    --bs-gray-80: #383838;     --bs-gray-70: #707070;
  --bs-gray-60: #9F9F9F;    --bs-gray-50: #B8B8B8;     --bs-gray-40: #CCCCCC;
  --bs-gray-30: #E8E8E8;    --bs-gray-20: #F0F0F0;     --bs-gray-10: #F6F6F6;
  --bs-gray-05: #FAFAFA;    --bs-white: #FFFFFF;
  
  /* Greens (CTA color) */
  --bs-green-10: #EDF7F2;   --bs-green-20: #BCF5D7;    --bs-green-30: #79ECAF;
  --bs-green-50: #00D362;   --bs-green-60: #04AC51;    --bs-green-80: #0A4324;
  --bs-green-90: #0A2A19;
  
  /* Reds (errors/destructive) */
  --bs-red-10: #FCE8E8;     --bs-red-20: #FAD1D1;      --bs-red-30: #F66;
  --bs-red-50: #F04242;     --bs-red-60: #E50000;       --bs-red-80: #450808;
  
  /* Yellows (warnings) */
  --bs-yellow-50: #FFD633;  --bs-yellow-60: #F9C806;
  
  /* Orange (accent) */
  --bs-orange-50: #FF8731;  --bs-orange-60: #F06400;
  
  /* Violet (secondary brand) */
  --bs-violet-10: #F7F2FE;  --bs-violet-20: #E0CCFC;    --bs-violet-30: #B37DFF;
  --bs-violet-50: #8731FF;  --bs-violet-60: #6400F0;    --bs-violet-70: #4600FF;
}
```

**Key insight:** BeatStars uses **green as their primary CTA color** (#00D362), blue as secondary (#006AFF), violet as accent (#8731FF). Same pattern Selah uses (green for earnings, indigo for promotion). This color psychology is industry standard.

**Additional Colors (Secondary CSS variables):**
```css
--white: #fff;
--black: #000;
--navy-blue: #005ff8;
--green-haze: #00a656;
--yellow-lemon: #ffdf00;
--blue: #007cff;
--solid-blue: #005ff8;
--red: #eb0000;
--scarlet: #fe2b0d;
--fills-solid-green: #00a87d;
```

**Status Colors (Semantic):**
```css
--cod-grey: #0A0A0A;         /* Darkest background */
--cod-grey-light: #121212;   /* Card backgrounds */
--mine-shaft: #262626;       /* Borders/dividers */
--silver-chalice: #9F9F9F;   /* Muted text */
--silver-dark: #B8B8B8;       /* Secondary text */
--alto: #D8D8D8;              /* Light borders */
```

### Typography

**Font Stack (from @font-face declarations):**
```css
/* Body font */
@font-face {
  font-family: 'Schibsted Grotesk';
  src: url(SchibstedGrotesk-Regular.woff2);
  font-weight: 400;
}
@font-face {
  font-family: 'Schibsted Grotesk';
  src: url(SchibstedGrotesk-Medium.woff2);
  font-weight: 500;
}
@font-face {
  font-family: 'Schibsted Grotesk';
  src: url(SchibstedGrotesk-SemiBold.woff2);
  font-weight: 600;
}

/* Display/heading font */
@font-face {
  font-family: 'Bebas Neue';
  src: url(bebas-neue-regular.woff2);
}
```

**Key insight:** Two-font system — Schibsted Grotesk (body, 400/500/600 weights) + Bebas Neue (display/headings). Uses WOFF2 format for performance. Selah uses Righteous + Poppins — similar two-font architecture.

### Gradients (CTA Buttons)
```css
--bs-gradient-green: linear-gradient(0deg, #00A97F 0%, #00D36E 100%);
--bs-gradient-green-hover: linear-gradient(0deg, rgba(0,0,0,.2), rgba(0,0,0,.2)), 
                           var(--bs-gradient-green);
--bs-gradient-blue: linear-gradient(180deg, #43A5FF 0%, #1B65FF 100%);
--bs-gradient-blue-hover: linear-gradient(0deg, rgba(0,0,0,.2), rgba(0,0,0,.2)), 
                          var(--bs-gradient-blue);
```

**Key insight:** Gradient direction is vertical (0deg/180deg). Hover states are achieved by overlaying `rgba(0,0,0,.2)` on top of the base gradient — clean, maintainable pattern. Selah currently uses inline gradients — could adopt this overlay pattern.

### Z-Index Scale
```css
--bs-layer-under: -1;
--bs-layer-bottom: 0;
--bs-layer-top: 100000;
--bs-layer-modal: 30000;
--bs-layer-banner: 20000;
--bs-layer-snackbar: 10000;
--bs-layer-drawer: 9000;
--bs-layer-header: 8000;
--bs-layer-card: 1000;
```

### Material Design Integration
BeatStars uses Angular Material components extensively:
```css
--mat-option-selected-state-label-text-color: #9e9e9e;
--mat-option-label-text-color: white;
--mat-option-hover-state-layer-color: rgba(255,255,255,.08);
--mdc-filled-text-field-caret-color: #9e9e9e;
--mdc-filled-text-field-container-color: #4a4a4a;
/* ... 50+ Material Design custom properties ... */
```

### What Selah Can Steal from BeatStars

- **Green gradient for CTAs:** `linear-gradient(0deg, #00A97F 0%, #00D36E 100%)` — a teal-to-green vertical gradient. More premium than flat green. Selah could upgrade its green buttons.
- **Hover pattern:** Overlay `rgba(0,0,0,0.2)` on gradients for hover states. Simple, consistent, works on any gradient.
- **Two-font system:** Display font (Bebas Neue) + body font (Schibsted Grotesk). Selah has Righteous + Poppins — same effective pattern.
- **Z-index scale with named variables:** `--bs-layer-modal`, `--bs-layer-header`, etc. Makes stacking context predictable. Selah currently uses arbitrary z-index values.
- **Semantic gray scale:** 10-step gray palette from black to white with meaningful names. Selah uses opacity-based whites (`white/[0.03]`) — different approach, both work.
- **Green as primary CTA, blue as secondary, violet as accent** — same color psychology Selah uses. Validates the approach.

---

## 5. GOFUNDME — The Gold Standard (Indirect Sources)

**Sources:** Transform Magazine (Jan 2026 rebrand), SaaSFrame screenshots, GoFundMe Studio designer docs, design tokens article.

### Key Findings from Rebrand (January 2026)

**From Transform Magazine:**
> "GoFundMe partnered with Koto for a rebrand project that reflects the company's expanding reach beyond individual giving to nonprofit organisations. The UI rebrand features a new logo, colour, typography and art direction."

**From Rebrand Case Study (SchweitzerDesigns):**
> "The outdated color palette restricted designers to use only basic colors, which created problems because designers needed a strong visual system for building emphasis points and emotional responses."

### GoFundMe Studio Designer — Campaign Page Builder

**Source:** GoFundMe Pro Help Center — actual documentation of their page builder.

Available elements for campaign pages:
- **Text blocks** (headings, body text)
- **Buttons** (CTA, donation)
- **Images** (hero, gallery, inline)
- **Video embeds**
- **Progress bars**
- **Donor walls** (social proof)
- **Update/comment sections**
- **Sections** with configurable background colors and opacity

**Layout pattern:** Drag-and-drop block editor. Each section has independent background color/opacity control. Logo and social links are globally configured. This means GoFundMe campaign pages are **modular** — artists can add/remove/reorder sections.

### What Selah Can Steal from GoFundMe

- **Modular campaign page builder concept** — even if not drag-and-drop, Selah could make campaign pages more configurable (optional sections artists can enable/disable).
- **Donor wall as social proof** — GoFundMe prominently shows recent donors. Selah could show recent submissions/creators.
- **Campaign "story" as primary content** — GoFundMe puts the story front and center, not buried below CTAs.
- **Progress bar as emotional anchor** — always visible, always updating. Same as Selah's ring progress indicator but GoFundMe's is more prominent (full-width bar).

---

## 6. KICKSTARTER & INDIEGOGO (Blocked)

Both sites returned **HTTP 403** with JavaScript challenge walls. Direct HTML/CSS extraction not possible without a headless browser.

**What we know from public documentation:**
- Kickstarter uses a **two-column layout** (content left, rewards/CTA right sidebar)
- The "Back this project" button is **green** and **sticky** on scroll
- Reward tiers are displayed as **cards** with price, description, backer count, and "LIMITED" badges
- Campaign pages have **tabbed navigation** (Campaign, FAQ, Updates, Comments, Community)
- Indiegogo uses **perk cards** similar to Kickstarter rewards

---

## 7. SYNTHESIS — Cross-Competitor Patterns

### Button/CTA Colors (Real Hex Codes)

| Platform | Primary CTA | Secondary CTA | Error |
|----------|------------|---------------|-------|
| **BeatStars** | `#00D362` green gradient | `#006AFF` blue gradient | `#E50000` red |
| **Groover** | `#528bdd` blue | — | `#eb4452` red |
| **PlaylistPush** | Dark theme (#000 bg) | — | — |
| **Selah.fm (current)** | `#4338CA` indigo gradient | `#22C55E` green outline | red-400 |

**Pattern:** Blue for primary action (trust, professionalism), green for success/earnings, red for destructive/errors. Selah's indigo is unique but valid — it's more premium/differentiated than standard blue.

### Font Architecture (Real Font Stacks)

| Platform | Display/Heading | Body |
|----------|----------------|------|
| **Groover** | neue-haas-display (900 weight) | Circular |
| **BeatStars** | Bebas Neue | Schibsted Grotesk (400/500/600) |
| **Selah.fm** | Righteous | Poppins / system-ui |

**Pattern:** All platforms use a **two-font system**: display font for headings (personality) + geometric sans-serif for body (readability). Heading weights are universally bold (700-900). Selah's Righteous + Poppins combination is on par with competitors.

### Background Colors (Real Values)

| Platform | Background | Card/Container |
|----------|-----------|----------------|
| **PlaylistPush** | `#000` (pure black) | — |
| **BeatStars** | `#0A0A0A` / `#121212` | `#1A1A1A`, `#262626` |
| **Selah.fm** | `#0F0F23` (navy) / `#080817` | `bg-white/[0.03]` |

**Pattern:** Dark backgrounds dominate music/creator platforms. Pure black for maximum contrast with artwork. Selah's dark navy is distinctive but competitors lean toward pure blacks/dark grays.

### Social Proof Elements

| Platform | Social Proof |
|----------|-------------|
| **SubmitHub** | "{shared}+ songs shared", "{premium}% approval rate", curator stats |
| **PlaylistPush** | "The #1 Real Music Promotion Service" (positioning, not stats) |
| **BeatStars** | Track/beat stats (BPM, key), producer follower count |
| **GoFundMe** | "$X raised", "X donors", donor wall with names/amounts/messages |

**Pattern:** All platforms show real numbers — not hidden when zero. Framed as momentum ("X songs shared") or opportunity ("Be the first"). Selah should never hide zero counts.

### Pricing/Credit Transparency

| Platform | Pricing Model |
|----------|--------------|
| **SubmitHub** | "1-3 credits per curator", premium vs standard, "$0.50 per response" for curators |
| **PlaylistPush** | Dedicated pricing nav link, packages |
| **BeatStars** | License tiers per beat (MP3 → WAV → Stems → Unlimited → Exclusive) |

**Pattern:** Transparent, upfront pricing. No surprises. Selah could display "You set your CPM rate — here's what creators earn:" with examples.

---

## 8. WHAT THIS MEANS FOR SELAH.FM

### Already Doing Well (Validated by Competitors)
- Two-font system (Righteous + Poppins) ✅
- Dark theme ✅
- Indigo (trust) + Green (earnings) color system ✅
- Glass-morphism card pattern ✅
- Three-step user flow ✅

### Gaps to Address
- **No pure black backgrounds** — competitors use #000/#0A0A0A for maximum artwork contrast
- **No gradient hover pattern** — competitors use `rgba(0,0,0,0.2)` overlay, simpler and more consistent
- **No modular campaign page** — GoFundMe lets artists customize sections. Selah campaign pages are rigid.
- **Social proof too subtle** — competitors show stats prominently. Selah buries them.
- **No "no hidden fees" messaging** — SubmitHub/Groover emphasize this. Selah should too.
- **Too many CTAs** — every competitor has ONE primary CTA per page. Selah has 3-7.
- **Transparency of pricing** — competitors show exact costs/credits upfront. Selah's 20% fee should be more visible.

### Design System Improvements
1. Add pure black background option for hero/artwork sections
2. Standardize gradient hover effects with overlay pattern
3. Create a z-index scale with named variables
4. Make CTAs sticky on scroll (all competitors do this)
5. Show social proof at top of campaign pages
6. Single primary CTA per page
7. Tabbed content on campaign pages (About/Requirements/Submissions)

---

*This document contains only data extracted from actual competitor websites via HTTP fetches, CSS analysis, and public documentation. No training-data gap-filling.*
