import { describe, it, expect } from 'vitest';
import { selectWithAntiRepeat } from '@/lib/session/anti-repeat';
import { createMockExercise } from '@tests/fixtures/exercise';
import type { ExercisePattern, SubconceptProgress } from '@/lib/curriculum/types';

const createMockProgress = (subconcept: string): SubconceptProgress => ({
  id: '1',
  userId: 'user-1',
  subconceptSlug: subconcept,
  conceptSlug: 'control-flow',
  phase: 'learning',
  easeFactor: 2.5,
  interval: 0,
  nextReview: new Date(),
  lastReviewed: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('selectWithAntiRepeat', () => {
  it('returns any candidate when lastPattern is null', () => {
    const candidates = [
      {
        exercise: createMockExercise({
          slug: 'ex1',
          pattern: 'iteration',
          subconcept: 'for',
        }),
        progress: createMockProgress('for'),
      },
    ];

    const result = selectWithAntiRepeat(candidates, null);

    expect(result).not.toBeNull();
    expect(result?.exercise.slug).toBe('ex1');
  });

  it('prefers candidates with different pattern than lastPattern', () => {
    const candidates = [
      {
        exercise: createMockExercise({
          slug: 'ex1',
          pattern: 'iteration',
          subconcept: 'for',
        }),
        progress: createMockProgress('for'),
      },
      {
        exercise: createMockExercise({
          slug: 'ex2',
          pattern: 'accumulator',
          subconcept: 'while',
        }),
        progress: createMockProgress('while'),
      },
    ];

    const result = selectWithAntiRepeat(candidates, 'iteration');

    expect(result?.exercise.pattern).toBe('accumulator');
  });

  it('falls back to same pattern if no alternatives exist', () => {
    const candidates = [
      {
        exercise: createMockExercise({
          slug: 'ex1',
          pattern: 'iteration',
          subconcept: 'for',
        }),
        progress: createMockProgress('for'),
      },
      {
        exercise: createMockExercise({
          slug: 'ex2',
          pattern: 'iteration',
          subconcept: 'while',
        }),
        progress: createMockProgress('while'),
      },
    ];

    const result = selectWithAntiRepeat(candidates, 'iteration');

    expect(result).not.toBeNull();
    expect(result?.exercise.pattern).toBe('iteration');
  });

  it('returns null when no candidates', () => {
    const result = selectWithAntiRepeat([], 'iteration');
    expect(result).toBeNull();
  });

  it('handles undefined pattern the same as null', () => {
    const candidates = [
      {
        exercise: createMockExercise({
          slug: 'ex1',
          pattern: 'filtering',
          subconcept: 'comprehensions',
        }),
        progress: createMockProgress('comprehensions'),
      },
    ];

    const result = selectWithAntiRepeat(candidates, undefined as unknown as ExercisePattern | null);

    expect(result).not.toBeNull();
    expect(result?.exercise.slug).toBe('ex1');
  });

  it('returns first different pattern when multiple alternatives exist', () => {
    const candidates = [
      {
        exercise: createMockExercise({
          slug: 'ex1',
          pattern: 'iteration',
          subconcept: 'for',
        }),
        progress: createMockProgress('for'),
      },
      {
        exercise: createMockExercise({
          slug: 'ex2',
          pattern: 'accumulator',
          subconcept: 'while',
        }),
        progress: createMockProgress('while'),
      },
      {
        exercise: createMockExercise({
          slug: 'ex3',
          pattern: 'filtering',
          subconcept: 'comprehensions',
        }),
        progress: createMockProgress('comprehensions'),
      },
    ];

    const result = selectWithAntiRepeat(candidates, 'iteration');

    // Should pick the first different pattern (accumulator)
    expect(result?.exercise.pattern).toBe('accumulator');
    expect(result?.exercise.slug).toBe('ex2');
  });
});
