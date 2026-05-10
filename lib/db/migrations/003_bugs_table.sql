-- Migration 003: Bug reporting system
-- Adds a bugs table for in-app bug reports, pulled periodically for DeepSeek TUI fixes.

CREATE TABLE IF NOT EXISTS bugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    steps_to_reproduce TEXT,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'fixed', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index to quickly pull new bugs
CREATE INDEX IF NOT EXISTS idx_bugs_status_new ON bugs(status, created_at) WHERE status = 'new';
