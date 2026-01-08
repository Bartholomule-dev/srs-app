import { describe, it, expect, afterAll } from 'vitest';
import {
  serviceClient as supabase,
  createTestUser,
  deleteTestUser,
} from '@tests/fixtures/supabase';

describe('Profiles Migration', () => {
  const testUserIds: string[] = [];

  afterAll(async () => {
    // Cleanup all test users
    for (const id of testUserIds) {
      await deleteTestUser(id);
    }
  });

  describe('Schema', () => {
    it('profiles table exists', async () => {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(0);

      expect(error).toBeNull();
    });

    it('has required columns with correct defaults', async () => {
      // Create a real auth user (profile is auto-created by trigger)
      const testId = await createTestUser();
      testUserIds.push(testId);

      const { data, error } = await supabase
        .from('profiles')
        .select()
        .eq('id', testId)
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        id: testId,
        display_name: null,
        avatar_url: null,
        preferred_language: 'python',
        daily_goal: 10,
        notification_time: null,
        current_streak: 0,
        longest_streak: 0,
        total_exercises_completed: 0,
      });
      // Username is auto-generated from the first 8 chars of the user ID
      expect(data?.username).toMatch(/^user_[a-f0-9]{8}$/);
      expect(data?.created_at).toBeDefined();
      expect(data?.updated_at).toBeDefined();
    });

    it('enforces unique username constraint', async () => {
      const testId1 = await createTestUser();
      const testId2 = await createTestUser();
      testUserIds.push(testId1, testId2);

      const username = `test_${Date.now()}`;

      await supabase
        .from('profiles')
        .update({ username })
        .eq('id', testId1);

      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', testId2);

      expect(error).not.toBeNull();
      expect(error?.code).toBe('23505'); // unique_violation
    });
  });
});
