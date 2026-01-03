import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  LOCAL_SUPABASE_URL,
  LOCAL_SUPABASE_SERVICE_KEY,
} from '../../setup';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || LOCAL_SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

/**
 * Create a test user in auth.users (profile is auto-created by trigger)
 */
async function createTestUser(): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email: `test-${crypto.randomUUID()}@example.com`,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user.id;
}

/**
 * Delete a test user (cascades to profile and user_progress)
 */
async function deleteTestUser(userId: string): Promise<void> {
  await supabase.auth.admin.deleteUser(userId);
}

describe('User Progress Migration', () => {
  let testUserId: string;
  let testExerciseId: string;

  beforeAll(async () => {
    // Create a real auth user (profile is auto-created by trigger)
    testUserId = await createTestUser();

    const { data, error } = await supabase
      .from('exercises')
      .insert({
        language: 'python',
        category: 'test',
        difficulty: 1,
        title: 'Test',
        slug: `test-exercise-${crypto.randomUUID()}`,
        prompt: 'Test',
        expected_answer: 'test',
      })
      .select('id')
      .single();
    if (error) throw new Error(`Failed to create test exercise: ${error.message}`);
    testExerciseId = data!.id;
  });

  afterAll(async () => {
    await supabase.from('user_progress').delete().eq('user_id', testUserId);
    await supabase.from('exercises').delete().eq('id', testExerciseId);
    await deleteTestUser(testUserId);
  });

  describe('Schema', () => {
    it('user_progress table exists', async () => {
      const { error } = await supabase
        .from('user_progress')
        .select('id')
        .limit(0);

      expect(error).toBeNull();
    });

    it('has correct default SRS values', async () => {
      const { data, error } = await supabase
        .from('user_progress')
        .insert({
          user_id: testUserId,
          exercise_id: testExerciseId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        ease_factor: 2.5,
        interval: 0,
        repetitions: 0,
        times_seen: 0,
        times_correct: 0,
      });
      expect(data?.next_review).toBeDefined();
      expect(data?.last_reviewed).toBeNull();

      await supabase.from('user_progress').delete().eq('id', data!.id);
    });

    it('enforces unique user_id + exercise_id', async () => {
      await supabase.from('user_progress').insert({
        user_id: testUserId,
        exercise_id: testExerciseId,
      });

      const { error } = await supabase.from('user_progress').insert({
        user_id: testUserId,
        exercise_id: testExerciseId,
      });

      expect(error?.code).toBe('23505');

      await supabase.from('user_progress').delete().eq('user_id', testUserId);
    });

    it('enforces ease_factor bounds', async () => {
      const { error: lowError } = await supabase.from('user_progress').insert({
        user_id: testUserId,
        exercise_id: testExerciseId,
        ease_factor: 1.0, // Below minimum 1.3
      });
      expect(lowError).not.toBeNull();

      const { error: highError } = await supabase.from('user_progress').insert({
        user_id: testUserId,
        exercise_id: testExerciseId,
        ease_factor: 3.5, // Above maximum 3.0
      });
      expect(highError).not.toBeNull();
    });

    it('cascades delete when profile is deleted', async () => {
      // Create a separate test user for cascade test
      const tempUserId = await createTestUser();

      await supabase.from('user_progress').insert({
        user_id: tempUserId,
        exercise_id: testExerciseId,
      });

      // Delete the user (cascades to profile and user_progress)
      await deleteTestUser(tempUserId);

      const { data } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', tempUserId);

      expect(data).toEqual([]);
    });
  });
});
