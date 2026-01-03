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
