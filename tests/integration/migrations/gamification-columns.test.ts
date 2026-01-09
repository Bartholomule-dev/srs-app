import { describe, it, expect, afterAll } from 'vitest';
import {
  serviceClient as supabase,
  createTestUser,
  deleteTestUser,
} from '@tests/fixtures/supabase';

describe('Gamification columns migration', () => {
  const testUserIds: string[] = [];

  afterAll(async () => {
    // Cleanup all test users
    for (const id of testUserIds) {
      await deleteTestUser(id);
    }
  });

  describe('profiles table', () => {
    it('has streak_freezes column with default 0', async () => {
      const testUserId = await createTestUser();
      testUserIds.push(testUserId);

      const { data, error } = await supabase
        .from('profiles')
        .select('streak_freezes')
        .eq('id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(data?.streak_freezes).toBe(0);
    });

    it('has last_freeze_earned_at column (nullable)', async () => {
      const testUserId = await createTestUser();
      testUserIds.push(testUserId);

      const { data, error } = await supabase
        .from('profiles')
        .select('last_freeze_earned_at')
        .eq('id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(data?.last_freeze_earned_at).toBeNull();
    });

    it('has last_activity_date column (nullable)', async () => {
      const testUserId = await createTestUser();
      testUserIds.push(testUserId);

      const { data, error } = await supabase
        .from('profiles')
        .select('last_activity_date')
        .eq('id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(data?.last_activity_date).toBeNull();
    });

    it('enforces streak_freezes CHECK constraint (0-2)', async () => {
      const testUserId = await createTestUser();
      testUserIds.push(testUserId);

      const { error } = await supabase
        .from('profiles')
        .update({ streak_freezes: 3 })
        .eq('id', testUserId);

      expect(error).not.toBeNull();
      expect(error?.message).toContain('violates check constraint');
    });

    it('allows streak_freezes values within range (0-2)', async () => {
      const testUserId = await createTestUser();
      testUserIds.push(testUserId);

      // Test setting to 2
      const { error: error1 } = await supabase
        .from('profiles')
        .update({ streak_freezes: 2 })
        .eq('id', testUserId);

      expect(error1).toBeNull();

      // Verify the value was set
      const { data } = await supabase
        .from('profiles')
        .select('streak_freezes')
        .eq('id', testUserId)
        .single();

      expect(data?.streak_freezes).toBe(2);
    });

    it('rejects negative streak_freezes', async () => {
      const testUserId = await createTestUser();
      testUserIds.push(testUserId);

      const { error } = await supabase
        .from('profiles')
        .update({ streak_freezes: -1 })
        .eq('id', testUserId);

      expect(error).not.toBeNull();
      expect(error?.message).toContain('violates check constraint');
    });
  });

  describe('exercise_attempts table', () => {
    it('has points_earned column with default 0', async () => {
      const testUserId = await createTestUser();
      testUserIds.push(testUserId);

      const { data, error } = await supabase
        .from('exercise_attempts')
        .insert({
          user_id: testUserId,
          exercise_slug: 'test-exercise-points',
        })
        .select('points_earned')
        .single();

      expect(error).toBeNull();
      expect(data?.points_earned).toBe(0);

      // Cleanup
      await supabase
        .from('exercise_attempts')
        .delete()
        .eq('user_id', testUserId);
    });

    it('has timezone_offset_minutes column (nullable)', async () => {
      const testUserId = await createTestUser();
      testUserIds.push(testUserId);

      const { data, error } = await supabase
        .from('exercise_attempts')
        .insert({
          user_id: testUserId,
          exercise_slug: 'test-exercise-tz',
          timezone_offset_minutes: -300,
        })
        .select('timezone_offset_minutes')
        .single();

      expect(error).toBeNull();
      expect(data?.timezone_offset_minutes).toBe(-300);

      await supabase
        .from('exercise_attempts')
        .delete()
        .eq('user_id', testUserId);
    });

    it('has is_correct column (nullable)', async () => {
      const testUserId = await createTestUser();
      testUserIds.push(testUserId);

      const { data, error } = await supabase
        .from('exercise_attempts')
        .insert({
          user_id: testUserId,
          exercise_slug: 'test-exercise-correct',
          is_correct: true,
        })
        .select('is_correct')
        .single();

      expect(error).toBeNull();
      expect(data?.is_correct).toBe(true);

      await supabase
        .from('exercise_attempts')
        .delete()
        .eq('user_id', testUserId);
    });

    it('has rating column (nullable, 1-4)', async () => {
      const testUserId = await createTestUser();
      testUserIds.push(testUserId);

      const { data, error } = await supabase
        .from('exercise_attempts')
        .insert({
          user_id: testUserId,
          exercise_slug: 'test-exercise-rating',
          rating: 3,
        })
        .select('rating')
        .single();

      expect(error).toBeNull();
      expect(data?.rating).toBe(3);

      await supabase
        .from('exercise_attempts')
        .delete()
        .eq('user_id', testUserId);
    });

    it('has is_first_attempt column (default true)', async () => {
      const testUserId = await createTestUser();
      testUserIds.push(testUserId);

      const { data, error } = await supabase
        .from('exercise_attempts')
        .insert({
          user_id: testUserId,
          exercise_slug: 'test-exercise-first',
        })
        .select('is_first_attempt')
        .single();

      expect(error).toBeNull();
      expect(data?.is_first_attempt).toBe(true);

      await supabase
        .from('exercise_attempts')
        .delete()
        .eq('user_id', testUserId);
    });

    it('enforces rating CHECK constraint (1-4)', async () => {
      const testUserId = await createTestUser();
      testUserIds.push(testUserId);

      // Rating 0 should fail
      const { error: error0 } = await supabase
        .from('exercise_attempts')
        .insert({
          user_id: testUserId,
          exercise_slug: 'test-exercise-rating-invalid',
          rating: 0,
        });

      expect(error0).not.toBeNull();
      expect(error0?.message).toContain('violates check constraint');

      // Rating 5 should fail
      const { error: error5 } = await supabase
        .from('exercise_attempts')
        .insert({
          user_id: testUserId,
          exercise_slug: 'test-exercise-rating-invalid2',
          rating: 5,
        });

      expect(error5).not.toBeNull();
      expect(error5?.message).toContain('violates check constraint');

      await supabase
        .from('exercise_attempts')
        .delete()
        .eq('user_id', testUserId);
    });

    it('enforces points_earned CHECK constraint (non-negative)', async () => {
      const testUserId = await createTestUser();
      testUserIds.push(testUserId);

      const { error } = await supabase
        .from('exercise_attempts')
        .insert({
          user_id: testUserId,
          exercise_slug: 'test-exercise-points-neg',
          points_earned: -10,
        });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('violates check constraint');

      await supabase
        .from('exercise_attempts')
        .delete()
        .eq('user_id', testUserId);
    });
  });
});
