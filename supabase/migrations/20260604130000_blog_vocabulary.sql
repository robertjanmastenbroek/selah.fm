-- Blog Vocabulary Tracking
-- Persists word/phrase frequency data across all blog post generations.
-- Enables a self-learning banned-words mechanism — every post feeds back
-- into the prompt so the AI learns which vocabulary patterns are overused.
--
-- Run decay_blog_vocabulary() periodically (every ~50 posts) for a sliding window.

CREATE TABLE IF NOT EXISTS blog_word_counts (
  word TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track phrase-level patterns (2-4 word n-grams) that become detectable
CREATE TABLE IF NOT EXISTS blog_phrase_counts (
  phrase TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Query helper: words appearing more than N times across all blog posts
CREATE OR REPLACE FUNCTION get_overused_blog_words(threshold INT DEFAULT 10)
RETURNS TABLE(word TEXT, frequency INT) AS $$
BEGIN
  RETURN QUERY
  SELECT bwc.word, bwc.count::int
  FROM blog_word_counts bwc
  WHERE bwc.count >= threshold
  ORDER BY bwc.count DESC;
END;
$$ LANGUAGE plpgsql;

-- Query helper: phrase patterns appearing more than N times
CREATE OR REPLACE FUNCTION get_overused_blog_phrases(threshold INT DEFAULT 5)
RETURNS TABLE(phrase TEXT, frequency INT) AS $$
BEGIN
  RETURN QUERY
  SELECT bpc.phrase, bpc.count::int
  FROM blog_phrase_counts bpc
  WHERE bpc.count >= threshold
  ORDER BY bpc.count DESC;
END;
$$ LANGUAGE plpgsql;

-- Track blog quality scores over time
CREATE TABLE IF NOT EXISTS blog_quality_scores (
  blog_post_id UUID PRIMARY KEY REFERENCES blog_posts(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  word_count INTEGER,
  sentence_variety_score INTEGER DEFAULT 0,
  paragraph_variety_score INTEGER DEFAULT 0,
  banned_word_penalty INTEGER DEFAULT 0,
  generic_phrase_penalty INTEGER DEFAULT 0,
  personal_voice_count INTEGER DEFAULT 0,
  contraction_ratio NUMERIC DEFAULT 0,
  emotional_shifts INTEGER DEFAULT 0,
  has_faq BOOLEAN DEFAULT FALSE,
  has_key_takeaways BOOLEAN DEFAULT FALSE,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decay function: halve all counts to give recent posts more weight
-- Run periodically (e.g., every 50 posts) to create a sliding window effect
CREATE OR REPLACE FUNCTION decay_blog_vocabulary()
RETURNS INT AS $$
DECLARE
  removed INT;
BEGIN
  -- Halve all word counts
  UPDATE blog_word_counts SET count = GREATEST(count / 2, 1);
  -- Halve all phrase counts
  UPDATE blog_phrase_counts SET count = GREATEST(count / 2, 1);
  -- Remove entries that fell below threshold after decay
  DELETE FROM blog_word_counts WHERE count < 2;
  DELETE FROM blog_phrase_counts WHERE count < 2;
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$ LANGUAGE plpgsql;
