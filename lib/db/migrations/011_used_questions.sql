-- 011_used_questions_tracking.sql
-- Track which questions have been used for blog posts to prevent duplicates
-- and allow continuous discovery of fresh, relevant questions.

-- Table to track used/skipped questions
CREATE TABLE IF NOT EXISTS used_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  normalized_text TEXT NOT NULL UNIQUE, -- lowercase, trimmed, dedup key
  blog_post_id UUID REFERENCES blog_posts(id),
  status TEXT NOT NULL DEFAULT 'answered', -- 'answered', 'skipped', 'pending'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_used_questions_status ON used_questions(status);
CREATE INDEX IF NOT EXISTS idx_used_questions_blog_post ON used_questions(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_used_questions_normalized ON used_questions(normalized_text);

-- Add a last_sourced_at timestamp to track when questions were last refreshed
ALTER TABLE batches ADD COLUMN IF NOT EXISTS last_sourced_at TIMESTAMPTZ;
