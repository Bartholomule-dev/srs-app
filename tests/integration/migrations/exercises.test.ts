import { describe, it, expect, afterEach } from 'vitest';
import { serviceClient as supabase } from '@tests/fixtures/supabase';

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
          slug: 'test-exercise-all-fields',
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
          slug: 'test-minimal-defaults',
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
          slug: 'test-difficulty-constraint',
          prompt: 'Test',
          expected_answer: 'test',
        });

      expect(error).not.toBeNull();
      expect(error?.code).toBe('23514'); // check_violation
    });

    it('has slug column with unique constraint per language', async () => {
      // First insert two exercises with same language, different slugs
      const { data: data1, error: error1 } = await supabase
        .from('exercises')
        .insert({
          language: 'python',
          category: 'test',
          difficulty: 1,
          title: 'Test Slug 1',
          slug: 'test-unique-slug-1',
          prompt: 'Test',
          expected_answer: 'test',
        })
        .select()
        .single();

      if (data1?.id) testIds.push(data1.id);
      expect(error1).toBeNull();

      const { data: data2, error: error2 } = await supabase
        .from('exercises')
        .insert({
          language: 'python',
          category: 'test',
          difficulty: 1,
          title: 'Test Slug 2',
          slug: 'test-unique-slug-2',
          prompt: 'Test',
          expected_answer: 'test',
        })
        .select()
        .single();

      if (data2?.id) testIds.push(data2.id);
      expect(error2).toBeNull();

      // Verify both exercises have non-null slugs
      expect(data1?.slug).toBe('test-unique-slug-1');
      expect(data2?.slug).toBe('test-unique-slug-2');

      // Attempt to insert duplicate slug for same language - should fail
      const { error: dupeError } = await supabase
        .from('exercises')
        .insert({
          language: 'python',
          category: 'test',
          difficulty: 1,
          title: 'Test Slug Dupe',
          slug: 'test-unique-slug-1', // Duplicate!
          prompt: 'Test',
          expected_answer: 'test',
        });

      expect(dupeError).not.toBeNull();
      expect(dupeError?.code).toBe('23505'); // unique_violation

      // Same slug with different language should work
      const { data: data3, error: error3 } = await supabase
        .from('exercises')
        .insert({
          language: 'javascript', // Different language
          category: 'test',
          difficulty: 1,
          title: 'Test Slug JS',
          slug: 'test-unique-slug-1', // Same slug, different language
          prompt: 'Test',
          expected_answer: 'test',
        })
        .select()
        .single();

      if (data3?.id) testIds.push(data3.id);
      expect(error3).toBeNull();
      expect(data3?.slug).toBe('test-unique-slug-1');
    });
  });
});
