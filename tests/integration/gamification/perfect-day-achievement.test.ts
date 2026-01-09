/**
 * Perfect Day Achievement Tests
 *
 * Tests the "perfect-day" achievement which requires:
 * - 100% first-attempt accuracy in a single session
 * - Minimum 10 cards in the session
 * - "First attempt" means rating >= 3 (Good or Easy) on first try
 *
 * Uses time-window grouping (1 hour) to identify sessions.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  serviceClient as supabase,
  createTestUser,
  deleteTestUser,
} from '@tests/fixtures/supabase';

describe('Perfect Day achievement', () => {
  let testUserId: string;

  beforeAll(async () => {
    testUserId = await createTestUser();
  });

  afterAll(async () => {
    if (testUserId) {
      await deleteTestUser(testUserId);
    }
  });

  beforeEach(async () => {
    // Clean up user data between tests
    await supabase.from('user_achievements').delete().eq('user_id', testUserId);
    await supabase.from('exercise_attempts').delete().eq('user_id', testUserId);
  });

  it('unlocks perfect-day for 10+ correct first-attempts in a session', async () => {
    const baseTime = new Date();

    // Insert 10 perfect attempts in same hour window
    const attempts = Array.from({ length: 10 }, (_, i) => ({
      user_id: testUserId,
      exercise_slug: `test-exercise-${i}`,
      is_correct: true,
      rating: 3, // Good rating (first-attempt correct)
      is_first_attempt: true,
      created_at: new Date(baseTime.getTime() + i * 60000).toISOString(), // 1 min apart
    }));

    await supabase.from('exercise_attempts').insert(attempts);

    const { data, error } = await supabase.rpc('check_achievements', {
      p_user_id: testUserId,
    });

    expect(error).toBeNull();
    expect(data.newly_unlocked).toContain('perfect-day');
  });

  it('unlocks with rating 4 (Easy) as well', async () => {
    const baseTime = new Date();

    // Insert 10 perfect attempts with Easy rating
    const attempts = Array.from({ length: 10 }, (_, i) => ({
      user_id: testUserId,
      exercise_slug: `test-exercise-easy-${i}`,
      is_correct: true,
      rating: 4, // Easy rating
      is_first_attempt: true,
      created_at: new Date(baseTime.getTime() + i * 60000).toISOString(),
    }));

    await supabase.from('exercise_attempts').insert(attempts);

    const { data, error } = await supabase.rpc('check_achievements', {
      p_user_id: testUserId,
    });

    expect(error).toBeNull();
    expect(data.newly_unlocked).toContain('perfect-day');
  });

  it('does not unlock if fewer than 10 attempts', async () => {
    const baseTime = new Date();

    // Only 9 attempts
    const attempts = Array.from({ length: 9 }, (_, i) => ({
      user_id: testUserId,
      exercise_slug: `test-exercise-${i}`,
      is_correct: true,
      rating: 3,
      is_first_attempt: true,
      created_at: new Date(baseTime.getTime() + i * 60000).toISOString(),
    }));

    await supabase.from('exercise_attempts').insert(attempts);

    const { data, error } = await supabase.rpc('check_achievements', {
      p_user_id: testUserId,
    });

    expect(error).toBeNull();
    expect(data.newly_unlocked).not.toContain('perfect-day');
  });

  it('does not unlock if any attempt was wrong (is_correct = false)', async () => {
    const baseTime = new Date();

    const attempts = Array.from({ length: 10 }, (_, i) => ({
      user_id: testUserId,
      exercise_slug: `test-exercise-${i}`,
      is_correct: i < 9, // Last one is wrong
      rating: i < 9 ? 3 : 1, // Again rating for wrong answer
      is_first_attempt: true,
      created_at: new Date(baseTime.getTime() + i * 60000).toISOString(),
    }));

    await supabase.from('exercise_attempts').insert(attempts);

    const { data, error } = await supabase.rpc('check_achievements', {
      p_user_id: testUserId,
    });

    expect(error).toBeNull();
    expect(data.newly_unlocked).not.toContain('perfect-day');
  });

  it('does not unlock if any attempt had low rating (< 3)', async () => {
    const baseTime = new Date();

    const attempts = Array.from({ length: 10 }, (_, i) => ({
      user_id: testUserId,
      exercise_slug: `test-exercise-${i}`,
      is_correct: true,
      rating: i < 9 ? 3 : 2, // Last one is Hard (rating 2)
      is_first_attempt: true,
      created_at: new Date(baseTime.getTime() + i * 60000).toISOString(),
    }));

    await supabase.from('exercise_attempts').insert(attempts);

    const { data, error } = await supabase.rpc('check_achievements', {
      p_user_id: testUserId,
    });

    expect(error).toBeNull();
    expect(data.newly_unlocked).not.toContain('perfect-day');
  });

  it('does not unlock if any attempt was not first attempt', async () => {
    const baseTime = new Date();

    const attempts = Array.from({ length: 10 }, (_, i) => ({
      user_id: testUserId,
      exercise_slug: `test-exercise-${i}`,
      is_correct: true,
      rating: 3,
      is_first_attempt: i < 9, // Last one was a retry
      created_at: new Date(baseTime.getTime() + i * 60000).toISOString(),
    }));

    await supabase.from('exercise_attempts').insert(attempts);

    const { data, error } = await supabase.rpc('check_achievements', {
      p_user_id: testUserId,
    });

    expect(error).toBeNull();
    expect(data.newly_unlocked).not.toContain('perfect-day');
  });

  it('works with multiple sessions - unlocks if any session is perfect', async () => {
    const baseTime = new Date();
    const twoHoursAgo = new Date(baseTime.getTime() - 2 * 60 * 60 * 1000);

    // First session (2 hours ago): 5 attempts, not enough
    const firstSession = Array.from({ length: 5 }, (_, i) => ({
      user_id: testUserId,
      exercise_slug: `test-exercise-old-${i}`,
      is_correct: true,
      rating: 3,
      is_first_attempt: true,
      created_at: new Date(twoHoursAgo.getTime() + i * 60000).toISOString(),
    }));

    // Second session (now): 10 perfect attempts
    const secondSession = Array.from({ length: 10 }, (_, i) => ({
      user_id: testUserId,
      exercise_slug: `test-exercise-new-${i}`,
      is_correct: true,
      rating: 3,
      is_first_attempt: true,
      created_at: new Date(baseTime.getTime() + i * 60000).toISOString(),
    }));

    await supabase.from('exercise_attempts').insert([...firstSession, ...secondSession]);

    const { data, error } = await supabase.rpc('check_achievements', {
      p_user_id: testUserId,
    });

    expect(error).toBeNull();
    expect(data.newly_unlocked).toContain('perfect-day');
  });

  it('handles attempts without rating (NULL) gracefully', async () => {
    const baseTime = new Date();

    // 10 attempts but some have NULL rating (legacy data)
    const attempts = Array.from({ length: 10 }, (_, i) => ({
      user_id: testUserId,
      exercise_slug: `test-exercise-${i}`,
      is_correct: true,
      rating: i < 8 ? 3 : null, // Last 2 have NULL rating
      is_first_attempt: true,
      created_at: new Date(baseTime.getTime() + i * 60000).toISOString(),
    }));

    await supabase.from('exercise_attempts').insert(attempts);

    const { data, error } = await supabase.rpc('check_achievements', {
      p_user_id: testUserId,
    });

    expect(error).toBeNull();
    // NULL rating should not count as perfect
    expect(data.newly_unlocked).not.toContain('perfect-day');
  });

  it('is idempotent - does not re-unlock already unlocked', async () => {
    const baseTime = new Date();

    const attempts = Array.from({ length: 10 }, (_, i) => ({
      user_id: testUserId,
      exercise_slug: `test-exercise-${i}`,
      is_correct: true,
      rating: 3,
      is_first_attempt: true,
      created_at: new Date(baseTime.getTime() + i * 60000).toISOString(),
    }));

    await supabase.from('exercise_attempts').insert(attempts);

    // First check - should unlock
    const { data: first, error: firstError } = await supabase.rpc('check_achievements', {
      p_user_id: testUserId,
    });
    expect(firstError).toBeNull();
    expect(first.newly_unlocked).toContain('perfect-day');

    // Second check - should NOT unlock again
    const { data: second, error: secondError } = await supabase.rpc('check_achievements', {
      p_user_id: testUserId,
    });
    expect(secondError).toBeNull();
    expect(second.newly_unlocked).not.toContain('perfect-day');
    expect(second.all_unlocked).toContain('perfect-day');
  });
});
