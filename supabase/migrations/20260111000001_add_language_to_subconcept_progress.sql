-- Add language column to subconcept_progress for multi-language support
-- Defaults to 'python' to migrate existing data automatically

-- Add language column with default 'python' for existing data
ALTER TABLE subconcept_progress
  ADD COLUMN language TEXT NOT NULL DEFAULT 'python';

-- Drop old unique constraint
ALTER TABLE subconcept_progress
  DROP CONSTRAINT IF EXISTS subconcept_progress_user_id_subconcept_slug_key;

-- Add new unique constraint including language
ALTER TABLE subconcept_progress
  ADD CONSTRAINT subconcept_progress_user_language_subconcept_key
    UNIQUE(user_id, language, subconcept_slug);

-- Index for language-filtered due queries (most common access pattern)
CREATE INDEX idx_subconcept_progress_due_by_language
  ON subconcept_progress(user_id, language, next_review);

-- Index for user + language lookups
CREATE INDEX idx_subconcept_progress_user_language
  ON subconcept_progress(user_id, language);

-- Comment on new column
COMMENT ON COLUMN subconcept_progress.language IS 'Programming language for this progress record (python, javascript, etc.)';
