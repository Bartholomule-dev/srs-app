import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  serviceClient as supabase,
  createTestUser,
  deleteTestUser,
} from '@tests/fixtures/supabase';

describe('Time-based achievements', () => {
  let testUserId: string;

  beforeAll(async () => {
    testUserId = await createTestUser();
  });

  afterAll(async () => {
    if (testUserId) {
      await supabase.from('user_achievements').delete().eq('user_id', testUserId);
      await supabase.from('exercise_attempts').delete().eq('user_id', testUserId);
      await deleteTestUser(testUserId);
    }
  });

  beforeEach(async () => {
    await supabase.from('user_achievements').delete().eq('user_id', testUserId);
    await supabase.from('exercise_attempts').delete().eq('user_id', testUserId);
  });

  describe('early-bird achievement', () => {
    it('unlocks early-bird for exercise at 6:00 AM UTC', async () => {
      // Insert exercise attempt at 6:00 AM UTC
      const earlyMorning = new Date();
      earlyMorning.setUTCHours(6, 0, 0, 0);

      await supabase.from('exercise_attempts').insert({
        user_id: testUserId,
        exercise_slug: 'test-exercise',
        is_correct: true,
        created_at: earlyMorning.toISOString(),
      });

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('early-bird');
    });

    it('unlocks early-bird for exercise at 5:00 AM UTC (boundary)', async () => {
      const earlyMorning = new Date();
      earlyMorning.setUTCHours(5, 0, 0, 0);

      await supabase.from('exercise_attempts').insert({
        user_id: testUserId,
        exercise_slug: 'test-exercise',
        is_correct: true,
        created_at: earlyMorning.toISOString(),
      });

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('early-bird');
    });

    it('unlocks early-bird for exercise at 7:59 AM UTC (boundary)', async () => {
      const earlyMorning = new Date();
      earlyMorning.setUTCHours(7, 59, 59, 0);

      await supabase.from('exercise_attempts').insert({
        user_id: testUserId,
        exercise_slug: 'test-exercise',
        is_correct: true,
        created_at: earlyMorning.toISOString(),
      });

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('early-bird');
    });

    it('does not unlock early-bird for exercise at 10:00 AM', async () => {
      const lateMorning = new Date();
      lateMorning.setUTCHours(10, 0, 0, 0);

      await supabase.from('exercise_attempts').insert({
        user_id: testUserId,
        exercise_slug: 'test-exercise',
        is_correct: true,
        created_at: lateMorning.toISOString(),
      });

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).not.toContain('early-bird');
    });

    it('does not unlock early-bird for exercise at 4:59 AM (just before range)', async () => {
      const tooEarly = new Date();
      tooEarly.setUTCHours(4, 59, 59, 0);

      await supabase.from('exercise_attempts').insert({
        user_id: testUserId,
        exercise_slug: 'test-exercise',
        is_correct: true,
        created_at: tooEarly.toISOString(),
      });

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).not.toContain('early-bird');
    });

    it('does not unlock early-bird for exercise at 8:00 AM (just after range)', async () => {
      const afterRange = new Date();
      afterRange.setUTCHours(8, 0, 0, 0);

      await supabase.from('exercise_attempts').insert({
        user_id: testUserId,
        exercise_slug: 'test-exercise',
        is_correct: true,
        created_at: afterRange.toISOString(),
      });

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).not.toContain('early-bird');
    });
  });

  describe('night-owl achievement', () => {
    it('unlocks night-owl for exercise at 2:00 AM UTC', async () => {
      const lateNight = new Date();
      lateNight.setUTCHours(2, 0, 0, 0);

      await supabase.from('exercise_attempts').insert({
        user_id: testUserId,
        exercise_slug: 'test-exercise',
        is_correct: true,
        created_at: lateNight.toISOString(),
      });

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('night-owl');
    });

    it('unlocks night-owl for exercise at 12:00 AM UTC (boundary)', async () => {
      const midnight = new Date();
      midnight.setUTCHours(0, 0, 0, 0);

      await supabase.from('exercise_attempts').insert({
        user_id: testUserId,
        exercise_slug: 'test-exercise',
        is_correct: true,
        created_at: midnight.toISOString(),
      });

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('night-owl');
    });

    it('unlocks night-owl for exercise at 4:59 AM UTC (boundary)', async () => {
      const lateNight = new Date();
      lateNight.setUTCHours(4, 59, 59, 0);

      await supabase.from('exercise_attempts').insert({
        user_id: testUserId,
        exercise_slug: 'test-exercise',
        is_correct: true,
        created_at: lateNight.toISOString(),
      });

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('night-owl');
    });

    it('does not unlock night-owl for exercise at 8:00 PM', async () => {
      const evening = new Date();
      evening.setUTCHours(20, 0, 0, 0);

      await supabase.from('exercise_attempts').insert({
        user_id: testUserId,
        exercise_slug: 'test-exercise',
        is_correct: true,
        created_at: evening.toISOString(),
      });

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).not.toContain('night-owl');
    });

    it('does not unlock night-owl for exercise at 5:00 AM (just after range)', async () => {
      const afterRange = new Date();
      afterRange.setUTCHours(5, 0, 0, 0);

      await supabase.from('exercise_attempts').insert({
        user_id: testUserId,
        exercise_slug: 'test-exercise',
        is_correct: true,
        created_at: afterRange.toISOString(),
      });

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      // Note: 5 AM unlocks early-bird but NOT night-owl
      expect(data.newly_unlocked).not.toContain('night-owl');
    });

    it('does not unlock night-owl for exercise at 11:59 PM (before midnight)', async () => {
      const beforeMidnight = new Date();
      beforeMidnight.setUTCHours(23, 59, 59, 0);

      await supabase.from('exercise_attempts').insert({
        user_id: testUserId,
        exercise_slug: 'test-exercise',
        is_correct: true,
        created_at: beforeMidnight.toISOString(),
      });

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).not.toContain('night-owl');
    });
  });

  describe('idempotency', () => {
    it('is idempotent for time-based achievements', async () => {
      const earlyMorning = new Date();
      earlyMorning.setUTCHours(6, 0, 0, 0);

      await supabase.from('exercise_attempts').insert({
        user_id: testUserId,
        exercise_slug: 'test-exercise',
        is_correct: true,
        created_at: earlyMorning.toISOString(),
      });

      // First check - should unlock
      const { data: first, error: firstError } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });
      expect(firstError).toBeNull();
      expect(first.newly_unlocked).toContain('early-bird');

      // Second check - should NOT unlock again
      const { data: second, error: secondError } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });
      expect(secondError).toBeNull();
      expect(second.newly_unlocked).not.toContain('early-bird');
      expect(second.all_unlocked).toContain('early-bird');
    });
  });

  describe('combined achievements', () => {
    it('can unlock both early-bird and night-owl for the same user', async () => {
      // Insert attempt at 2 AM (night-owl)
      const nightTime = new Date();
      nightTime.setUTCHours(2, 0, 0, 0);

      await supabase.from('exercise_attempts').insert({
        user_id: testUserId,
        exercise_slug: 'test-exercise-1',
        is_correct: true,
        created_at: nightTime.toISOString(),
      });

      // Insert attempt at 6 AM (early-bird)
      const morningTime = new Date();
      morningTime.setUTCHours(6, 0, 0, 0);

      await supabase.from('exercise_attempts').insert({
        user_id: testUserId,
        exercise_slug: 'test-exercise-2',
        is_correct: true,
        created_at: morningTime.toISOString(),
      });

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('early-bird');
      expect(data.newly_unlocked).toContain('night-owl');
    });
  });
});
