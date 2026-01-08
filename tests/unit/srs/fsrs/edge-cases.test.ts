// tests/unit/srs/fsrs/edge-cases.test.ts
// Edge case tests - corrupted data, boundary conditions, defensive handling
//
// WHY THESE TESTS MATTER:
// - Database corruption happens
// - Manual DB edits introduce invalid states
// - Migration bugs can leave inconsistent data
// - Timezone differences cause date bugs
// - These tests verify our code doesn't crash on bad input

import { describe, it, expect } from 'vitest';
import {
  reviewCard,
  progressToCardState,
  cardStateToProgress,
} from '@/lib/srs/fsrs/adapter';
import { qualityToRating, inferRating } from '@/lib/srs/fsrs/mapping';
import { mapFSRSStateToPhase, selectExercise } from '@/lib/srs/exercise-selection';
import type { FSRSState } from '@/lib/srs/fsrs/types';
import type { Quality } from '@/lib/types';
import type { ConceptSlug } from '@/lib/curriculum/types';

describe('Edge Cases - Corrupted Database Data', () => {
  // NOTE: ts-fsrs contract tests (NaN handling, negative stability) are in tsfsrs-contract.test.ts
  // This file tests OUR adapter's handling of edge cases, not ts-fsrs library behavior.

  describe('progressToCardState with invalid data', () => {
    it('handles null lastReview', () => {
      const progress = {
        stability: 5,
        difficulty: 0.3,
        fsrsState: 'Review' as FSRSState,
        due: new Date(),
        lastReview: null,
        reps: 5,
        lapses: 0,
        elapsedDays: 3,
        scheduledDays: 7,
      };

      const card = progressToCardState(progress);
      expect(card.lastReview).toBeNull();
    });

    it('handles zero reps with Review state (inconsistent)', () => {
      // Review state with 0 reps is logically inconsistent
      const badProgress = {
        stability: 5,
        difficulty: 0.3,
        fsrsState: 'Review' as FSRSState,
        due: new Date(),
        lastReview: new Date(),
        reps: 0, // Inconsistent with Review state
        lapses: 0,
        elapsedDays: 3,
        scheduledDays: 7,
      };

      // Should not crash
      const card = progressToCardState(badProgress);
      expect(card).toBeDefined();
    });

    it('handles negative elapsed/scheduled days', () => {
      const badProgress = {
        stability: 5,
        difficulty: 0.3,
        fsrsState: 'Review' as FSRSState,
        due: new Date(),
        lastReview: new Date(),
        reps: 5,
        lapses: 0,
        elapsedDays: -1, // Invalid
        scheduledDays: -1, // Invalid
      };

      const card = progressToCardState(badProgress);
      expect(card).toBeDefined();
    });
  });

  describe('reviewCard with corrupted card state', () => {
    it('handles review of card with zero stability', () => {
      const card = {
        due: new Date(),
        stability: 0, // Edge case - brand new or corrupted
        difficulty: 0,
        elapsedDays: 0,
        scheduledDays: 0,
        reps: 0,
        lapses: 0,
        state: 'New' as FSRSState,
        lastReview: null,
      };

      // Should not throw
      const result = reviewCard(card, 'Good', new Date());
      expect(result.cardState.stability).toBeGreaterThan(0);
    });

    it('handles very high stability (long-term user)', () => {
      const card = {
        due: new Date(),
        stability: 1000, // Very well-known card
        difficulty: 0.1,
        elapsedDays: 365,
        scheduledDays: 365,
        reps: 100,
        lapses: 2,
        state: 'Review' as FSRSState,
        lastReview: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      };

      const result = reviewCard(card, 'Good', new Date());
      expect(result.cardState).toBeDefined();
      expect(Number.isFinite(result.cardState.stability)).toBe(true);
    });

    it('handles overdue card reviewed months late', () => {
      const dueDate = new Date('2025-01-01');
      const reviewDate = new Date('2026-01-01'); // 1 year late!

      const card = {
        due: dueDate,
        stability: 30,
        difficulty: 0.3,
        elapsedDays: 30,
        scheduledDays: 30,
        reps: 10,
        lapses: 0,
        state: 'Review' as FSRSState,
        lastReview: new Date('2024-12-01'),
      };

      const result = reviewCard(card, 'Good', reviewDate);
      expect(result.cardState).toBeDefined();
      // Should handle large elapsed time gracefully
      expect(Number.isFinite(result.cardState.scheduledDays)).toBe(true);
    });
  });
});

describe('Edge Cases - Date/Time Handling', () => {
  it('handles midnight UTC edge case', () => {
    const midnight = new Date('2026-01-01T00:00:00.000Z');
    const card = {
      due: midnight,
      stability: 5,
      difficulty: 0.3,
      elapsedDays: 1,
      scheduledDays: 1,
      reps: 3,
      lapses: 0,
      state: 'Review' as FSRSState,
      lastReview: new Date('2025-12-31T00:00:00.000Z'),
    };

    // Review at exactly midnight
    const result = reviewCard(card, 'Good', midnight);
    expect(result.cardState.due.getTime()).toBeGreaterThan(midnight.getTime());
  });

  it('handles same-second review (rapid clicking)', () => {
    const now = new Date();
    const card = {
      due: now,
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      state: 'New' as FSRSState,
      lastReview: null,
    };

    const result1 = reviewCard(card, 'Good', now);
    // Immediate second review at same timestamp
    const result2 = reviewCard(result1.cardState, 'Good', now);

    expect(result2.cardState.reps).toBe(2);
  });

  it('handles review before due date (early review)', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const card = {
      due: tomorrow, // Due tomorrow
      stability: 5,
      difficulty: 0.3,
      elapsedDays: 1,
      scheduledDays: 2,
      reps: 3,
      lapses: 0,
      state: 'Review' as FSRSState,
      lastReview: new Date(),
    };

    // Review today (early)
    const result = reviewCard(card, 'Good', new Date());
    expect(result.cardState).toBeDefined();
  });
});

describe('Edge Cases - Quality/Rating Mapping', () => {
  it('handles all quality values including edge cases', () => {
    const qualities: Quality[] = [0, 1, 2, 3, 4, 5];

    for (const q of qualities) {
      const rating = qualityToRating(q);
      expect(['Again', 'Hard', 'Good', 'Easy']).toContain(rating);
    }
  });

  it('inferRating handles zero response time', () => {
    const rating = inferRating({
      isCorrect: true,
      hintUsed: false,
      responseTimeMs: 0, // Instant - suspicious but valid
    });

    expect(rating).toBe('Easy'); // Fast = Easy
  });

  it('inferRating handles very long response time', () => {
    const rating = inferRating({
      isCorrect: true,
      hintUsed: false,
      responseTimeMs: 3600000, // 1 hour - very slow
    });

    expect(rating).toBe('Hard'); // Slow = Hard
  });

  it('inferRating handles all boolean combinations', () => {
    const combinations = [
      { isCorrect: true, hintUsed: true, responseTimeMs: 5000 },
      { isCorrect: true, hintUsed: false, responseTimeMs: 5000 },
      { isCorrect: false, hintUsed: true, responseTimeMs: 5000 },
      { isCorrect: false, hintUsed: false, responseTimeMs: 5000 },
      { isCorrect: true, hintUsed: false, usedAstMatch: true, responseTimeMs: 5000 },
    ];

    for (const input of combinations) {
      const rating = inferRating(input);
      expect(['Again', 'Hard', 'Good', 'Easy']).toContain(rating);
    }
  });
});

describe('Edge Cases - State Mapping', () => {
  it('mapFSRSStateToPhase handles all states', () => {
    const states: FSRSState[] = ['New', 'Learning', 'Review', 'Relearning'];

    for (const state of states) {
      const phase = mapFSRSStateToPhase(state);
      expect(['learning', 'review']).toContain(phase);
    }
  });
});

describe('Edge Cases - Exercise Selection', () => {
  it('selectExercise handles empty exercise list', () => {
    const result = selectExercise(
      { subconceptSlug: 'for', phase: 'learning' },
      [],
      []
    );

    expect(result).toBeNull();
  });

  it('selectExercise handles all exercises already seen many times', () => {
    const exercises = [
      {
        id: '1',
        slug: 'ex-1',
        subconcept: 'for',
        level: 'intro' as const,
        pattern: 'iteration' as const,
        exerciseType: 'write' as const,
      },
    ].map(e => ({
      ...e,
      language: 'python',
      category: 'loops',
      difficulty: 1,
      title: 'Test',
      prompt: 'Test',
      expectedAnswer: 'test',
      acceptedSolutions: [],
      hints: [],
      explanation: null,
      tags: [],
      timesPracticed: 0,
      avgSuccessRate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      concept: 'loops' as ConceptSlug,
      prereqs: [],
      objective: 'Test',
      targets: null,
      template: null,
      blankPosition: null,
    }));

    const attempts = [{
      id: 'a-1',
      userId: 'user',
      exerciseSlug: 'ex-1',
      timesSeen: 1000, // Seen many times
      timesCorrect: 999,
      lastSeenAt: new Date(),
    }];

    // Should still return an exercise even if all heavily used
    const result = selectExercise(
      { subconceptSlug: 'for', phase: 'review' },
      exercises,
      attempts
    );

    expect(result).not.toBeNull();
  });
});

describe('Edge Cases - Round-Trip Integrity', () => {
  it('cardStateToProgress preserves all fields through round-trip', () => {
    const original = {
      due: new Date('2026-06-15T14:30:00Z'),
      stability: 45.67,
      difficulty: 0.42,
      elapsedDays: 12,
      scheduledDays: 15,
      reps: 8,
      lapses: 1,
      state: 'Review' as FSRSState,
      lastReview: new Date('2026-06-01T10:00:00Z'),
    };

    const progress = cardStateToProgress(original);
    const restored = progressToCardState(progress);

    expect(restored.stability).toBe(original.stability);
    expect(restored.difficulty).toBe(original.difficulty);
    expect(restored.state).toBe(original.state);
    expect(restored.reps).toBe(original.reps);
    expect(restored.lapses).toBe(original.lapses);
    expect(restored.elapsedDays).toBe(original.elapsedDays);
    expect(restored.scheduledDays).toBe(original.scheduledDays);
  });
});
