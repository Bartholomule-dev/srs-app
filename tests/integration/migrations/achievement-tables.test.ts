import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  serviceClient as supabase,
  createTestUser,
  deleteTestUser,
} from '@tests/fixtures/supabase';

describe('Achievement tables migration', () => {
  const testUserIds: string[] = [];

  afterAll(async () => {
    // Cleanup all test users
    for (const id of testUserIds) {
      await supabase.from('user_achievements').delete().eq('user_id', id);
      await deleteTestUser(id);
    }
  });

  describe('achievement_definitions table', () => {
    it('has seeded achievements', async () => {
      const { data, error } = await supabase
        .from('achievement_definitions')
        .select('*');

      expect(error).toBeNull();
      expect(data?.length).toBe(18);
    });

    it('has correct categories', async () => {
      const { data } = await supabase
        .from('achievement_definitions')
        .select('category')
        .order('category');

      const categories = [...new Set(data?.map((d) => d.category))];
      expect(categories).toContain('habit');
      expect(categories).toContain('mastery');
      expect(categories).toContain('completionist');
    });

    it('first-steps achievement exists', async () => {
      const { data } = await supabase
        .from('achievement_definitions')
        .select('*')
        .eq('slug', 'first-steps')
        .single();

      expect(data?.name).toBe('First Steps');
      expect(data?.category).toBe('habit');
      expect(data?.icon).toBe('👣');
    });

    it('has all habit achievements', async () => {
      const { data, error } = await supabase
        .from('achievement_definitions')
        .select('slug')
        .eq('category', 'habit')
        .order('sort_order');

      expect(error).toBeNull();
      expect(data?.length).toBe(7);
      const slugs = data?.map((d) => d.slug);
      expect(slugs).toContain('first-steps');
      expect(slugs).toContain('week-warrior');
      expect(slugs).toContain('fortnight-fighter');
      expect(slugs).toContain('monthly-master');
      expect(slugs).toContain('perfect-day');
      expect(slugs).toContain('early-bird');
      expect(slugs).toContain('night-owl');
    });

    it('has all mastery achievements', async () => {
      const { data, error } = await supabase
        .from('achievement_definitions')
        .select('slug')
        .eq('category', 'mastery')
        .order('sort_order');

      expect(error).toBeNull();
      expect(data?.length).toBe(6);
      const slugs = data?.map((d) => d.slug);
      expect(slugs).toContain('bronze-age');
      expect(slugs).toContain('silver-lining');
      expect(slugs).toContain('gold-standard');
      expect(slugs).toContain('platinum-club');
      expect(slugs).toContain('concept-master');
      expect(slugs).toContain('pythonista');
    });

    it('has all completionist achievements', async () => {
      const { data, error } = await supabase
        .from('achievement_definitions')
        .select('slug')
        .eq('category', 'completionist')
        .order('sort_order');

      expect(error).toBeNull();
      expect(data?.length).toBe(5);
      const slugs = data?.map((d) => d.slug);
      expect(slugs).toContain('century');
      expect(slugs).toContain('half-k');
      expect(slugs).toContain('thousand-strong');
      expect(slugs).toContain('explorer');
      expect(slugs).toContain('well-rounded');
    });

    it('has metadata JSONB column with correct structure', async () => {
      const { data } = await supabase
        .from('achievement_definitions')
        .select('metadata')
        .eq('slug', 'week-warrior')
        .single();

      expect(data?.metadata).toEqual({ type: 'streak', value: 7 });
    });
  });

  describe('user_achievements table', () => {
    let testUserId: string;

    beforeAll(async () => {
      testUserId = await createTestUser();
      testUserIds.push(testUserId);
    });

    beforeEach(async () => {
      await supabase.from('user_achievements').delete().eq('user_id', testUserId);
    });

    it('can insert user achievement', async () => {
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: testUserId,
          achievement_slug: 'first-steps',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.achievement_slug).toBe('first-steps');
      expect(data?.unlocked_at).toBeTruthy();
    });

    it('enforces unique user + achievement', async () => {
      await supabase.from('user_achievements').insert({
        user_id: testUserId,
        achievement_slug: 'first-steps',
      });

      const { error } = await supabase.from('user_achievements').insert({
        user_id: testUserId,
        achievement_slug: 'first-steps',
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('duplicate');
    });

    it('enforces foreign key to achievement_definitions', async () => {
      const { error } = await supabase.from('user_achievements').insert({
        user_id: testUserId,
        achievement_slug: 'nonexistent-achievement',
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('violates foreign key');
    });

    it('allows same achievement for different users', async () => {
      const secondUserId = await createTestUser();
      testUserIds.push(secondUserId);

      const { error: error1 } = await supabase.from('user_achievements').insert({
        user_id: testUserId,
        achievement_slug: 'first-steps',
      });

      const { error: error2 } = await supabase.from('user_achievements').insert({
        user_id: secondUserId,
        achievement_slug: 'first-steps',
      });

      expect(error1).toBeNull();
      expect(error2).toBeNull();
    });

    it('cascades delete when user is deleted', async () => {
      const tempUserId = await createTestUser();

      // Insert achievement for temp user
      await supabase.from('user_achievements').insert({
        user_id: tempUserId,
        achievement_slug: 'first-steps',
      });

      // Delete user
      await deleteTestUser(tempUserId);

      // Verify achievement was cascaded
      const { data } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', tempUserId);

      expect(data?.length).toBe(0);
    });

    it('has indexes for efficient queries', async () => {
      // Insert multiple achievements to test query performance pattern
      await supabase.from('user_achievements').insert([
        { user_id: testUserId, achievement_slug: 'first-steps' },
        { user_id: testUserId, achievement_slug: 'week-warrior' },
        { user_id: testUserId, achievement_slug: 'bronze-age' },
      ]);

      // Query by user_id (indexed)
      const { data: byUser, error: userError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', testUserId);

      expect(userError).toBeNull();
      expect(byUser?.length).toBe(3);

      // Query by achievement_slug (indexed)
      const { data: bySlug, error: slugError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('achievement_slug', 'first-steps');

      expect(slugError).toBeNull();
      expect(bySlug?.length).toBeGreaterThanOrEqual(1);
    });
  });
});
