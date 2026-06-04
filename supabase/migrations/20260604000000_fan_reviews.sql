-- Fan reviews table
-- Allows authenticated users to leave 5-star reviews with text on artist pages.

CREATE TABLE IF NOT EXISTS fan_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who left the review
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- What they're reviewing (artist page)
  artist_id UUID REFERENCES discovered_artists(id) ON DELETE CASCADE,
  
  -- Review content
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL CHECK (char_length(content) >= 10 AND char_length(content) <= 2000),
  
  -- Moderation
  is_hidden BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  -- Artist response
  response_text TEXT,
  response_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  
  -- One review per artist per user
  UNIQUE(user_id, artist_id)
);

CREATE INDEX IF NOT EXISTS idx_fan_reviews_artist ON fan_reviews(artist_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fan_reviews_user ON fan_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_fan_reviews_featured ON fan_reviews(artist_id) WHERE is_featured = true;

-- Enable RLS
ALTER TABLE fan_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read non-hidden reviews
CREATE POLICY "Anyone can read visible reviews"
  ON fan_reviews FOR SELECT
  USING (NOT is_hidden);

-- Authenticated users can create reviews (one per artist)
CREATE POLICY "Authenticated users can create reviews"
  ON fan_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON fan_reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Row-level trigger to enforce updated_at
CREATE OR REPLACE FUNCTION update_fan_review_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fan_review_timestamp ON fan_reviews;
CREATE TRIGGER trg_fan_review_timestamp
  BEFORE UPDATE ON fan_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_fan_review_timestamp();
