-- Dynamic Exercise Metrics Schema
-- Extends exercise_attempts and adds transfer assessment tracking

-- === Extend exercise_attempts table ===

-- Generated parameters stored as JSONB
ALTER TABLE exercise_attempts
ADD COLUMN IF NOT EXISTS generated_params JSONB;

-- Seed used for parameter generation (for reproducibility)
ALTER TABLE exercise_attempts
ADD COLUMN IF NOT EXISTS seed VARCHAR(64);

-- Grading method used (string, execution, execution-fallback)
ALTER TABLE exercise_attempts
ADD COLUMN IF NOT EXISTS grading_method VARCHAR(20);

-- Whether user used the target construct (Pass 2)
ALTER TABLE exercise_attempts
ADD COLUMN IF NOT EXISTS used_target_construct BOOLEAN;

-- Whether coaching feedback was shown
ALTER TABLE exercise_attempts
ADD COLUMN IF NOT EXISTS coaching_shown BOOLEAN DEFAULT FALSE;

-- Response time in milliseconds
ALTER TABLE exercise_attempts
ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;

-- Whether hints were used
ALTER TABLE exercise_attempts
ADD COLUMN IF NOT EXISTS hint_used BOOLEAN DEFAULT FALSE;

-- Quality score assigned (0-5)
ALTER TABLE exercise_attempts
ADD COLUMN IF NOT EXISTS quality_score SMALLINT;

-- Timestamp of this specific attempt
ALTER TABLE exercise_attempts
ADD COLUMN IF NOT EXISTS attempted_at TIMESTAMPTZ DEFAULT NOW();

-- === Create transfer_assessments table ===
-- Tracks performance on novel exercises for near-transfer measurement

CREATE TABLE IF NOT EXISTS transfer_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subconcept_slug TEXT NOT NULL,
  exercise_slug TEXT NOT NULL,
  was_correct BOOLEAN NOT NULL,
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Context about user's prior practice
  practice_count INTEGER NOT NULL,
  last_practice_at TIMESTAMPTZ,

  -- Optional: grading details
  grading_method VARCHAR(20),
  response_time_ms INTEGER
);

-- Indexes for transfer_assessments
CREATE INDEX IF NOT EXISTS idx_transfer_user_subconcept
  ON transfer_assessments(user_id, subconcept_slug);
CREATE INDEX IF NOT EXISTS idx_transfer_assessed_at
  ON transfer_assessments(assessed_at);
CREATE INDEX IF NOT EXISTS idx_transfer_subconcept
  ON transfer_assessments(subconcept_slug);

-- RLS for transfer_assessments
ALTER TABLE transfer_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transfer assessments"
  ON transfer_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transfer assessments"
  ON transfer_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- === Add indexes for exercise_attempts queries ===
CREATE INDEX IF NOT EXISTS idx_attempts_grading_method
  ON exercise_attempts(grading_method);
CREATE INDEX IF NOT EXISTS idx_attempts_used_construct
  ON exercise_attempts(used_target_construct)
  WHERE used_target_construct IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attempts_coaching
  ON exercise_attempts(coaching_shown)
  WHERE coaching_shown = TRUE;
CREATE INDEX IF NOT EXISTS idx_attempts_attempted_at
  ON exercise_attempts(attempted_at);

-- === Comments for documentation ===
COMMENT ON COLUMN exercise_attempts.generated_params IS
  'JSONB of parameters generated for this dynamic exercise instance';
COMMENT ON COLUMN exercise_attempts.seed IS
  'Deterministic seed used to generate params (for debugging/reproducibility)';
COMMENT ON COLUMN exercise_attempts.grading_method IS
  'How answer was graded: string, execution, execution-fallback';
COMMENT ON COLUMN exercise_attempts.used_target_construct IS
  'Whether user used target construct (Pass 2). NULL if no target defined.';
COMMENT ON COLUMN exercise_attempts.coaching_shown IS
  'Whether coaching feedback was displayed for this attempt';

COMMENT ON TABLE transfer_assessments IS
  'Tracks performance on novel exercises for measuring near-transfer';
COMMENT ON COLUMN transfer_assessments.practice_count IS
  'Number of times user practiced this subconcept before assessment';
