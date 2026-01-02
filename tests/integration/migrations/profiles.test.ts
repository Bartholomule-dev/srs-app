import { describe, it, expect, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  LOCAL_SUPABASE_URL,
  LOCAL_SUPABASE_SERVICE_KEY,
} from '../../setup';

// Service client bypasses RLS for testing schema
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
 * Delete a test user (cascades to profile)
 */
async function deleteTestUser(userId: string): Promise<void> {
  await supabase.auth.admin.deleteUser(userId);
}

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
        username: null,
        display_name: null,
        avatar_url: null,
        preferred_language: 'python',
        daily_goal: 10,
        notification_time: null,
        current_streak: 0,
        longest_streak: 0,
        total_exercises_completed: 0,
      });
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
