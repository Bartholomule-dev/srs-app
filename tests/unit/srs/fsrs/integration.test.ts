// tests/unit/srs/fsrs/integration.test.ts
// Cross-component integration tests for FSRS
//
// These tests verify different FSRS components work together correctly.
// Unit tests for individual components are in:
//   - adapter.test.ts (adapter functions)
//   - mapping.test.ts (quality/rating mapping)
//   - regression.test.ts (pinned behavior)
//   - invariants.test.ts (properties that must hold)
//   - edge-cases.test.ts (error conditions)

import { describe, it, expect } from 'vitest';
import {
  createEmptyFSRSCard,
  reviewCard,
  cardStateToProgress,
  progressToCardState,
} from '@/lib/srs/fsrs/adapter';
import { qualityToRating, inferRating } from '@/lib/srs/fsrs/mapping';
import { mapFSRSStateToPhase, selectExercise } from '@/lib/srs/exercise-selection';
import { STATE_REVERSE_MAP } from '@/lib/srs/fsrs/types';
import type { FSRSState } from '@/lib/srs/fsrs/types';
import type { Quality } from '@/lib/types';
import type { Exercise } from '@/lib/types/app.types';

// Helper to create mock exercises
function createMockExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-1',
    slug: 'for-loop-basic',
    language: 'python',
    category: 'control-flow',
    difficulty: 1,
    title: 'Basic For Loop',
    prompt: 'Write a for loop',
    expectedAnswer: 'for i in range(10): print(i)',
    acceptedSolutions: [],
    hints: ['Use range()'],
    explanation: null,
    tags: ['loops'],
    timesPracticed: 0,
    avgSuccessRate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    concept: 'control-flow',
    subconcept: 'for',
    level: 'intro',
    prereqs: [],
    exerciseType: 'write',
    pattern: 'iteration',
    objective: 'Write a basic for loop',
    targets: null,
    template: null,
    blankPosition: null,
    ...overrides,
  } as Exercise;
}

describe('FSRS Component Integration', () => {
  describe('Quality → Rating → Review Flow', () => {
    it('quality score flows correctly through rating to review', () => {
      // This tests the full flow: Quality (from UI) → Rating → FSRS review
      const qualities: Quality[] = [0, 1, 2, 3, 4, 5];
      const card = createEmptyFSRSCard(new Date('2026-01-01'));

      for (const quality of qualities) {
        const rating = qualityToRating(quality);
        const result = reviewCard(card, rating, new Date('2026-01-01'));

        // Quality 0-2 = Again = fail
        if (quality <= 2) {
          expect(result.wasCorrect).toBe(false);
        } else {
          expect(result.wasCorrect).toBe(true);
        }
      }
    });

    it('inferRating signals flow correctly through review', () => {
      // Tests: Review input signals → inferRating → FSRS review
      const card = createEmptyFSRSCard(new Date('2026-01-01'));

      // Correct answer with hint = Hard
      const hintRating = inferRating({
        isCorrect: true,
        hintUsed: true,
        responseTimeMs: 5000,
      });
      const hintResult = reviewCard(card, hintRating, new Date('2026-01-01'));
      expect(hintRating).toBe('Hard');
      expect(hintResult.wasCorrect).toBe(true);

      // Fast correct = Easy
      const fastRating = inferRating({
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: 5000, // <15s
      });
      const fastResult = reviewCard(card, fastRating, new Date('2026-01-01'));
      expect(fastRating).toBe('Easy');
      expect(fastResult.cardState.stability).toBeGreaterThan(hintResult.cardState.stability);
    });
  });

  describe('FSRS State → Exercise Selection Phase', () => {
    const exercises = [
      createMockExercise({ id: '1', slug: 'intro-1', level: 'intro' }),
      createMockExercise({ id: '2', slug: 'practice-1', level: 'practice' }),
      createMockExercise({ id: '3', slug: 'edge-1', level: 'edge' }),
    ];

    it('New state maps to learning phase, selecting intro exercises', () => {
      const card = createEmptyFSRSCard(new Date());
      expect(card.state).toBe('New');

      const phase = mapFSRSStateToPhase(card.state);
      expect(phase).toBe('learning');

      const selected = selectExercise(
        { subconceptSlug: 'for', phase },
        exercises,
        []
      );
      expect(selected?.level).toBe('intro');
    });

    it('Learning state maps to learning phase', () => {
      let card = createEmptyFSRSCard(new Date('2026-01-01'));
      card = reviewCard(card, 'Good', new Date('2026-01-01')).cardState;
      expect(card.state).toBe('Learning');

      const phase = mapFSRSStateToPhase(card.state);
      expect(phase).toBe('learning');
    });

    it('Review state maps to review phase', () => {
      let card = createEmptyFSRSCard(new Date('2026-01-01'));
      let date = new Date('2026-01-01');

      // Graduate to Review
      while (card.state !== 'Review') {
        const result = reviewCard(card, 'Good', date);
        card = result.cardState;
        date = new Date(card.due.getTime() + 1000);
      }

      const phase = mapFSRSStateToPhase(card.state);
      expect(phase).toBe('review');
    });

    it('Relearning state maps to learning phase', () => {
      let card = createEmptyFSRSCard(new Date('2026-01-01'));
      let date = new Date('2026-01-01');

      // Graduate to Review, then lapse
      while (card.state !== 'Review') {
        const result = reviewCard(card, 'Good', date);
        card = result.cardState;
        date = new Date(card.due.getTime() + 1000);
      }

      // Lapse
      card = reviewCard(card, 'Again', date).cardState;
      expect(card.state).toBe('Relearning');

      const phase = mapFSRSStateToPhase(card.state);
      expect(phase).toBe('learning');
    });
  });

  describe('Progress ↔ CardState Round-Trip', () => {
    it('preserves all fields through database-style round-trip', () => {
      // Simulate: FSRS review → save to DB → load from DB → continue reviewing
      let card = createEmptyFSRSCard(new Date('2026-01-01'));
      let date = new Date('2026-01-01');

      // Do a few reviews
      for (let i = 0; i < 3; i++) {
        card = reviewCard(card, 'Good', date).cardState;
        date = new Date(card.due.getTime() + 1000);
      }

      // "Save to database" - extract progress fields
      const progress = cardStateToProgress(card);

      // "Load from database" - reconstruct card state
      const restored = progressToCardState(progress);

      // Continue reviewing with restored card
      const nextResult = reviewCard(restored, 'Good', date);

      // Should work correctly
      expect(nextResult.cardState.reps).toBe(card.reps + 1);
      expect(nextResult.cardState.state).toBeDefined();
    });

    it('handles all FSRS states through round-trip', () => {
      const states: FSRSState[] = ['New', 'Learning', 'Review', 'Relearning'];

      for (const state of states) {
        const progress = {
          stability: 5,
          difficulty: 0.3,
          fsrsState: state,
          due: new Date(),
          lastReview: state === 'New' ? null : new Date(),
          reps: state === 'New' ? 0 : 5,
          lapses: state === 'Relearning' ? 1 : 0,
          elapsedDays: 1,
          scheduledDays: 1,
        };

        const card = progressToCardState(progress);
        expect(card.state).toBe(state);

        const backToProgress = cardStateToProgress(card);
        expect(backToProgress.fsrsState).toBe(state);
      }
    });
  });

  describe('Complete Review Session Simulation', () => {
    it('simulates user completing 5 exercises with varying performance', () => {
      // User does 5 reviews with different performance levels
      const performances: Array<{ responseTimeMs: number; isCorrect: boolean; hintUsed: boolean }> = [
        { responseTimeMs: 8000, isCorrect: true, hintUsed: false },   // Fast, correct → Easy
        { responseTimeMs: 25000, isCorrect: true, hintUsed: false },  // Medium → Good
        { responseTimeMs: 40000, isCorrect: true, hintUsed: false },  // Slow → Hard
        { responseTimeMs: 15000, isCorrect: true, hintUsed: true },   // Used hint → Hard
        { responseTimeMs: 10000, isCorrect: false, hintUsed: false }, // Wrong → Again
      ];

      let card = createEmptyFSRSCard(new Date('2026-01-01T09:00:00Z'));
      let date = new Date('2026-01-01T09:00:00Z');

      const results: Array<{ rating: string; wasCorrect: boolean; stability: number }> = [];

      for (const perf of performances) {
        const rating = inferRating(perf);
        const result = reviewCard(card, rating, date);
        results.push({
          rating,
          wasCorrect: result.wasCorrect,
          stability: result.cardState.stability,
        });
        card = result.cardState;
        date = new Date(date.getTime() + 60000); // 1 minute between exercises
      }

      // Verify expected ratings
      expect(results[0].rating).toBe('Easy');
      expect(results[1].rating).toBe('Good');
      expect(results[2].rating).toBe('Hard');
      expect(results[3].rating).toBe('Hard');
      expect(results[4].rating).toBe('Again');

      // Final card should reflect the session
      expect(card.reps).toBe(5);
      // Ended with Again, so stability should have dropped
    });
  });
});
