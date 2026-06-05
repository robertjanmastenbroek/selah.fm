# Community Artist Resource — Phase 1 Implementation Plan

**Status:** Planning complete, ready for implementation
**Branch:** `feat/community-artist-resource`
**Parallel work:** Do not commit to `feat/referral-ux-*` branches — use this dedicated branch

---

## Overview

Transform Selah.fm's 2,158 AI-generated artist pages into community-vetted resources. Starting from a "Was this helpful?" micro-survey, progressing to full Wikipedia-style edit suggestions.

**Core insight from strategy team:** Community editing is the single highest-leverage move for SEO/LLMO. It shifts Google's site classification from "AI content farm" to "community resource." Even 10-20 community-edited pages could change the site-level signal.

---

## Files to Create

### New files (7)

| # | File | Purpose | Expert |
|---|------|---------|--------|
| 1 | `supabase/migrations/20260605000000_community_contributions.sql` | Schema: `artist_feedback`, `artist_edit_suggestions`, `artist_edit_history` | Engineering |
| 2 | `app/api/artist/[slug]/feedback/route.ts` | API: POST feedback + edit suggestions | Engineering |
| 3 | `components/HelpfulSurvey.tsx` | "Was this helpful?" widget + feedback flow | Product/UX |
| 4 | `components/EditSuggestionModal.tsx` | Structured edit suggestion form | Product/UX |
| 5 | `components/EditorAttributionBadge.tsx` | "Last edited by..." attribution | Product/UX |
| 6 | `components/ModerationEditQueue.tsx` | Edit suggestion review UI for `/app/review/` | Trust & Safety |
| 7 | `docs/COMMUNITY_GUIDELINES.md` | Community guidelines text | Growth |

### Files to modify (11)

| # | File | Change | Expert |
|---|------|--------|--------|
| 1 | `app/artist/[slug]/page.tsx` | Add edit data query, update schema, update noindex logic | Engineering + SEO |
| 2 | `app/artist/[slug]/ArtistProfileClient.tsx` | Wire in HelpfulSurvey, EditSuggestionModal, EditorAttributionBadge | Engineering |
| 3 | `app/review/page.tsx` | Add "Edit Suggestions" tab | Trust & Safety |
| 4 | `app/llms.txt/route.ts` | Add "## Community" section | SEO |
| 5 | `lib/engagement.ts` | Add community contribution paragraph to welcome emails | Growth |
| 6 | `lib/email-outreach.ts` | Add "Suggest an edit" link to artist outreach | Growth |
| 7 | `lib/creator-email-outreach.ts` | Add "Suggest an edit" link to creator outreach | Growth |
| 8 | `lib/notifications.ts` | Add `edit_approved`, `edit_needs_changes` notification types | Trust & Safety |
| 9 | `lib/rate-limit.ts` | Add rate limit config for feedback/edits | Trust & Safety |
| 10 | `lib/validation.ts` | Add edit suggestion validation schemas | Trust & Safety |
| 11 | `app/admin/page.tsx` | Add community metrics cards | Growth |

---

## 1. Database Schema (Engineering)

### Migration: `20260605000000_community_contributions.sql`

```sql
-- ============================================================
-- Community Contributions — Phase 1
-- Tables: artist_feedback, artist_edit_suggestions, artist_edit_history
-- ============================================================

-- Table 1: artist_feedback
-- Tracks "Was this helpful?" micro-survey responses
CREATE TABLE IF NOT EXISTS artist_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES discovered_artists(id) ON DELETE CASCADE,
  helpful BOOLEAN NOT NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_session_or_user CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_artist_feedback_artist ON artist_feedback(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_feedback_user ON artist_feedback(user_id);

ALTER TABLE artist_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can insert feedback (anonymous with session_id, auth with user_id)
CREATE POLICY "Anyone can submit feedback"
  ON artist_feedback FOR INSERT
  WITH CHECK (true);

-- Anyone can read aggregate counts
CREATE POLICY "Anyone can read feedback"
  ON artist_feedback FOR SELECT
  USING (true);

-- No updates or deletes (immutable)

-- Table 2: artist_edit_suggestions
-- Tracks community edit suggestions with moderation status
CREATE TABLE IF NOT EXISTS artist_edit_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES discovered_artists(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL CHECK (field_name IN ('bio', 'genre', 'track', 'social_link', 'image', 'other')),
  current_value TEXT,
  suggested_value TEXT NOT NULL,
  reason TEXT,
  source TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'email', 'seeded')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_changes')),
  moderator_id UUID REFERENCES auth.users(id),
  moderator_notes TEXT,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_artist_edit_suggestions_artist ON artist_edit_suggestions(artist_id, status);
CREATE INDEX IF NOT EXISTS idx_artist_edit_suggestions_status ON artist_edit_suggestions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_artist_edit_suggestions_user ON artist_edit_suggestions(user_id);

ALTER TABLE artist_edit_suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone can read pending/approved suggestions for an artist
CREATE POLICY "Anyone can read visible suggestions"
  ON artist_edit_suggestions FOR SELECT
  USING (status IN ('pending', 'approved') OR user_id = auth.uid());

-- Authenticated users can insert suggestions
CREATE POLICY "Authenticated users can submit suggestions"
  ON artist_edit_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Moderators can update status
CREATE POLICY "Moderators can update suggestions"
  ON artist_edit_suggestions FOR UPDATE
  USING (auth.email() = 'motomotosings@gmail.com')
  WITH CHECK (auth.email() = 'motomotosings@gmail.com');

-- Table 3: artist_edit_history
-- Immutable, versioned log of applied edits
CREATE TABLE IF NOT EXISTS artist_edit_history (
  id BIGSERIAL PRIMARY KEY,
  artist_id INTEGER NOT NULL REFERENCES discovered_artists(id) ON DELETE CASCADE,
  suggestion_id UUID REFERENCES artist_edit_suggestions(id),
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT NOT NULL,
  applied_by UUID REFERENCES auth.users(id),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artist_edit_history_artist ON artist_edit_history(artist_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artist_edit_history_verified ON artist_edit_history(artist_id) WHERE is_verified = TRUE;

ALTER TABLE artist_edit_history ENABLE ROW LEVEL SECURITY;

-- Anyone can read edit history
CREATE POLICY "Anyone can read edit history"
  ON artist_edit_history FOR SELECT
  USING (true);

-- Only system via trigger can insert
CREATE POLICY "Only system can insert history"
  ON artist_edit_history FOR INSERT
  WITH CHECK (auth.email() = 'motomotosings@gmail.com');

-- Triggers
CREATE OR REPLACE FUNCTION update_edit_suggestion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_edit_suggestion_timestamp ON artist_edit_suggestions;
CREATE TRIGGER trg_edit_suggestion_timestamp
  BEFORE UPDATE ON artist_edit_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_edit_suggestion_timestamp();

-- Helper function: count verified edits for an artist
CREATE OR REPLACE FUNCTION count_verified_edits(artist_id INTEGER)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::integer FROM artist_edit_history
  WHERE artist_edit_history.artist_id = $1 AND is_verified = TRUE;
$$ LANGUAGE sql STABLE;
```

### Rollback SQL

```sql
DROP TRIGGER IF EXISTS trg_edit_suggestion_timestamp ON artist_edit_suggestions;
DROP FUNCTION IF EXISTS update_edit_suggestion_timestamp();
DROP FUNCTION IF EXISTS count_verified_edits(INTEGER);
DROP TABLE IF EXISTS artist_edit_history;
DROP TABLE IF EXISTS artist_edit_suggestions;
DROP TABLE IF EXISTS artist_feedback;
```

---

## 2. API Route (Engineering)

### `POST /api/artist/[slug]/feedback`

**File:** `app/api/artist/[slug]/feedback/route.ts`

```typescript
// POST handler
// Body: { 
//   helpful: boolean,
//   suggestion?: { 
//     field_name: string,
//     current_value?: string,
//     suggested_value: string,
//     reason?: string 
//   }
// }
//
// Responses:
// 200: { success: true, feedback_id: "uuid" }
// 200: { success: true, suggestion_id: "uuid", status: "pending" }
// 429: { error: "rate_limit", retry_after: 3600 }
```

**Key implementation details:**
- Accept anonymous feedback via `session_id` cookie (generate UUID if not exists)
- For edit suggestions: require authentication (return 401 if no user)
- Rate limits: 10 feedback/hr per session, 3 edit suggestions/day per user
- On approved suggestion: insert into `artist_edit_history`, update `artist_audits.bio` if bio field
- Call `recordUserAction(userId)` for authenticated users
- Fire notification via `lib/notifications.ts` on approval/rejection

---

## 3. Components (Product/UX)

### `components/HelpfulSurvey.tsx`

**Props:**
```typescript
interface HelpfulSurveyProps {
  artistId: string;
  artistSlug: string;
  artistName: string;
  userId?: string;
  hasExistingContributions?: number;
}
```

**States:**
- **Anonymous, untouched:** `"Was this artist page helpful?  👍  👎"`
- **Anonymous, clicked 👍:** `"Thanks! Want to help improve this page?  Suggest an edit →"` (link triggers sign-in)
- **Anonymous, clicked 👎:** Show `"What's wrong?  Wrong genre / Missing tracks / Bio incorrect / Other"` → any selection → sign-in wall → redirect back with pre-filled modal
- **Logged-in, clicked 👍:** `"Glad it helped! You've helped improve this page"` + subtle confetti animation (reuse existing)
- **Logged-in, clicked 👎:** Expand inline panel with feedback type selection
- **Logged-in, repeat visitor:** `"You've contributed to this page  [X] edits"`

**Placement:** Bottom of artist page, after the bio/About tab content, before the Reviews & Comments section.

### `components/EditSuggestionModal.tsx`

**Props:**
```typescript
interface EditSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistId: string;
  artistName: string;
  currentBio?: string;
  currentGenres: string[];
  initialField?: string; // pre-selected from survey feedback
}
```

**Layout:**
- Header: `"Help improve [Artist Name]'s page — your suggestions help fans and creators discover the right info"`
- Step 1: Field selector (radio buttons with icons)
  - Bio (edit icon) — opens textarea with "What's wrong with the current bio?"
  - Genre (tag icon) — multi-select with current genres pre-filled
  - Track listing (music icon) — text input for track name + dropdown "Missing" / "Incorrect"
  - Social links (link icon) — URL input + platform dropdown
  - Images (image icon) — URL input
  - Other (dots icon) — free-form textarea
- Step 2 (conditional): Based on field selection, show specific form
- Step 3: Reason textarea (optional but encouraged): "Why are you suggesting this change?"
- Submit: `"Submit suggestion"` (disabled until required fields filled)
- Confirmation: `"Thanks! A moderator will review your suggestion. You'll get a notification when it's live."` + suggestion ID
- Error state: `"Something went wrong. Please try again."` + retry button
- Rate limited: `"You've submitted [X] suggestions today. Please try again tomorrow."`

### `components/EditorAttributionBadge.tsx`

**Props:**
```typescript
interface EditorAttributionBadgeProps {
  artistId: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  contributorCount: number;
}
```

**States:**
- 0 edits: Don't render (don't highlight that it's AI-only)
- 1-4 edits: `"Last edited by [username] on [date]"`
- 5+ edits: `"[X] contributors have improved this page"`
- Clickable: Opens edit history panel (Phase 2 placeholder)

**Placement:** Below the bio text, small text with muted styling.

---

## 4. Artist Page Integration (Engineering)

### `app/artist/[slug]/page.tsx` changes

**Inside `getArtistData()`**, add after the existing secondary queries:

```typescript
// Community edit data
let verifiedEditCount = 0;
let latestEditDate: Date | null = null;
try {
  const [result] = await sql`
    SELECT COUNT(*)::int as count,
           MAX(created_at) as latest
    FROM artist_edit_history
    WHERE artist_id = ${artistId} AND is_verified = TRUE
  `;
  verifiedEditCount = result?.count || 0;
  latestEditDate = result?.latest || null;
} catch (e: any) {
  console.error('[ARTIST] edit history fetch failed:', e.message);
}
```

**Return these in the result object.**

**Noindex logic update** (line ~120):

```typescript
// Current:
const isThin = stats.total_tracks === 0 || (...);

// New: community edits can override thin status
const hasCommunityEdits = verifiedEditCount >= 3;
const isThin = !hasCommunityEdits && (stats.total_tracks === 0 || (...));
```

**Schema additions** (inside JSON-LD `MusicGroup`):

```typescript
// Add to MusicGroup node:
...(latestEditDate ? { dateModified: latestEditDate.toISOString() } : {}),
...(verifiedEditCount > 0 ? {
  correction: {
    '@type': 'CorrectionComment',
    text: `Bio corrected by community contributor${verifiedEditCount > 1 ? 's' : ''}`,
  },
} : {}),
```

**Add to FAQPage** (new question):

```typescript
{
  '@type': 'Question',
  name: `Is this ${artist.artist_name} page accurate?`,
  acceptedAnswer: {
    '@type': 'Answer',
    text: `This page has been reviewed by ${Math.max(1, verifiedEditCount)} community contributor${verifiedEditCount !== 1 ? 's' : ''}. You can suggest corrections if something is wrong.`,
  },
},
```

### `ArtistProfileClient.tsx` changes

Import and mount the three new components, passing `artistId`, `artistSlug`, `artistName`, and edit-related props.

---

## 5. Moderation Queue (Trust & Safety)

### `app/review/page.tsx` — New "Edit Suggestions" tab

Add a second tab next to the existing submission review tab:

```
[ Submission Review ] [ Edit Suggestions ]
```

**Queue items show:**
- Artist name (link to page)
- Field being edited (badge: "Bio", "Genre", "Track", etc.)
- Old value → New value diff (side-by-side or inline)
- Submitter (username or "Anonymous")
- Time since submission
- Status badge

**Actions:**
- **Approve** — inserts into `artist_edit_history`, updates `artist_audits` if bio, sends notification, marks suggestion as `approved`
- **Reject** — opens textarea for moderator notes (required), sends notification, marks as `rejected`
- **Skip** — leaves as `pending` for later review

**Rate limits for Phase 1:**
- 10 anonymous feedback submissions per hour per session
- 3 edit suggestions per day per authenticated user
- 1 feedback per artist per logged-in user (upsert behavior)

**Governance rules:**
- Edits go to `pending` queue, not live immediately
- If an artist claims their page, their edits auto-approve (Phase 2)
- Policy text on submission: *"By submitting, you confirm this information is accurate to the best of your knowledge. Promotional, offensive, or inaccurate suggestions will be rejected."*

---

## 6. SEO/LLMO Changes (SEO)

### JSON-LD additions

| Property | Where | Condition | Value |
|----------|-------|-----------|-------|
| `dateModified` | MusicGroup | `latestEditDate != null` | ISO timestamp |
| `correction` | MusicGroup | `verifiedEditCount > 0` | `{ @type: "CorrectionComment", text: "..." }` |
| `sdPublisher` | WebPage (not MusicGroup) | Always | `{ @type: "Organization", name: "Selah.fm Community", url: "https://selah.fm" }` |
| `dateModified` | WebPage | `latestEditDate != null` | ISO timestamp |
| FAQ question | FAQPage | Always | "Is this page accurate?" with contributor count |

### Metadata changes

- `<meta name="dateModified" content="..." />` — set to latest edit timestamp
- `<meta property="article:modified_time" content="..." />` — same
- Description: if community edits exist, append " Community-updated page."
- No `author` meta in Phase 1 (anonymous edits; Phase 2 when attribution exists)

### Noindex logic

```typescript
// New rule: community edits override thin page status
const hasCommunityEdits = verifiedEditCount >= 3;
const isThin = !hasCommunityEdits && (stats.total_tracks === 0 || (...));
```

This gives every artist page a path to indexability: if someone makes 3 edits, it gets indexed regardless of tracks or activity.

### llms.txt addition

In `app/llms.txt/route.ts`, add after the "## Notable content" section:

```
## Community
Artist pages at /artist/[slug] accept community corrections. Verified edits are reviewed by human moderators. Each page tracks edit history and contributor count.
- Suggest an edit: any artist page
- Edit history: visible on each artist page
- Moderation: 24-hour review target for most suggestions
```

---

## 7. Code-Only Changes (Growth)

These are the only growth-related code changes — they add community contribution hooks into the existing email and notification systems. No founder action required.

### A. Welcome email additions (`lib/engagement.ts`)

Add community contribution paragraph to `renderWelcomeEmail1`:

**Artist version** — insert after the "How to get started" section:
```html
<br><br>
<strong>One more thing — your artist page could use your help.</strong><br>
The bio, genre tags, and track list on your page were generated automatically. If something looks wrong, you can fix it. <a href="https://selah.fm/artist/YOUR_SLUG" style="color:#5B7FFF;">Suggest corrections to your bio</a>, add missing tracks, or fix your genre. It takes 30 seconds.
```

**Creator version** — insert after "How it works" section:
```html
<br><br>
<strong>Know an artist whose page looks wrong?</strong><br>
You can <a href="https://selah.fm/browse" style="color:#5B7FFF;">suggest edits to any artist page</a> to help other creators discover accurate info about the artists they want to work with. Every fix helps the whole community.
```

### B. New trigger email: "Your edit was approved"

Add to `lib/engagement.ts`:
```typescript
export function renderEditApprovedEmail(params: {
  name: string;
  artistName: string;
  changes: string;
  artistUrl: string;
}): { subject: string; html: string } {
  const { name, artistName, changes } = params;
  return {
    subject: `Your suggestion for ${artistName} was approved 🎉`,
    html: emailWrapper({
      title: `Your edit was approved`,
      body: [
        `Hey ${name},`,
        `Great news — your edit for <strong>${artistName}</strong> was approved!`,
        `<blockquote>${changes}</blockquote>`,
        `You've helped make the database more accurate. Every edit counts.`,
        `— Robert-Jan<br>Founder, Selah.fm`,
      ].join('<br>'),
      cta: { text: 'Suggest another edit →', url: 'https://selah.fm/browse' },
    }),
  };
}
```

### C. New trigger email: "Your edit needs changes"

```typescript
export function renderEditNeedsChangesEmail(params: {
  name: string;
  artistName: string;
  moderatorFeedback: string;
  resubmitUrl: string;
}): { subject: string; html: string } {
  const { name, artistName, moderatorFeedback } = params;
  return {
    subject: `Quick update on your ${artistName} suggestion`,
    html: emailWrapper({
      title: `Your edit needs a small fix`,
      body: [
        `Hey ${name},`,
        `Thanks for editing <strong>${artistName}</strong>'s page. It needs a small adjustment:`,
        `<blockquote>${moderatorFeedback}</blockquote>`,
        `Tweak it and resubmit — we'll review it right away.`,
        `— Robert-Jan<br>Founder, Selah.fm`,
      ].join('<br>'),
      cta: { text: 'Edit and resubmit →', url: `https://selah.fm/browse` },
    }),
  };
}
```

### D. Outreach email additions

**`lib/email-outreach.ts`** — Add to artist outreach template before sign-off:
```html
<br><br>
<strong>See something wrong on your page?</strong><br>
Your bio, genre, and tracks were auto-generated. If anything's off, <a href="${claimUrl || campaignUrl}" style="color:#5B7FFF;">you can suggest corrections here</a> — it takes 30 seconds.
```

**`lib/creator-email-outreach.ts`** — Add to creator outreach template before sign-off:
```html
<br><br>
<strong>Spot a mistake on an artist's page?</strong><br>
You can <a href="https://selah.fm/browse" style="color:#5B7FFF;">suggest edits to any artist page</a> to help other creators find accurate info.
```

### E. Admin dashboard metrics

Add a "Community" section to `/admin/page.tsx` with cards for:
- Total feedback responses with 👍/👎 ratio
- Total edit suggestions submitted
- Approval rate (%)
- Average time to moderation (hours)
- Top contributors table
- Most-edited artists table

API endpoint: `GET /api/admin/community/stats` (follows same pattern as existing `/api/admin/overview`)

---

## 8. Implementation Order

Build in this sequence:

```
Step 1: Migration (create all 3 tables + RLS + triggers)
Step 2: Validation schemas (lib/validation.ts)
Step 3: Rate limit config (lib/rate-limit.ts)
Step 4: Notification types (lib/notifications.ts)
Step 5: API route (POST /api/artist/[slug]/feedback)
Step 6: HelpfulSurvey component
Step 7: EditSuggestionModal component
Step 8: EditorAttributionBadge component
Step 9: Wire into ArtistProfileClient.tsx
Step 10: ModerationEditQueue component + review page tab
Step 11: SEO schema + metadata + noindex updates
Step 12: llms.txt update
Step 13: Email sequence updates (engagement.ts + outreach files)
Step 14: Admin dashboard metrics
Step 15: Deploy
```

---

## 9. Branch Strategy

```bash
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feat/community-artist-resource

# Build in order above, commit after each step
git add [files]
git commit -m "feat: add community contributions schema migration"
git commit -m "feat: add feedback API route"
# ... etc

# Push when ready
git push origin feat/community-artist-resource
```

Do NOT commit to `feat/referral-ux-*` branches — those belong to the parallel agent.

---

## 10. Phase 1 Success Criteria (Code)

Everything here is verifiable by deploying and running the system. No human-action metrics.

- [ ] Migration runs cleanly — 3 tables created, RLS policies applied, indexes built
- [ ] `POST /api/artist/[slug]/feedback` accepts anonymous 👍/👎 and authenticated edit suggestions
- [ ] Rate limits enforced: 10/hr anonymous, 3/day authenticated
- [ ] HelpfulSurvey renders on all artist pages with correct state transitions
- [ ] EditSuggestionModal submits to API and returns confirmation
- [ ] EditorAttributionBadge renders when contributorCount > 0
- [ ] Moderation queue has "Edit Suggestions" tab with approve/reject/skip
- [ ] Approved edits write to artist_edit_history and update artist_audits.bio
- [ ] JSON-LD includes dateModified (when edits exist) and correction markup
- [ ] Noindex logic overrides for pages with 3+ community edits
- [ ] llms.txt includes "## Community" section
- [ ] Welcome emails include contribution paragraph
- [ ] Trigger emails (approved / needs changes) render correctly
- [ ] Admin dashboard shows community metrics
- [ ] `npx tsc --noEmit` passes with zero errors
