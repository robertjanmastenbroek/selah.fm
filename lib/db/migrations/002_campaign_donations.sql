-- Migration: campaign_donations table
-- Lets fans donate to artist campaigns — crowdfunding for music promotion

CREATE TABLE IF NOT EXISTS campaign_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  donor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  donor_name TEXT,
  message TEXT,
  anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_campaign ON campaign_donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON campaign_donations(donor_id);
