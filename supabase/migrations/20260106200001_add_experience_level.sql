-- Add experience_level column to profiles
-- Values: 'refresher' (default), 'learning', 'beginner'

ALTER TABLE profiles
ADD COLUMN experience_level TEXT
DEFAULT 'refresher'
CHECK (experience_level IN ('refresher', 'learning', 'beginner'));

-- Comment for documentation
COMMENT ON COLUMN profiles.experience_level IS 'User experience level: refresher (80% write), learning (50% write), beginner (30% write)';
