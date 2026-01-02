import { describe, it, expect, afterEach } from 'vitest';
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

describe('Exercises Migration', () => {
  const testIds: string[] = [];

  afterEach(async () => {
    if (testIds.length > 0) {
      await supabase.from('exercises').delete().in('id', testIds);
      testIds.length = 0;
    }
  });

  describe('Schema', () => {
    it('exercises table exists', async () => {
      const { error } = await supabase
        .from('exercises')
        .select('id')
        .limit(0);

      expect(error).toBeNull();
    });

    it('can insert exercise with all fields', async () => {
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          language: 'python',
          category: 'loops',
          difficulty: 1,
          title: 'Test Exercise',
          prompt: 'Write a for loop',
          expected_answer: 'for i in range(5):',
          hints: ['Use range()'],
          explanation: 'Explanation here',
          tags: ['loops', 'beginner'],
        })
        .select()
        .single();

      if (data?.id) testIds.push(data.id);

      expect(error).toBeNull();
      expect(data?.id).toBeDefined();
      expect(data?.times_practiced).toBe(0);
      expect(data?.avg_success_rate).toBeNull();
    });

    it('has correct default values', async () => {
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          language: 'python',
          category: 'basics',
          difficulty: 1,
          title: 'Minimal Exercise',
          prompt: 'Test',
          expected_answer: 'answer',
        })
        .select()
        .single();

      if (data?.id) testIds.push(data.id);

      expect(error).toBeNull();
      expect(data?.hints).toEqual([]);
      expect(data?.tags).toEqual([]);
      expect(data?.explanation).toBeNull();
    });

    it('enforces difficulty range constraint', async () => {
      const { error } = await supabase
        .from('exercises')
        .insert({
          language: 'python',
          category: 'test',
          difficulty: 6, // Invalid: must be 1-5
          title: 'Test',
          prompt: 'Test',
          expected_answer: 'test',
        });

      expect(error).not.toBeNull();
      expect(error?.code).toBe('23514'); // check_violation
    });
  });
});
