-- Add slug column with composite unique constraint for multi-language support
-- Slugs are manually authored in YAML, never auto-generated during import

-- Step 1: Add nullable slug column
ALTER TABLE exercises
ADD COLUMN slug TEXT;

-- Step 2: Backfill existing exercises with category-prefixed slugs
-- This guarantees uniqueness even if titles collide after normalization
UPDATE exercises
SET slug = LOWER(
  category || '-' ||
  REGEXP_REPLACE(
    REGEXP_REPLACE(title, '[^a-zA-Z0-9 -]', '', 'g'),
    ' +', '-', 'g'
  )
);

-- Step 3: Make slug required
ALTER TABLE exercises
ALTER COLUMN slug SET NOT NULL;

-- Step 4: Composite unique constraint (language, slug) for multi-language support
ALTER TABLE exercises
ADD CONSTRAINT exercises_language_slug_unique UNIQUE (language, slug);

-- Step 5: Update difficulty constraint to match design (1-3 not 1-5)
ALTER TABLE exercises
DROP CONSTRAINT IF EXISTS exercises_difficulty_check;

ALTER TABLE exercises
ADD CONSTRAINT exercises_difficulty_check CHECK (difficulty BETWEEN 1 AND 3);

-- Step 6: Add index for slug lookups
CREATE INDEX idx_exercises_slug ON exercises(slug);
CREATE INDEX idx_exercises_language_slug ON exercises(language, slug);
