# Selah.fm — 0.0001% World-Class Standard Blueprint

**Date:** June 4, 2026
**Standard:** Top 0.0001% worldwide (~6,000 individuals globally)
**Scope:** UI/UX, conversion, onboarding, security, database, code quality

---

## Phase 1 Complete: Research Findings

### A. Artist/Music Platforms — World Class

**Spotify Design System (Encore)**
| Principle | How It Works | Selah.fm Gap |
|-----------|-------------|--------------|
| **Color as emotion** | UI extracts dominant colors from album art → dynamic gradients | ❌ Static gradient based on name hash |
| **Dark-first** | #121212 canvas makes content pop | ✅ Already dark theme |
| **Card architecture** | Single card primitive scales across all surfaces | 🟡 Cards exist but less consistent |
| **Elevation through brightness** | Hover = lighter card (inverse of light-mode) | ❌ Hover states are subtle — no elevation shift |
| **Typography hierarchy** | 96px canon → 32px title → 16px card → 14px body → 11px caption | 🟡 Has Righteous + Poppins but scale not systematic |
| **Micro-interactions** | 200ms transitions, play button appears on card hover, shadow on raised elements | 🟡 150-300ms used but hover reveals minimal |
| **Wrapped-style storytelling** | Bold duotone, oversized type, personal data as shareable asset | ❌ No equivalent |

**Bandcamp**
| Principle | Selah.fm Gap |
|-----------|-------------|
| Direct artist-to-fan with zero middleman | ❌ Platform fee is necessary but should be transparent |
| Track-level merchandise + donations | 🟡 Donations exist but no merch |
| Rich per-track pages with streaming + comments | 🟡 Track pages exist but barebones |
| Community feel — comments feel alive | 🟡 Comments exist but sparse |

### B. Creator Marketplaces — World Class

**Kickstarter**
| Principle | Selah.fm Gap |
|-----------|-------------|
| Video hero auto-plays above the fold | ❌ Static image only |
| Funding thermometer with real-time updates | ✅ Live ticker exists |
| Backer avatar grid with pledge amounts | ✅ Supporter grid exists |
| Reward tiers with clear pricing | 🟡 CPM is the only "tier" |
| Risk & challenges section for trust | ❌ Missing |
| Creator story with images throughout | ❌ Missing — just raw description |

**Product Hunt**
| Principle | Selah.fm Gap |
|-----------|-------------|
| Upvote/downvote as social proof mechanism | ❌ Missing — reactions exist on submissions but not campaigns |
| Maker comments/replies visible on every listing | ✅ Comments exist |
| "Launched X hours ago" freshness indicator | 🟡 Created date shown but not prominently |
| Hunter + Maker dual-credibility system | ❌ No concept of "who found this" |

### C. Fundraising/Donation — World Class

**GoFundMe**
| Principle | Selah.fm Gap |
|-----------|-------------|
| Emotional storytelling above data | ❌ Data-first, story-second |
| Donation thermometer with goal % | ✅ Budget progress exists |
| Recent donor carousel with names | ✅ Supporter grid exists |
| "X people have donated" social proof | ✅ Social proof bar exists |
| Mobile-optimized sticky donate CTA | ✅ Sticky bar exists |

**Stripe Checkout**
| Principle | Selah.fm Gap |
|-----------|-------------|
| Single-field address autocomplete | ❌ Basic form |
| Real-time validation on each field | 🟡 Some validation exists |
| Apple Pay / Google Pay as first option | ❌ Missing for donations |
| Error messages in plain language | 🟡 Standard |
| 3D Secure handled seamlessly | ❌ Not tested |

### D. Design Execution — World Class (Linear, Stripe, Vercel, Apple)

**Linear**
| Principle | Selah.fm Gap |
|-----------|-------------|
| Every micro-interaction serves a purpose (no decorative animation) | 🟡 Some animations are decorative |
| Keyboard shortcuts for everything | ❌ None |
| Optimistic UI everywhere | 🟡 Used in follow but not consistently |
| Loading: skeleton shimmer + content appears progressively | ❌ Flat skeletons |
| Empty states are helpful, not dead ends | 🟡 Some empty states exist |
| Command palette (Cmd+K) for all actions | ❌ Missing |
| Consistent 8px grid spacing | 🟡 Uses Tailwind spacing but not always consistent |

**Stripe**
| Principle | Selah.fm Gap |
|-----------|-------------|
| Documentation-quality error messages | ❌ Generic error messages |
| One-click reattempt on failure | ❌ Missing |
| Progressive disclosure (show complexity only when needed) | 🟡 Onboarding does this well |
| Visual consistency across every surface | 🟡 Mostly consistent but some pages use `#0F0F23` vs `#121212` |

**Vercel**
| Principle | Selah.fm Gap |
|-----------|-------------|
| Dark theme with perfect contrast ratios | ✅ Good |
| Typography that communicates hierarchy at a glance | 🟡 Could be more systematic |
| Deployment previews for every change | ❌ Missing |
| Loading states that feel instantaneous | 🟡 Some loading states exist |

### E. Conversion-Optimized Onboarding (Duolingo, Calendly, Stripe Atlas)

**Duolingo**
| Principle | Selah.fm Gap |
|-----------|-------------|
| Gamified progress (streaks, XP, badges) | ❌ Missing |
| Micro-commitments (2 min/day) | 🟡 Onboarding asks for name only |
| Immediate value on first session | 🟡 Shows browse immediately |
| Social proof (friends learning) | ❌ Missing |

**Calendly**
| Principle | Selah.fm Gap |
|-----------|-------------|
| Minimal steps (3 clicks to schedule) | 🟡 Creator: 5 steps. Artist: 3 steps |
| Pre-filled smart defaults | ✅ CPM presets exist |
| Connect calendar = instant value | 🟡 No "connect Spotify" during onboarding |
| Single-purpose page design | ✅ Focused onboarding |

**Stripe Atlas**
| Principle | Selah.fm Gap |
|-----------|-------------|
| "You're X minutes away from..." clear expectation setting | ❌ Missing |
| Progress bar with estimated time remaining | 🟡 Progress bar exists but no time estimates |
| Save-and-resume-anytime (localStorage) | ✅ Exists |
| Know exactly what info you need before starting | 🟡 Step overview not shown upfront |

---

## Phase 2: Current State Audit

### Scorecard (1-10, world-class target = 10)

| Dimension | Score | Key Gaps |
|-----------|-------|----------|
| **Campaign Page** | 7/10 | Missing: video hero, storytelling, risk section, creator testimonials, Stripe Apple Pay |
| **Artist Profile** | 8/10 | Missing: dynamic color extraction from cover art, card hover elevation, systematic type scale |
| **Track Page** | 3/10 | Missing: EVERYTHING interactive — bare server-rendered HTML |
| **Creator Onboarding** | 7/10 | Missing: Stripe Connect during onboarding, platform handle collection, time estimates per step |
| **Artist Onboarding** | 6/10 | Missing: Spotify connect, campaign preview, "what creators see" |
| **Login Page** | 7/10 | Missing: real social proof numbers, Apple/Google Pay badge, testimonial |
| **Browse Page** | 7/10 | Missing: keyboard navigation, infinite scroll, hover preview |
| **Checkout** | 6/10 | Missing: Apple Pay, estimated delivery, one-click reattempt |
| **Security** | 7/10 | Missing: rate limiting on auth endpoints, audit logging |
| **Database** | 7/10 | Missing: connection pooling config, query performance monitoring |

### Priority Matrix

```
                    High Impact · Low Effort
                    ┌─────────────────────────────┐
                    │                             │
    EASY WINS       │  • Track page client comp   │  STRATEGIC
    (Do Now)        │  • Add past-slot check fix   │  (Plan)
                    │  • Fix real social proof #s  │
                    │  • Add scroll animations     │
                    │  • Card hover elevation      │
                    ├─────────────────────────────┤
                    │                             │
    FOUNDATIONAL    │  • Dynamic color extraction  │  LONG-TERM
    (Build Right)   │  • Systematic type scale    │  (Defer)
                    │  • Stripe Connect onboarding │
                    │  • Campaign video hero       │
                    │  • Creator testimonials      │
                    │  • Keyboard shortcuts        │
                    └─────────────────────────────┘
                    Low Impact · High Effort
```

---

## Phase 3: Execution Plan (Ready for Approval)

### Sprint 1 (Today): Critical Foundations
1. **Track page** — Add client component with earnings calculator + CTAs
2. **Login page** — Fix social proof numbers, add testimonials stripe
3. **Campaign page** — Add video hero support, creator testimonials section
4. **Card elevation** — All cards get lighter on hover (Spotify pattern)

### Sprint 2 (Next): Onboarding Optimization
1. **Creator onboarding** — Add Stripe Connect step, platform handle collection
2. **Artist onboarding** — Add Spotify connect, campaign preview
3. **Login page** — Add Apple/Google Pay badge, estimated time to first earn

### Sprint 3 (Next+): Deep UX
1. **Dynamic color extraction** — Extract dominant colors from cover art for gradients
2. **Systematic type scale** — Implement Spotify-style hierarchy
3. **Storytelling sections** — Campaign "About" section with rich media
4. **Keyboard shortcuts** — Cmd+K palette, navigation shortcuts

---

*Ready for your review and approval to proceed to Phase 3 execution.*
