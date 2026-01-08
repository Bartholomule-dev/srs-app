import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { serviceClient } from '@tests/fixtures/supabase';

describe('Stats Integration', () => {
  let testUserId: string;
  let testExerciseId: string;

  beforeAll(async () => {
    // Create test user via auth.admin
    const { data: userData } = await serviceClient.auth.admin.createUser({
      email: `stats-test-${Date.now()}@example.com`,
      email_confirm: true,
    });
    testUserId = userData.user!.id;

    // Create test exercise instead of relying on seed data
    const { data: exercise } = await serviceClient
      .from('exercises')
      .insert({
        language: 'python',
        category: 'test',
        difficulty: 1,
        title: 'Stats Flow Test Exercise',
        slug: `stats-flow-test-${Date.now()}`,
        prompt: 'Test prompt',
        expected_answer: 'test',
      })
      .select()
      .single();
    testExerciseId = exercise!.id;
  });

  afterAll(async () => {
    // Clean up test exercise
    if (testExerciseId) {
      await serviceClient.from('exercises').delete().eq('id', testExerciseId);
    }
    // Clean up test user (cascades to user_progress)
    if (testUserId) {
      await serviceClient.auth.admin.deleteUser(testUserId);
    }
  });

  beforeEach(async () => {
    // Clean up any existing progress for this user
    await serviceClient
      .from('user_progress')
      .delete()
      .eq('user_id', testUserId);
  });

  it('can query user_progress with last_reviewed date', async () => {
    const now = new Date();

    // Insert user_progress with today's date
    await serviceClient.from('user_progress').insert({
      user_id: testUserId,
      exercise_id: testExerciseId,
      last_reviewed: now.toISOString(),
      times_seen: 1,
      times_correct: 1,
    });

    // Query back
    const { data } = await serviceClient
      .from('user_progress')
      .select('*')
      .eq('user_id', testUserId);

    expect(data).toHaveLength(1);
    expect(data![0].last_reviewed).toBeDefined();
  });

  it('can update profile stats', async () => {
    // Update profile stats
    const { error } = await serviceClient
      .from('profiles')
      .update({
        current_streak: 3,
        longest_streak: 5,
        total_exercises_completed: 10,
      })
      .eq('id', testUserId);

    expect(error).toBeNull();

    // Verify the update
    const { data } = await serviceClient
      .from('profiles')
      .select('current_streak, longest_streak, total_exercises_completed')
      .eq('id', testUserId)
      .single();

    expect(data?.current_streak).toBe(3);
    expect(data?.longest_streak).toBe(5);
    expect(data?.total_exercises_completed).toBe(10);
  });
});
