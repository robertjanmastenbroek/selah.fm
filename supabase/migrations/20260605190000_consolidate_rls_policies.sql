-- Consolidate duplicate permissive RLS policies into single policies per action.
-- PostgreSQL evaluates ALL matching policies (OR logic) — multiple policies
-- for the same role+action add overhead. Consolidating eliminates that.
--
-- Admin emails are consolidated to use motomotosings@gmail.com everywhere
-- (was split between 'your-admin@email.com' and 'motomotosings@gmail.com').

BEGIN;

-- ═══════════════════════════════════════════════════════════════
-- campaigns [ALL]
-- Previously: Admins can manage all campaigns + Artists can manage own campaigns
-- Now: Single policy with OR
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Admins can manage all campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Artists can manage own campaigns" ON public.campaigns;

CREATE POLICY "Artists and admins can manage campaigns"
  ON public.campaigns FOR ALL
  USING (
    artist_id = (select auth.uid())
    OR (select auth.uid()) IN (SELECT id FROM users WHERE email = 'motomotosings@gmail.com')
  );

-- ═══════════════════════════════════════════════════════════════
-- submissions [ALL]
-- Previously: Admins can manage all submissions + Creators can manage own submissions
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Admins can manage all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Creators can manage own submissions" ON public.submissions;

CREATE POLICY "Creators and admins can manage submissions"
  ON public.submissions FOR ALL
  USING (
    creator_id = (select auth.uid())
    OR (select auth.uid()) IN (SELECT id FROM users WHERE email = 'motomotosings@gmail.com')
  );

-- ═══════════════════════════════════════════════════════════════
-- users [SELECT]
-- Previously: Admins can read all users + Users can read own profile
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;

CREATE POLICY "Users and admins can read users"
  ON public.users FOR SELECT
  USING (
    (select auth.uid()) = id
    OR (select auth.uid()) IN (SELECT id FROM users WHERE email = 'motomotosings@gmail.com')
  );

-- ═══════════════════════════════════════════════════════════════
-- view_snapshots [SELECT]
-- Previously: 3 policies (Admins + Artists + Creators)
-- Now: Single policy with OR
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Admins can read all view_snapshots" ON public.view_snapshots;
DROP POLICY IF EXISTS "Artists can read snapshots on their campaigns" ON public.view_snapshots;
DROP POLICY IF EXISTS "Creators can read own view snapshots" ON public.view_snapshots;

CREATE POLICY "Users and admins can read view_snapshots"
  ON public.view_snapshots FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM submissions WHERE id = view_snapshots.submission_id AND creator_id = (select auth.uid()))
    OR EXISTS (SELECT 1 FROM submissions s JOIN campaigns c ON c.id = s.campaign_id WHERE s.id = view_snapshots.submission_id AND c.artist_id = (select auth.uid()))
    OR (select auth.uid()) IN (SELECT id FROM users WHERE email = 'motomotosings@gmail.com')
  );

-- ═══════════════════════════════════════════════════════════════
-- Cleanup unused admin placeholder
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Admins can manage all ratings" ON public.ratings;
DROP POLICY IF EXISTS "Admins can manage all campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can manage all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can read all view_snapshots" ON public.view_snapshots;

COMMIT;
