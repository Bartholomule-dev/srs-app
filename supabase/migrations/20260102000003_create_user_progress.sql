-- Create user_progress table
-- Stores SRS state for each user-exercise pair

CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,

  -- SRS State (SM-2 algorithm)
  ease_factor DECIMAL(3,2) DEFAULT 2.50 CHECK (ease_factor >= 1.30 AND ease_factor <= 3.00),
  interval INTEGER DEFAULT 0 CHECK (interval >= 0),
  repetitions INTEGER DEFAULT 0 CHECK (repetitions >= 0),

  -- Scheduling
  next_review TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed TIMESTAMPTZ,

  -- Stats
  times_seen INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, exercise_id)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON user_progress FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_user_progress_due ON user_progress(user_id, next_review);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
