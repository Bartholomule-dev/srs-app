-- Add grading strategy fields to exercises table
-- Migration: grading_strategies

-- Add grading strategy column
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS grading_strategy TEXT;

-- Add verification script column
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS verification_script TEXT;

-- Add constraint for valid strategies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_grading_strategy'
  ) THEN
    ALTER TABLE exercises
    ADD CONSTRAINT valid_grading_strategy
    CHECK (grading_strategy IS NULL OR grading_strategy IN ('exact', 'token', 'ast', 'execution'));
  END IF;
END $$;

-- Create telemetry table for future analytics
CREATE TABLE IF NOT EXISTS grading_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_slug TEXT NOT NULL REFERENCES exercises(slug),
  strategy TEXT NOT NULL,
  was_correct BOOLEAN NOT NULL,
  fallback_used BOOLEAN DEFAULT FALSE,
  fallback_reason TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_grading_telemetry_slug ON grading_telemetry(exercise_slug);
CREATE INDEX IF NOT EXISTS idx_grading_telemetry_created ON grading_telemetry(created_at);
CREATE INDEX IF NOT EXISTS idx_grading_telemetry_user ON grading_telemetry(user_id);

-- Enable RLS on telemetry table
ALTER TABLE grading_telemetry ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own telemetry
DROP POLICY IF EXISTS "Users can insert own telemetry" ON grading_telemetry;
CREATE POLICY "Users can insert own telemetry"
ON grading_telemetry FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own telemetry
DROP POLICY IF EXISTS "Users can view own telemetry" ON grading_telemetry;
CREATE POLICY "Users can view own telemetry"
ON grading_telemetry FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Comment on new columns
COMMENT ON COLUMN exercises.grading_strategy IS 'Override grading strategy: exact, token, ast, or execution';
COMMENT ON COLUMN exercises.verification_script IS 'Python assertion script for execution strategy verification';
