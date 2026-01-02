import { describe, it, expect, afterEach } from 'vitest';
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

describe('Profiles Migration', () => {
  const testIds: string[] = [];

  afterEach(async () => {
    // Cleanup test data
    if (testIds.length > 0) {
      await supabase.from('profiles').delete().in('id', testIds);
      testIds.length = 0;
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
      const testId = crypto.randomUUID();
      testIds.push(testId);

      const { data, error } = await supabase
        .from('profiles')
        .insert({ id: testId })
        .select()
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
      const testId1 = crypto.randomUUID();
      const testId2 = crypto.randomUUID();
      const username = `test_${Date.now()}`;
      testIds.push(testId1);

      await supabase.from('profiles').insert({ id: testId1, username });

      const { error } = await supabase
        .from('profiles')
        .insert({ id: testId2, username });

      expect(error).not.toBeNull();
      expect(error?.code).toBe('23505'); // unique_violation
    });
  });
});
