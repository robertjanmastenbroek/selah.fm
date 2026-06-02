-- ═══════════════════════════════════════════════════════════════
-- Phase 0: Social Layer Database Migrations
-- Part 2: Data migrations — backfill artist_profiles, clean slugs
-- ═══════════════════════════════════════════════════════════════

-- 0F. Backfill artist_profiles for discovered_artists without one
INSERT INTO artist_profiles (artist_id, slug, created_at)
SELECT da.id,
  LOWER(REGEXP_REPLACE(da.artist_name, '[^a-z0-9]+', '-', 'g')) || '-' || SUBSTRING(da.id::text, 1, 6),
  NOW()
FROM discovered_artists da
WHERE NOT EXISTS (SELECT 1 FROM artist_profiles ap WHERE ap.artist_id = da.id)
ON CONFLICT DO NOTHING;

-- 0G. Sanitize existing slugs — remove UUID-style slugs like 'artist-709772'
-- Keep human-readable slugs, regenerate machine-generated ones
UPDATE artist_profiles ap
SET slug = LOWER(REGEXP_REPLACE(
  (SELECT artist_name FROM discovered_artists WHERE id = ap.artist_id),
  '[^a-z0-9]+', '-', 'g'
)) || '-' || SUBSTRING(ap.artist_id::text, 1, 6)
WHERE ap.slug LIKE 'artist-%' OR ap.slug ~ '^[a-z]+-[a-f0-9]{6}$' = false;

-- Handle slug collisions by appending a counter suffix
UPDATE artist_profiles ap
SET slug = ap.slug || '-' || SUBSTRING(ap.artist_id::text, 1, 4)
WHERE EXISTS (
  SELECT 1 FROM artist_profiles ap2
  WHERE ap2.artist_id != ap.artist_id AND ap2.slug = ap.slug
);
