import { describe, it, expect, afterAll } from 'vitest';
import {
  serviceClient as supabase,
  createTestUser,
  deleteTestUser,
} from '@tests/fixtures/supabase';

describe('repair_user_stats RPC', () => {
  const testUserIds: string[] = [];

  afterAll(async () => {
    // Cleanup all test users
    for (const id of testUserIds) {
      await deleteTestUser(id);
    }
  });

  /**
   * Helper to call the repair_user_stats RPC function
   */
  async function repairUserStats(userId: string): Promise<{
    total_exercises_completed: number;
    total_points_recalculated: number;
  }> {
    const { data, error } = await supabase.rpc('repair_user_stats', {
      p_user_id: userId,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Helper to create an exercise attempt directly
   */
  async function createAttempt(
    userId: string,
    overrides: {
      exercise_slug?: string;
      is_correct?: boolean;
      points_earned?: number;
    } = {}
  ): Promise<void> {
    const { error } = await supabase.from('exercise_attempts').insert({
      user_id: userId,
      exercise_slug: overrides.exercise_slug ?? `test-exercise-${crypto.randomUUID()}`,
      is_correct: overrides.is_correct ?? true,
      points_earned: overrides.points_earned ?? 10,
      times_seen: 1,
      times_correct: overrides.is_correct !== false ? 1 : 0,
    });

    if (error) throw error;
  }

  /**
   * Helper to corrupt profile data for testing repair
   */
  async function corruptProfileStats(
    userId: string,
    values: { total_exercises_completed?: number }
  ): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update(values)
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Helper to get profile stats
   */
  async function getProfileStats(userId: string): Promise<{
    total_exercises_completed: number;
  }> {
    const { data, error } = await supabase
      .from('profiles')
      .select('total_exercises_completed')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return {
      total_exercises_completed: data.total_exercises_completed ?? 0,
    };
  }

  describe('recalculates correct exercise count', () => {
    it('returns 0 when user has no attempts', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      const result = await repairUserStats(userId);

      expect(result.total_exercises_completed).toBe(0);
      expect(result.total_points_recalculated).toBe(0);
    });

    it('counts only correct attempts', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      // Create 3 correct and 2 incorrect attempts
      await createAttempt(userId, { is_correct: true, points_earned: 10 });
      await createAttempt(userId, { is_correct: true, points_earned: 15 });
      await createAttempt(userId, { is_correct: true, points_earned: 12 });
      await createAttempt(userId, { is_correct: false, points_earned: 0 });
      await createAttempt(userId, { is_correct: false, points_earned: 0 });

      const result = await repairUserStats(userId);

      expect(result.total_exercises_completed).toBe(3);
    });

    it('sums all points regardless of correctness', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      await createAttempt(userId, { is_correct: true, points_earned: 10 });
      await createAttempt(userId, { is_correct: true, points_earned: 15 });
      await createAttempt(userId, { is_correct: false, points_earned: 0 });

      const result = await repairUserStats(userId);

      expect(result.total_points_recalculated).toBe(25);
    });
  });

  describe('updates profile with correct values', () => {
    it('repairs corrupted total_exercises_completed', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      // Create 5 correct attempts
      for (let i = 0; i < 5; i++) {
        await createAttempt(userId, { is_correct: true, points_earned: 10 });
      }

      // Corrupt the profile data (set wrong count)
      await corruptProfileStats(userId, { total_exercises_completed: 999 });

      // Verify corruption
      const beforeRepair = await getProfileStats(userId);
      expect(beforeRepair.total_exercises_completed).toBe(999);

      // Call repair function
      await repairUserStats(userId);

      // Verify repair
      const afterRepair = await getProfileStats(userId);
      expect(afterRepair.total_exercises_completed).toBe(5);
    });

    it('repairs zero exercises when profile shows inflated count', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      // No attempts, but corrupt profile to show exercises
      await corruptProfileStats(userId, { total_exercises_completed: 100 });

      // Call repair function
      const result = await repairUserStats(userId);

      expect(result.total_exercises_completed).toBe(0);

      // Verify profile was updated
      const afterRepair = await getProfileStats(userId);
      expect(afterRepair.total_exercises_completed).toBe(0);
    });
  });

  describe('handles edge cases', () => {
    it('handles null is_correct values (does not count as correct)', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      // Create attempt with null is_correct
      const { error } = await supabase.from('exercise_attempts').insert({
        user_id: userId,
        exercise_slug: `test-exercise-${crypto.randomUUID()}`,
        is_correct: null,
        points_earned: 5,
        times_seen: 1,
        times_correct: 0,
      });
      if (error) throw error;

      const result = await repairUserStats(userId);

      // null is_correct should not count as correct
      expect(result.total_exercises_completed).toBe(0);
      // But points should still be summed
      expect(result.total_points_recalculated).toBe(5);
    });

    it('handles null points_earned values', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      // Create attempt with null points_earned
      const { error } = await supabase.from('exercise_attempts').insert({
        user_id: userId,
        exercise_slug: `test-exercise-${crypto.randomUUID()}`,
        is_correct: true,
        points_earned: null,
        times_seen: 1,
        times_correct: 1,
      });
      if (error) throw error;

      const result = await repairUserStats(userId);

      expect(result.total_exercises_completed).toBe(1);
      // null points should be treated as 0 in SUM
      expect(result.total_points_recalculated).toBe(0);
    });

    it('returns consistent values on multiple calls', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      await createAttempt(userId, { is_correct: true, points_earned: 20 });
      await createAttempt(userId, { is_correct: true, points_earned: 15 });

      const result1 = await repairUserStats(userId);
      const result2 = await repairUserStats(userId);

      expect(result1).toEqual(result2);
      expect(result1.total_exercises_completed).toBe(2);
      expect(result1.total_points_recalculated).toBe(35);
    });
  });

  describe('large data sets', () => {
    it('handles many attempts efficiently', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      // Create 50 attempts with varying correctness and points
      const insertPromises = [];
      for (let i = 0; i < 50; i++) {
        const isCorrect = i % 3 !== 0; // 2/3 correct
        insertPromises.push(
          createAttempt(userId, {
            is_correct: isCorrect,
            points_earned: isCorrect ? 10 : 0,
          })
        );
      }
      await Promise.all(insertPromises);

      const result = await repairUserStats(userId);

      // 50 attempts, 1/3 incorrect = 17 incorrect, 33 correct
      expect(result.total_exercises_completed).toBe(33);
      // 33 correct * 10 points = 330
      expect(result.total_points_recalculated).toBe(330);
    });
  });
});
