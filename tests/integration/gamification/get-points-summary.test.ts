import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  serviceClient as supabase,
  createTestUser,
  deleteTestUser,
} from '@tests/fixtures/supabase';

describe('get_points_summary RPC function', () => {
  const testUserIds: string[] = [];

  afterAll(async () => {
    // Cleanup all test users (cascades to exercise_attempts)
    for (const id of testUserIds) {
      await deleteTestUser(id);
    }
  });

  /**
   * Helper to call get_points_summary RPC
   */
  async function getPointsSummary(
    userId: string,
    startDate: string,
    endDate: string
  ) {
    const { data, error } = await supabase.rpc('get_points_summary', {
      p_user_id: userId,
      p_start_date: startDate,
      p_end_date: endDate,
    });
    return { data, error };
  }

  /**
   * Helper to insert an exercise attempt with specific points and date
   */
  async function insertAttempt(
    userId: string,
    exerciseSlug: string,
    pointsEarned: number,
    attemptedAt?: Date
  ) {
    const { error } = await supabase.from('exercise_attempts').insert({
      user_id: userId,
      exercise_slug: exerciseSlug,
      points_earned: pointsEarned,
      attempted_at: attemptedAt?.toISOString() ?? new Date().toISOString(),
    });
    if (error) throw error;
  }

  describe('basic functionality', () => {
    it('returns zeros when no attempts exist', async () => {
      const testUserId = await createTestUser();
      testUserIds.push(testUserId);

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await getPointsSummary(testUserId, today, today);

      expect(error).toBeNull();
      expect(data).toEqual({
        today: 0,
        this_week: 0,
        daily_cap: 500,
        daily_cap_reached: false,
      });
    });

    it('calculates today\'s points correctly', async () => {
      const testUserId = await createTestUser();
      testUserIds.push(testUserId);

      // Insert attempts for today
      await insertAttempt(testUserId, 'test-ex-1', 50);
      await insertAttempt(testUserId, 'test-ex-2', 75);
      await insertAttempt(testUserId, 'test-ex-3', 25);

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await getPointsSummary(testUserId, today, today);

      expect(error).toBeNull();
      expect(data.today).toBe(150);
      expect(data.this_week).toBe(150);
      expect(data.daily_cap_reached).toBe(false);
    });

    it('calculates weekly points across date range', async () => {
      const testUserId = await createTestUser();
      testUserIds.push(testUserId);

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      // Insert attempts across different days
      await insertAttempt(testUserId, 'test-week-1', 100, today);
      await insertAttempt(testUserId, 'test-week-2', 80, yesterday);
      await insertAttempt(testUserId, 'test-week-3', 60, twoDaysAgo);
      await insertAttempt(testUserId, 'test-week-4', 40, threeDaysAgo);

      const startDate = threeDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      const { data, error } = await getPointsSummary(testUserId, startDate, endDate);

      expect(error).toBeNull();
      expect(data.today).toBe(100);
      expect(data.this_week).toBe(280); // 100 + 80 + 60 + 40
    });

    it('excludes points outside the date range', async () => {
      const testUserId = await createTestUser();
      testUserIds.push(testUserId);

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const fiveDaysAgo = new Date(today);
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      // Insert attempts - one outside range
      await insertAttempt(testUserId, 'test-range-1', 100, today);
      await insertAttempt(testUserId, 'test-range-2', 50, yesterday);
      await insertAttempt(testUserId, 'test-range-3', 200, fiveDaysAgo); // Outside range

      const startDate = yesterday.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      const { data, error } = await getPointsSummary(testUserId, startDate, endDate);

      expect(error).toBeNull();
      expect(data.this_week).toBe(150); // Only 100 + 50, not 200
    });
  });

  describe('daily cap detection', () => {
    it('detects daily cap reached when today >= 500', async () => {
      const testUserId = await createTestUser();
      testUserIds.push(testUserId);

      // Insert enough points to reach cap
      await insertAttempt(testUserId, 'test-cap-1', 200);
      await insertAttempt(testUserId, 'test-cap-2', 200);
      await insertAttempt(testUserId, 'test-cap-3', 100);

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await getPointsSummary(testUserId, today, today);

      expect(error).toBeNull();
      expect(data.today).toBe(500);
      expect(data.daily_cap).toBe(500);
      expect(data.daily_cap_reached).toBe(true);
    });

    it('detects daily cap reached when today > 500', async () => {
      const testUserId = await createTestUser();
      testUserIds.push(testUserId);

      // Insert points exceeding cap
      await insertAttempt(testUserId, 'test-over-cap-1', 300);
      await insertAttempt(testUserId, 'test-over-cap-2', 250);

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await getPointsSummary(testUserId, today, today);

      expect(error).toBeNull();
      expect(data.today).toBe(550);
      expect(data.daily_cap_reached).toBe(true);
    });

    it('does not flag cap when today < 500', async () => {
      const testUserId = await createTestUser();
      testUserIds.push(testUserId);

      // Insert points under cap
      await insertAttempt(testUserId, 'test-under-cap-1', 200);
      await insertAttempt(testUserId, 'test-under-cap-2', 200);

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await getPointsSummary(testUserId, today, today);

      expect(error).toBeNull();
      expect(data.today).toBe(400);
      expect(data.daily_cap_reached).toBe(false);
    });
  });

  describe('user isolation', () => {
    it('only counts points for the specified user', async () => {
      const testUserId1 = await createTestUser();
      const testUserId2 = await createTestUser();
      testUserIds.push(testUserId1, testUserId2);

      // Insert points for both users
      await insertAttempt(testUserId1, 'test-iso-1', 100);
      await insertAttempt(testUserId2, 'test-iso-2', 200);

      const today = new Date().toISOString().split('T')[0];

      const { data: data1 } = await getPointsSummary(testUserId1, today, today);
      const { data: data2 } = await getPointsSummary(testUserId2, today, today);

      expect(data1.today).toBe(100);
      expect(data2.today).toBe(200);
    });
  });
});
