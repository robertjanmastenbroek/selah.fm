-- Add signup source tracking to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS signup_source TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS signup_referrer TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS signup_utm_source TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS signup_utm_medium TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS signup_utm_campaign TEXT;
