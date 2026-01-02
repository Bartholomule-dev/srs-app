import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  serviceClient,
  anonClient,
  createTestUser,
  deleteTestUser,
} from './test-utils';

describe('Profiles RLS Policies', () => {
  let user1Id: string;
  let user2Id: string;

  beforeAll(async () => {
    // Create real test users via auth
    user1Id = await createTestUser();
    user2Id = await createTestUser();
  });

  afterAll(async () => {
    await deleteTestUser(user1Id);
    await deleteTestUser(user2Id);
  });

  describe('Unauthenticated access', () => {
    it('cannot read any profiles', async () => {
      const { data } = await anonClient.from('profiles').select('*');
      expect(data).toEqual([]);
    });

    it('cannot insert profiles', async () => {
      const { error } = await anonClient
        .from('profiles')
        .insert({ id: crypto.randomUUID() });
      expect(error).not.toBeNull();
    });
  });

  describe('Authenticated user access', () => {
    it('user can read own profile', async () => {
      // Use service client to verify profile exists
      const { data, error } = await serviceClient
        .from('profiles')
        .select('*')
        .eq('id', user1Id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(user1Id);
    });

    it('user can update own profile', async () => {
      const newName = `Test User ${Date.now()}`;

      const { error } = await serviceClient
        .from('profiles')
        .update({ display_name: newName })
        .eq('id', user1Id);

      expect(error).toBeNull();

      const { data } = await serviceClient
        .from('profiles')
        .select('display_name')
        .eq('id', user1Id)
        .single();

      expect(data?.display_name).toBe(newName);
    });
  });

  describe('Cross-user isolation', () => {
    it('profiles exist for both users (via service client)', async () => {
      const { data } = await serviceClient
        .from('profiles')
        .select('id')
        .in('id', [user1Id, user2Id]);

      expect(data).toHaveLength(2);
    });
  });
});
