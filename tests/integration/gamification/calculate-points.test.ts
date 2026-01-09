import { describe, it, expect, afterAll } from 'vitest';
import {
  serviceClient as supabase,
  createTestUser,
  deleteTestUser,
} from '@tests/fixtures/supabase';

describe('calculate_attempt_points RPC', () => {
  const testUserIds: string[] = [];

  afterAll(async () => {
    // Cleanup all test users
    for (const id of testUserIds) {
      await deleteTestUser(id);
    }
  });

  /**
   * Helper to call the RPC function with defaults
   */
  async function calculatePoints(
    userId: string,
    overrides: {
      is_correct?: boolean;
      rating?: number;
      used_hint?: boolean;
      is_first_attempt?: boolean;
      response_time_ms?: number;
      subconcept_stability?: number;
    } = {}
  ): Promise<number> {
    const { data, error } = await supabase.rpc('calculate_attempt_points', {
      p_user_id: userId,
      p_is_correct: overrides.is_correct ?? true,
      p_rating: overrides.rating ?? 3,
      p_used_hint: overrides.used_hint ?? false,
      p_is_first_attempt: overrides.is_first_attempt ?? false,
      p_response_time_ms: overrides.response_time_ms ?? 10000,
      p_subconcept_stability: overrides.subconcept_stability ?? 0,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Helper to set user's current streak
   */
  async function setUserStreak(userId: string, streak: number): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ current_streak: streak })
      .eq('id', userId);

    if (error) throw error;
  }

  describe('incorrect answers', () => {
    it('returns 0 for incorrect answer', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      const points = await calculatePoints(userId, {
        is_correct: false,
        rating: 3, // Even with good rating
      });

      expect(points).toBe(0);
    });
  });

  describe('base points', () => {
    it('awards base 10 points for correct answer', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      // Minimal correct answer: rating 1, used hint, not first attempt
      const points = await calculatePoints(userId, {
        is_correct: true,
        rating: 1, // Again - 0 bonus
        used_hint: true, // No bonus
        is_first_attempt: false, // No bonus
        subconcept_stability: 0, // No speed bonus
      });

      // 10 base + 0 quality + 0 no-hint + 0 first + 0 speed = 10
      expect(points).toBe(10);
    });
  });

  describe('quality bonus', () => {
    it('awards 5 bonus for rating 4 (Easy)', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      const points = await calculatePoints(userId, {
        rating: 4,
        used_hint: true,
        is_first_attempt: false,
      });

      // 10 base + 5 quality = 15
      expect(points).toBe(15);
    });

    it('awards 3 bonus for rating 3 (Good)', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      const points = await calculatePoints(userId, {
        rating: 3,
        used_hint: true,
        is_first_attempt: false,
      });

      // 10 base + 3 quality = 13
      expect(points).toBe(13);
    });

    it('awards 1 bonus for rating 2 (Hard)', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      const points = await calculatePoints(userId, {
        rating: 2,
        used_hint: true,
        is_first_attempt: false,
      });

      // 10 base + 1 quality = 11
      expect(points).toBe(11);
    });

    it('awards 0 bonus for rating 1 (Again)', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      const points = await calculatePoints(userId, {
        rating: 1,
        used_hint: true,
        is_first_attempt: false,
      });

      // 10 base + 0 quality = 10
      expect(points).toBe(10);
    });
  });

  describe('no-hint bonus', () => {
    it('awards 3 bonus when hint not used', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      const points = await calculatePoints(userId, {
        rating: 1,
        used_hint: false, // +3
        is_first_attempt: false,
      });

      // 10 base + 0 quality + 3 no-hint = 13
      expect(points).toBe(13);
    });

    it('awards no bonus when hint used', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      const points = await calculatePoints(userId, {
        rating: 1,
        used_hint: true, // +0
        is_first_attempt: false,
      });

      // 10 base + 0 quality + 0 no-hint = 10
      expect(points).toBe(10);
    });
  });

  describe('first attempt bonus', () => {
    it('awards 2 bonus for first attempt', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      const points = await calculatePoints(userId, {
        rating: 1,
        used_hint: true,
        is_first_attempt: true, // +2
      });

      // 10 base + 0 quality + 0 no-hint + 2 first = 12
      expect(points).toBe(12);
    });
  });

  describe('speed bonus', () => {
    it('awards no speed bonus when stability < 30 days', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      const points = await calculatePoints(userId, {
        rating: 1,
        used_hint: true,
        is_first_attempt: false,
        response_time_ms: 1000, // Very fast
        subconcept_stability: 29, // Just under threshold
      });

      // 10 base only
      expect(points).toBe(10);
    });

    it('awards 5 bonus for < 3s response when mastered', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      const points = await calculatePoints(userId, {
        rating: 1,
        used_hint: true,
        is_first_attempt: false,
        response_time_ms: 2999,
        subconcept_stability: 30,
      });

      // 10 base + 0 quality + 0 no-hint + 0 first + 5 speed = 15
      expect(points).toBe(15);
    });

    it('awards 4 bonus for < 5s response when mastered', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      const points = await calculatePoints(userId, {
        rating: 1,
        used_hint: true,
        is_first_attempt: false,
        response_time_ms: 4999,
        subconcept_stability: 30,
      });

      // 10 base + 4 speed = 14
      expect(points).toBe(14);
    });

    it('awards 3 bonus for < 8s response when mastered', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      const points = await calculatePoints(userId, {
        rating: 1,
        used_hint: true,
        is_first_attempt: false,
        response_time_ms: 7999,
        subconcept_stability: 30,
      });

      // 10 base + 3 speed = 13
      expect(points).toBe(13);
    });

    it('awards 2 bonus for < 12s response when mastered', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      const points = await calculatePoints(userId, {
        rating: 1,
        used_hint: true,
        is_first_attempt: false,
        response_time_ms: 11999,
        subconcept_stability: 30,
      });

      // 10 base + 2 speed = 12
      expect(points).toBe(12);
    });

    it('awards 1 bonus for < 20s response when mastered', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      const points = await calculatePoints(userId, {
        rating: 1,
        used_hint: true,
        is_first_attempt: false,
        response_time_ms: 19999,
        subconcept_stability: 30,
      });

      // 10 base + 1 speed = 11
      expect(points).toBe(11);
    });

    it('awards 0 bonus for >= 20s response when mastered', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      const points = await calculatePoints(userId, {
        rating: 1,
        used_hint: true,
        is_first_attempt: false,
        response_time_ms: 20000,
        subconcept_stability: 30,
      });

      // 10 base + 0 speed = 10
      expect(points).toBe(10);
    });
  });

  describe('streak multiplier', () => {
    it('applies 1.0x multiplier for streak < 7 days', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);
      await setUserStreak(userId, 6);

      const points = await calculatePoints(userId, {
        rating: 4, // +5
        used_hint: false, // +3
        is_first_attempt: true, // +2
      });

      // (10 + 5 + 3 + 2) * 1.0 = 20
      expect(points).toBe(20);
    });

    it('applies 1.1x multiplier for streak >= 7 days', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);
      await setUserStreak(userId, 7);

      const points = await calculatePoints(userId, {
        rating: 4, // +5
        used_hint: false, // +3
        is_first_attempt: true, // +2
      });

      // floor((10 + 5 + 3 + 2) * 1.1) = floor(22) = 22
      expect(points).toBe(22);
    });

    it('applies 1.15x multiplier for streak >= 14 days', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);
      await setUserStreak(userId, 14);

      const points = await calculatePoints(userId, {
        rating: 4, // +5
        used_hint: false, // +3
        is_first_attempt: true, // +2
      });

      // floor((10 + 5 + 3 + 2) * 1.15) = floor(23) = 23
      expect(points).toBe(23);
    });

    it('applies 1.2x multiplier for streak >= 30 days', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);
      await setUserStreak(userId, 30);

      const points = await calculatePoints(userId, {
        rating: 4, // +5
        used_hint: false, // +3
        is_first_attempt: true, // +2
      });

      // floor((10 + 5 + 3 + 2) * 1.2) = floor(24) = 24
      expect(points).toBe(24);
    });

    it('floors the multiplied result', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);
      await setUserStreak(userId, 7); // 1.1x multiplier

      // Use values that produce a non-integer result
      const points = await calculatePoints(userId, {
        rating: 2, // +1, total = 11
        used_hint: true,
        is_first_attempt: false,
      });

      // floor(11 * 1.1) = floor(12.1) = 12
      expect(points).toBe(12);
    });
  });

  describe('combined bonuses', () => {
    it('calculates maximum possible points correctly', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);
      await setUserStreak(userId, 30); // 1.2x multiplier

      const points = await calculatePoints(userId, {
        is_correct: true,
        rating: 4, // +5
        used_hint: false, // +3
        is_first_attempt: true, // +2
        response_time_ms: 2000, // +5 (< 3s)
        subconcept_stability: 30, // Enables speed bonus
      });

      // floor((10 + 5 + 3 + 2 + 5) * 1.2) = floor(30) = 30
      expect(points).toBe(30);
    });

    it('combines all bonuses without streak multiplier', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      const points = await calculatePoints(userId, {
        is_correct: true,
        rating: 4, // +5
        used_hint: false, // +3
        is_first_attempt: true, // +2
        response_time_ms: 2000, // +5 (< 3s)
        subconcept_stability: 30, // Enables speed bonus
      });

      // 10 + 5 + 3 + 2 + 5 = 25
      expect(points).toBe(25);
    });
  });

  describe('edge cases', () => {
    it('handles null current_streak gracefully', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      // Explicitly set streak to null
      await supabase
        .from('profiles')
        .update({ current_streak: null })
        .eq('id', userId);

      const points = await calculatePoints(userId, {
        rating: 3,
        used_hint: true,
        is_first_attempt: false,
      });

      // Should use 1.0x multiplier (COALESCE handles null)
      // 10 + 3 = 13
      expect(points).toBe(13);
    });

    it('handles 0 response time', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      const points = await calculatePoints(userId, {
        rating: 1,
        used_hint: true,
        is_first_attempt: false,
        response_time_ms: 0,
        subconcept_stability: 30,
      });

      // 10 + 5 (speed) = 15
      expect(points).toBe(15);
    });

    it('handles very high stability', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      const points = await calculatePoints(userId, {
        rating: 1,
        used_hint: true,
        is_first_attempt: false,
        response_time_ms: 1000,
        subconcept_stability: 365, // One year
      });

      // 10 + 5 (speed) = 15
      expect(points).toBe(15);
    });
  });
});
