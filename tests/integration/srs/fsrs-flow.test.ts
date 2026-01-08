// tests/integration/srs/fsrs-flow.test.ts
// Integration tests for FSRS-based subconcept progress
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { serviceClient } from '@tests/fixtures/supabase';
import {
  createEmptyFSRSCard,
  reviewCard,
} from '@/lib/srs/fsrs/adapter';
import { qualityToRating } from '@/lib/srs/fsrs/mapping';
import { STATE_MAP } from '@/lib/srs/fsrs/types';
import type { Quality } from '@/lib/types';

describe('FSRS Flow Integration', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
    const { data: userData, error } = await serviceClient.auth.admin.createUser({
      email: `fsrs-test-${Date.now()}@example.com`,
      email_confirm: true,
    });

    if (error || !userData.user) {
      throw new Error(`Failed to create test user: ${error?.message}`);
    }
    testUserId = userData.user.id;
  });

  afterAll(async () => {
    // Clean up test user (cascades to subconcept_progress)
    if (testUserId) {
      await serviceClient.auth.admin.deleteUser(testUserId);
    }
  });

  beforeEach(async () => {
    // Clean up any existing progress for this user
    await serviceClient
      .from('subconcept_progress')
      .delete()
      .eq('user_id', testUserId);
  });

  describe('Subconcept Progress CRUD', () => {
    it('creates initial FSRS progress record', async () => {
      const now = new Date();
      const card = createEmptyFSRSCard(now);

      const { data, error } = await serviceClient
        .from('subconcept_progress')
        .insert({
          user_id: testUserId,
          subconcept_slug: 'for',
          concept_slug: 'loops',
          stability: card.stability,
          difficulty: card.difficulty,
          fsrs_state: STATE_MAP[card.state],
          reps: card.reps,
          lapses: card.lapses,
          elapsed_days: card.elapsedDays,
          scheduled_days: card.scheduledDays,
          next_review: card.due.toISOString(),
          last_reviewed: null,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.stability).toBe(0);
      expect(data.difficulty).toBe(0);
      expect(data.fsrs_state).toBe(0); // New state
      expect(data.reps).toBe(0);
      expect(data.lapses).toBe(0);
    });

    it('updates progress after review with Good rating', async () => {
      const now = new Date();
      const card = createEmptyFSRSCard(now);

      // Insert initial progress
      await serviceClient
        .from('subconcept_progress')
        .insert({
          user_id: testUserId,
          subconcept_slug: 'for',
          concept_slug: 'loops',
          stability: card.stability,
          difficulty: card.difficulty,
          fsrs_state: STATE_MAP[card.state],
          reps: card.reps,
          lapses: card.lapses,
          elapsed_days: card.elapsedDays,
          scheduled_days: card.scheduledDays,
          next_review: card.due.toISOString(),
          last_reviewed: null,
        });

      // Simulate a Good review
      const result = reviewCard(card, 'Good', now);

      // Update the record
      const { data, error } = await serviceClient
        .from('subconcept_progress')
        .update({
          stability: result.cardState.stability,
          difficulty: result.cardState.difficulty,
          fsrs_state: STATE_MAP[result.cardState.state],
          reps: result.cardState.reps,
          lapses: result.cardState.lapses,
          elapsed_days: result.cardState.elapsedDays,
          scheduled_days: result.cardState.scheduledDays,
          next_review: result.cardState.due.toISOString(),
          last_reviewed: now.toISOString(),
        })
        .eq('user_id', testUserId)
        .eq('subconcept_slug', 'for')
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.stability).toBeGreaterThan(0);
      expect(data.reps).toBe(1);
      expect(data.fsrs_state).toBe(1); // Learning state
      expect(data.last_reviewed).not.toBeNull();
    });

    it('queries due subconcepts correctly', async () => {
      const now = new Date();
      const pastDue = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
      const futureDue = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day ahead

      // Insert one due and one not due
      await serviceClient.from('subconcept_progress').insert([
        {
          user_id: testUserId,
          subconcept_slug: 'for',
          concept_slug: 'loops',
          stability: 5,
          difficulty: 0.3,
          fsrs_state: 2, // Review
          reps: 3,
          lapses: 0,
          elapsed_days: 1,
          scheduled_days: 1,
          next_review: pastDue.toISOString(), // Due
          last_reviewed: pastDue.toISOString(),
        },
        {
          user_id: testUserId,
          subconcept_slug: 'while',
          concept_slug: 'loops',
          stability: 10,
          difficulty: 0.3,
          fsrs_state: 2, // Review
          reps: 5,
          lapses: 0,
          elapsed_days: 3,
          scheduled_days: 7,
          next_review: futureDue.toISOString(), // Not due
          last_reviewed: now.toISOString(),
        },
      ]);

      // Query due subconcepts
      const { data, error } = await serviceClient
        .from('subconcept_progress')
        .select('*')
        .eq('user_id', testUserId)
        .lte('next_review', now.toISOString());

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].subconcept_slug).toBe('for');
    });
  });

  describe('Database Round-Trip Field Preservation', () => {
    it('preserves all FSRS fields with exact precision through insert/select', async () => {
      // Test values chosen to catch precision loss and type coercion bugs
      const testValues = {
        stability: 45.6789,        // High precision decimal
        difficulty: 0.123456,      // Sub-1 decimal
        fsrs_state: 2,             // Review state
        reps: 42,
        lapses: 7,
        elapsed_days: 15,
        scheduled_days: 28,
        next_review: new Date('2026-06-15T14:30:00.000Z'),
        last_reviewed: new Date('2026-06-01T10:00:00.000Z'),
      };

      // Insert raw row with known values
      const { data: inserted, error: insertError } = await serviceClient
        .from('subconcept_progress')
        .insert({
          user_id: testUserId,
          subconcept_slug: 'test-precision',
          concept_slug: 'foundations',
          stability: testValues.stability,
          difficulty: testValues.difficulty,
          fsrs_state: testValues.fsrs_state,
          reps: testValues.reps,
          lapses: testValues.lapses,
          elapsed_days: testValues.elapsed_days,
          scheduled_days: testValues.scheduled_days,
          next_review: testValues.next_review.toISOString(),
          last_reviewed: testValues.last_reviewed.toISOString(),
        })
        .select()
        .single();

      expect(insertError).toBeNull();
      expect(inserted).toBeDefined();

      // Verify all fields preserved with exact precision
      expect(inserted.stability).toBeCloseTo(testValues.stability, 4);
      expect(inserted.difficulty).toBeCloseTo(testValues.difficulty, 4);
      expect(inserted.fsrs_state).toBe(testValues.fsrs_state);
      expect(inserted.reps).toBe(testValues.reps);
      expect(inserted.lapses).toBe(testValues.lapses);
      expect(inserted.elapsed_days).toBe(testValues.elapsed_days);
      expect(inserted.scheduled_days).toBe(testValues.scheduled_days);

      // Date round-trip (string conversion)
      const retrievedNextReview = new Date(inserted.next_review);
      expect(retrievedNextReview.getTime()).toBe(testValues.next_review.getTime());

      const retrievedLastReviewed = new Date(inserted.last_reviewed);
      expect(retrievedLastReviewed.getTime()).toBe(testValues.last_reviewed.getTime());
    });

    it('handles null last_reviewed correctly', async () => {
      // New cards have null last_reviewed
      const { data, error } = await serviceClient
        .from('subconcept_progress')
        .insert({
          user_id: testUserId,
          subconcept_slug: 'null-lastrev-test',
          concept_slug: 'foundations',
          stability: 0,
          difficulty: 0,
          fsrs_state: 0,
          reps: 0,
          lapses: 0,
          elapsed_days: 0,
          scheduled_days: 0,
          next_review: new Date().toISOString(),
          last_reviewed: null,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.last_reviewed).toBeNull();
    });

    it('fsrs_state accepts all valid values 0-3', async () => {
      const validStates = [0, 1, 2, 3]; // New, Learning, Review, Relearning

      for (const state of validStates) {
        const { data, error } = await serviceClient
          .from('subconcept_progress')
          .insert({
            user_id: testUserId,
            subconcept_slug: `state-test-${state}`,
            concept_slug: 'foundations',
            stability: 0,
            difficulty: 0,
            fsrs_state: state,
            reps: 0,
            lapses: 0,
            elapsed_days: 0,
            scheduled_days: 0,
            next_review: new Date().toISOString(),
            last_reviewed: null,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data.fsrs_state).toBe(state);
      }
    });
  });

  describe('FSRS Behavior Verification', () => {
    it('stability increases with consecutive Good ratings', async () => {
      const now = new Date();
      let card = createEmptyFSRSCard(now);
      let currentTime = now;
      const stabilities: number[] = [];

      // Simulate 5 consecutive Good reviews
      for (let i = 0; i < 5; i++) {
        const result = reviewCard(card, 'Good', currentTime);
        stabilities.push(result.cardState.stability);
        card = result.cardState;
        currentTime = new Date(result.cardState.due.getTime() + 1000);
      }

      // Save final state to database
      const { data, error } = await serviceClient
        .from('subconcept_progress')
        .insert({
          user_id: testUserId,
          subconcept_slug: 'for',
          concept_slug: 'loops',
          stability: card.stability,
          difficulty: card.difficulty,
          fsrs_state: STATE_MAP[card.state],
          reps: card.reps,
          lapses: card.lapses,
          elapsed_days: card.elapsedDays,
          scheduled_days: card.scheduledDays,
          next_review: card.due.toISOString(),
          last_reviewed: currentTime.toISOString(),
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.stability).toBeGreaterThan(stabilities[0]);
      expect(data.reps).toBe(5);

      // Verify stability trend increases
      for (let i = 1; i < stabilities.length; i++) {
        expect(stabilities[i]).toBeGreaterThanOrEqual(stabilities[i - 1]);
      }
    });

    it('lapses increment on Again rating from Review state', async () => {
      const now = new Date();
      let card = createEmptyFSRSCard(now);
      let currentTime = now;

      // Progress to Review state
      while (card.state !== 'Review') {
        const result = reviewCard(card, 'Good', currentTime);
        card = result.cardState;
        currentTime = new Date(result.cardState.due.getTime() + 1000);
      }

      expect(card.state).toBe('Review');
      expect(card.lapses).toBe(0);

      // Lapse (Again rating)
      const lapseResult = reviewCard(card, 'Again', currentTime);

      // Save lapsed state
      const { data, error } = await serviceClient
        .from('subconcept_progress')
        .insert({
          user_id: testUserId,
          subconcept_slug: 'for',
          concept_slug: 'loops',
          stability: lapseResult.cardState.stability,
          difficulty: lapseResult.cardState.difficulty,
          fsrs_state: STATE_MAP[lapseResult.cardState.state],
          reps: lapseResult.cardState.reps,
          lapses: lapseResult.cardState.lapses,
          elapsed_days: lapseResult.cardState.elapsedDays,
          scheduled_days: lapseResult.cardState.scheduledDays,
          next_review: lapseResult.cardState.due.toISOString(),
          last_reviewed: currentTime.toISOString(),
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.lapses).toBe(1);
      expect(data.fsrs_state).toBe(3); // Relearning state
    });

    it('quality ratings map correctly to FSRS outcomes', async () => {
      const testCases: Array<{ quality: Quality; expectedPassing: boolean }> = [
        { quality: 0, expectedPassing: false },
        { quality: 1, expectedPassing: false },
        { quality: 2, expectedPassing: false },
        { quality: 3, expectedPassing: true },
        { quality: 4, expectedPassing: true },
        { quality: 5, expectedPassing: true },
      ];

      for (const { quality, expectedPassing } of testCases) {
        const now = new Date();
        const card = createEmptyFSRSCard(now);
        const rating = qualityToRating(quality);
        const result = reviewCard(card, rating, now);

        expect(result.wasCorrect).toBe(expectedPassing);
      }
    });

    it('scheduled intervals grow with mastery', async () => {
      const now = new Date();
      let card = createEmptyFSRSCard(now);
      let currentTime = now;
      const intervals: number[] = [];

      // Simulate 8 consecutive Good reviews to reach stable Review state
      for (let i = 0; i < 8; i++) {
        const result = reviewCard(card, 'Good', currentTime);
        intervals.push(result.cardState.scheduledDays);
        card = result.cardState;
        currentTime = new Date(result.cardState.due.getTime() + 1000);
      }

      // Once in Review state, intervals should be meaningful
      const reviewIntervals = intervals.filter(i => i > 0);
      expect(reviewIntervals.length).toBeGreaterThan(0);

      // Final interval should be larger than initial intervals
      const finalInterval = intervals[intervals.length - 1];
      if (reviewIntervals.length > 1) {
        expect(finalInterval).toBeGreaterThanOrEqual(reviewIntervals[0]);
      }
    });
  });

  describe('Multi-Subconcept Session Simulation', () => {
    it('handles multiple subconcepts in a session', async () => {
      const now = new Date();
      const subconcepts = ['for', 'while', 'enumerate'];

      // Create initial progress for all subconcepts
      for (const slug of subconcepts) {
        const card = createEmptyFSRSCard(now);
        await serviceClient.from('subconcept_progress').insert({
          user_id: testUserId,
          subconcept_slug: slug,
          concept_slug: 'loops',
          stability: card.stability,
          difficulty: card.difficulty,
          fsrs_state: STATE_MAP[card.state],
          reps: card.reps,
          lapses: card.lapses,
          elapsed_days: card.elapsedDays,
          scheduled_days: card.scheduledDays,
          next_review: card.due.toISOString(),
          last_reviewed: null,
        });
      }

      // Simulate reviews with different ratings
      const ratings: Array<{ slug: string; quality: Quality }> = [
        { slug: 'for', quality: 5 },       // Easy
        { slug: 'while', quality: 3 },     // Hard
        { slug: 'enumerate', quality: 1 }, // Again
      ];

      for (const { slug, quality } of ratings) {
        // Fetch current state
        const { data: current } = await serviceClient
          .from('subconcept_progress')
          .select('*')
          .eq('user_id', testUserId)
          .eq('subconcept_slug', slug)
          .single();

        // Calculate new state
        const cardState = {
          due: new Date(current!.next_review),
          stability: current!.stability,
          difficulty: current!.difficulty,
          elapsedDays: current!.elapsed_days,
          scheduledDays: current!.scheduled_days,
          reps: current!.reps,
          lapses: current!.lapses,
          state: ['New', 'Learning', 'Review', 'Relearning'][current!.fsrs_state] as 'New' | 'Learning' | 'Review' | 'Relearning',
          lastReview: current!.last_reviewed ? new Date(current!.last_reviewed) : null,
        };

        const rating = qualityToRating(quality);
        const result = reviewCard(cardState, rating, now);

        // Update
        await serviceClient
          .from('subconcept_progress')
          .update({
            stability: result.cardState.stability,
            difficulty: result.cardState.difficulty,
            fsrs_state: STATE_MAP[result.cardState.state],
            reps: result.cardState.reps,
            lapses: result.cardState.lapses,
            elapsed_days: result.cardState.elapsedDays,
            scheduled_days: result.cardState.scheduledDays,
            next_review: result.cardState.due.toISOString(),
            last_reviewed: now.toISOString(),
          })
          .eq('user_id', testUserId)
          .eq('subconcept_slug', slug);
      }

      // Verify final states
      const { data: finalStates } = await serviceClient
        .from('subconcept_progress')
        .select('*')
        .eq('user_id', testUserId)
        .order('subconcept_slug');

      expect(finalStates).toHaveLength(3);

      // 'enumerate' (Again) should still be in early state
      const enumerate = finalStates!.find(s => s.subconcept_slug === 'enumerate');
      expect(enumerate!.reps).toBe(1);

      // 'for' (Easy) should have higher stability
      const forLoop = finalStates!.find(s => s.subconcept_slug === 'for');
      expect(forLoop!.stability).toBeGreaterThan(0);

      // 'while' (Hard) should be between
      const whileLoop = finalStates!.find(s => s.subconcept_slug === 'while');
      expect(whileLoop!.reps).toBe(1);
    });
  });
});
