-- Add dominant_color to artist_profiles for dynamic gradient backgrounds
ALTER TABLE artist_profiles ADD COLUMN IF NOT EXISTS dominant_color TEXT;
