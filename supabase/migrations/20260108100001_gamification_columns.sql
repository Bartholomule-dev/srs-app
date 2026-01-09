-- Add gamification columns to profiles and exercise_attempts
-- Part of Phase 3.1: Gamification Foundation

-- === PROFILES TABLE ===

-- Streak freezes (earned protection tokens)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_freezes INTEGER DEFAULT 0
  CHECK (streak_freezes >= 0 AND streak_freezes <= 2);

-- When the last freeze was earned (prevents farming)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_freeze_earned_at TIMESTAMPTZ;

-- Last activity date in user's timezone (for streak calculation)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- Comments for documentation
COMMENT ON COLUMN profiles.streak_freezes IS
  'Number of streak freeze tokens available (0-2)';
COMMENT ON COLUMN profiles.last_freeze_earned_at IS
  'Timestamp when last streak freeze was earned';
COMMENT ON COLUMN profiles.last_activity_date IS
  'Last practice date in user timezone (for streak tracking)';

-- === EXERCISE_ATTEMPTS TABLE ===

-- Points earned for this attempt (computed server-side)
ALTER TABLE exercise_attempts ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0
  CHECK (points_earned >= 0);

-- Timezone offset for date calculations
ALTER TABLE exercise_attempts ADD COLUMN IF NOT EXISTS timezone_offset_minutes INTEGER;

-- Whether the answer was correct
ALTER TABLE exercise_attempts ADD COLUMN IF NOT EXISTS is_correct BOOLEAN;

-- FSRS rating (1-4)
ALTER TABLE exercise_attempts ADD COLUMN IF NOT EXISTS rating SMALLINT
  CHECK (rating >= 1 AND rating <= 4);

-- Whether this was the first attempt for this exercise
ALTER TABLE exercise_attempts ADD COLUMN IF NOT EXISTS is_first_attempt BOOLEAN DEFAULT true;

-- Comments for documentation
COMMENT ON COLUMN exercise_attempts.points_earned IS
  'Points earned for this attempt (computed server-side)';
COMMENT ON COLUMN exercise_attempts.timezone_offset_minutes IS
  'Client timezone offset in minutes (e.g., -300 for EST)';
COMMENT ON COLUMN exercise_attempts.is_correct IS
  'Whether the answer was correct';
COMMENT ON COLUMN exercise_attempts.rating IS
  'FSRS rating (1=Again, 2=Hard, 3=Good, 4=Easy)';
COMMENT ON COLUMN exercise_attempts.is_first_attempt IS
  'Whether this was the first attempt for this exercise';

-- === INDEXES ===

-- Index for points-based queries (leaderboards, point history)
CREATE INDEX IF NOT EXISTS idx_attempts_points ON exercise_attempts(user_id, points_earned);

-- Index for correctness-based queries (accuracy stats)
CREATE INDEX IF NOT EXISTS idx_attempts_is_correct ON exercise_attempts(user_id, is_correct);
