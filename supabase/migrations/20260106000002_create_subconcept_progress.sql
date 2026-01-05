-- Subconcept-level SRS tracking (replaces exercise-level for scheduling)
CREATE TABLE subconcept_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subconcept_slug TEXT NOT NULL,
  concept_slug TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'learning' CHECK (phase IN ('learning', 'review')),
  ease_factor REAL NOT NULL DEFAULT 2.5 CHECK (ease_factor >= 1.3 AND ease_factor <= 3.0),
  interval INTEGER NOT NULL DEFAULT 0,
  next_review TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reviewed TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, subconcept_slug)
);

-- Indexes for efficient querying
CREATE INDEX idx_subconcept_progress_user_id ON subconcept_progress(user_id);
CREATE INDEX idx_subconcept_progress_next_review ON subconcept_progress(next_review);
CREATE INDEX idx_subconcept_progress_concept ON subconcept_progress(concept_slug);
-- Composite index for due items query (user_id, next_review)
-- Note: Partial index with NOW() not possible (non-immutable), but this index
-- efficiently supports queries like: WHERE user_id = ? AND next_review <= NOW()
CREATE INDEX idx_subconcept_progress_due ON subconcept_progress(user_id, next_review);

-- RLS policies
ALTER TABLE subconcept_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subconcept progress"
  ON subconcept_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subconcept progress"
  ON subconcept_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subconcept progress"
  ON subconcept_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_subconcept_progress_updated_at
  BEFORE UPDATE ON subconcept_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
