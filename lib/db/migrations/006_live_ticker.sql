-- Migration 006: Live ticker events table
CREATE TABLE live_ticker_events (
    id          SERIAL PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id),
    event_type  TEXT NOT NULL CHECK (event_type IN ('donation_received', 'video_submitted')),
    payload     JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticker_campaign_time ON live_ticker_events(campaign_id, created_at DESC);
