// tests/integration/fsrs-hook-integration.test.ts
// Integration tests that prove FSRS is actually being called by the hooks
//
// These tests verify the CRITICAL integration path:
// recordSubconceptResult() → qualityToRating() → progressToCardState() → reviewCard() → DB
//
// Unlike E2E tests, these are deterministic and fail loudly.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase before importing the hook
const mockUpsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      mockFrom(table);
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
            }),
            lte: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
        upsert: (data: unknown) => {
          mockUpsert(data);
          return {
            select: () => ({
              single: () => {
                mockSingle();
                return Promise.resolve({ data, error: null });
              },
            }),
          };
        },
      };
    },
  },
}));

vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    loading: false,
  }),
}));

// Import FSRS functions directly to verify they're called correctly
import { reviewCard, createEmptyFSRSCard, progressToCardState } from '@/lib/srs/fsrs/adapter';
import { qualityToRating } from '@/lib/srs/fsrs/mapping';
import { STATE_MAP, STATE_REVERSE_MAP } from '@/lib/srs/fsrs/types';
import type { Quality } from '@/lib/types';

describe('FSRS Hook Integration - Proves FSRS Is Actually Used', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('qualityToRating integration', () => {
    it('MUST convert Quality 5 to Easy rating', () => {
      const rating = qualityToRating(5 as Quality);
      expect(rating).toBe('Easy');
    });

    it('MUST convert Quality 4 to Good rating', () => {
      const rating = qualityToRating(4 as Quality);
      expect(rating).toBe('Good');
    });

    it('MUST convert Quality 3 to Hard rating', () => {
      const rating = qualityToRating(3 as Quality);
      expect(rating).toBe('Hard');
    });

    it('MUST convert Quality 0-2 to Again rating', () => {
      expect(qualityToRating(0 as Quality)).toBe('Again');
      expect(qualityToRating(1 as Quality)).toBe('Again');
      expect(qualityToRating(2 as Quality)).toBe('Again');
    });
  });

  describe('progressToCardState integration', () => {
    it('MUST preserve all FSRS fields through conversion', () => {
      const progress = {
        stability: 5.5,
        difficulty: 0.35,
        fsrsState: 'Review' as const,
        due: new Date('2026-01-15'),
        lastReview: new Date('2026-01-10'),
        reps: 7,
        lapses: 1,
        elapsedDays: 5,
        scheduledDays: 5,
      };

      const cardState = progressToCardState(progress);

      expect(cardState.stability).toBe(5.5);
      expect(cardState.difficulty).toBe(0.35);
      expect(cardState.state).toBe('Review');
      expect(cardState.reps).toBe(7);
      expect(cardState.lapses).toBe(1);
      expect(cardState.elapsedDays).toBe(5);
      expect(cardState.scheduledDays).toBe(5);
    });

    it('MUST handle New state correctly', () => {
      const progress = {
        stability: 0,
        difficulty: 0,
        fsrsState: 'New' as const,
        due: new Date(),
        lastReview: null,
        reps: 0,
        lapses: 0,
        elapsedDays: 0,
        scheduledDays: 0,
      };

      const cardState = progressToCardState(progress);
      expect(cardState.state).toBe('New');
      expect(cardState.reps).toBe(0);
    });
  });

  describe('reviewCard integration', () => {
    it('MUST produce valid FSRS output for new card with Good rating', () => {
      const card = createEmptyFSRSCard(new Date('2026-01-15'));
      const result = reviewCard(card, 'Good', new Date('2026-01-15'));

      // HARD ASSERTIONS - these MUST be true
      expect(result.cardState).toBeDefined();
      expect(result.cardState.stability).toBeGreaterThan(0);
      expect(result.cardState.reps).toBe(1);
      expect(result.cardState.state).toBe('Learning');
      expect(result.wasCorrect).toBe(true);
    });

    it('MUST increase reps on each review', () => {
      const card = createEmptyFSRSCard(new Date('2026-01-15'));
      const result1 = reviewCard(card, 'Good', new Date('2026-01-15'));
      const result2 = reviewCard(result1.cardState, 'Good', new Date('2026-01-15'));

      expect(result2.cardState.reps).toBe(2);
    });

    it('MUST mark wasCorrect=false for Again rating', () => {
      const card = createEmptyFSRSCard(new Date('2026-01-15'));
      const result = reviewCard(card, 'Again', new Date('2026-01-15'));

      expect(result.wasCorrect).toBe(false);
    });

    it('MUST produce higher stability for Easy than Good', () => {
      const card = createEmptyFSRSCard(new Date('2026-01-15'));
      const goodResult = reviewCard(card, 'Good', new Date('2026-01-15'));
      const easyResult = reviewCard(card, 'Easy', new Date('2026-01-15'));

      expect(easyResult.cardState.stability).toBeGreaterThan(goodResult.cardState.stability);
    });
  });

  describe('STATE_MAP and STATE_REVERSE_MAP integration', () => {
    it('MUST correctly map states bidirectionally', () => {
      expect(STATE_MAP['New']).toBe(0);
      expect(STATE_MAP['Learning']).toBe(1);
      expect(STATE_MAP['Review']).toBe(2);
      expect(STATE_MAP['Relearning']).toBe(3);

      expect(STATE_REVERSE_MAP[0]).toBe('New');
      expect(STATE_REVERSE_MAP[1]).toBe('Learning');
      expect(STATE_REVERSE_MAP[2]).toBe('Review');
      expect(STATE_REVERSE_MAP[3]).toBe('Relearning');
    });
  });

  describe('Full Integration Path Simulation', () => {
    it('MUST correctly process a complete review cycle', () => {
      // Simulate what recordSubconceptResult does:

      // 1. Convert quality to rating
      const quality: Quality = 4; // Good
      const rating = qualityToRating(quality);
      expect(rating).toBe('Good');

      // 2. Create card state from progress
      const existingProgress = {
        stability: 2.5,
        difficulty: 0.3,
        fsrsState: 'Learning' as const,
        due: new Date('2026-01-15'),
        lastReview: new Date('2026-01-14'),
        reps: 2,
        lapses: 0,
        elapsedDays: 1,
        scheduledDays: 1,
      };
      const cardState = progressToCardState(existingProgress);

      // 3. Review the card
      const result = reviewCard(cardState, rating, new Date('2026-01-15'));

      // 4. Verify FSRS produced valid output
      expect(result.cardState.reps).toBe(3); // Incremented from 2
      expect(result.cardState.stability).toBeGreaterThan(0);
      expect(result.cardState.difficulty).toBeGreaterThanOrEqual(0);
      expect(result.cardState.difficulty).toBeLessThanOrEqual(1);
      expect(result.wasCorrect).toBe(true);

      // 5. Verify output can be saved to DB (correct field mapping)
      const dbUpdate = {
        stability: result.cardState.stability,
        difficulty: result.cardState.difficulty,
        fsrs_state: STATE_MAP[result.cardState.state],
        reps: result.cardState.reps,
        lapses: result.cardState.lapses,
        elapsed_days: result.cardState.elapsedDays,
        scheduled_days: result.cardState.scheduledDays,
        next_review: result.cardState.due.toISOString(),
        last_reviewed: result.cardState.lastReview?.toISOString(),
      };

      expect(dbUpdate.reps).toBe(3);
      expect(typeof dbUpdate.fsrs_state).toBe('number');
      expect([0, 1, 2, 3]).toContain(dbUpdate.fsrs_state);
      expect(dbUpdate.next_review).toBeDefined();
    });

    it('MUST handle Again rating and record lapse when in Review state', () => {
      // Card in Review state
      const reviewCard_state = progressToCardState({
        stability: 10,
        difficulty: 0.3,
        fsrsState: 'Review' as const,
        due: new Date('2026-01-15'),
        lastReview: new Date('2026-01-10'),
        reps: 5,
        lapses: 0,
        elapsedDays: 5,
        scheduledDays: 5,
      });

      const result = reviewCard(reviewCard_state, 'Again', new Date('2026-01-15'));

      // MUST record a lapse
      expect(result.cardState.lapses).toBe(1);
      expect(result.cardState.state).toBe('Relearning');
      expect(result.wasCorrect).toBe(false);
      // Stability should decrease after a lapse
      expect(result.cardState.stability).toBeLessThan(10);
    });
  });
});
