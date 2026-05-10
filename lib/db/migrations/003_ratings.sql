-- 003_ratings: Two-way rating system for artists and creators
-- Artists rate creators after a paid submission
-- Creators rate artists after receiving payment

CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  reviewee_id UUID NOT NULL REFERENCES users(id),
  reviewer_role TEXT NOT NULL CHECK (reviewer_role IN ('artist', 'creator')),
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(submission_id, reviewer_id) -- One rating per submission per user
);

CREATE INDEX IF NOT EXISTS idx_ratings_reviewee ON ratings(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_submission ON ratings(submission_id);
