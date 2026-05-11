-- Migration 008: Dual-role support (artist + creator)
-- Users can now have both roles simultaneously instead of mutually exclusive user_type.

-- Add boolean flags for each role
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_artist BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_creator BOOLEAN NOT NULL DEFAULT false;

-- Backfill from existing user_type
UPDATE users SET is_artist = true WHERE user_type = 'artist';
UPDATE users SET is_creator = true WHERE user_type = 'creator';

-- Create indexes for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_is_artist ON users(is_artist) WHERE is_artist = true;
CREATE INDEX IF NOT EXISTS idx_users_is_creator ON users(is_creator) WHERE is_creator = true;

-- Update creator_earnings view to use is_creator flag
DROP VIEW IF EXISTS creator_earnings;
CREATE VIEW creator_earnings AS
SELECT
    u.id AS creator_id,
    u.display_name,
    COUNT(s.id) AS total_submissions,
    COUNT(s.id) FILTER (WHERE s.review_status = 'approved') AS approved_submissions,
    COALESCE(SUM(s.views_verified), 0) AS total_verified_views,
    COALESCE(SUM(s.payout_amount_cents), 0) AS total_earned_cents
FROM users u
LEFT JOIN submissions s ON s.creator_id = u.id AND s.payout_status = 'paid'
WHERE u.is_creator = true
GROUP BY u.id, u.display_name;

-- Update creator_stats view to use is_creator flag
DROP VIEW IF EXISTS creator_stats;
CREATE VIEW creator_stats AS
SELECT
    u.id AS creator_id,
    u.display_name,
    COUNT(s.id) AS total_submissions,
    COUNT(s.id) FILTER (WHERE s.review_status = 'approved') AS approved_submissions,
    COALESCE(SUM(s.views_verified), 0) AS total_verified_views,
    COALESCE(SUM(s.payout_amount_cents), 0) AS total_earned_cents,
    CASE 
        WHEN COUNT(s.id) > 0 
        THEN ROUND(COUNT(s.id) FILTER (WHERE s.review_status = 'approved')::numeric / COUNT(s.id)::numeric, 2)
        ELSE 0
    END AS acceptance_rate
FROM users u
LEFT JOIN submissions s ON s.creator_id = u.id
WHERE u.is_creator = true
GROUP BY u.id, u.display_name;
