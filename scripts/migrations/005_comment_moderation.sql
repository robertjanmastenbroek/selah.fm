-- ── Phase 6: Comment Moderation ──────────────────────────────
-- Adds report tracking and moderation to page_comments.

-- Add moderation columns to page_comments
ALTER TABLE page_comments ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE page_comments ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- Create comment reports table
CREATE TABLE IF NOT EXISTS comment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES page_comments(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (comment_id, reporter_id)
);
CREATE INDEX IF NOT EXISTS idx_comment_reports_comment ON comment_reports(comment_id);
