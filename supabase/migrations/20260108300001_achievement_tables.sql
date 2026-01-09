-- Create achievement tables and seed definitions

-- Achievement definitions (static, seeded)
CREATE TABLE achievement_definitions (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('habit', 'mastery', 'completionist')),
  icon TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User unlocked achievements
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_slug TEXT NOT NULL REFERENCES achievement_definitions(slug),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_slug)
);

-- RLS for user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Achievement definitions are public read
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievement definitions"
  ON achievement_definitions FOR SELECT
  USING (true);

-- Indexes
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_slug ON user_achievements(achievement_slug);
CREATE INDEX idx_achievement_definitions_category ON achievement_definitions(category);

-- Seed achievement definitions
INSERT INTO achievement_definitions (slug, name, description, category, icon, sort_order, metadata) VALUES
-- Habit (7)
('first-steps', 'First Steps', 'Complete your first graded exercise', 'habit', '👣', 1, '{"type": "count", "value": 1}'),
('week-warrior', 'Week Warrior', 'Achieve a 7-day streak', 'habit', '🔥', 2, '{"type": "streak", "value": 7}'),
('fortnight-fighter', 'Fortnight Fighter', 'Achieve a 14-day streak', 'habit', '⚔️', 3, '{"type": "streak", "value": 14}'),
('monthly-master', 'Monthly Master', 'Achieve a 30-day streak', 'habit', '🏆', 4, '{"type": "streak", "value": 30}'),
('perfect-day', 'Perfect Day', '100% first-attempt accuracy in a session (min 10 cards)', 'habit', '⭐', 5, '{"type": "perfect_session", "value": 10}'),
('early-bird', 'Early Bird', 'Practice between 5:00 AM and 7:59 AM', 'habit', '🌅', 6, '{"type": "time_range", "start": 5, "end": 7}'),
('night-owl', 'Night Owl', 'Practice between 12:00 AM and 4:59 AM', 'habit', '🦉', 7, '{"type": "time_range", "start": 0, "end": 4}'),
-- Mastery (6)
('bronze-age', 'Bronze Age', 'Earn your first Bronze badge', 'mastery', '🥉', 8, '{"type": "tier", "tier": "bronze", "count": 1}'),
('silver-lining', 'Silver Lining', 'Earn your first Silver badge', 'mastery', '🥈', 9, '{"type": "tier", "tier": "silver", "count": 1}'),
('gold-standard', 'Gold Standard', 'Earn your first Gold badge', 'mastery', '🥇', 10, '{"type": "tier", "tier": "gold", "count": 1}'),
('platinum-club', 'Platinum Club', 'Earn your first Platinum badge', 'mastery', '💎', 11, '{"type": "tier", "tier": "platinum", "count": 1}'),
('concept-master', 'Concept Master', 'Master all subconcepts in any concept', 'mastery', '👑', 12, '{"type": "concept_mastery", "count": 1}'),
('pythonista', 'Pythonista', 'Master all 65 Python subconcepts', 'mastery', '🐍', 13, '{"type": "tier", "tier": "gold", "count": 65}'),
-- Completionist (5)
('century', 'Century', 'Complete 100 graded exercises', 'completionist', '💯', 14, '{"type": "count", "value": 100}'),
('half-k', 'Half K', 'Complete 500 graded exercises', 'completionist', '🎯', 15, '{"type": "count", "value": 500}'),
('thousand-strong', 'Thousand Strong', 'Complete 1000 graded exercises', 'completionist', '🏅', 16, '{"type": "count", "value": 1000}'),
('explorer', 'Explorer', 'Try all 3 exercise types (write, fill-in, predict)', 'completionist', '🧭', 17, '{"type": "variety", "target": "exercise_types", "count": 3}'),
('well-rounded', 'Well Rounded', 'Complete exercises in all 11 concepts', 'completionist', '🌐', 18, '{"type": "variety", "target": "concepts", "count": 11}');

COMMENT ON TABLE achievement_definitions IS
  'Static achievement definitions. Seeded on migration.';
COMMENT ON TABLE user_achievements IS
  'User unlocked achievements. Inserted by check_achievements RPC.';
