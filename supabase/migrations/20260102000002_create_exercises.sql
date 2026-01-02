-- Create exercises table
-- Stores exercise content and metadata

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content classification
  language TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),

  -- Exercise content
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  expected_answer TEXT NOT NULL,
  hints JSONB DEFAULT '[]',
  explanation TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Aggregate stats
  times_practiced INTEGER DEFAULT 0,
  avg_success_rate DECIMAL(3,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises are public read for authenticated users
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exercises are readable by authenticated users"
  ON exercises FOR SELECT
  TO authenticated
  USING (true);

-- Performance indexes
CREATE INDEX idx_exercises_language ON exercises(language);
CREATE INDEX idx_exercises_language_category ON exercises(language, category);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX idx_exercises_tags ON exercises USING GIN(tags);

-- Updated_at trigger
CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
