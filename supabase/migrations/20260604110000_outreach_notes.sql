-- Add notes column to outreach_log (required by outreach-followup cron)
ALTER TABLE public.outreach_log ADD COLUMN IF NOT EXISTS notes text;
