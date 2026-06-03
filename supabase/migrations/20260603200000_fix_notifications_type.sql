-- Fix notifications CHECK constraint — add 'message' type
-- The messages route creates notifications with type='message' but
-- the CHECK constraint only allowed submission/approval/rejection/earning/payout/system

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('submission', 'approval', 'rejection', 'earning', 'payout', 'system', 'message', 'comment', 'reaction', 'donation'));
