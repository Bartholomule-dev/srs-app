-- Add Perfect Day achievement to check_achievements RPC
-- 100% first-attempt accuracy in a single session (10+ cards)
-- Uses time-window grouping (1 hour) to identify sessions

CREATE OR REPLACE FUNCTION check_achievements(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_bronze_count INTEGER;
  v_silver_count INTEGER;
  v_gold_count INTEGER;
  v_platinum_count INTEGER;
  v_has_early_bird BOOLEAN;
  v_has_night_owl BOOLEAN;
  v_has_perfect_day BOOLEAN;
  v_already_unlocked TEXT[];
  v_newly_unlocked TEXT[];
  v_achievement_slug TEXT;
  v_achievement_met BOOLEAN;
BEGIN
  -- Fetch profile stats
  SELECT current_streak, total_exercises_completed
  INTO v_profile
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'newly_unlocked', '[]'::jsonb,
      'all_unlocked', '[]'::jsonb,
      'error', 'User not found'
    );
  END IF;

  -- Count badge tiers from subconcept_progress stability
  -- Bronze: stability >= 1 day
  -- Silver: stability >= 7 days
  -- Gold: stability >= 30 days
  -- Platinum: stability >= 90 days
  SELECT
    COALESCE(SUM(CASE WHEN stability >= 1 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN stability >= 7 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN stability >= 30 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN stability >= 90 THEN 1 ELSE 0 END), 0)
  INTO v_bronze_count, v_silver_count, v_gold_count, v_platinum_count
  FROM subconcept_progress
  WHERE user_id = p_user_id;

  -- Check for early-bird (5:00-7:59 AM UTC)
  SELECT EXISTS (
    SELECT 1 FROM exercise_attempts
    WHERE user_id = p_user_id
      AND EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC') BETWEEN 5 AND 7
  ) INTO v_has_early_bird;

  -- Check for night-owl (00:00-4:59 AM UTC)
  SELECT EXISTS (
    SELECT 1 FROM exercise_attempts
    WHERE user_id = p_user_id
      AND EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC') BETWEEN 0 AND 4
  ) INTO v_has_night_owl;

  -- Check for perfect day: 10+ first-attempt correct answers in a 1-hour window
  -- A "perfect" attempt requires: is_correct = true, rating >= 3 (Good/Easy), is_first_attempt = true
  SELECT EXISTS (
    SELECT 1
    FROM (
      SELECT
        DATE_TRUNC('hour', created_at) as session_window,
        COUNT(*) as attempt_count,
        COUNT(*) FILTER (
          WHERE is_correct = true
            AND rating >= 3
            AND is_first_attempt = true
        ) as perfect_count
      FROM exercise_attempts
      WHERE user_id = p_user_id
      GROUP BY DATE_TRUNC('hour', created_at)
    ) sessions
    WHERE attempt_count >= 10
      AND attempt_count = perfect_count
  ) INTO v_has_perfect_day;

  -- Get already unlocked achievements
  SELECT COALESCE(array_agg(achievement_slug), '{}')
  INTO v_already_unlocked
  FROM user_achievements
  WHERE user_id = p_user_id;

  -- Initialize newly_unlocked
  v_newly_unlocked := '{}';

  -- Check each achievement condition and insert if met and not already unlocked

  -- First Steps: total_exercises >= 1
  v_achievement_slug := 'first-steps';
  v_achievement_met := COALESCE(v_profile.total_exercises_completed, 0) >= 1;
  IF v_achievement_met AND NOT (v_achievement_slug = ANY(v_already_unlocked)) THEN
    INSERT INTO user_achievements (user_id, achievement_slug)
    VALUES (p_user_id, v_achievement_slug)
    ON CONFLICT (user_id, achievement_slug) DO NOTHING;
    v_newly_unlocked := array_append(v_newly_unlocked, v_achievement_slug);
  END IF;

  -- Week Warrior: current_streak >= 7
  v_achievement_slug := 'week-warrior';
  v_achievement_met := COALESCE(v_profile.current_streak, 0) >= 7;
  IF v_achievement_met AND NOT (v_achievement_slug = ANY(v_already_unlocked)) THEN
    INSERT INTO user_achievements (user_id, achievement_slug)
    VALUES (p_user_id, v_achievement_slug)
    ON CONFLICT (user_id, achievement_slug) DO NOTHING;
    v_newly_unlocked := array_append(v_newly_unlocked, v_achievement_slug);
  END IF;

  -- Fortnight Fighter: current_streak >= 14
  v_achievement_slug := 'fortnight-fighter';
  v_achievement_met := COALESCE(v_profile.current_streak, 0) >= 14;
  IF v_achievement_met AND NOT (v_achievement_slug = ANY(v_already_unlocked)) THEN
    INSERT INTO user_achievements (user_id, achievement_slug)
    VALUES (p_user_id, v_achievement_slug)
    ON CONFLICT (user_id, achievement_slug) DO NOTHING;
    v_newly_unlocked := array_append(v_newly_unlocked, v_achievement_slug);
  END IF;

  -- Monthly Master: current_streak >= 30
  v_achievement_slug := 'monthly-master';
  v_achievement_met := COALESCE(v_profile.current_streak, 0) >= 30;
  IF v_achievement_met AND NOT (v_achievement_slug = ANY(v_already_unlocked)) THEN
    INSERT INTO user_achievements (user_id, achievement_slug)
    VALUES (p_user_id, v_achievement_slug)
    ON CONFLICT (user_id, achievement_slug) DO NOTHING;
    v_newly_unlocked := array_append(v_newly_unlocked, v_achievement_slug);
  END IF;

  -- Bronze Age: bronze_count >= 1
  v_achievement_slug := 'bronze-age';
  v_achievement_met := v_bronze_count >= 1;
  IF v_achievement_met AND NOT (v_achievement_slug = ANY(v_already_unlocked)) THEN
    INSERT INTO user_achievements (user_id, achievement_slug)
    VALUES (p_user_id, v_achievement_slug)
    ON CONFLICT (user_id, achievement_slug) DO NOTHING;
    v_newly_unlocked := array_append(v_newly_unlocked, v_achievement_slug);
  END IF;

  -- Silver Lining: silver_count >= 1
  v_achievement_slug := 'silver-lining';
  v_achievement_met := v_silver_count >= 1;
  IF v_achievement_met AND NOT (v_achievement_slug = ANY(v_already_unlocked)) THEN
    INSERT INTO user_achievements (user_id, achievement_slug)
    VALUES (p_user_id, v_achievement_slug)
    ON CONFLICT (user_id, achievement_slug) DO NOTHING;
    v_newly_unlocked := array_append(v_newly_unlocked, v_achievement_slug);
  END IF;

  -- Gold Standard: gold_count >= 1
  v_achievement_slug := 'gold-standard';
  v_achievement_met := v_gold_count >= 1;
  IF v_achievement_met AND NOT (v_achievement_slug = ANY(v_already_unlocked)) THEN
    INSERT INTO user_achievements (user_id, achievement_slug)
    VALUES (p_user_id, v_achievement_slug)
    ON CONFLICT (user_id, achievement_slug) DO NOTHING;
    v_newly_unlocked := array_append(v_newly_unlocked, v_achievement_slug);
  END IF;

  -- Platinum Club: platinum_count >= 1
  v_achievement_slug := 'platinum-club';
  v_achievement_met := v_platinum_count >= 1;
  IF v_achievement_met AND NOT (v_achievement_slug = ANY(v_already_unlocked)) THEN
    INSERT INTO user_achievements (user_id, achievement_slug)
    VALUES (p_user_id, v_achievement_slug)
    ON CONFLICT (user_id, achievement_slug) DO NOTHING;
    v_newly_unlocked := array_append(v_newly_unlocked, v_achievement_slug);
  END IF;

  -- Pythonista: gold_count >= 65 (all Python subconcepts mastered)
  v_achievement_slug := 'pythonista';
  v_achievement_met := v_gold_count >= 65;
  IF v_achievement_met AND NOT (v_achievement_slug = ANY(v_already_unlocked)) THEN
    INSERT INTO user_achievements (user_id, achievement_slug)
    VALUES (p_user_id, v_achievement_slug)
    ON CONFLICT (user_id, achievement_slug) DO NOTHING;
    v_newly_unlocked := array_append(v_newly_unlocked, v_achievement_slug);
  END IF;

  -- Century: total_exercises >= 100
  v_achievement_slug := 'century';
  v_achievement_met := COALESCE(v_profile.total_exercises_completed, 0) >= 100;
  IF v_achievement_met AND NOT (v_achievement_slug = ANY(v_already_unlocked)) THEN
    INSERT INTO user_achievements (user_id, achievement_slug)
    VALUES (p_user_id, v_achievement_slug)
    ON CONFLICT (user_id, achievement_slug) DO NOTHING;
    v_newly_unlocked := array_append(v_newly_unlocked, v_achievement_slug);
  END IF;

  -- Half-K: total_exercises >= 500
  v_achievement_slug := 'half-k';
  v_achievement_met := COALESCE(v_profile.total_exercises_completed, 0) >= 500;
  IF v_achievement_met AND NOT (v_achievement_slug = ANY(v_already_unlocked)) THEN
    INSERT INTO user_achievements (user_id, achievement_slug)
    VALUES (p_user_id, v_achievement_slug)
    ON CONFLICT (user_id, achievement_slug) DO NOTHING;
    v_newly_unlocked := array_append(v_newly_unlocked, v_achievement_slug);
  END IF;

  -- Thousand Strong: total_exercises >= 1000
  v_achievement_slug := 'thousand-strong';
  v_achievement_met := COALESCE(v_profile.total_exercises_completed, 0) >= 1000;
  IF v_achievement_met AND NOT (v_achievement_slug = ANY(v_already_unlocked)) THEN
    INSERT INTO user_achievements (user_id, achievement_slug)
    VALUES (p_user_id, v_achievement_slug)
    ON CONFLICT (user_id, achievement_slug) DO NOTHING;
    v_newly_unlocked := array_append(v_newly_unlocked, v_achievement_slug);
  END IF;

  -- Early Bird: practice between 5:00-7:59 AM UTC
  v_achievement_slug := 'early-bird';
  v_achievement_met := v_has_early_bird;
  IF v_achievement_met AND NOT (v_achievement_slug = ANY(v_already_unlocked)) THEN
    INSERT INTO user_achievements (user_id, achievement_slug)
    VALUES (p_user_id, v_achievement_slug)
    ON CONFLICT (user_id, achievement_slug) DO NOTHING;
    v_newly_unlocked := array_append(v_newly_unlocked, v_achievement_slug);
  END IF;

  -- Night Owl: practice between 00:00-4:59 AM UTC
  v_achievement_slug := 'night-owl';
  v_achievement_met := v_has_night_owl;
  IF v_achievement_met AND NOT (v_achievement_slug = ANY(v_already_unlocked)) THEN
    INSERT INTO user_achievements (user_id, achievement_slug)
    VALUES (p_user_id, v_achievement_slug)
    ON CONFLICT (user_id, achievement_slug) DO NOTHING;
    v_newly_unlocked := array_append(v_newly_unlocked, v_achievement_slug);
  END IF;

  -- Perfect Day: 10+ first-attempt correct answers in a session
  v_achievement_slug := 'perfect-day';
  v_achievement_met := v_has_perfect_day;
  IF v_achievement_met AND NOT (v_achievement_slug = ANY(v_already_unlocked)) THEN
    INSERT INTO user_achievements (user_id, achievement_slug)
    VALUES (p_user_id, v_achievement_slug)
    ON CONFLICT (user_id, achievement_slug) DO NOTHING;
    v_newly_unlocked := array_append(v_newly_unlocked, v_achievement_slug);
  END IF;

  -- Note: Remaining achievements for future tasks:
  -- - explorer (requires exercise type tracking)
  -- - well-rounded (requires concept tracking)
  -- - concept-master (requires concept-level mastery check)

  -- Return newly unlocked and all unlocked
  RETURN jsonb_build_object(
    'newly_unlocked', to_jsonb(v_newly_unlocked),
    'all_unlocked', to_jsonb(v_already_unlocked || v_newly_unlocked)
  );
END;
$$;

-- Grant already exists from initial migration, but ensure it's there
GRANT EXECUTE ON FUNCTION check_achievements(UUID) TO authenticated;

COMMENT ON FUNCTION check_achievements IS
  'Idempotent achievement checker. Checks user stats against achievement conditions and unlocks if met.
   Returns JSON with newly_unlocked (just unlocked this call) and all_unlocked (complete list).
   Supports: first-steps, week-warrior, fortnight-fighter, monthly-master, bronze-age, silver-lining,
   gold-standard, platinum-club, pythonista, century, half-k, thousand-strong, early-bird, night-owl, perfect-day.';
