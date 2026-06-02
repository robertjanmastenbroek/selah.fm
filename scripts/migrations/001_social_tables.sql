-- ═══════════════════════════════════════════════════════════════
-- Phase 0: Social Layer Database Migrations
-- Part 1: New tables for comments, reactions, activity feed
-- ═══════════════════════════════════════════════════════════════

-- 0A. Page comments (forum-like threads on artist & campaign pages)
CREATE TABLE IF NOT EXISTS page_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL CHECK (page_type IN ('artist', 'campaign')),
  page_id UUID NOT NULL,
  parent_id UUID REFERENCES page_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 1000),
  likes_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_page_comments_page ON page_comments(page_type, page_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_comments_parent ON page_comments(parent_id);

-- 0B. Comment likes (who liked which comment)
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES page_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (comment_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);

-- 0C. Submission reactions (fan ❤️ on creator videos)
CREATE TABLE IF NOT EXISTS submission_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reaction_type TEXT NOT NULL DEFAULT 'heart' CHECK (reaction_type IN ('heart', 'fire', 'clap', 'star')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (submission_id, user_id, reaction_type)
);
CREATE INDEX IF NOT EXISTS idx_sub_reactions_sub ON submission_reactions(submission_id);

-- 0D. Activity events (aggregated hype feed per artist)
CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES discovered_artists(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'donation', 'submission', 'comment', 'reaction_batch', 'rating', 'artist_claimed'
  )),
  actor_type TEXT NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'anonymous')),
  actor_name TEXT,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_artist ON activity_events(artist_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_events(created_at DESC);

-- 0E. Add denormalized counters
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS reactions_count INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_submissions_reactions ON submissions(reactions_count DESC);

ALTER TABLE discovered_artists ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_discovered_comments ON discovered_artists(comment_count DESC);
