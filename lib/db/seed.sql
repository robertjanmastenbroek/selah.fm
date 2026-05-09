-- Selah.fm Demo Data Seeder
-- Run this to populate the platform with realistic demo data
-- Usage: psql $DATABASE_URL -f lib/db/seed.sql

-- Demo artists
INSERT INTO users (id, email, password_hash, user_type, display_name)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'artist1@selah-demo.fm', 'demo', 'artist', 'Luna Park'),
  ('00000000-0000-0000-0000-000000000002', 'artist2@selah-demo.fm', 'demo', 'artist', 'Synth Priest'),
  ('00000000-0000-0000-0000-000000000003', 'artist3@selah-demo.fm', 'demo', 'artist', 'Holy Frequencies')
ON CONFLICT DO NOTHING;

-- Demo creators
INSERT INTO users (id, email, password_hash, user_type, display_name, bio, genres, preferred_cpm_cents, tiktok_handle)
VALUES
  ('00000000-0000-0000-0000-000000000011', 'creator1@selah-demo.fm', 'demo', 'creator', 'Mia Johnson', 'TikTok creator. Music + lifestyle content. 28K followers.', 'pop,electronic', 200, '@creatormia'),
  ('00000000-0000-0000-0000-000000000012', 'creator2@selah-demo.fm', 'demo', 'creator', 'Jake Miller', 'Dance content creator. 45K followers. High engagement.', 'edm,techno', 300, '@dancewithjake'),
  ('00000000-0000-0000-0000-000000000013', 'creator3@selah-demo.fm', 'demo', 'creator', 'Rachel T', 'Lifestyle creator. Reels-focused. Worked with major labels.', 'pop,hiphop', 350, '@viralqueen'),
  ('00000000-0000-0000-0000-000000000014', 'creator4@selah-demo.fm', 'demo', 'creator', 'Tom Wells', 'YouTube Shorts creator. Music promo niche.', 'edm,techno', 250, '@shortsguy'),
  ('00000000-0000-0000-0000-000000000015', 'creator5@selah-demo.fm', 'demo', 'creator', 'Alex + Sam', 'Music reel creators. Brand partnership experience.', 'pop,electronic,indie', 400, '@reelmasters')
ON CONFLICT DO NOTHING;

-- Demo campaigns
INSERT INTO campaigns (id, artist_id, track_title, track_url, cpm_rate_cents, total_budget_cents, max_payout_per_submission_cents, budget_remaining_cents, platforms, cover_art_url, requirements, recommended_hashtags)
VALUES
  ('00000000-1000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000001',
   'Midnight Frequencies', 'https://open.spotify.com/track/demo1', 300, 50000, 10000, 50000,
   ARRAY['tiktok', 'instagram', 'youtube'],
   'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
   'Minimum 15 seconds. Must use the track as background audio. Show your face or personality.',
   '#newmusic #indiemusic #electronicmusic'),

  ('00000000-1000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000002',
   'Desert Wind', 'https://open.spotify.com/track/demo2', 250, 30000, 7500, 30000,
   ARRAY['tiktok', 'instagram'],
   'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
   'Any style — dance, lifestyle, aesthetic. High-energy content preferred.',
   '#edm #techno #newmusic'),

  ('00000000-1000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000003',
   'Summer Nights', 'https://open.spotify.com/track/demo3', 350, 40000, 8000, 40000,
   ARRAY['tiktok', 'instagram', 'youtube'],
   'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800',
   'Vibe check: sunset, road trip, beach. Any format welcome.',
   '#pop #summervibes #newmusic')
ON CONFLICT DO NOTHING;
