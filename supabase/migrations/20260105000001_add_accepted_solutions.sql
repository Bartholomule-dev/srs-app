-- Add accepted_solutions column to exercises table
-- Stores alternative valid answers as a text array

ALTER TABLE exercises
ADD COLUMN accepted_solutions TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN exercises.accepted_solutions IS 'Alternative valid answers beyond expected_answer';
