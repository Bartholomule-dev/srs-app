import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  LOCAL_SUPABASE_URL,
  LOCAL_SUPABASE_SERVICE_KEY,
} from '../../setup';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || LOCAL_SUPABASE_SERVICE_KEY;

const serviceClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

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

    // Get an exercise from seed data
    const { data: exercise } = await serviceClient
      .from('exercises')
      .select('id')
      .limit(1)
      .single();
    testExerciseId = exercise!.id;
  });

  afterAll(async () => {
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
