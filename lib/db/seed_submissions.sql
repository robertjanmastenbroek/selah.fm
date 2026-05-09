-- Selah.fm Demo Submissions Seeder
-- Populates submissions with varied statuses for a realistic-looking platform
-- Run AFTER seed.sql to have users and campaigns in place
-- Usage: psql $DATABASE_URL -f lib/db/seed_submissions.sql

-- Submissions for Midnight Frequencies (campaign 00000000-1000-4000-8000-000000000001)
-- Mix of pending, approved, and paid
INSERT INTO submissions (campaign_id, creator_id, content_url, platform, review_status, payout_status, views_verified, payout_amount_cents, views_at_submit, submitted_at, reviewed_at)
VALUES
  -- Pending submissions (awaiting review)
  ('00000000-1000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000011', 'https://tiktok.com/@creatormia/video/demo1', 'tiktok', 'pending', 'pending', 3200, NULL, 3200, NOW() - INTERVAL '2 hours', NULL),
  ('00000000-1000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000012', 'https://tiktok.com/@dancewithjake/video/demo2', 'tiktok', 'pending', 'pending', 8900, NULL, 8900, NOW() - INTERVAL '1 hour', NULL),
  
  -- Approved (awaiting payout)
  ('00000000-1000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000013', 'https://instagram.com/reel/demo3', 'instagram', 'approved', 'processing', 12400, 2976, 12400, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
  
  -- Paid (completed)
  ('00000000-1000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000011', 'https://tiktok.com/@creatormia/video/demo4', 'tiktok', 'approved', 'paid', 28500, 6840, 28500, NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days'),
  ('00000000-1000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000014', 'https://youtube.com/shorts/demo5', 'youtube', 'approved', 'paid', 15200, 3648, 15200, NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),
  
  -- Rejected
  ('00000000-1000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000015', 'https://tiktok.com/@reelmasters/video/demo6', 'tiktok', 'rejected', 'pending', 2100, NULL, 2100, NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- Update campaign budget_remaining for paid submissions
UPDATE campaigns 
SET budget_remaining_cents = budget_remaining_cents - 10488
WHERE id = '00000000-1000-4000-8000-000000000001' 
  AND budget_remaining_cents = total_budget_cents;

-- Submissions for Desert Wind (campaign 00000000-1000-4000-8000-000000000002)
INSERT INTO submissions (campaign_id, creator_id, content_url, platform, review_status, payout_status, views_verified, payout_amount_cents, views_at_submit, submitted_at, reviewed_at)
VALUES
  ('00000000-1000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000012', 'https://tiktok.com/@dancewithjake/video/demo7', 'tiktok', 'pending', 'pending', 5600, NULL, 5600, NOW() - INTERVAL '30 minutes', NULL),
  ('00000000-1000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000014', 'https://youtube.com/shorts/demo8', 'youtube', 'approved', 'paid', 22300, 4460, 22300, NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 days'),
  ('00000000-1000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000011', 'https://instagram.com/reel/demo9', 'instagram', 'approved', 'paid', 9100, 1820, 9100, NOW() - INTERVAL '8 days', NOW() - INTERVAL '6 days')
ON CONFLICT DO NOTHING;

UPDATE campaigns 
SET budget_remaining_cents = budget_remaining_cents - 6280
WHERE id = '00000000-1000-4000-8000-000000000002' 
  AND budget_remaining_cents = total_budget_cents;

-- Submissions for Summer Nights (campaign 00000000-1000-4000-8000-000000000003)
INSERT INTO submissions (campaign_id, creator_id, content_url, platform, review_status, payout_status, views_verified, payout_amount_cents, views_at_submit, submitted_at, reviewed_at)
VALUES
  ('00000000-1000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000013', 'https://tiktok.com/@viralqueen/video/demo10', 'tiktok', 'approved', 'paid', 45100, 12628, 45100, NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days'),
  ('00000000-1000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000015', 'https://tiktok.com/@reelmasters/video/demo11', 'tiktok', 'approved', 'paid', 18300, 5124, 18300, NOW() - INTERVAL '9 days', NOW() - INTERVAL '7 days'),
  ('00000000-1000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000012', 'https://tiktok.com/@dancewithjake/video/demo12', 'tiktok', 'pending', 'pending', 12500, NULL, 12500, NOW() - INTERVAL '4 hours', NULL)
ON CONFLICT DO NOTHING;

UPDATE campaigns 
SET budget_remaining_cents = budget_remaining_cents - 17752
WHERE id = '00000000-1000-4000-8000-000000000003' 
  AND budget_remaining_cents = total_budget_cents;
