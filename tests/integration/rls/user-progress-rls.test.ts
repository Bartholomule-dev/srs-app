import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  serviceClient,
  anonClient,
  createTestUser,
  deleteTestUser,
} from './test-utils';

describe('User Progress RLS Policies', () => {
  let userId: string;
  let otherUserId: string;
  let exerciseId: string;

  beforeAll(async () => {
    userId = await createTestUser();
    otherUserId = await createTestUser();

    const { data, error } = await serviceClient
      .from('exercises')
      .insert({
        language: 'python',
        category: 'test',
        difficulty: 1,
        title: 'RLS Test',
        slug: `rls-test-exercise-${crypto.randomUUID()}`,
        prompt: 'Test',
        expected_answer: 'test',
      })
      .select('id')
      .single();
    if (error) throw new Error(`Failed to create test exercise: ${error.message}`);
    exerciseId = data!.id;

    // Create progress for user
    await serviceClient.from('user_progress').insert({
      user_id: userId,
      exercise_id: exerciseId,
    });
  });

  afterAll(async () => {
    await serviceClient.from('user_progress').delete().eq('user_id', userId);
    await serviceClient.from('user_progress').delete().eq('user_id', otherUserId);
    await serviceClient.from('exercises').delete().eq('id', exerciseId);
    await deleteTestUser(userId);
    await deleteTestUser(otherUserId);
  });

  describe('Unauthenticated access', () => {
    it('cannot read any progress', async () => {
      const { data } = await anonClient.from('user_progress').select('*');
      expect(data).toEqual([]);
    });

    it('cannot insert progress', async () => {
      const { error } = await anonClient.from('user_progress').insert({
        user_id: userId,
        exercise_id: exerciseId,
      });
      expect(error).not.toBeNull();
    });
  });

  describe('Authenticated user access', () => {
    it('user can read own progress', async () => {
      const { data, error } = await serviceClient
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('user can update own progress', async () => {
      const { error } = await serviceClient
        .from('user_progress')
        .update({ times_seen: 5 })
        .eq('user_id', userId);

      expect(error).toBeNull();
    });
  });

  describe('Cross-user isolation', () => {
    it('other user has no progress (RLS blocks)', async () => {
      const { data } = await serviceClient
        .from('user_progress')
        .select('*')
        .eq('user_id', otherUserId);

      expect(data).toEqual([]);
    });
  });
});
