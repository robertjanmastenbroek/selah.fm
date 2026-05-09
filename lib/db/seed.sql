-- Selah.fm Demo Data Seeder
-- Populates the platform with realistic demo data + beautiful images
-- Usage: psql $DATABASE_URL -f lib/db/seed.sql

-- Demo artists (no avatars needed — they use campaign covers)
INSERT INTO users (id, email, password_hash, user_type, display_name)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'artist1@selah-demo.fm', 'demo', 'artist', 'Luna Park'),
  ('00000000-0000-0000-0000-000000000002', 'artist2@selah-demo.fm', 'demo', 'artist', 'Synth Priest'),
  ('00000000-0000-0000-0000-000000000003', 'artist3@selah-demo.fm', 'demo', 'artist', 'Holy Frequencies')
ON CONFLICT DO NOTHING;

-- Demo creators with profile images
INSERT INTO users (id, email, password_hash, user_type, display_name, bio, genres, preferred_cpm_cents, tiktok_handle, instagram_handle, profile_image_url)
VALUES
  ('00000000-0000-0000-0000-000000000011', 'creator1@selah-demo.fm', 'demo', 'creator', 'Mia Johnson', 'TikTok creator. Music + lifestyle content. 28K followers.', 'pop,electronic', 200, '@creatormia', '@mia.reels', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face'),
  ('00000000-0000-0000-0000-000000000012', 'creator2@selah-demo.fm', 'demo', 'creator', 'Jake Miller', 'Dance content creator. 45K followers. High engagement.', 'edm,techno', 300, '@dancewithjake', '@jakemoves', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'),
  ('00000000-0000-0000-0000-000000000013', 'creator3@selah-demo.fm', 'demo', 'creator', 'Rachel T', 'Lifestyle creator. Reels-focused. Worked with major labels.', 'pop,hiphop', 350, '@viralqueen', '@rachelcreates', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face'),
  ('00000000-0000-0000-0000-000000000014', 'creator4@selah-demo.fm', 'demo', 'creator', 'Tom Wells', 'YouTube Shorts creator. Music promo niche.', 'edm,techno', 250, '@shortsguy', '@tomwells', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face'),
  ('00000000-0000-0000-0000-000000000015', 'creator5@selah-demo.fm', 'demo', 'creator', 'Alex + Sam', 'Music reel creators. Brand partnership experience.', 'pop,electronic,indie', 400, '@reelmasters', '@alexsamcreates', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop&crop=face')
ON CONFLICT DO NOTHING;

-- Demo campaigns with beautiful cover art
INSERT INTO campaigns (id, artist_id, track_title, track_url, cpm_rate_cents, total_budget_cents, max_payout_per_submission_cents, budget_remaining_cents, platforms, cover_art_url, requirements, recommended_hashtags)
VALUES
  ('00000000-1000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000001',
   'Midnight Frequencies', 'https://open.spotify.com/track/demo1', 300, 50000, 10000, 50000,
   ARRAY['tiktok', 'instagram', 'youtube'],
   'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
   'Minimum 15 seconds. Must use the track as background audio. Show your face or personality.',
   '#newmusic #indiemusic #electronicmusic'),

  ('00000000-1000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000002',
   'Desert Wind', 'https://open.spotify.com/track/demo2', 250, 30000, 7500, 30000,
   ARRAY['tiktok', 'instagram'],
   'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&q=80',
   'Any style — dance, lifestyle, aesthetic. High-energy content preferred.',
   '#edm #techno #newmusic'),

  ('00000000-1000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000003',
   'Summer Nights', 'https://open.spotify.com/track/demo3', 350, 40000, 8000, 40000,
   ARRAY['tiktok', 'instagram', 'youtube'],
   'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
   'Vibe check: sunset, road trip, beach. Any format welcome.',
   '#pop #summervibes #newmusic'),

  ('00000000-1000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000001',
   'Neon Cathedral', 'https://open.spotify.com/track/demo4', 400, 75000, 15000, 60000,
   ARRAY['tiktok', 'youtube'],
   'https://images.unsplash.com/photo-1598653222000-6b9b7a042652?w=800&q=80',
   'Dark, moody aesthetic. Studio headphones vibe. 30+ seconds preferred.',
   '#darkelectronic #studio #newmusic'),

  ('00000000-1000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000002',
   'Crystal Dawn', 'https://open.spotify.com/track/demo5', 200, 20000, 5000, 20000,
   ARRAY['tiktok', 'instagram', 'youtube'],
   'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80',
   'Morning vibes, coffee, sunrise. Soft and warm content.',
   '#morningvibes #organichouse #newmusic'),

  ('00000000-1000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000003',
   'Bass Cathedral', 'https://open.spotify.com/track/demo6', 500, 100000, 20000, 100000,
   ARRAY['tiktok', 'instagram'],
   'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
   'High energy. Festival vibes. Crowd shots encouraged. 15-60 seconds.',
   '#bassmusic #festival #christianedm')
ON CONFLICT DO NOTHING;
