-- Typing indicators for real-time chat
CREATE TABLE IF NOT EXISTS typing_indicators (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  conversation_with UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expired_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '5 seconds'
);

CREATE INDEX IF NOT EXISTS idx_typing_conversation ON typing_indicators(conversation_with);
