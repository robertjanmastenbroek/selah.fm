-- Bio Vocabulary Tracking
-- Persists word frequency data across all bio generations
-- Enables the self-learning banned-words mechanism to work across instances

CREATE TABLE IF NOT EXISTS bio_word_counts (
  word TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Query helper: words that appear more than N times across all bios
-- Threshold of 3+ means "appeared in 3+ different bios" = overused
CREATE OR REPLACE FUNCTION get_overused_words(threshold INT DEFAULT 3)
RETURNS TABLE(word TEXT, frequency INT) AS $$
BEGIN
  RETURN QUERY
  SELECT bwc.word, bwc.count::int
  FROM bio_word_counts bwc
  WHERE bwc.count >= threshold
  ORDER BY bwc.count DESC;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

-- Decay function: halve all counts to give recent bios more weight
-- Run periodically (e.g., every 500 bios) to create a sliding window effect
CREATE OR REPLACE FUNCTION decay_bio_vocabulary()
RETURNS INT AS $$
DECLARE
  removed INT;
BEGIN
  -- Halve all counts
  UPDATE bio_word_counts SET count = GREATEST(count / 2, 1);
  -- Remove words that fell below threshold after decay
  DELETE FROM bio_word_counts WHERE count < 2;
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';
