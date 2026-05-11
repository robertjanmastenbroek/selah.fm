-- Migration 009: Set all existing users to dual-role by default
-- Everyone should be able to both create campaigns AND submit to them.

UPDATE users SET is_artist = true, is_creator = true
WHERE is_artist = false OR is_creator = false;
