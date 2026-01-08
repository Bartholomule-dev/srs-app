-- Drop legacy user_progress table
-- This table was used for per-exercise SRS tracking in Phase 1 (SM-2 algorithm)
-- Phase 2 migrated to concept-based SRS using subconcept_progress and exercise_attempts tables

-- Drop RLS policies first
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can delete their own progress" ON user_progress;

-- Drop the table
DROP TABLE IF EXISTS user_progress;
