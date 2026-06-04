-- Create support_chats table for support widget conversation logging
CREATE TABLE IF NOT EXISTS public.support_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_message TEXT NOT NULL,
    bot_reply TEXT,
    reply_source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_support_chats_created ON public.support_chats(created_at DESC);

-- RLS: service_role only (cron/admin)
ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;

-- Allow service_role (cron) full access
CREATE POLICY "Service role full access"
  ON public.support_chats
  USING (true)
  WITH CHECK (true);
