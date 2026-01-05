-- Add taxonomy columns to exercises table for concept-based SRS

-- Add new taxonomy columns to exercises table
ALTER TABLE exercises
ADD COLUMN concept TEXT,
ADD COLUMN subconcept TEXT,
ADD COLUMN level TEXT CHECK (level IN ('intro', 'practice', 'edge', 'integrated')),
ADD COLUMN prereqs TEXT[] DEFAULT '{}',
ADD COLUMN exercise_type TEXT DEFAULT 'write' CHECK (exercise_type IN ('write', 'fill-in', 'predict', 'debug')),
ADD COLUMN pattern TEXT,
ADD COLUMN template TEXT,
ADD COLUMN blank_position INTEGER;

-- Create index for concept-based queries
CREATE INDEX idx_exercises_concept ON exercises(concept);
CREATE INDEX idx_exercises_subconcept ON exercises(subconcept);
CREATE INDEX idx_exercises_concept_subconcept ON exercises(concept, subconcept);

-- Comment for documentation
COMMENT ON COLUMN exercises.concept IS 'Primary milestone/concept slug';
COMMENT ON COLUMN exercises.subconcept IS 'Specific skill within concept';
COMMENT ON COLUMN exercises.level IS 'Difficulty progression: intro, practice, edge, integrated';
COMMENT ON COLUMN exercises.prereqs IS 'Array of subconcept slugs that must be mastered first';
COMMENT ON COLUMN exercises.exercise_type IS 'Exercise format: write, fill-in, predict, debug';
COMMENT ON COLUMN exercises.pattern IS 'Programming pattern: accumulator, filtering, etc.';
COMMENT ON COLUMN exercises.template IS 'For fill-in: code with ___ blanks';
COMMENT ON COLUMN exercises.blank_position IS 'For fill-in: which blank (0-indexed)';
