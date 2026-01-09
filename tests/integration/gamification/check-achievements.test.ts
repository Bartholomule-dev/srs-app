import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  serviceClient as supabase,
  createTestUser,
  deleteTestUser,
} from '@tests/fixtures/supabase';

describe('check_achievements RPC function', () => {
  let testUserId: string;

  beforeAll(async () => {
    testUserId = await createTestUser();
  });

  afterAll(async () => {
    if (testUserId) {
      await deleteTestUser(testUserId);
    }
  });

  beforeEach(async () => {
    // Clean up user data between tests
    await supabase.from('user_achievements').delete().eq('user_id', testUserId);
    await supabase.from('exercise_attempts').delete().eq('user_id', testUserId);
    await supabase.from('subconcept_progress').delete().eq('user_id', testUserId);
    await supabase.from('profiles').update({
      current_streak: 0,
      total_exercises_completed: 0,
    }).eq('id', testUserId);
  });

  describe('exercise count achievements', () => {
    it('unlocks first-steps after first graded exercise', async () => {
      await supabase.from('profiles').update({
        total_exercises_completed: 1,
      }).eq('id', testUserId);

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('first-steps');
    });

    it('unlocks century for 100 exercises', async () => {
      await supabase.from('profiles').update({
        total_exercises_completed: 100,
      }).eq('id', testUserId);

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('century');
    });

    it('unlocks half-k for 500 exercises', async () => {
      await supabase.from('profiles').update({
        total_exercises_completed: 500,
      }).eq('id', testUserId);

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('half-k');
    });

    it('unlocks thousand-strong for 1000 exercises', async () => {
      await supabase.from('profiles').update({
        total_exercises_completed: 1000,
      }).eq('id', testUserId);

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('thousand-strong');
    });
  });

  describe('streak achievements', () => {
    it('unlocks week-warrior at 7-day streak', async () => {
      await supabase.from('profiles').update({
        current_streak: 7,
      }).eq('id', testUserId);

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('week-warrior');
    });

    it('unlocks fortnight-fighter at 14-day streak', async () => {
      await supabase.from('profiles').update({
        current_streak: 14,
      }).eq('id', testUserId);

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('fortnight-fighter');
    });

    it('unlocks monthly-master at 30-day streak', async () => {
      await supabase.from('profiles').update({
        current_streak: 30,
      }).eq('id', testUserId);

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('monthly-master');
    });
  });

  describe('badge tier achievements', () => {
    it('unlocks bronze-age for first bronze badge (stability >= 1)', async () => {
      await supabase.from('subconcept_progress').insert({
        user_id: testUserId,
        subconcept_slug: 'test-subconcept',
        concept_slug: 'test-concept',
        stability: 2, // Bronze = >= 1 day
        difficulty: 0.5,
        fsrs_state: 2,
        reps: 3,
        lapses: 0,
      });

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('bronze-age');
    });

    it('unlocks silver-lining for first silver badge (stability >= 7)', async () => {
      await supabase.from('subconcept_progress').insert({
        user_id: testUserId,
        subconcept_slug: 'test-subconcept',
        concept_slug: 'test-concept',
        stability: 10, // Silver = >= 7 days
        difficulty: 0.5,
        fsrs_state: 2,
        reps: 5,
        lapses: 0,
      });

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('silver-lining');
    });

    it('unlocks gold-standard for first gold badge (stability >= 30)', async () => {
      await supabase.from('subconcept_progress').insert({
        user_id: testUserId,
        subconcept_slug: 'test-subconcept',
        concept_slug: 'test-concept',
        stability: 35, // Gold = >= 30 days
        difficulty: 0.5,
        fsrs_state: 2,
        reps: 10,
        lapses: 0,
      });

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('gold-standard');
    });

    it('unlocks platinum-club for first platinum badge (stability >= 90)', async () => {
      await supabase.from('subconcept_progress').insert({
        user_id: testUserId,
        subconcept_slug: 'test-subconcept',
        concept_slug: 'test-concept',
        stability: 95, // Platinum = >= 90 days
        difficulty: 0.5,
        fsrs_state: 2,
        reps: 20,
        lapses: 0,
      });

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('platinum-club');
    });

    it('unlocks pythonista for 65 gold badges (stability >= 30)', async () => {
      // Insert 65 subconcepts with gold-level stability
      const subconcepts = Array.from({ length: 65 }, (_, i) => ({
        user_id: testUserId,
        subconcept_slug: `subconcept-${i}`,
        concept_slug: 'test-concept',
        stability: 35, // Gold = >= 30 days
        difficulty: 0.5,
        fsrs_state: 2,
        reps: 10,
        lapses: 0,
      }));

      await supabase.from('subconcept_progress').insert(subconcepts);

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('pythonista');
    });
  });

  describe('idempotency', () => {
    it('is idempotent - does not re-unlock already unlocked', async () => {
      await supabase.from('profiles').update({
        current_streak: 7,
      }).eq('id', testUserId);

      // First check - should unlock
      const { data: first, error: firstError } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });
      expect(firstError).toBeNull();
      expect(first.newly_unlocked).toContain('week-warrior');

      // Second check - should NOT unlock again
      const { data: second, error: secondError } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });
      expect(secondError).toBeNull();
      expect(second.newly_unlocked).not.toContain('week-warrior');
    });

    it('returns all_unlocked list including previously unlocked', async () => {
      await supabase.from('profiles').update({
        current_streak: 7,
        total_exercises_completed: 100,
      }).eq('id', testUserId);

      // First check
      const { data: first } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });
      expect(first.newly_unlocked).toContain('week-warrior');
      expect(first.newly_unlocked).toContain('century');

      // Second check - newly_unlocked should be empty but all_unlocked has both
      const { data: second } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });
      expect(second.newly_unlocked).toHaveLength(0);
      expect(second.all_unlocked).toContain('week-warrior');
      expect(second.all_unlocked).toContain('century');
    });
  });

  describe('multiple unlocks', () => {
    it('unlocks multiple achievements in one call', async () => {
      await supabase.from('profiles').update({
        current_streak: 14, // week-warrior + fortnight-fighter
        total_exercises_completed: 1, // first-steps
      }).eq('id', testUserId);

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('first-steps');
      expect(data.newly_unlocked).toContain('week-warrior');
      expect(data.newly_unlocked).toContain('fortnight-fighter');
      expect(data.newly_unlocked).toHaveLength(3);
    });

    it('unlocks both count and tier achievements in one call', async () => {
      await supabase.from('profiles').update({
        total_exercises_completed: 100,
      }).eq('id', testUserId);

      await supabase.from('subconcept_progress').insert({
        user_id: testUserId,
        subconcept_slug: 'test-subconcept',
        concept_slug: 'test-concept',
        stability: 10, // Silver
        difficulty: 0.5,
        fsrs_state: 2,
        reps: 5,
        lapses: 0,
      });

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('century');
      expect(data.newly_unlocked).toContain('bronze-age');
      expect(data.newly_unlocked).toContain('silver-lining');
    });
  });

  describe('edge cases', () => {
    it('handles user with no progress', async () => {
      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toHaveLength(0);
      expect(data.all_unlocked).toHaveLength(0);
    });

    it('handles user with just below threshold', async () => {
      await supabase.from('profiles').update({
        current_streak: 6, // Just below 7
        total_exercises_completed: 99, // Just below 100
      }).eq('id', testUserId);

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).not.toContain('week-warrior');
      expect(data.newly_unlocked).not.toContain('century');
    });

    it('handles stability at exact threshold', async () => {
      await supabase.from('subconcept_progress').insert({
        user_id: testUserId,
        subconcept_slug: 'test-subconcept',
        concept_slug: 'test-concept',
        stability: 1.0, // Exactly at bronze threshold
        difficulty: 0.5,
        fsrs_state: 2,
        reps: 2,
        lapses: 0,
      });

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data.newly_unlocked).toContain('bronze-age');
    });
  });
});
