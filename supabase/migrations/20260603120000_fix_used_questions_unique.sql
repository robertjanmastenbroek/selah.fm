-- Add missing unique constraint on used_questions.normalized_text
-- The pipeline's ON CONFLICT (normalized_text) DO NOTHING requires this.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_used_questions_normalized_unique
  ON public.used_questions(normalized_text);

-- Also add unique constraint on voice_chunks for the same reason
-- (pipeline inserts voice chunks per interview)
CREATE INDEX IF NOT EXISTS idx_voice_chunks_interview
  ON public.voice_chunks(interview_id);
