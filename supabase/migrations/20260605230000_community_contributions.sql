-- ============================================================
-- Community Contributions — Phase 1
-- Tables: artist_feedback, artist_edit_suggestions, artist_edit_history
-- Allows users to submit "Was this helpful?" feedback and
-- suggest corrections to artist pages (Wikipedia-style).
-- ============================================================

-- ── Table 1: artist_feedback ──
-- Tracks "Was this helpful?" micro-survey responses.
-- Anonymous users submit via session_id, authenticated via user_id.

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

-- Anyone can insert feedback (anonymous or authenticated)
CREATE POLICY "Anyone can submit feedback"
  ON artist_feedback FOR INSERT
  WITH CHECK (true);

-- Anyone can read aggregate counts
CREATE POLICY "Anyone can read feedback"
  ON artist_feedback FOR SELECT
  USING (true);

-- No updates or deletes — immutable once submitted

-- ── Table 2: artist_edit_suggestions ──
-- User-submitted edit suggestions with moderation pipeline.

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

-- Anyone can read pending or approved suggestions for an artist
CREATE POLICY "Anyone can read visible suggestions"
  ON artist_edit_suggestions FOR SELECT
  USING (status IN ('pending', 'approved') OR user_id = auth.uid());

-- Authenticated users can create suggestions
CREATE POLICY "Authenticated users can submit suggestions"
  ON artist_edit_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Moderators (admin email) can update suggestion status
CREATE POLICY "Moderators can update suggestions"
  ON artist_edit_suggestions FOR UPDATE
  USING (auth.email() = 'motomotosings@gmail.com')
  WITH CHECK (auth.email() = 'motomotosings@gmail.com');

-- ── Table 3: artist_edit_history ──
-- Immutable, versioned log of all applied community edits.

CREATE TABLE IF NOT EXISTS artist_edit_history (
  id BIGSERIAL PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES discovered_artists(id) ON DELETE CASCADE,
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

-- Anyone can read the edit history (public log)
CREATE POLICY "Anyone can read edit history"
  ON artist_edit_history FOR SELECT
  USING (true);

-- Only moderators can insert into the history log
CREATE POLICY "Only moderators can insert history"
  ON artist_edit_history FOR INSERT
  WITH CHECK (auth.email() = 'motomotosings@gmail.com');

-- ── Triggers ──

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

-- ── Helper function ──
-- Returns the number of verified edits for an artist.
-- Used by the artist page to determine noindex status and badge display.

CREATE OR REPLACE FUNCTION count_verified_edits(artist_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::integer FROM artist_edit_history
  WHERE artist_edit_history.artist_id = $1 AND is_verified = TRUE;
$$ LANGUAGE sql STABLE;
