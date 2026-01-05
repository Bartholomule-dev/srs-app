// tests/unit/srs/algorithm.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  calculateNextReview,
  createInitialCardState,
  getDueCards,
  getNewCards,
} from '@/lib/srs/algorithm';
import type { CardState } from '@/lib/srs/types';
import { DEFAULT_SRS_CONFIG } from '@/lib/srs/types';
import type { UserProgress, Exercise } from '@/lib/types';

describe('SRS Algorithm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-02T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createInitialCardState', () => {
    it('creates state with default values', () => {
      const state = createInitialCardState();

      expect(state.easeFactor).toBe(DEFAULT_SRS_CONFIG.initialEaseFactor);
      expect(state.interval).toBe(0);
      expect(state.repetitions).toBe(0);
      expect(state.nextReview).toEqual(new Date('2026-01-02T12:00:00Z'));
      expect(state.lastReviewed).toBeNull();
    });
  });

  describe('calculateNextReview', () => {
    describe('on failure (quality < 3)', () => {
      it('resets repetitions to 0', () => {
        const current: CardState = {
          easeFactor: 2.5,
          interval: 10,
          repetitions: 3,
          nextReview: new Date(),
          lastReviewed: null,
        };

        const result = calculateNextReview(2, current);

        expect(result.newState.repetitions).toBe(0);
      });

      it('sets interval to 1 day', () => {
        const current: CardState = {
          easeFactor: 2.5,
          interval: 10,
          repetitions: 3,
          nextReview: new Date(),
          lastReviewed: null,
        };

        const result = calculateNextReview(1, current);

        expect(result.newState.interval).toBe(1);
      });

      it('preserves ease factor on failure', () => {
        const current: CardState = {
          easeFactor: 2.3,
          interval: 10,
          repetitions: 3,
          nextReview: new Date(),
          lastReviewed: null,
        };

        const result = calculateNextReview(0, current);

        expect(result.newState.easeFactor).toBe(2.3);
      });

      it('sets wasCorrect to false', () => {
        const current: CardState = {
          easeFactor: 2.5,
          interval: 1,
          repetitions: 0,
          nextReview: new Date(),
          lastReviewed: null,
        };

        const result = calculateNextReview(2, current);

        expect(result.wasCorrect).toBe(false);
      });
    });

    describe('on success (quality >= 3)', () => {
      it('increments repetitions', () => {
        const current: CardState = {
          easeFactor: 2.5,
          interval: 1,
          repetitions: 1,
          nextReview: new Date(),
          lastReviewed: null,
        };

        const result = calculateNextReview(4, current);

        expect(result.newState.repetitions).toBe(2);
      });

      it('sets interval to 1 on first success', () => {
        const current: CardState = {
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: new Date(),
          lastReviewed: null,
        };

        const result = calculateNextReview(4, current);

        expect(result.newState.interval).toBe(1);
      });

      it('sets interval to 6 on second success', () => {
        const current: CardState = {
          easeFactor: 2.5,
          interval: 1,
          repetitions: 1,
          nextReview: new Date(),
          lastReviewed: null,
        };

        const result = calculateNextReview(4, current);

        expect(result.newState.interval).toBe(6);
      });

      it('multiplies interval by ease factor on subsequent successes', () => {
        const current: CardState = {
          easeFactor: 2.5,
          interval: 6,
          repetitions: 2,
          nextReview: new Date(),
          lastReviewed: null,
        };

        const result = calculateNextReview(4, current);

        expect(result.newState.interval).toBe(15); // 6 * 2.5 = 15
      });

      it('sets wasCorrect to true', () => {
        const current: CardState = {
          easeFactor: 2.5,
          interval: 1,
          repetitions: 1,
          nextReview: new Date(),
          lastReviewed: null,
        };

        const result = calculateNextReview(3, current);

        expect(result.wasCorrect).toBe(true);
      });
    });

    describe('ease factor adjustment', () => {
      it('decreases ease factor for quality 3 (hard)', () => {
        const current: CardState = {
          easeFactor: 2.5,
          interval: 6,
          repetitions: 2,
          nextReview: new Date(),
          lastReviewed: null,
        };

        const result = calculateNextReview(3, current);

        expect(result.newState.easeFactor).toBeLessThan(2.5);
      });

      it('maintains ease factor for quality 4 (good)', () => {
        const current: CardState = {
          easeFactor: 2.5,
          interval: 6,
          repetitions: 2,
          nextReview: new Date(),
          lastReviewed: null,
        };

        const result = calculateNextReview(4, current);

        // EF' = EF + (0.1 - (5-4) * (0.08 + (5-4) * 0.02))
        // EF' = 2.5 + (0.1 - 1 * 0.1) = 2.5 + 0 = 2.5
        expect(result.newState.easeFactor).toBe(2.5);
      });

      it('increases ease factor for quality 5 (easy)', () => {
        const current: CardState = {
          easeFactor: 2.5,
          interval: 6,
          repetitions: 2,
          nextReview: new Date(),
          lastReviewed: null,
        };

        const result = calculateNextReview(5, current);

        expect(result.newState.easeFactor).toBeGreaterThan(2.5);
      });

      it('never drops below minimum (1.3)', () => {
        const current: CardState = {
          easeFactor: 1.3,
          interval: 1,
          repetitions: 1,
          nextReview: new Date(),
          lastReviewed: null,
        };

        const result = calculateNextReview(3, current);

        expect(result.newState.easeFactor).toBeGreaterThanOrEqual(1.3);
      });

      it('never exceeds maximum (3.0)', () => {
        const current: CardState = {
          easeFactor: 3.0,
          interval: 10,
          repetitions: 5,
          nextReview: new Date(),
          lastReviewed: null,
        };

        const result = calculateNextReview(5, current);

        expect(result.newState.easeFactor).toBeLessThanOrEqual(3.0);
      });
    });

    describe('next review date', () => {
      it('sets nextReview to interval days in future', () => {
        const current: CardState = {
          easeFactor: 2.5,
          interval: 1,
          repetitions: 1,
          nextReview: new Date('2026-01-01'),
          lastReviewed: null,
        };

        const result = calculateNextReview(4, current);

        // interval becomes 6, so nextReview = now + 6 days
        const expected = new Date('2026-01-08T12:00:00Z');
        expect(result.newState.nextReview).toEqual(expected);
      });

      it('updates lastReviewed to now', () => {
        const current: CardState = {
          easeFactor: 2.5,
          interval: 1,
          repetitions: 1,
          nextReview: new Date(),
          lastReviewed: null,
        };

        const result = calculateNextReview(4, current);

        expect(result.newState.lastReviewed).toEqual(new Date('2026-01-02T12:00:00Z'));
      });
    });
  });
});

describe('getDueCards', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-02T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty array when no progress exists', () => {
    const result = getDueCards([]);
    expect(result).toEqual([]);
  });

  it('returns cards due today or earlier', () => {
    const progress: UserProgress[] = [
      {
        id: '1',
        userId: 'user-1',
        exerciseId: 'ex-1',
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: '2026-01-02T00:00:00Z', // Due today
        lastReviewed: '2026-01-01T00:00:00Z',
        timesSeen: 1,
        timesCorrect: 1,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: '2',
        userId: 'user-1',
        exerciseId: 'ex-2',
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: '2026-01-01T00:00:00Z', // Overdue
        lastReviewed: '2025-12-31T00:00:00Z',
        timesSeen: 1,
        timesCorrect: 1,
        createdAt: '2025-12-31T00:00:00Z',
        updatedAt: '2025-12-31T00:00:00Z',
      },
    ];

    const result = getDueCards(progress);

    expect(result).toHaveLength(2);
  });

  it('excludes cards not yet due', () => {
    const progress: UserProgress[] = [
      {
        id: '1',
        userId: 'user-1',
        exerciseId: 'ex-1',
        easeFactor: 2.5,
        interval: 10,
        repetitions: 3,
        nextReview: '2026-01-10T00:00:00Z', // Future
        lastReviewed: '2026-01-01T00:00:00Z',
        timesSeen: 3,
        timesCorrect: 3,
        createdAt: '2025-12-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    const result = getDueCards(progress);

    expect(result).toHaveLength(0);
  });

  it('sorts by nextReview ascending (oldest first)', () => {
    const progress: UserProgress[] = [
      {
        id: '1',
        userId: 'user-1',
        exerciseId: 'ex-1',
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: '2026-01-02T10:00:00Z',
        lastReviewed: null,
        timesSeen: 1,
        timesCorrect: 0,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: '2',
        userId: 'user-1',
        exerciseId: 'ex-2',
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: '2026-01-01T00:00:00Z',
        lastReviewed: null,
        timesSeen: 1,
        timesCorrect: 0,
        createdAt: '2025-12-31T00:00:00Z',
        updatedAt: '2025-12-31T00:00:00Z',
      },
    ];

    const result = getDueCards(progress);

    expect(result[0].exerciseId).toBe('ex-2'); // Older due date first
    expect(result[1].exerciseId).toBe('ex-1');
  });

  it('converts UserProgress to DueCard format', () => {
    const progress: UserProgress[] = [
      {
        id: '1',
        userId: 'user-1',
        exerciseId: 'ex-1',
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
        nextReview: '2026-01-02T00:00:00Z',
        lastReviewed: '2025-12-27T00:00:00Z',
        timesSeen: 2,
        timesCorrect: 2,
        createdAt: '2025-12-20T00:00:00Z',
        updatedAt: '2025-12-27T00:00:00Z',
      },
    ];

    const result = getDueCards(progress);

    expect(result[0]).toEqual({
      exerciseId: 'ex-1',
      state: {
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
        nextReview: new Date('2026-01-02T00:00:00Z'),
        lastReviewed: new Date('2025-12-27T00:00:00Z'),
      },
      isNew: false,
    });
  });
});

describe('getNewCards', () => {
  it('returns empty array when no exercises available', () => {
    const result = getNewCards([], [], 5);
    expect(result).toEqual([]);
  });

  it('returns exercises not in progress', () => {
    const exercises: Exercise[] = [
      createMockExercise('ex-1'),
      createMockExercise('ex-2'),
      createMockExercise('ex-3'),
    ];
    const existingProgress: UserProgress[] = [
      createMockProgress('ex-1'),
    ];

    const result = getNewCards(exercises, existingProgress, 5);

    expect(result).toHaveLength(2);
    expect(result.map(c => c.exerciseId)).toEqual(['ex-2', 'ex-3']);
  });

  it('respects limit parameter', () => {
    const exercises: Exercise[] = [
      createMockExercise('ex-1'),
      createMockExercise('ex-2'),
      createMockExercise('ex-3'),
      createMockExercise('ex-4'),
      createMockExercise('ex-5'),
    ];

    const result = getNewCards(exercises, [], 2);

    expect(result).toHaveLength(2);
  });

  it('marks cards as new', () => {
    const exercises: Exercise[] = [createMockExercise('ex-1')];

    const result = getNewCards(exercises, [], 5);

    expect(result[0].isNew).toBe(true);
  });

  it('creates initial state for new cards', () => {
    const exercises: Exercise[] = [createMockExercise('ex-1')];

    const result = getNewCards(exercises, [], 5);

    expect(result[0].state.easeFactor).toBe(DEFAULT_SRS_CONFIG.initialEaseFactor);
    expect(result[0].state.interval).toBe(0);
    expect(result[0].state.repetitions).toBe(0);
  });
});

// Helper functions for tests
function createMockExercise(id: string): Exercise {
  return {
    id,
    slug: `exercise-${id}`,
    language: 'python',
    category: 'basics',
    difficulty: 1,
    title: `Exercise ${id}`,
    prompt: 'Test prompt',
    expectedAnswer: 'test answer',
    acceptedSolutions: [],
    hints: [],
    explanation: null,
    tags: [],
    timesPracticed: 0,
    avgSuccessRate: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

function createMockProgress(exerciseId: string): UserProgress {
  return {
    id: `progress-${exerciseId}`,
    userId: 'user-1',
    exerciseId,
    easeFactor: 2.5,
    interval: 1,
    repetitions: 1,
    nextReview: '2026-01-03T00:00:00Z',
    lastReviewed: '2026-01-02T00:00:00Z',
    timesSeen: 1,
    timesCorrect: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  };
}
