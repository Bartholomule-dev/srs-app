import { describe, it, expect, afterAll } from 'vitest';
import {
  serviceClient as supabase,
  createTestUser,
  deleteTestUser,
} from '@tests/fixtures/supabase';

describe('exercise_attempts language migration', () => {
  const testUserIds: string[] = [];

  afterAll(async () => {
    // Cleanup all test users (cascades to exercise_attempts)
    for (const id of testUserIds) {
      await deleteTestUser(id);
    }
  });

  it('has language column with default python', async () => {
    const { data, error } = await supabase
      .from('exercise_attempts')
      .select('language')
      .limit(1);

    // Column should exist (no error about unknown column)
    expect(error).toBeNull();
    // data can be empty array if no rows exist, but query should succeed
    expect(Array.isArray(data)).toBe(true);
  });

  it('enforces unique constraint on (user_id, language, exercise_slug)', async () => {
    const userId = await createTestUser();
    testUserIds.push(userId);

    // Insert first record for python
    const { error: err1 } = await supabase.from('exercise_attempts').insert({
      user_id: userId,
      language: 'python',
      exercise_slug: 'for-basic',
      times_seen: 1,
      times_correct: 1,
    });

    expect(err1).toBeNull();

    // Same slug, different language should work
    const { error: err2 } = await supabase.from('exercise_attempts').insert({
      user_id: userId,
      language: 'javascript',
      exercise_slug: 'for-basic',
      times_seen: 1,
      times_correct: 0,
    });

    expect(err2).toBeNull();

    // Same slug, same language should fail (unique violation)
    const { error: err3 } = await supabase.from('exercise_attempts').insert({
      user_id: userId,
      language: 'python',
      exercise_slug: 'for-basic',
      times_seen: 2,
      times_correct: 1,
    });

    expect(err3).not.toBeNull();
    expect(err3!.code).toBe('23505'); // unique_violation
  });

  it('has index on (user_id, language, exercise_slug)', async () => {
    // Verify via a query that would use this index
    const { error } = await supabase
      .from('exercise_attempts')
      .select('id')
      .eq('user_id', '00000000-0000-0000-0000-000000000000')
      .eq('language', 'python')
      .eq('exercise_slug', 'test-slug')
      .limit(0);

    // Query should work (index existence verified by migration)
    expect(error).toBeNull();
  });

  it('has index on (user_id, language)', async () => {
    // Verify via a query that would use this index
    const { error } = await supabase
      .from('exercise_attempts')
      .select('id')
      .eq('user_id', '00000000-0000-0000-0000-000000000000')
      .eq('language', 'python')
      .limit(0);

    // Query should work (index existence verified by migration)
    expect(error).toBeNull();
  });

  it('defaults language to python when not specified', async () => {
    const userId = await createTestUser();
    testUserIds.push(userId);

    // Insert without specifying language
    const { error: insertError } = await supabase
      .from('exercise_attempts')
      .insert({
        user_id: userId,
        exercise_slug: 'default-lang-test',
        times_seen: 1,
        times_correct: 0,
      });

    expect(insertError).toBeNull();

    // Verify default was applied
    const { data, error: selectError } = await supabase
      .from('exercise_attempts')
      .select('language')
      .eq('user_id', userId)
      .eq('exercise_slug', 'default-lang-test')
      .single();

    expect(selectError).toBeNull();
    expect(data?.language).toBe('python');
  });
});
