-- Add language column to exercise_attempts for multi-language support
-- This allows tracking exercise attempts per language (e.g., same exercise slug
-- in Python and JavaScript are tracked separately)

-- Add language column with default 'python' for existing records
ALTER TABLE exercise_attempts
  ADD COLUMN language TEXT NOT NULL DEFAULT 'python';

-- Drop old unique constraint (user_id, exercise_slug)
ALTER TABLE exercise_attempts
  DROP CONSTRAINT IF EXISTS exercise_attempts_user_id_exercise_slug_key;

-- Add new unique constraint including language
-- This allows the same exercise_slug to exist for different languages
ALTER TABLE exercise_attempts
  ADD CONSTRAINT exercise_attempts_user_language_exercise_key
    UNIQUE(user_id, language, exercise_slug);

-- Update index for language-filtered queries
DROP INDEX IF EXISTS idx_exercise_attempts_user_exercise;
CREATE INDEX idx_exercise_attempts_user_language_exercise
  ON exercise_attempts(user_id, language, exercise_slug);

-- Add index for filtering by user and language (for getting all attempts in a language)
CREATE INDEX idx_exercise_attempts_user_language
  ON exercise_attempts(user_id, language);
