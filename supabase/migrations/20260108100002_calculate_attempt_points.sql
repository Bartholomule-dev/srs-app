-- RPC function to calculate points for an exercise attempt
-- Part of Phase 3.1: Gamification Foundation

CREATE OR REPLACE FUNCTION calculate_attempt_points(
  p_user_id UUID,
  p_is_correct BOOLEAN,
  p_rating INTEGER,
  p_used_hint BOOLEAN,
  p_is_first_attempt BOOLEAN,
  p_response_time_ms INTEGER,
  p_subconcept_stability FLOAT
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base INTEGER := 10;
  v_quality_bonus INTEGER := 0;
  v_no_hint_bonus INTEGER := 0;
  v_first_attempt_bonus INTEGER := 0;
  v_speed_bonus INTEGER := 0;
  v_subtotal INTEGER := 0;
  v_streak_multiplier NUMERIC := 1.0;
  v_current_streak INTEGER := 0;
  v_total INTEGER := 0;
BEGIN
  -- Incorrect answers earn 0 points
  IF NOT p_is_correct THEN
    RETURN 0;
  END IF;

  -- Quality bonus based on rating
  v_quality_bonus := CASE p_rating
    WHEN 4 THEN 5  -- Easy
    WHEN 3 THEN 3  -- Good
    WHEN 2 THEN 1  -- Hard
    ELSE 0         -- Again
  END;

  -- No-hint bonus
  IF NOT p_used_hint THEN
    v_no_hint_bonus := 3;
  END IF;

  -- First attempt bonus
  IF p_is_first_attempt THEN
    v_first_attempt_bonus := 2;
  END IF;

  -- Speed bonus (only for mastered subconcepts, stability >= 30 days)
  IF p_subconcept_stability >= 30 THEN
    v_speed_bonus := CASE
      WHEN p_response_time_ms < 3000 THEN 5
      WHEN p_response_time_ms < 5000 THEN 4
      WHEN p_response_time_ms < 8000 THEN 3
      WHEN p_response_time_ms < 12000 THEN 2
      WHEN p_response_time_ms < 20000 THEN 1
      ELSE 0
    END;
  END IF;

  -- Calculate subtotal
  v_subtotal := v_base + v_quality_bonus + v_no_hint_bonus + v_first_attempt_bonus + v_speed_bonus;

  -- Get current streak for multiplier
  SELECT COALESCE(current_streak, 0) INTO v_current_streak
  FROM profiles
  WHERE id = p_user_id;

  -- Streak multiplier
  v_streak_multiplier := CASE
    WHEN v_current_streak >= 30 THEN 1.2
    WHEN v_current_streak >= 14 THEN 1.15
    WHEN v_current_streak >= 7 THEN 1.1
    ELSE 1.0
  END;

  -- Calculate total (floor)
  v_total := FLOOR(v_subtotal * v_streak_multiplier);

  RETURN v_total;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION calculate_attempt_points TO authenticated;

COMMENT ON FUNCTION calculate_attempt_points IS
  'Calculate points earned for an exercise attempt. Returns integer points.';
