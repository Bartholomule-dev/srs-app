# Milestone 3: SRS Engine & Error Handling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the SM-2 spaced repetition algorithm, create the useSRS hook for session management, and add robust error handling with ErrorBoundary and Toast components.

**Architecture:** Pure functions for SRS calculations (algorithm.ts), stateful scheduler for session queue (scheduler.ts), React hook (useSRS) for data fetching and mutations, and reusable error handling components. All business logic is client-side with Supabase for persistence.

**Tech Stack:** TypeScript 5 (strict), React 19, Vitest, React Testing Library, Supabase JS v2

---

## Prerequisites

- Local Supabase running: `pnpm db:start`
- Database migrated with seed data: `pnpm db:reset`
- All Milestone 2 tests passing: `pnpm test`

---

## Task 1: SRS Algorithm Types

**Files:**
- Create: `src/lib/srs/types.ts`
- Test: `tests/unit/srs/types.test.ts`

**Step 1: Write the type test**

```typescript
// tests/unit/srs/types.test.ts
import { describe, it, expectTypeOf } from 'vitest';
import type { CardState, ReviewResult, SRSConfig } from '@/lib/srs/types';
import type { Quality } from '@/lib/types';

describe('SRS Types', () => {
  it('CardState has correct shape', () => {
    expectTypeOf<CardState>().toMatchTypeOf<{
      easeFactor: number;
      interval: number;
      repetitions: number;
      nextReview: Date;
      lastReviewed: Date | null;
    }>();
  });

  it('ReviewResult includes new state and metadata', () => {
    expectTypeOf<ReviewResult>().toMatchTypeOf<{
      newState: CardState;
      wasCorrect: boolean;
      quality: Quality;
    }>();
  });

  it('SRSConfig has algorithm parameters', () => {
    expectTypeOf<SRSConfig>().toMatchTypeOf<{
      minEaseFactor: number;
      maxEaseFactor: number;
      initialEaseFactor: number;
      initialInterval: number;
      graduatingInterval: number;
    }>();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/srs/types.test.ts`
Expected: FAIL with "Cannot find module '@/lib/srs/types'"

**Step 3: Create directory and types**

```bash
mkdir -p src/lib/srs
mkdir -p tests/unit/srs
```

```typescript
// src/lib/srs/types.ts
import type { Quality } from '@/lib/types';

/**
 * Represents the SRS state for a single card/exercise
 */
export interface CardState {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
  lastReviewed: Date | null;
}

/**
 * Result of reviewing a card
 */
export interface ReviewResult {
  newState: CardState;
  wasCorrect: boolean;
  quality: Quality;
}

/**
 * SM-2 algorithm configuration
 */
export interface SRSConfig {
  minEaseFactor: number;
  maxEaseFactor: number;
  initialEaseFactor: number;
  initialInterval: number;
  graduatingInterval: number;
}

/**
 * Default SM-2 configuration
 */
export const DEFAULT_SRS_CONFIG: SRSConfig = {
  minEaseFactor: 1.3,
  maxEaseFactor: 3.0,
  initialEaseFactor: 2.5,
  initialInterval: 1,
  graduatingInterval: 6,
};

/**
 * Card with exercise data for display
 */
export interface DueCard {
  exerciseId: string;
  state: CardState;
  isNew: boolean;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/srs/types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/srs/types.ts tests/unit/srs/types.test.ts
git commit -m "feat(srs): add SRS algorithm type definitions"
```

---

## Task 2: SRS Algorithm Core - calculateNextReview

**Files:**
- Create: `src/lib/srs/algorithm.ts`
- Test: `tests/unit/srs/algorithm.test.ts`

**Step 1: Write failing tests for calculateNextReview**

```typescript
// tests/unit/srs/algorithm.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { calculateNextReview, createInitialCardState } from '@/lib/srs/algorithm';
import type { CardState } from '@/lib/srs/types';
import { DEFAULT_SRS_CONFIG } from '@/lib/srs/types';

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
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/srs/algorithm.test.ts`
Expected: FAIL with "Cannot find module '@/lib/srs/algorithm'"

**Step 3: Implement the algorithm**

```typescript
// src/lib/srs/algorithm.ts
import type { CardState, ReviewResult, SRSConfig } from './types';
import { DEFAULT_SRS_CONFIG } from './types';
import type { Quality } from '@/lib/types';

/**
 * Create initial state for a new card
 */
export function createInitialCardState(config: SRSConfig = DEFAULT_SRS_CONFIG): CardState {
  return {
    easeFactor: config.initialEaseFactor,
    interval: 0,
    repetitions: 0,
    nextReview: new Date(),
    lastReviewed: null,
  };
}

/**
 * SM-2 algorithm: Calculate the next review state based on quality rating
 *
 * Quality ratings:
 * - 0-2: Failure (reset progress)
 * - 3: Hard (correct but difficult)
 * - 4: Good (correct with some hesitation)
 * - 5: Easy (perfect recall)
 */
export function calculateNextReview(
  quality: Quality,
  currentState: CardState,
  config: SRSConfig = DEFAULT_SRS_CONFIG
): ReviewResult {
  const wasCorrect = quality >= 3;
  const now = new Date();

  if (!wasCorrect) {
    // Failure: reset repetitions, keep ease factor, review tomorrow
    return {
      newState: {
        ...currentState,
        repetitions: 0,
        interval: 1,
        nextReview: addDays(now, 1),
        lastReviewed: now,
      },
      wasCorrect: false,
      quality,
    };
  }

  // Success: calculate new ease factor and interval
  const newEaseFactor = calculateNewEaseFactor(quality, currentState.easeFactor, config);
  const newRepetitions = currentState.repetitions + 1;
  const newInterval = calculateNewInterval(newRepetitions, currentState.interval, newEaseFactor, config);

  return {
    newState: {
      easeFactor: newEaseFactor,
      interval: newInterval,
      repetitions: newRepetitions,
      nextReview: addDays(now, newInterval),
      lastReviewed: now,
    },
    wasCorrect: true,
    quality,
  };
}

/**
 * SM-2 ease factor adjustment formula
 * EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 */
function calculateNewEaseFactor(
  quality: Quality,
  currentEaseFactor: number,
  config: SRSConfig
): number {
  const q = quality;
  const adjustment = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  const newEF = currentEaseFactor + adjustment;

  return Math.max(config.minEaseFactor, Math.min(config.maxEaseFactor, newEF));
}

/**
 * Calculate new interval based on repetition count
 */
function calculateNewInterval(
  repetitions: number,
  currentInterval: number,
  easeFactor: number,
  config: SRSConfig
): number {
  if (repetitions === 1) {
    return config.initialInterval;
  }

  if (repetitions === 2) {
    return config.graduatingInterval;
  }

  return Math.round(currentInterval * easeFactor);
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test tests/unit/srs/algorithm.test.ts`
Expected: PASS (17 tests)

**Step 5: Commit**

```bash
git add src/lib/srs/algorithm.ts tests/unit/srs/algorithm.test.ts
git commit -m "feat(srs): implement SM-2 calculateNextReview algorithm"
```

---

## Task 3: SRS Algorithm - getDueCards and getNewCards

**Files:**
- Modify: `src/lib/srs/algorithm.ts`
- Modify: `tests/unit/srs/algorithm.test.ts`

**Step 1: Write failing tests for getDueCards and getNewCards**

Add to `tests/unit/srs/algorithm.test.ts`:

```typescript
import {
  calculateNextReview,
  createInitialCardState,
  getDueCards,
  getNewCards
} from '@/lib/srs/algorithm';
import type { UserProgress, Exercise } from '@/lib/types';

// Add these test suites after existing describe blocks

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
    language: 'python',
    category: 'basics',
    difficulty: 1,
    title: `Exercise ${id}`,
    prompt: 'Test prompt',
    expectedAnswer: 'test answer',
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
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/srs/algorithm.test.ts`
Expected: FAIL with "getDueCards is not a function"

**Step 3: Implement getDueCards and getNewCards**

Add to `src/lib/srs/algorithm.ts`:

```typescript
import type { UserProgress, Exercise } from '@/lib/types';
import type { CardState, ReviewResult, SRSConfig, DueCard } from './types';

// ... existing code ...

/**
 * Get cards due for review (nextReview <= now)
 * Sorted by nextReview ascending (most overdue first)
 */
export function getDueCards(userProgress: UserProgress[]): DueCard[] {
  const now = new Date();

  return userProgress
    .filter((progress) => new Date(progress.nextReview) <= now)
    .sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime())
    .map((progress) => ({
      exerciseId: progress.exerciseId,
      state: progressToCardState(progress),
      isNew: false,
    }));
}

/**
 * Get new cards (exercises without any progress) up to a limit
 */
export function getNewCards(
  exercises: Exercise[],
  existingProgress: UserProgress[],
  limit: number,
  config: SRSConfig = DEFAULT_SRS_CONFIG
): DueCard[] {
  const progressExerciseIds = new Set(existingProgress.map((p) => p.exerciseId));

  return exercises
    .filter((exercise) => !progressExerciseIds.has(exercise.id))
    .slice(0, limit)
    .map((exercise) => ({
      exerciseId: exercise.id,
      state: createInitialCardState(config),
      isNew: true,
    }));
}

/**
 * Convert UserProgress to CardState
 */
function progressToCardState(progress: UserProgress): CardState {
  return {
    easeFactor: progress.easeFactor,
    interval: progress.interval,
    repetitions: progress.repetitions,
    nextReview: new Date(progress.nextReview),
    lastReviewed: progress.lastReviewed ? new Date(progress.lastReviewed) : null,
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test tests/unit/srs/algorithm.test.ts`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add src/lib/srs/algorithm.ts tests/unit/srs/algorithm.test.ts
git commit -m "feat(srs): add getDueCards and getNewCards functions"
```

---

## Task 4: SRS Barrel Export and UserProgress Mapper

**Files:**
- Create: `src/lib/srs/index.ts`
- Modify: `src/lib/supabase/mappers.ts`
- Test: `tests/unit/srs/mappers.test.ts`

**Step 1: Write failing test for toDbUserProgressUpdate**

```typescript
// tests/unit/srs/mappers.test.ts
import { describe, it, expect } from 'vitest';
import { toDbUserProgressUpdate, cardStateToProgressUpdate } from '@/lib/supabase/mappers';
import type { CardState } from '@/lib/srs/types';

describe('toDbUserProgressUpdate', () => {
  it('converts app fields to database fields', () => {
    const update = {
      easeFactor: 2.6,
      interval: 10,
      repetitions: 3,
    };

    const result = toDbUserProgressUpdate(update);

    expect(result).toEqual({
      ease_factor: 2.6,
      interval: 10,
      repetitions: 3,
    });
  });

  it('only includes provided fields', () => {
    const update = { interval: 5 };

    const result = toDbUserProgressUpdate(update);

    expect(result).toEqual({ interval: 5 });
    expect(result).not.toHaveProperty('ease_factor');
  });

  it('converts date fields to ISO strings', () => {
    const now = new Date('2026-01-02T12:00:00Z');
    const update = {
      nextReview: now.toISOString(),
      lastReviewed: now.toISOString(),
    };

    const result = toDbUserProgressUpdate(update);

    expect(result).toEqual({
      next_review: '2026-01-02T12:00:00.000Z',
      last_reviewed: '2026-01-02T12:00:00.000Z',
    });
  });
});

describe('cardStateToProgressUpdate', () => {
  it('converts CardState to database update format', () => {
    const state: CardState = {
      easeFactor: 2.5,
      interval: 6,
      repetitions: 2,
      nextReview: new Date('2026-01-08T12:00:00Z'),
      lastReviewed: new Date('2026-01-02T12:00:00Z'),
    };

    const result = cardStateToProgressUpdate(state);

    expect(result).toEqual({
      ease_factor: 2.5,
      interval: 6,
      repetitions: 2,
      next_review: '2026-01-08T12:00:00.000Z',
      last_reviewed: '2026-01-02T12:00:00.000Z',
    });
  });

  it('handles null lastReviewed', () => {
    const state: CardState = {
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: new Date('2026-01-02T12:00:00Z'),
      lastReviewed: null,
    };

    const result = cardStateToProgressUpdate(state);

    expect(result.last_reviewed).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/srs/mappers.test.ts`
Expected: FAIL with "toDbUserProgressUpdate is not exported"

**Step 3: Add mapper functions**

Add to `src/lib/supabase/mappers.ts`:

```typescript
import type { CardState } from '@/lib/srs/types';

// ... existing code ...

/**
 * Map app user progress updates to database format
 */
export function toDbUserProgressUpdate(app: Partial<Omit<UserProgress, 'id' | 'userId' | 'exerciseId' | 'createdAt'>>) {
  const db: Record<string, unknown> = {};
  if (app.easeFactor !== undefined) db.ease_factor = app.easeFactor;
  if (app.interval !== undefined) db.interval = app.interval;
  if (app.repetitions !== undefined) db.repetitions = app.repetitions;
  if (app.nextReview !== undefined) db.next_review = new Date(app.nextReview).toISOString();
  if (app.lastReviewed !== undefined) db.last_reviewed = app.lastReviewed ? new Date(app.lastReviewed).toISOString() : null;
  if (app.timesSeen !== undefined) db.times_seen = app.timesSeen;
  if (app.timesCorrect !== undefined) db.times_correct = app.timesCorrect;
  return db;
}

/**
 * Convert CardState to database update format
 */
export function cardStateToProgressUpdate(state: CardState) {
  return {
    ease_factor: state.easeFactor,
    interval: state.interval,
    repetitions: state.repetitions,
    next_review: state.nextReview.toISOString(),
    last_reviewed: state.lastReviewed ? state.lastReviewed.toISOString() : null,
  };
}
```

**Step 4: Create SRS barrel export**

```typescript
// src/lib/srs/index.ts
export {
  calculateNextReview,
  createInitialCardState,
  getDueCards,
  getNewCards,
} from './algorithm';

export type {
  CardState,
  ReviewResult,
  SRSConfig,
  DueCard,
} from './types';

export { DEFAULT_SRS_CONFIG } from './types';
```

**Step 5: Run tests to verify they pass**

Run: `pnpm test tests/unit/srs/mappers.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/lib/srs/index.ts src/lib/supabase/mappers.ts tests/unit/srs/mappers.test.ts
git commit -m "feat(srs): add barrel export and progress mappers"
```

---

## Task 5: Error Utilities - AppError Class

**Files:**
- Create: `src/lib/errors/types.ts`
- Create: `src/lib/errors/AppError.ts`
- Test: `tests/unit/errors/AppError.test.ts`

**Step 1: Write failing tests**

```typescript
// tests/unit/errors/AppError.test.ts
import { describe, it, expect } from 'vitest';
import { AppError, ErrorCode } from '@/lib/errors/AppError';

describe('AppError', () => {
  it('extends Error', () => {
    const error = new AppError('Test error', ErrorCode.UNKNOWN);
    expect(error).toBeInstanceOf(Error);
  });

  it('has code property', () => {
    const error = new AppError('Test', ErrorCode.AUTH_ERROR);
    expect(error.code).toBe(ErrorCode.AUTH_ERROR);
  });

  it('has message property', () => {
    const error = new AppError('Something went wrong', ErrorCode.UNKNOWN);
    expect(error.message).toBe('Something went wrong');
  });

  it('has optional cause', () => {
    const originalError = new Error('Original');
    const error = new AppError('Wrapped', ErrorCode.DATABASE_ERROR, originalError);
    expect(error.cause).toBe(originalError);
  });

  it('has optional context', () => {
    const error = new AppError('Test', ErrorCode.VALIDATION_ERROR, undefined, { field: 'email' });
    expect(error.context).toEqual({ field: 'email' });
  });

  it('has name set to AppError', () => {
    const error = new AppError('Test', ErrorCode.UNKNOWN);
    expect(error.name).toBe('AppError');
  });

  it('is JSON serializable', () => {
    const error = new AppError('Test error', ErrorCode.NETWORK_ERROR, undefined, { retry: true });
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'AppError',
      code: ErrorCode.NETWORK_ERROR,
      message: 'Test error',
      context: { retry: true },
    });
  });
});

describe('ErrorCode', () => {
  it('has expected error codes', () => {
    expect(ErrorCode.UNKNOWN).toBe('UNKNOWN');
    expect(ErrorCode.AUTH_ERROR).toBe('AUTH_ERROR');
    expect(ErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR');
    expect(ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR');
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorCode.PERMISSION_DENIED).toBe('PERMISSION_DENIED');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/errors/AppError.test.ts`
Expected: FAIL with "Cannot find module '@/lib/errors/AppError'"

**Step 3: Create directory and implement**

```bash
mkdir -p src/lib/errors
mkdir -p tests/unit/errors
```

```typescript
// src/lib/errors/AppError.ts

export const ErrorCode = {
  UNKNOWN: 'UNKNOWN',
  AUTH_ERROR: 'AUTH_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  SRS_ERROR: 'SRS_ERROR',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ErrorContext {
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly code: ErrorCodeType;
  public readonly context?: ErrorContext;

  constructor(
    message: string,
    code: ErrorCodeType,
    cause?: Error,
    context?: ErrorContext
  ) {
    super(message, { cause });
    this.name = 'AppError';
    this.code = code;
    this.context = context;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
    };
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test tests/unit/errors/AppError.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/errors/AppError.ts tests/unit/errors/AppError.test.ts
git commit -m "feat(errors): add AppError class with error codes"
```

---

## Task 6: Error Utilities - handleSupabaseError

**Files:**
- Create: `src/lib/errors/handleSupabaseError.ts`
- Test: `tests/unit/errors/handleSupabaseError.test.ts`

**Step 1: Write failing tests**

```typescript
// tests/unit/errors/handleSupabaseError.test.ts
import { describe, it, expect } from 'vitest';
import { handleSupabaseError } from '@/lib/errors/handleSupabaseError';
import { AppError, ErrorCode } from '@/lib/errors/AppError';
import type { PostgrestError, AuthError } from '@supabase/supabase-js';

describe('handleSupabaseError', () => {
  describe('PostgrestError handling', () => {
    it('converts PGRST116 (no rows) to NOT_FOUND', () => {
      const pgError: PostgrestError = {
        message: 'No rows found',
        details: '',
        hint: '',
        code: 'PGRST116',
      };

      const result = handleSupabaseError(pgError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe(ErrorCode.NOT_FOUND);
      expect(result.message).toBe('Resource not found');
    });

    it('converts 42501 (permission denied) to PERMISSION_DENIED', () => {
      const pgError: PostgrestError = {
        message: 'permission denied for table',
        details: '',
        hint: '',
        code: '42501',
      };

      const result = handleSupabaseError(pgError);

      expect(result.code).toBe(ErrorCode.PERMISSION_DENIED);
      expect(result.message).toBe('You do not have permission to perform this action');
    });

    it('converts 23505 (unique violation) to VALIDATION_ERROR', () => {
      const pgError: PostgrestError = {
        message: 'duplicate key value violates unique constraint',
        details: 'Key (email)=(test@example.com) already exists.',
        hint: '',
        code: '23505',
      };

      const result = handleSupabaseError(pgError);

      expect(result.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(result.message).toBe('A record with this value already exists');
    });

    it('converts unknown codes to DATABASE_ERROR', () => {
      const pgError: PostgrestError = {
        message: 'Something unexpected',
        details: '',
        hint: '',
        code: '99999',
      };

      const result = handleSupabaseError(pgError);

      expect(result.code).toBe(ErrorCode.DATABASE_ERROR);
    });
  });

  describe('AuthError handling', () => {
    it('converts invalid_credentials to AUTH_ERROR', () => {
      const authError = {
        name: 'AuthApiError',
        message: 'Invalid login credentials',
        status: 400,
        code: 'invalid_credentials',
      } as AuthError;

      const result = handleSupabaseError(authError);

      expect(result.code).toBe(ErrorCode.AUTH_ERROR);
      expect(result.message).toBe('Invalid credentials');
    });

    it('converts user_not_found to NOT_FOUND', () => {
      const authError = {
        name: 'AuthApiError',
        message: 'User not found',
        status: 404,
        code: 'user_not_found',
      } as AuthError;

      const result = handleSupabaseError(authError);

      expect(result.code).toBe(ErrorCode.NOT_FOUND);
    });

    it('converts session_not_found to AUTH_ERROR', () => {
      const authError = {
        name: 'AuthApiError',
        message: 'Session not found',
        status: 401,
        code: 'session_not_found',
      } as AuthError;

      const result = handleSupabaseError(authError);

      expect(result.code).toBe(ErrorCode.AUTH_ERROR);
      expect(result.message).toBe('Your session has expired. Please sign in again.');
    });
  });

  describe('Generic error handling', () => {
    it('wraps unknown errors as UNKNOWN', () => {
      const error = new Error('Something broke');

      const result = handleSupabaseError(error);

      expect(result.code).toBe(ErrorCode.UNKNOWN);
      expect(result.cause).toBe(error);
    });

    it('preserves original error as cause', () => {
      const original = new Error('Original');

      const result = handleSupabaseError(original);

      expect(result.cause).toBe(original);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/errors/handleSupabaseError.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Implement handleSupabaseError**

```typescript
// src/lib/errors/handleSupabaseError.ts
import type { PostgrestError, AuthError } from '@supabase/supabase-js';
import { AppError, ErrorCode, type ErrorCodeType } from './AppError';

interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
  name?: string;
}

/**
 * Convert Supabase errors to user-friendly AppErrors
 */
export function handleSupabaseError(error: unknown): AppError {
  // Handle PostgrestError (database errors)
  if (isPostgrestError(error)) {
    return handlePostgrestError(error);
  }

  // Handle AuthError
  if (isAuthError(error)) {
    return handleAuthError(error);
  }

  // Handle generic errors
  if (error instanceof Error) {
    return new AppError(
      error.message || 'An unexpected error occurred',
      ErrorCode.UNKNOWN,
      error
    );
  }

  // Fallback for non-Error types
  return new AppError(
    'An unexpected error occurred',
    ErrorCode.UNKNOWN,
    undefined,
    { originalError: error }
  );
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    !('status' in error && 'name' in error)
  );
}

function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: string }).name?.includes('Auth')
  );
}

function handlePostgrestError(error: PostgrestError): AppError {
  const errorMappings: Record<string, { code: ErrorCodeType; message: string }> = {
    PGRST116: { code: ErrorCode.NOT_FOUND, message: 'Resource not found' },
    '42501': { code: ErrorCode.PERMISSION_DENIED, message: 'You do not have permission to perform this action' },
    '23505': { code: ErrorCode.VALIDATION_ERROR, message: 'A record with this value already exists' },
    '23503': { code: ErrorCode.VALIDATION_ERROR, message: 'Referenced record does not exist' },
    '23502': { code: ErrorCode.VALIDATION_ERROR, message: 'Required field is missing' },
    '22P02': { code: ErrorCode.VALIDATION_ERROR, message: 'Invalid input format' },
  };

  const mapping = errorMappings[error.code];
  if (mapping) {
    return new AppError(mapping.message, mapping.code, undefined, {
      originalCode: error.code,
      details: error.details,
    });
  }

  return new AppError(
    'A database error occurred',
    ErrorCode.DATABASE_ERROR,
    undefined,
    { originalCode: error.code, message: error.message }
  );
}

function handleAuthError(error: AuthError): AppError {
  const code = (error as { code?: string }).code || '';

  const errorMappings: Record<string, { code: ErrorCodeType; message: string }> = {
    invalid_credentials: { code: ErrorCode.AUTH_ERROR, message: 'Invalid credentials' },
    user_not_found: { code: ErrorCode.NOT_FOUND, message: 'User not found' },
    session_not_found: { code: ErrorCode.AUTH_ERROR, message: 'Your session has expired. Please sign in again.' },
    email_not_confirmed: { code: ErrorCode.AUTH_ERROR, message: 'Please confirm your email address' },
    invalid_token: { code: ErrorCode.AUTH_ERROR, message: 'Invalid or expired token' },
  };

  const mapping = errorMappings[code];
  if (mapping) {
    return new AppError(mapping.message, mapping.code, undefined, {
      originalCode: code,
    });
  }

  return new AppError(
    error.message || 'Authentication error',
    ErrorCode.AUTH_ERROR,
    undefined,
    { originalCode: code }
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test tests/unit/errors/handleSupabaseError.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/errors/handleSupabaseError.ts tests/unit/errors/handleSupabaseError.test.ts
git commit -m "feat(errors): add handleSupabaseError utility"
```

---

## Task 7: Error Utilities - Barrel Export

**Files:**
- Create: `src/lib/errors/index.ts`

**Step 1: Create barrel export**

```typescript
// src/lib/errors/index.ts
export { AppError, ErrorCode, type ErrorCodeType, type ErrorContext } from './AppError';
export { handleSupabaseError } from './handleSupabaseError';
```

**Step 2: Commit**

```bash
git add src/lib/errors/index.ts
git commit -m "feat(errors): add barrel export for error utilities"
```

---

## Task 8: ErrorBoundary Component

**Files:**
- Create: `src/components/ErrorBoundary.tsx`
- Test: `tests/unit/components/ErrorBoundary.test.tsx`

**Step 1: Write failing tests**

```typescript
// tests/unit/components/ErrorBoundary.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Component that throws an error
function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Normal content</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for expected errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('shows error message in fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/test error/i)).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('provides reset function via render prop fallback', async () => {
    const { rerender } = render(
      <ErrorBoundary
        fallback={({ reset }) => (
          <button onClick={reset}>Try again</button>
        )}
      >
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/components/ErrorBoundary.test.tsx`
Expected: FAIL with "Cannot find module '@/components/ErrorBoundary'"

**Step 3: Implement ErrorBoundary**

```typescript
// src/components/ErrorBoundary.tsx
'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface FallbackProps {
  error: Error;
  reset: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: FallbackProps) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props;

      if (typeof fallback === 'function') {
        return fallback({ error: this.state.error, reset: this.reset });
      }

      if (fallback) {
        return fallback;
      }

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center">
          <h2 className="mb-2 text-lg font-semibold text-red-600 dark:text-red-400">
            Something went wrong
          </h2>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            {this.state.error.message}
          </p>
          <button
            onClick={this.reset}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Step 4: Update components barrel export**

```typescript
// src/components/index.ts
export { ProtectedRoute } from './ProtectedRoute';
export { ErrorBoundary } from './ErrorBoundary';
```

**Step 5: Run tests to verify they pass**

Run: `pnpm test tests/unit/components/ErrorBoundary.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/ErrorBoundary.tsx src/components/index.ts tests/unit/components/ErrorBoundary.test.tsx
git commit -m "feat(errors): add ErrorBoundary component"
```

---

## Task 9: Toast Component

**Files:**
- Create: `src/lib/context/toast.types.ts`
- Create: `src/lib/context/ToastContext.tsx`
- Create: `src/components/Toast.tsx`
- Test: `tests/unit/components/Toast.test.tsx`

**Step 1: Write failing tests**

```typescript
// tests/unit/components/Toast.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '@/lib/context/ToastContext';
import { Toast } from '@/components/Toast';

function TestComponent() {
  const { showToast } = useToast();

  return (
    <div>
      <button onClick={() => showToast({ type: 'success', message: 'Success!' })}>
        Show Success
      </button>
      <button onClick={() => showToast({ type: 'error', message: 'Error!' })}>
        Show Error
      </button>
      <button onClick={() => showToast({ type: 'info', message: 'Info!' })}>
        Show Info
      </button>
    </div>
  );
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows success toast when triggered', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <ToastProvider>
        <TestComponent />
        <Toast />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Success'));

    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('shows error toast with error styling', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <ToastProvider>
        <TestComponent />
        <Toast />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Error'));

    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-red-50');
  });

  it('auto-dismisses after duration', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <ToastProvider>
        <TestComponent />
        <Toast />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Success'));
    expect(screen.getByText('Success!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText('Success!')).not.toBeInTheDocument();
  });

  it('can be manually dismissed', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <ToastProvider>
        <TestComponent />
        <Toast />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Success'));
    expect(screen.getByText('Success!')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(screen.queryByText('Success!')).not.toBeInTheDocument();
  });

  it('throws when useToast used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function BadComponent() {
      useToast();
      return null;
    }

    expect(() => render(<BadComponent />)).toThrow(
      'useToast must be used within a ToastProvider'
    );

    spy.mockRestore();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/components/Toast.test.tsx`
Expected: FAIL with "Cannot find module"

**Step 3: Install @testing-library/user-event if needed**

```bash
pnpm add -D @testing-library/user-event
```

**Step 4: Create toast types**

```typescript
// src/lib/context/toast.types.ts
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ToastOptions {
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ToastContextValue {
  toasts: ToastMessage[];
  showToast: (options: ToastOptions) => void;
  dismissToast: (id: string) => void;
}
```

**Step 5: Create ToastContext**

```typescript
// src/lib/context/ToastContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { ToastContextValue, ToastMessage, ToastOptions } from './toast.types';

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((options: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const toast: ToastMessage = {
      id,
      type: options.type,
      message: options.message,
      duration: options.duration ?? 5000,
    };

    setToasts((prev) => [...prev, toast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
```

**Step 6: Create Toast component**

```typescript
// src/components/Toast.tsx
'use client';

import { useEffect, useCallback } from 'react';
import { useToast } from '@/lib/context/ToastContext';
import type { ToastType } from '@/lib/context/toast.types';

const toastStyles: Record<ToastType, string> = {
  success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
};

const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

export function Toast() {
  const { toasts, dismissToast } = useToast();

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onDismiss={dismissToast}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

function ToastItem({ id, type, message, duration = 5000, onDismiss }: ToastItemProps) {
  const handleDismiss = useCallback(() => {
    onDismiss(id);
  }, [id, onDismiss]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(handleDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, handleDismiss]);

  return (
    <div
      role="alert"
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg ${toastStyles[type]}`}
    >
      <span className="text-lg" aria-hidden="true">
        {icons[type]}
      </span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        className="rounded p-1 opacity-70 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
```

**Step 7: Update barrel exports**

```typescript
// src/components/index.ts
export { ProtectedRoute } from './ProtectedRoute';
export { ErrorBoundary } from './ErrorBoundary';
export { Toast } from './Toast';
```

```typescript
// src/lib/context/index.ts
export { AuthProvider, AuthContext } from './AuthContext';
export type { AuthState, AuthContextValue } from './auth.types';
export { ToastProvider, useToast } from './ToastContext';
export type { ToastMessage, ToastOptions, ToastType } from './toast.types';
```

**Step 8: Run tests to verify they pass**

Run: `pnpm test tests/unit/components/Toast.test.tsx`
Expected: PASS

**Step 9: Commit**

```bash
git add src/lib/context/toast.types.ts src/lib/context/ToastContext.tsx src/components/Toast.tsx src/components/index.ts src/lib/context/index.ts tests/unit/components/Toast.test.tsx
git commit -m "feat(errors): add Toast component and ToastProvider"
```

---

## Task 10: useSRS Hook

**Files:**
- Create: `src/lib/hooks/useSRS.ts`
- Test: `tests/unit/hooks/useSRS.test.tsx`

**Step 1: Write failing tests**

```typescript
// tests/unit/hooks/useSRS.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSRS } from '@/lib/hooks/useSRS';
import { AuthProvider } from '@/lib/context/AuthContext';
import type { ReactNode } from 'react';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          lte: vi.fn(),
          order: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase/client';

const mockUser = { id: 'user-123', email: 'test@example.com' };

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useSRS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });
  });

  describe('initialization', () => {
    it('returns loading true initially', () => {
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useSRS(), { wrapper });

      expect(result.current.loading).toBe(true);
    });

    it('fetches due cards on mount', async () => {
      const mockProgress = [
        {
          id: 'progress-1',
          user_id: 'user-123',
          exercise_id: 'ex-1',
          ease_factor: 2.5,
          interval: 1,
          repetitions: 1,
          next_review: '2026-01-02T00:00:00Z',
          last_reviewed: '2026-01-01T00:00:00Z',
          times_seen: 1,
          times_correct: 1,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: mockProgress, error: null }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.dueCards).toHaveLength(1);
      expect(result.current.dueCards[0].exerciseId).toBe('ex-1');
    });
  });

  describe('recordAnswer', () => {
    it('updates card state after answer', async () => {
      const mockFrom = vi.mocked(supabase.from);

      // Initial fetch
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'new-progress',
                user_id: 'user-123',
                exercise_id: 'ex-1',
                ease_factor: 2.5,
                interval: 1,
                repetitions: 1,
                next_review: '2026-01-03T00:00:00Z',
                last_reviewed: '2026-01-02T00:00:00Z',
                times_seen: 1,
                times_correct: 1,
                created_at: '2026-01-02T00:00:00Z',
                updated_at: '2026-01-02T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.recordAnswer('ex-1', 4);
      });

      expect(mockFrom).toHaveBeenCalledWith('user_progress');
    });

    it('sets error on failure', async () => {
      const mockFrom = vi.mocked(supabase.from);

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error', code: '50000' },
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.recordAnswer('ex-1', 4);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('currentCard', () => {
    it('returns first due card', async () => {
      const mockProgress = [
        {
          id: 'p1',
          user_id: 'user-123',
          exercise_id: 'ex-1',
          ease_factor: 2.5,
          interval: 1,
          repetitions: 1,
          next_review: '2026-01-01T00:00:00Z',
          last_reviewed: null,
          times_seen: 1,
          times_correct: 0,
          created_at: '2025-12-31T00:00:00Z',
          updated_at: '2025-12-31T00:00:00Z',
        },
        {
          id: 'p2',
          user_id: 'user-123',
          exercise_id: 'ex-2',
          ease_factor: 2.5,
          interval: 1,
          repetitions: 1,
          next_review: '2026-01-02T00:00:00Z',
          last_reviewed: null,
          times_seen: 1,
          times_correct: 0,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: mockProgress, error: null }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentCard?.exerciseId).toBe('ex-1');
    });

    it('returns null when no cards due', async () => {
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentCard).toBeNull();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/hooks/useSRS.test.tsx`
Expected: FAIL with "Cannot find module '@/lib/hooks/useSRS'"

**Step 3: Implement useSRS hook**

```typescript
// src/lib/hooks/useSRS.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { mapUserProgress, cardStateToProgressUpdate } from '@/lib/supabase/mappers';
import { calculateNextReview, createInitialCardState } from '@/lib/srs';
import { handleSupabaseError } from '@/lib/errors';
import type { DueCard } from '@/lib/srs';
import type { Quality, DbUserProgress } from '@/lib/types';
import type { AppError } from '@/lib/errors';

interface UseSRSReturn {
  dueCards: DueCard[];
  currentCard: DueCard | null;
  loading: boolean;
  error: AppError | null;
  recordAnswer: (exerciseId: string, quality: Quality) => Promise<void>;
  refetch: () => Promise<void>;
  remainingCount: number;
}

export function useSRS(): UseSRSReturn {
  const { user, loading: authLoading } = useAuth();
  const [dueCards, setDueCards] = useState<DueCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const fetchDueCards = useCallback(async () => {
    if (!user) {
      setDueCards([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const now = new Date().toISOString();

    const { data, error: fetchError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .lte('next_review', now);

    if (fetchError) {
      setError(handleSupabaseError(fetchError));
      setLoading(false);
      return;
    }

    const cards: DueCard[] = (data || [])
      .map((row) => {
        const progress = mapUserProgress(row as DbUserProgress);
        return {
          exerciseId: progress.exerciseId,
          state: {
            easeFactor: progress.easeFactor,
            interval: progress.interval,
            repetitions: progress.repetitions,
            nextReview: new Date(progress.nextReview),
            lastReviewed: progress.lastReviewed ? new Date(progress.lastReviewed) : null,
          },
          isNew: false,
        };
      })
      .sort((a, b) => a.state.nextReview.getTime() - b.state.nextReview.getTime());

    setDueCards(cards);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchDueCards();
    }
  }, [authLoading, fetchDueCards]);

  const recordAnswer = useCallback(
    async (exerciseId: string, quality: Quality): Promise<void> => {
      if (!user) {
        setError(handleSupabaseError(new Error('Must be authenticated')));
        return;
      }

      setError(null);

      // Find existing card state or create initial
      const existingCard = dueCards.find((c) => c.exerciseId === exerciseId);
      const currentState = existingCard?.state ?? createInitialCardState();

      // Calculate new state
      const result = calculateNextReview(quality, currentState);
      const dbUpdate = cardStateToProgressUpdate(result.newState);

      // Increment counters
      const existingProgress = existingCard
        ? await supabase
            .from('user_progress')
            .select('times_seen, times_correct')
            .eq('user_id', user.id)
            .eq('exercise_id', exerciseId)
            .single()
        : null;

      const timesSeen = ((existingProgress?.data?.times_seen as number) || 0) + 1;
      const timesCorrect = ((existingProgress?.data?.times_correct as number) || 0) + (result.wasCorrect ? 1 : 0);

      const { error: upsertError } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          exercise_id: exerciseId,
          ...dbUpdate,
          times_seen: timesSeen,
          times_correct: timesCorrect,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (upsertError) {
        setError(handleSupabaseError(upsertError));
        return;
      }

      // Remove card from due list (optimistic update)
      setDueCards((prev) => prev.filter((c) => c.exerciseId !== exerciseId));
    },
    [user, dueCards]
  );

  const currentCard = dueCards.length > 0 ? dueCards[0] : null;

  return {
    dueCards,
    currentCard,
    loading: authLoading || loading,
    error,
    recordAnswer,
    refetch: fetchDueCards,
    remainingCount: dueCards.length,
  };
}
```

**Step 4: Update hooks barrel export**

```typescript
// src/lib/hooks/index.ts
export { useAuth } from './useAuth';
export { useProfile } from './useProfile';
export { useRequireAuth } from './useRequireAuth';
export { useSRS } from './useSRS';
```

**Step 5: Run tests to verify they pass**

Run: `pnpm test tests/unit/hooks/useSRS.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add src/lib/hooks/useSRS.ts src/lib/hooks/index.ts tests/unit/hooks/useSRS.test.tsx
git commit -m "feat(srs): add useSRS hook for session management"
```

---

## Task 11: Integration Test - SRS Flow

**Files:**
- Create: `tests/integration/srs/srs-flow.test.ts`

**Step 1: Write integration test**

```typescript
// tests/integration/srs/srs-flow.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  LOCAL_SUPABASE_URL,
  LOCAL_SUPABASE_ANON_KEY,
  LOCAL_SUPABASE_SERVICE_KEY,
} from '../../setup';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || LOCAL_SUPABASE_SERVICE_KEY;

const serviceClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

describe('SRS Flow Integration', () => {
  let testUserId: string;
  let testExerciseId: string;

  beforeAll(async () => {
    // Create test user
    const { data: userData } = await serviceClient.auth.admin.createUser({
      email: `srs-test-${Date.now()}@example.com`,
      email_confirm: true,
    });
    testUserId = userData.user!.id;

    // Get an exercise ID from seed data
    const { data: exercises } = await serviceClient
      .from('exercises')
      .select('id')
      .limit(1)
      .single();
    testExerciseId = exercises!.id;
  });

  afterAll(async () => {
    // Clean up test user (cascades to user_progress)
    if (testUserId) {
      await serviceClient.auth.admin.deleteUser(testUserId);
    }
  });

  beforeEach(async () => {
    // Clean up any existing progress for this user
    await serviceClient
      .from('user_progress')
      .delete()
      .eq('user_id', testUserId);
  });

  it('creates progress record on first answer', async () => {
    // Simulate first answer (quality 4 = good)
    const now = new Date();
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + 1); // Initial interval = 1

    const { data, error } = await serviceClient
      .from('user_progress')
      .insert({
        user_id: testUserId,
        exercise_id: testExerciseId,
        ease_factor: 2.5,
        interval: 1,
        repetitions: 1,
        next_review: nextReview.toISOString(),
        last_reviewed: now.toISOString(),
        times_seen: 1,
        times_correct: 1,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.ease_factor).toBe(2.5);
    expect(data.interval).toBe(1);
    expect(data.repetitions).toBe(1);
  });

  it('updates progress after subsequent answer', async () => {
    // Create initial progress
    const now = new Date();
    await serviceClient.from('user_progress').insert({
      user_id: testUserId,
      exercise_id: testExerciseId,
      ease_factor: 2.5,
      interval: 1,
      repetitions: 1,
      next_review: now.toISOString(),
      last_reviewed: now.toISOString(),
      times_seen: 1,
      times_correct: 1,
    });

    // Update with second answer (quality 4 -> interval becomes 6)
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + 6);

    const { data, error } = await serviceClient
      .from('user_progress')
      .update({
        ease_factor: 2.5,
        interval: 6,
        repetitions: 2,
        next_review: nextReview.toISOString(),
        last_reviewed: now.toISOString(),
        times_seen: 2,
        times_correct: 2,
      })
      .eq('user_id', testUserId)
      .eq('exercise_id', testExerciseId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.interval).toBe(6);
    expect(data.repetitions).toBe(2);
  });

  it('resets progress on failure', async () => {
    // Create progress with good history
    const now = new Date();
    await serviceClient.from('user_progress').insert({
      user_id: testUserId,
      exercise_id: testExerciseId,
      ease_factor: 2.5,
      interval: 10,
      repetitions: 3,
      next_review: now.toISOString(),
      last_reviewed: now.toISOString(),
      times_seen: 3,
      times_correct: 3,
    });

    // Simulate failure (quality < 3)
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + 1); // Reset to 1 day

    const { data, error } = await serviceClient
      .from('user_progress')
      .update({
        interval: 1,
        repetitions: 0,
        next_review: nextReview.toISOString(),
        last_reviewed: now.toISOString(),
        times_seen: 4,
        times_correct: 3, // Did not increment
      })
      .eq('user_id', testUserId)
      .eq('exercise_id', testExerciseId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.interval).toBe(1);
    expect(data.repetitions).toBe(0);
    expect(data.times_correct).toBe(3);
  });

  it('fetches due cards correctly', async () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get multiple exercise IDs
    const { data: exercises } = await serviceClient
      .from('exercises')
      .select('id')
      .limit(3);

    // Create due card (yesterday)
    await serviceClient.from('user_progress').insert({
      user_id: testUserId,
      exercise_id: exercises![0].id,
      ease_factor: 2.5,
      interval: 1,
      repetitions: 1,
      next_review: yesterday.toISOString(),
      last_reviewed: yesterday.toISOString(),
      times_seen: 1,
      times_correct: 1,
    });

    // Create not-due card (tomorrow)
    await serviceClient.from('user_progress').insert({
      user_id: testUserId,
      exercise_id: exercises![1].id,
      ease_factor: 2.5,
      interval: 2,
      repetitions: 1,
      next_review: tomorrow.toISOString(),
      last_reviewed: now.toISOString(),
      times_seen: 1,
      times_correct: 1,
    });

    // Fetch due cards
    const { data: dueCards } = await serviceClient
      .from('user_progress')
      .select('*')
      .eq('user_id', testUserId)
      .lte('next_review', now.toISOString());

    expect(dueCards).toHaveLength(1);
    expect(dueCards![0].exercise_id).toBe(exercises![0].id);
  });
});
```

**Step 2: Create test directory**

```bash
mkdir -p tests/integration/srs
```

**Step 3: Run integration tests**

Run: `pnpm test tests/integration/srs/srs-flow.test.ts`
Expected: PASS (4 tests)

**Step 4: Commit**

```bash
git add tests/integration/srs/srs-flow.test.ts
git commit -m "test(srs): add SRS flow integration tests"
```

---

## Task 12: Run Full Test Suite and Verification

**Step 1: Run all tests**

Run: `pnpm test`
Expected: All tests pass

**Step 2: Run type check**

Run: `pnpm tsc --noEmit`
Expected: No type errors

**Step 3: Run linter**

Run: `pnpm lint`
Expected: No errors

**Step 4: Build application**

Run: `pnpm build`
Expected: Build succeeds

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat(milestone-3): complete SRS Engine & Error Handling

- Implement SM-2 algorithm (calculateNextReview, getDueCards, getNewCards)
- Add useSRS hook for session management
- Create AppError class with error codes
- Add handleSupabaseError utility for user-friendly messages
- Implement ErrorBoundary component
- Add Toast component with ToastProvider
- Add comprehensive test coverage (~40 new tests)
- Add SRS flow integration tests"
```

---

## Summary

| Task | Files Created/Modified | Tests Added |
|------|------------------------|-------------|
| 1. SRS Types | `srs/types.ts` | 3 |
| 2. calculateNextReview | `srs/algorithm.ts` | 17 |
| 3. getDueCards/getNewCards | `srs/algorithm.ts` | 9 |
| 4. Mappers & Export | `srs/index.ts`, `mappers.ts` | 4 |
| 5. AppError | `errors/AppError.ts` | 7 |
| 6. handleSupabaseError | `errors/handleSupabaseError.ts` | 9 |
| 7. Error Barrel | `errors/index.ts` | 0 |
| 8. ErrorBoundary | `components/ErrorBoundary.tsx` | 6 |
| 9. Toast | `components/Toast.tsx`, `context/ToastContext.tsx` | 5 |
| 10. useSRS Hook | `hooks/useSRS.ts` | 6 |
| 11. Integration Tests | `tests/integration/srs/` | 4 |
| 12. Verification | - | 0 |
| **Total** | **~15 files** | **~70 tests** |

---

## Verification Checklist

Before marking Milestone 3 complete:

- [ ] All tests pass: `pnpm test`
- [ ] Type check passes: `pnpm tsc --noEmit`
- [ ] Lint passes: `pnpm lint`
- [ ] Build succeeds: `pnpm build`
- [ ] calculateNextReview correctly implements SM-2
- [ ] getDueCards returns cards due for review
- [ ] getNewCards returns exercises without progress
- [ ] useSRS hook fetches and updates progress
- [ ] ErrorBoundary catches and displays errors
- [ ] Toast shows notifications with auto-dismiss
- [ ] handleSupabaseError converts errors to user-friendly messages

---

## Related

- [[2026-01-02-foundation-roadmap]] - Master roadmap
- [[2026-01-02-milestone-1-database-types]] - Milestone 1 plan
- [[2026-01-02-milestone-2-auth-hooks]] - Milestone 2 plan
- [[Testing-Strategy]] - Test approach
- [[Architecture]] - System design
