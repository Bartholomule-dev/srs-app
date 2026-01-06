// tests/unit/srs/mappers.test.ts
import { describe, it, expect } from 'vitest';
import { toDbUserProgressUpdate, cardStateToProgressUpdate, mapExercise } from '@/lib/supabase/mappers';
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

describe('mapExercise', () => {
  // Mock database exercise for reuse
  const mockDbExercise = {
    id: 'test-id',
    slug: 'for-loop-range',
    language: 'python',
    category: 'loops',
    difficulty: 1,
    title: 'For Loop Range',
    prompt: 'Write a for loop',
    expected_answer: 'for i in range(5):',
    accepted_solutions: [],
    hints: ['Use range()'],
    explanation: null,
    tags: ['loops'],
    times_practiced: 0,
    avg_success_rate: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    // Taxonomy fields (Phase 2)
    concept: 'control-flow',
    subconcept: 'for',
    level: 'intro',
    prereqs: [],
    exercise_type: 'write',
    pattern: 'iteration',
    template: null,
    blank_position: null,
    // Phase 2.5 fields
    objective: null,
    targets: null,
    // Phase 2.7: predict-output
    code: null,
  };

  it('maps slug field', () => {
    const result = mapExercise(mockDbExercise);
    expect(result.slug).toBe('for-loop-range');
  });

  describe('mapExercise objective and targets', () => {
    it('maps objective field', () => {
      const db = {
        ...mockDbExercise,
        objective: 'Use enumerate to iterate with index',
      };
      const result = mapExercise(db);
      expect(result.objective).toBe('Use enumerate to iterate with index');
    });

    it('maps targets array', () => {
      const db = {
        ...mockDbExercise,
        targets: ['for', 'enumerate', 'list-comp'],
      };
      const result = mapExercise(db);
      expect(result.targets).toEqual(['for', 'enumerate', 'list-comp']);
    });

    it('maps null targets when not provided', () => {
      const db = {
        ...mockDbExercise,
        targets: null,
      };
      const result = mapExercise(db);
      expect(result.targets).toBeNull();
    });

    it('defaults objective to empty string when null', () => {
      const db = {
        ...mockDbExercise,
        objective: null,
      };
      const result = mapExercise(db);
      expect(result.objective).toBe('');
    });
  });
});
