-- Migration 007: SEO keyword buckets + campaign slug
CREATE TABLE keyword_buckets (
    id          SERIAL PRIMARY KEY,
    bucket_name TEXT NOT NULL,           -- creator, fan, genre, mood
    keyword_text TEXT NOT NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_kw_bucket ON keyword_buckets(bucket_name);

-- Seed keyword data
INSERT INTO keyword_buckets (bucket_name, keyword_text) VALUES
-- Creator intent
('creator', 'earn money making tiktoks'),
('creator', 'get paid to promote music'),
('creator', 'make money with tiktok songs'),
('creator', 'tiktok creator fund alternative'),
('creator', 'submit video earn cash'),
('creator', 'paid per view music promotion'),
('creator', 'ugc music monetization'),
('creator', 'music video contest earn money'),
('creator', 'earn per view'),
('creator', 'make money posting music videos'),
-- Fan intent
('fan', 'support independent music'),
('fan', 'donate to artist'),
('fan', 'help promote song'),
('fan', 'fan funding music'),
('fan', 'support new release'),
('fan', 'fund music video'),
('fan', 'share music campaign'),
('fan', 'donate to music project'),
('fan', 'support artist new single'),
('fan', 'promote independent artist'),
-- Genre modifiers
('genre', 'afro house music promotion'),
('genre', 'indie folk video contest'),
('genre', 'lofi hip hop submission'),
('genre', 'meditation music earn'),
('genre', 'electronic music promotion'),
('genre', 'pop music video contest'),
('genre', 'hip hop promotion campaign'),
('genre', 'rnb video submission earn'),
('genre', 'rock music promotion'),
('genre', 'jazz music video earn'),
-- Mood/instrument modifiers
('mood', 'upbeat music promotion'),
('mood', 'calming music video earn'),
('mood', 'energetic track promotion'),
('mood', 'melancholic song support'),
('mood', 'acoustic guitar promotion'),
('mood', 'piano music video contest'),
('mood', 'synth track earn'),
('mood', 'chill music promotion');

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_slug ON campaigns(slug) WHERE slug IS NOT NULL;
