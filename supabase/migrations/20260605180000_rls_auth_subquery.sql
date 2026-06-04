-- Fix RLS policies: wrap auth.*() in subqueries for performance
-- auth.uid(), auth.jwt(), auth.email() now use (select auth.*()) to
-- evaluate ONCE per query instead of once per row.

BEGIN;

ALTER POLICY "Authenticated users can read analytics_events" ON public.analytics_events USING (((select auth.uid()) IS NOT NULL));
ALTER POLICY "Users can delete own follows" ON public.artist_follows USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can insert own follows" ON public.artist_follows WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can read own follows" ON public.artist_follows USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can read own bugs" ON public.bugs USING ((user_id = (select auth.uid())));
ALTER POLICY "Users can report bugs" ON public.bugs WITH CHECK (((select auth.uid()) IS NOT NULL));
ALTER POLICY "Authenticated users can donate" ON public.campaign_donations WITH CHECK (((select auth.uid()) IS NOT NULL));
ALTER POLICY "Admins can manage all campaigns" ON public.campaigns USING ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.email = ANY (ARRAY['your-admin@email.com'::text]))))));
ALTER POLICY "Artists can manage own campaigns" ON public.campaigns USING ((artist_id = (select auth.uid())));
ALTER POLICY "Authenticated users can create reviews" ON public.fan_reviews WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can update own reviews" ON public.fan_reviews USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can update own reviews" ON public.fan_reviews WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can read own messages" ON public.messages USING (((sender_id = (select auth.uid())) OR (receiver_id = (select auth.uid()))));
ALTER POLICY "Users can send messages" ON public.messages WITH CHECK ((sender_id = (select auth.uid())));
ALTER POLICY "Users can read own notifications" ON public.notifications USING ((user_id = (select auth.uid())));
ALTER POLICY "Users can update own notifications" ON public.notifications USING ((user_id = (select auth.uid())));
ALTER POLICY "Creators can read own payouts" ON public.payouts USING ((creator_id = (select auth.uid())));
ALTER POLICY "Admins can manage all ratings" ON public.ratings USING ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.email = ANY (ARRAY['motomotosings@gmail.com'::text]))))));
ALTER POLICY "Creators can create ratings for own submissions" ON public.ratings WITH CHECK ((EXISTS ( SELECT 1
   FROM submissions
  WHERE ((submissions.id = ratings.submission_id) AND (submissions.creator_id = (select auth.uid()))))));
ALTER POLICY "Users can read own referrals" ON public.referrals USING ((referrer_id = (select auth.uid())));
ALTER POLICY "Admins can manage all submissions" ON public.submissions USING ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.email = ANY (ARRAY['your-admin@email.com'::text]))))));
ALTER POLICY "Artists can read submissions on their campaigns" ON public.submissions USING ((EXISTS ( SELECT 1
   FROM campaigns
  WHERE ((campaigns.id = submissions.campaign_id) AND (campaigns.artist_id = (select auth.uid()))))));
ALTER POLICY "Creators can manage own submissions" ON public.submissions USING ((creator_id = (select auth.uid())));
ALTER POLICY "Admins can read all users" ON public.users USING ((EXISTS ( SELECT 1
   FROM users users_1
  WHERE ((users_1.id = (select auth.uid())) AND (users_1.email = ANY (ARRAY['your-admin@email.com'::text]))))));
ALTER POLICY "Users can read own profile" ON public.users USING (((select auth.uid()) = id));
ALTER POLICY "Users can update own profile" ON public.users USING (((select auth.uid()) = id));
ALTER POLICY "Admins can read all view_snapshots" ON public.view_snapshots USING ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = (select auth.uid())) AND (users.email = ANY (ARRAY['motomotosings@gmail.com'::text]))))));
ALTER POLICY "Artists can read snapshots on their campaigns" ON public.view_snapshots USING ((EXISTS ( SELECT 1
   FROM (submissions s
     JOIN campaigns c ON ((c.id = s.campaign_id)))
  WHERE ((s.id = view_snapshots.submission_id) AND (c.artist_id = (select auth.uid()))))));
ALTER POLICY "Creators can read own view snapshots" ON public.view_snapshots USING ((EXISTS ( SELECT 1
   FROM submissions
  WHERE ((submissions.id = view_snapshots.submission_id) AND (submissions.creator_id = (select auth.uid()))))));

COMMIT;
