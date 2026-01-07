// tests/unit/srs/fsrs/integration.test.ts
// Integration tests for the complete FSRS migration
import { describe, it, expect } from 'vitest';
import {
  createEmptyFSRSCard,
  reviewCard,
  cardStateToProgress,
  progressToCardState,
} from '@/lib/srs/fsrs/adapter';
import { qualityToRating, inferRating, isPassingRating } from '@/lib/srs/fsrs/mapping';
import { mapFSRSStateToPhase, selectExercise } from '@/lib/srs/exercise-selection';
import { STATE_REVERSE_MAP } from '@/lib/srs/fsrs/types';
import type { FSRSCardState, FSRSRating, FSRSState } from '@/lib/srs/fsrs/types';
import type { Quality } from '@/lib/types';
import type { SubconceptProgress } from '@/lib/curriculum/types';
import type { Exercise } from '@/lib/types/app.types';

// Helper to create a mock SubconceptProgress with FSRS fields
function createMockProgress(overrides: Partial<SubconceptProgress> = {}): SubconceptProgress {
  const card = createEmptyFSRSCard(new Date());
  return {
    id: 'test-progress-1',
    userId: 'user-123',
    subconceptSlug: 'for',
    conceptSlug: 'control-flow',
    stability: card.stability,
    difficulty: card.difficulty,
    fsrsState: 0 as 0 | 1 | 2 | 3,
    reps: card.reps,
    lapses: card.lapses,
    elapsedDays: card.elapsedDays,
    scheduledDays: card.scheduledDays,
    nextReview: card.due,
    lastReviewed: card.lastReview,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

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

describe('FSRS Integration', () => {
  describe('Quality to Rating Mapping', () => {
    it('maps all quality values correctly', () => {
      const qualityRatings: Array<[Quality, FSRSRating]> = [
        [0, 'Again'],
        [1, 'Again'],
        [2, 'Again'],
        [3, 'Hard'],
        [4, 'Good'],
        [5, 'Easy'],
      ];

      for (const [quality, expectedRating] of qualityRatings) {
        expect(qualityToRating(quality)).toBe(expectedRating);
      }
    });

    it('correctly identifies passing ratings', () => {
      expect(isPassingRating('Again')).toBe(false);
      expect(isPassingRating('Hard')).toBe(true);
      expect(isPassingRating('Good')).toBe(true);
      expect(isPassingRating('Easy')).toBe(true);
    });
  });

  describe('Rating Inference from Review Input', () => {
    it('returns Again for incorrect answers', () => {
      expect(inferRating({
        isCorrect: false,
        hintUsed: false,
        responseTimeMs: 5000,
      })).toBe('Again');
    });

    it('caps at Hard when hint is used', () => {
      expect(inferRating({
        isCorrect: true,
        hintUsed: true,
        responseTimeMs: 5000,
      })).toBe('Hard');
    });

    it('caps at Good when AST match is used', () => {
      expect(inferRating({
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: 5000,
        usedAstMatch: true,
      })).toBe('Good');
    });

    it('returns Easy for fast correct answers', () => {
      expect(inferRating({
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: 10000, // 10 seconds (fast)
      })).toBe('Easy');
    });

    it('returns Good for medium speed correct answers', () => {
      expect(inferRating({
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: 20000, // 20 seconds (medium)
      })).toBe('Good');
    });

    it('returns Hard for slow correct answers', () => {
      expect(inferRating({
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: 45000, // 45 seconds (slow)
      })).toBe('Hard');
    });
  });

  describe('FSRS State Progression', () => {
    it('progresses from New to Learning to Review', () => {
      let card = createEmptyFSRSCard(new Date('2026-01-01'));
      expect(card.state).toBe('New');

      // First review
      let result = reviewCard(card, 'Good', new Date('2026-01-01'));
      expect(result.cardState.state).toBe('Learning');

      // Continue reviewing with Good until reaching Review state
      let date = new Date('2026-01-01');
      while (result.cardState.state !== 'Review') {
        date = new Date(date.getTime() + (result.cardState.scheduledDays + 1) * 24 * 60 * 60 * 1000);
        result = reviewCard(result.cardState, 'Good', date);
      }

      expect(result.cardState.state).toBe('Review');
    });

    it('moves to Relearning on lapse', () => {
      let card = createEmptyFSRSCard(new Date('2026-01-01'));
      let date = new Date('2026-01-01');
      let result = reviewCard(card, 'Good', date);

      // Progress to Review state
      while (result.cardState.state !== 'Review') {
        date = new Date(date.getTime() + (result.cardState.scheduledDays + 1) * 24 * 60 * 60 * 1000);
        result = reviewCard(result.cardState, 'Good', date);
      }

      expect(result.cardState.state).toBe('Review');

      // Lapse (Again rating)
      date = new Date(date.getTime() + (result.cardState.scheduledDays + 1) * 24 * 60 * 60 * 1000);
      result = reviewCard(result.cardState, 'Again', date);
      expect(result.cardState.state).toBe('Relearning');
    });
  });

  describe('SubconceptProgress Integration', () => {
    it('creates valid SubconceptProgress from FSRS card', () => {
      const card = createEmptyFSRSCard(new Date('2026-01-01'));
      const progress = createMockProgress({
        stability: card.stability,
        difficulty: card.difficulty,
        fsrsState: 0, // New
        reps: card.reps,
        lapses: card.lapses,
      });

      expect(progress.fsrsState).toBe(0);
      expect(progress.stability).toBe(0);
      expect(progress.difficulty).toBe(0);
    });

    it('round-trips SubconceptProgress through FSRS card state', () => {
      const progress = createMockProgress();

      // Convert to FSRS card state
      const cardState = progressToCardState({
        stability: progress.stability,
        difficulty: progress.difficulty,
        fsrsState: STATE_REVERSE_MAP[progress.fsrsState] as FSRSState,
        due: progress.nextReview,
        lastReview: progress.lastReviewed,
        reps: progress.reps,
        lapses: progress.lapses,
        elapsedDays: progress.elapsedDays,
        scheduledDays: progress.scheduledDays,
      });

      expect(cardState.state).toBe('New');
      expect(cardState.stability).toBe(progress.stability);

      // Review the card
      const result = reviewCard(cardState, 'Good', new Date());
      const newProgress = cardStateToProgress(result.cardState);

      expect(newProgress.reps).toBe(1);
      expect(newProgress.stability).toBeGreaterThan(0);
    });
  });

  describe('FSRS State to Selection Phase Mapping', () => {
    it('maps New state to learning phase', () => {
      expect(mapFSRSStateToPhase('New')).toBe('learning');
    });

    it('maps Learning state to learning phase', () => {
      expect(mapFSRSStateToPhase('Learning')).toBe('learning');
    });

    it('maps Relearning state to learning phase', () => {
      expect(mapFSRSStateToPhase('Relearning')).toBe('learning');
    });

    it('maps Review state to review phase', () => {
      expect(mapFSRSStateToPhase('Review')).toBe('review');
    });
  });

  describe('Exercise Selection with FSRS', () => {
    const exercises = [
      createMockExercise({ id: '1', slug: 'for-1', level: 'intro', pattern: 'iteration' }),
      createMockExercise({ id: '2', slug: 'for-2', level: 'intro', pattern: 'accumulator' }),
      createMockExercise({ id: '3', slug: 'for-3', level: 'practice', pattern: 'iteration' }),
      createMockExercise({ id: '4', slug: 'for-4', level: 'edge', pattern: 'iteration' }),
    ];

    it('selects intro exercises first for New state', () => {
      const selectionInfo = {
        subconceptSlug: 'for',
        phase: mapFSRSStateToPhase('New'),
      };

      const selected = selectExercise(selectionInfo, exercises, []);
      expect(selected).not.toBeNull();
      expect(selected!.level).toBe('intro');
    });

    it('selects from all levels for Review state', () => {
      const selectionInfo = {
        subconceptSlug: 'for',
        phase: mapFSRSStateToPhase('Review'),
      };

      // With empty attempts, should still select (least-seen)
      const selected = selectExercise(selectionInfo, exercises, []);
      expect(selected).not.toBeNull();
    });

    it('applies anti-repeat pattern selection', () => {
      const selectionInfo = {
        subconceptSlug: 'for',
        phase: 'learning' as const,
      };

      // Select with lastPattern = 'iteration'
      const selected = selectExercise(selectionInfo, exercises, [], 'iteration');

      // Should prefer accumulator pattern to avoid repetition
      if (selected && exercises.some(e => e.pattern === 'accumulator' && e.level === 'intro')) {
        expect(selected.pattern).toBe('accumulator');
      }
    });
  });

  describe('Full Review Flow Simulation', () => {
    it('simulates a complete learning session', () => {
      // Start with a new card
      let card = createEmptyFSRSCard(new Date('2026-01-01T09:00:00Z'));
      let currentTime = new Date('2026-01-01T09:00:00Z');

      // Day 1: First review - Good
      let result = reviewCard(card, 'Good', currentTime);
      expect(result.cardState.reps).toBe(1);
      expect(result.cardState.state).toBe('Learning');

      // Day 1: Second review (after short interval) - Good
      currentTime = result.cardState.due;
      result = reviewCard(result.cardState, 'Good', currentTime);
      expect(result.cardState.reps).toBe(2);

      // Continue until Review state
      while (result.cardState.state !== 'Review') {
        currentTime = new Date(result.cardState.due.getTime() + 1000);
        result = reviewCard(result.cardState, 'Good', currentTime);
      }

      // Now in Review state - intervals should be longer
      expect(result.cardState.state).toBe('Review');
      expect(result.cardState.scheduledDays).toBeGreaterThan(0);

      // Simulate a lapse
      currentTime = new Date(result.cardState.due.getTime() + 1000);
      result = reviewCard(result.cardState, 'Again', currentTime);
      expect(result.cardState.state).toBe('Relearning');
      expect(result.cardState.lapses).toBe(1);

      // Recover from lapse
      currentTime = new Date(result.cardState.due.getTime() + 1000);
      result = reviewCard(result.cardState, 'Good', currentTime);
      expect(['Learning', 'Review', 'Relearning']).toContain(result.cardState.state);
    });

    it('maintains stability growth with consistent Good ratings', () => {
      let card = createEmptyFSRSCard(new Date('2026-01-01'));
      let currentTime = new Date('2026-01-01');
      const stabilities: number[] = [];

      // 10 reviews with Good rating
      for (let i = 0; i < 10; i++) {
        const result = reviewCard(card, 'Good', currentTime);
        stabilities.push(result.cardState.stability);
        card = result.cardState;
        currentTime = new Date(result.cardState.due.getTime() + 1000);
      }

      // Stability should generally increase
      const lastFiveStabilities = stabilities.slice(-5);
      const firstFiveStabilities = stabilities.slice(0, 5);
      const avgLast = lastFiveStabilities.reduce((a, b) => a + b, 0) / 5;
      const avgFirst = firstFiveStabilities.reduce((a, b) => a + b, 0) / 5;

      expect(avgLast).toBeGreaterThan(avgFirst);
    });
  });

  describe('Database Field Mapping', () => {
    it('cardStateToProgress extracts all required database fields', () => {
      const card = createEmptyFSRSCard(new Date('2026-01-01'));
      const result = reviewCard(card, 'Good', new Date('2026-01-01'));
      const progress = cardStateToProgress(result.cardState);

      // Verify all FSRS fields are present
      expect(progress).toHaveProperty('stability');
      expect(progress).toHaveProperty('difficulty');
      expect(progress).toHaveProperty('fsrsState');
      expect(progress).toHaveProperty('due');
      expect(progress).toHaveProperty('lastReview');
      expect(progress).toHaveProperty('reps');
      expect(progress).toHaveProperty('lapses');
      expect(progress).toHaveProperty('elapsedDays');
      expect(progress).toHaveProperty('scheduledDays');

      // Verify values are reasonable
      expect(progress.stability).toBeGreaterThan(0);
      expect(progress.reps).toBe(1);
      expect(progress.lapses).toBe(0);
    });

    it('handles all FSRS states correctly', () => {
      const states: FSRSState[] = ['New', 'Learning', 'Review', 'Relearning'];

      for (const state of states) {
        const cardState: FSRSCardState = {
          due: new Date(),
          stability: 5,
          difficulty: 0.3,
          elapsedDays: 1,
          scheduledDays: 1,
          reps: 3,
          lapses: 0,
          state,
          lastReview: new Date(),
        };

        const progress = cardStateToProgress(cardState);
        expect(progress.fsrsState).toBe(state);

        const restored = progressToCardState(progress);
        expect(restored.state).toBe(state);
      }
    });
  });
});
