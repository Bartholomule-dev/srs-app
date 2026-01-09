import { describe, it, expect, afterAll } from 'vitest';
import {
  serviceClient as supabase,
  createTestUser,
  deleteTestUser,
} from '@tests/fixtures/supabase';

interface UpdateStreakResult {
  current_streak: number;
  longest_streak: number;
  freezes_used: number;
  freeze_earned: boolean;
}

describe('update_streak RPC', () => {
  const testUserIds: string[] = [];

  afterAll(async () => {
    // Cleanup all test users
    for (const id of testUserIds) {
      await deleteTestUser(id);
    }
  });

  /**
   * Helper to call the update_streak RPC function
   */
  async function updateStreak(
    userId: string,
    activityDate: string
  ): Promise<UpdateStreakResult> {
    const { data, error } = await supabase.rpc('update_streak', {
      p_user_id: userId,
      p_activity_date: activityDate,
    });

    if (error) throw error;
    return data as UpdateStreakResult;
  }

  /**
   * Helper to get profile data
   */
  async function getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, streak_freezes, last_activity_date, last_freeze_earned_at')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Helper to set up profile state for testing
   */
  async function setProfileState(
    userId: string,
    state: {
      current_streak?: number;
      longest_streak?: number;
      streak_freezes?: number;
      last_activity_date?: string | null;
      last_freeze_earned_at?: string | null;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update(state)
      .eq('id', userId);

    if (error) throw error;
  }

  describe('first activity', () => {
    it('sets streak to 1 for first activity', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      const result = await updateStreak(userId, '2026-01-08');

      expect(result.current_streak).toBe(1);
      expect(result.longest_streak).toBe(1);
      expect(result.freezes_used).toBe(0);
      expect(result.freeze_earned).toBe(false);
    });

    it('updates last_activity_date in profile', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      await updateStreak(userId, '2026-01-08');
      const profile = await getProfile(userId);

      expect(profile.last_activity_date).toBe('2026-01-08');
    });
  });

  describe('consecutive days', () => {
    it('increments streak for consecutive day', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      await setProfileState(userId, {
        current_streak: 5,
        longest_streak: 5,
        last_activity_date: '2026-01-07',
      });

      const result = await updateStreak(userId, '2026-01-08');

      expect(result.current_streak).toBe(6);
      expect(result.longest_streak).toBe(6);
      expect(result.freezes_used).toBe(0);
    });

    it('builds streak from 1 to 7 over consecutive days', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      // Start fresh
      let result = await updateStreak(userId, '2026-01-01');
      expect(result.current_streak).toBe(1);

      // Consecutive days
      await setProfileState(userId, { last_activity_date: '2026-01-01' });
      result = await updateStreak(userId, '2026-01-02');
      expect(result.current_streak).toBe(2);

      await setProfileState(userId, { last_activity_date: '2026-01-02' });
      result = await updateStreak(userId, '2026-01-03');
      expect(result.current_streak).toBe(3);
    });
  });

  describe('same day activity', () => {
    it('returns current state without changes', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      await setProfileState(userId, {
        current_streak: 5,
        longest_streak: 10,
        streak_freezes: 1,
        last_activity_date: '2026-01-08',
      });

      const result = await updateStreak(userId, '2026-01-08');

      expect(result.current_streak).toBe(5);
      expect(result.longest_streak).toBe(10);
      expect(result.freezes_used).toBe(0);
      expect(result.freeze_earned).toBe(false);
    });

    it('does not modify profile for same day', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      await setProfileState(userId, {
        current_streak: 5,
        longest_streak: 10,
        streak_freezes: 1,
        last_activity_date: '2026-01-08',
      });

      await updateStreak(userId, '2026-01-08');
      const profile = await getProfile(userId);

      expect(profile.current_streak).toBe(5);
      expect(profile.longest_streak).toBe(10);
      expect(profile.streak_freezes).toBe(1);
    });
  });

  describe('gap with freezes available', () => {
    it('uses 1 freeze for 1 day gap', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      await setProfileState(userId, {
        current_streak: 5,
        longest_streak: 5,
        streak_freezes: 2,
        last_activity_date: '2026-01-06', // 1 day gap to 2026-01-08
      });

      const result = await updateStreak(userId, '2026-01-08');

      expect(result.current_streak).toBe(6);
      expect(result.freezes_used).toBe(1);

      const profile = await getProfile(userId);
      expect(profile.streak_freezes).toBe(1);
    });

    it('uses 2 freezes for 2 day gap', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      await setProfileState(userId, {
        current_streak: 5,
        longest_streak: 5,
        streak_freezes: 2,
        last_activity_date: '2026-01-05', // 2 day gap to 2026-01-08
      });

      const result = await updateStreak(userId, '2026-01-08');

      expect(result.current_streak).toBe(6);
      expect(result.freezes_used).toBe(2);

      const profile = await getProfile(userId);
      expect(profile.streak_freezes).toBe(0);
    });

    it('continues streak after using freezes', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      await setProfileState(userId, {
        current_streak: 10,
        longest_streak: 15,
        streak_freezes: 1,
        last_activity_date: '2026-01-06',
      });

      const result = await updateStreak(userId, '2026-01-08');

      expect(result.current_streak).toBe(11);
      expect(result.longest_streak).toBe(15); // Unchanged
    });
  });

  describe('gap exceeds available freezes', () => {
    it('resets streak to 1 when gap too large', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      await setProfileState(userId, {
        current_streak: 20,
        longest_streak: 20,
        streak_freezes: 1,
        last_activity_date: '2026-01-05', // 2 day gap, only 1 freeze
      });

      const result = await updateStreak(userId, '2026-01-08');

      expect(result.current_streak).toBe(1);
      expect(result.longest_streak).toBe(20); // Preserved
      expect(result.freezes_used).toBe(0); // No freezes used when resetting
    });

    it('preserves freezes when resetting', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      await setProfileState(userId, {
        current_streak: 20,
        longest_streak: 20,
        streak_freezes: 1,
        last_activity_date: '2026-01-01', // Large gap
      });

      await updateStreak(userId, '2026-01-08');
      const profile = await getProfile(userId);

      expect(profile.streak_freezes).toBe(1); // Preserved
    });

    it('resets streak with no freezes available', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      await setProfileState(userId, {
        current_streak: 15,
        longest_streak: 15,
        streak_freezes: 0,
        last_activity_date: '2026-01-06', // 1 day gap, no freezes
      });

      const result = await updateStreak(userId, '2026-01-08');

      expect(result.current_streak).toBe(1);
      expect(result.longest_streak).toBe(15);
    });
  });

  describe('longest_streak updates', () => {
    it('updates longest_streak when exceeded', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      await setProfileState(userId, {
        current_streak: 10,
        longest_streak: 10,
        last_activity_date: '2026-01-07',
      });

      const result = await updateStreak(userId, '2026-01-08');

      expect(result.current_streak).toBe(11);
      expect(result.longest_streak).toBe(11);
    });

    it('does not update longest_streak when not exceeded', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      await setProfileState(userId, {
        current_streak: 5,
        longest_streak: 20,
        last_activity_date: '2026-01-07',
      });

      const result = await updateStreak(userId, '2026-01-08');

      expect(result.current_streak).toBe(6);
      expect(result.longest_streak).toBe(20);
    });
  });

  describe('freeze earning', () => {
    it('earns freeze at day 7', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      await setProfileState(userId, {
        current_streak: 6,
        longest_streak: 6,
        streak_freezes: 0,
        last_activity_date: '2026-01-07',
      });

      const result = await updateStreak(userId, '2026-01-08');

      expect(result.current_streak).toBe(7);
      expect(result.freeze_earned).toBe(true);

      const profile = await getProfile(userId);
      expect(profile.streak_freezes).toBe(1);
    });

    it('earns freeze at day 14', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      await setProfileState(userId, {
        current_streak: 13,
        longest_streak: 13,
        streak_freezes: 1,
        last_activity_date: '2026-01-07',
      });

      const result = await updateStreak(userId, '2026-01-08');

      expect(result.current_streak).toBe(14);
      expect(result.freeze_earned).toBe(true);

      const profile = await getProfile(userId);
      expect(profile.streak_freezes).toBe(2);
    });

    it('does not earn freeze when at cap (2)', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      await setProfileState(userId, {
        current_streak: 6,
        longest_streak: 6,
        streak_freezes: 2, // Already at cap
        last_activity_date: '2026-01-07',
      });

      const result = await updateStreak(userId, '2026-01-08');

      expect(result.current_streak).toBe(7);
      expect(result.freeze_earned).toBe(false);

      const profile = await getProfile(userId);
      expect(profile.streak_freezes).toBe(2);
    });

    it('does not earn freeze at non-7-day milestones', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      await setProfileState(userId, {
        current_streak: 5,
        longest_streak: 5,
        streak_freezes: 0,
        last_activity_date: '2026-01-07',
      });

      const result = await updateStreak(userId, '2026-01-08');

      expect(result.current_streak).toBe(6);
      expect(result.freeze_earned).toBe(false);
    });

    it('updates last_freeze_earned_at when earning freeze', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      await setProfileState(userId, {
        current_streak: 6,
        longest_streak: 6,
        streak_freezes: 0,
        last_activity_date: '2026-01-07',
        last_freeze_earned_at: null,
      });

      await updateStreak(userId, '2026-01-08');
      const profile = await getProfile(userId);

      expect(profile.last_freeze_earned_at).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles null current_streak gracefully', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      // Ensure null values
      await supabase
        .from('profiles')
        .update({
          current_streak: null,
          longest_streak: null,
          streak_freezes: null,
          last_activity_date: null,
        })
        .eq('id', userId);

      const result = await updateStreak(userId, '2026-01-08');

      expect(result.current_streak).toBe(1);
      expect(result.longest_streak).toBe(1);
    });

    it('handles consecutive first activities (tests null -> 1 -> 2)', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      // First activity
      let result = await updateStreak(userId, '2026-01-07');
      expect(result.current_streak).toBe(1);

      // Second consecutive day
      result = await updateStreak(userId, '2026-01-08');
      expect(result.current_streak).toBe(2);
    });

    it('handles activity after reset correctly', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      // Reset scenario
      await setProfileState(userId, {
        current_streak: 1, // Just reset
        longest_streak: 30,
        streak_freezes: 0,
        last_activity_date: '2026-01-07',
      });

      const result = await updateStreak(userId, '2026-01-08');

      expect(result.current_streak).toBe(2);
      expect(result.longest_streak).toBe(30);
    });
  });

  describe('complex scenarios', () => {
    it('recovers from gap using freeze then continues streak', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      // Day 5, have 1 freeze
      await setProfileState(userId, {
        current_streak: 5,
        longest_streak: 5,
        streak_freezes: 1,
        last_activity_date: '2026-01-05',
      });

      // Miss 1 day (Jan 6), return Jan 7
      let result = await updateStreak(userId, '2026-01-07');
      expect(result.current_streak).toBe(6);
      expect(result.freezes_used).toBe(1);

      // Continue Jan 8 - should reach day 7
      result = await updateStreak(userId, '2026-01-08');
      expect(result.current_streak).toBe(7);
      expect(result.freeze_earned).toBe(true); // Earned freeze at day 7
    });

    it('handles streak break after earning freeze', async () => {
      const userId = await createTestUser();
      testUserIds.push(userId);

      // At day 7 with freeze
      await setProfileState(userId, {
        current_streak: 7,
        longest_streak: 7,
        streak_freezes: 1,
        last_activity_date: '2026-01-01',
      });

      // Big gap - break streak
      const result = await updateStreak(userId, '2026-01-08');

      expect(result.current_streak).toBe(1);
      expect(result.longest_streak).toBe(7);

      const profile = await getProfile(userId);
      expect(profile.streak_freezes).toBe(1); // Freeze preserved
    });
  });
});
