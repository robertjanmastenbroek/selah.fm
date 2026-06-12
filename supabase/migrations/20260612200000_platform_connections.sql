-- Platform connections — shared by creators + artists
-- One row per (user, platform). Role distinguishes use case.
CREATE TABLE IF NOT EXISTS public.platform_connections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform        TEXT NOT NULL CHECK (platform IN ('tiktok', 'youtube', 'instagram')),
    role            TEXT NOT NULL CHECK (role IN ('creator', 'artist')),
    platform_user_id TEXT,
    platform_username TEXT,
    access_token    TEXT,
    refresh_token   TEXT,
    token_expires_at TIMESTAMPTZ,
    avatar_url      TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_platform_connections_user
    ON public.platform_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_connections_platform
    ON public.platform_connections(platform);
