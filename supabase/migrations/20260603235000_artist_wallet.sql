-- Artist Wallet system: replace per-track funding with artist-level balance

-- 1. Add balance to artist_profiles
ALTER TABLE artist_profiles ADD COLUMN IF NOT EXISTS balance_cents INTEGER DEFAULT 0;
ALTER TABLE artist_profiles ADD COLUMN IF NOT EXISTS lifetime_deposits_cents INTEGER DEFAULT 0;

-- 2. Create transaction history
CREATE TABLE IF NOT EXISTS artist_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES discovered_artists(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'payout', 'withdrawal', 'refund')),
  description TEXT,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_artist_transactions_artist ON artist_transactions(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_transactions_created ON artist_transactions(created_at DESC);

-- 3. Make campaign budget columns nullable (they become optional — legacy per-track budgets)
ALTER TABLE campaigns ALTER COLUMN total_budget_cents DROP NOT NULL;
ALTER TABLE campaigns ALTER COLUMN budget_remaining_cents DROP NOT NULL;
ALTER TABLE campaigns ALTER COLUMN max_payout_per_submission_cents DROP NOT NULL;
ALTER TABLE campaigns ALTER COLUMN stripe_payment_intent_id DROP NOT NULL;

-- 4. Migrate existing campaign budgets to artist balance
-- Sum up all campaign budgets per artist, set as initial balance
UPDATE artist_profiles ap
SET balance_cents = COALESCE((
  SELECT SUM(cc.total) FROM (
    SELECT da.id as artist_id, COALESCE(SUM(c.total_budget_cents), 0) as total
    FROM campaigns c
    JOIN campaign_claims cc ON cc.campaign_id = c.id
    JOIN discovered_artists da ON da.id = cc.discovered_artist_id
    WHERE da.id = ap.artist_id
    GROUP BY da.id
  ) cc
), 0),
lifetime_deposits_cents = COALESCE((
  SELECT SUM(cc.total) FROM (
    SELECT da.id as artist_id, COALESCE(SUM(c.total_budget_cents), 0) as total
    FROM campaigns c
    JOIN campaign_claims cc ON cc.campaign_id = c.id
    JOIN discovered_artists da ON da.id = cc.discovered_artist_id
    WHERE da.id = ap.artist_id
    GROUP BY da.id
  ) cc
), 0);

-- Record migration transactions for existing budgets
INSERT INTO artist_transactions (artist_id, amount_cents, type, description)
SELECT ap.artist_id, ap.balance_cents, 'deposit', 'Initial balance from campaign budgets'
FROM artist_profiles ap
WHERE ap.balance_cents > 0;
