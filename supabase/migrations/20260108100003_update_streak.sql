-- Update streak RPC function
-- Part of Phase 3.1: Gamification Foundation
--
-- Handles streak calculation with freeze logic:
-- - First activity: streak = 1
-- - Consecutive day: increment streak
-- - Same day: no change (return current state)
-- - Gap > available freezes: reset to 1, preserve freezes
-- - Gap <= available freezes: use freezes, continue streak
-- - Freeze earned every 7 days (cap at 2)
-- - Updates longest_streak when exceeded

CREATE OR REPLACE FUNCTION update_streak(
  p_user_id UUID,
  p_activity_date DATE
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_activity_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_streak_freezes INTEGER;
  v_last_freeze_earned_at TIMESTAMPTZ;
  v_days_missed INTEGER;
  v_freezes_used INTEGER := 0;
  v_freeze_earned BOOLEAN := FALSE;
  v_new_streak INTEGER;
BEGIN
  -- Get current profile data
  SELECT last_activity_date, current_streak, longest_streak, streak_freezes, last_freeze_earned_at
  INTO v_last_activity_date, v_current_streak, v_longest_streak, v_streak_freezes, v_last_freeze_earned_at
  FROM profiles WHERE id = p_user_id;

  -- Handle NULL values with defaults
  v_current_streak := COALESCE(v_current_streak, 0);
  v_longest_streak := COALESCE(v_longest_streak, 0);
  v_streak_freezes := COALESCE(v_streak_freezes, 0);

  -- First activity ever
  IF v_last_activity_date IS NULL THEN
    v_days_missed := 0;
    v_new_streak := 1;
  -- Same day activity - no change
  ELSIF p_activity_date = v_last_activity_date THEN
    RETURN json_build_object(
      'current_streak', v_current_streak,
      'longest_streak', v_longest_streak,
      'freezes_used', 0,
      'freeze_earned', false
    );
  -- Consecutive day - increment streak
  ELSIF p_activity_date = v_last_activity_date + 1 THEN
    v_days_missed := 0;
    v_new_streak := v_current_streak + 1;
  -- Gap in activity
  ELSE
    v_days_missed := p_activity_date - v_last_activity_date - 1;
    -- Can cover gap with freezes
    IF v_days_missed <= v_streak_freezes THEN
      v_freezes_used := v_days_missed;
      v_streak_freezes := v_streak_freezes - v_days_missed;
      v_new_streak := v_current_streak + 1;
    -- Gap too large, reset streak but preserve remaining freezes
    ELSE
      v_new_streak := 1;
    END IF;
  END IF;

  -- Update longest streak if exceeded
  IF v_new_streak > v_longest_streak THEN
    v_longest_streak := v_new_streak;
  END IF;

  -- Check for freeze earning (every 7 days, cap at 2)
  -- Only earn freeze when reaching a new 7-day milestone
  IF v_new_streak > 0 AND v_new_streak % 7 = 0 AND v_streak_freezes < 2 THEN
    -- Only award if this is a new milestone (not same streak re-visiting the milestone)
    IF v_last_freeze_earned_at IS NULL OR v_new_streak > v_current_streak OR v_current_streak < 7 THEN
      v_freeze_earned := TRUE;
      v_streak_freezes := v_streak_freezes + 1;
      v_last_freeze_earned_at := NOW();
    END IF;
  END IF;

  -- Update profile
  UPDATE profiles SET
    current_streak = v_new_streak,
    longest_streak = v_longest_streak,
    streak_freezes = v_streak_freezes,
    last_activity_date = p_activity_date,
    last_freeze_earned_at = COALESCE(
      CASE WHEN v_freeze_earned THEN NOW() ELSE NULL END,
      last_freeze_earned_at
    ),
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Return result
  RETURN json_build_object(
    'current_streak', v_new_streak,
    'longest_streak', v_longest_streak,
    'freezes_used', v_freezes_used,
    'freeze_earned', v_freeze_earned
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_streak TO authenticated;

-- Add documentation
COMMENT ON FUNCTION update_streak IS 'Update user streak for activity date. Handles freeze logic and milestone earning.';
