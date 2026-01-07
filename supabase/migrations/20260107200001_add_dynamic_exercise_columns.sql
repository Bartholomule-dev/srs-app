-- Add dynamic exercise columns to exercises table
-- These columns enable parameterized exercises with two-pass grading

-- Generator name for dynamic exercises (references TypeScript generator)
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS generator TEXT;

-- Target construct for two-pass grading (checks if user used specific construct)
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS target_construct JSONB;

-- Execution verification flag (opt-in Pyodide verification for write exercises)
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS verify_by_execution BOOLEAN DEFAULT FALSE;

-- Index for finding dynamic exercises
CREATE INDEX IF NOT EXISTS idx_exercises_generator
  ON exercises(generator)
  WHERE generator IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN exercises.generator IS
  'TypeScript generator name for parameterized exercises (e.g., slice-bounds)';
COMMENT ON COLUMN exercises.target_construct IS
  'JSONB with type and feedback for two-pass grading construct checking';
COMMENT ON COLUMN exercises.verify_by_execution IS
  'Whether to verify answer by Pyodide execution (default: string matching)';
