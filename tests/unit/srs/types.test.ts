// tests/unit/srs/types.test.ts
import { describe, it, expect, expectTypeOf } from 'vitest';
import type { CardState, ReviewResult, SRSConfig, DueCard } from '@/lib/srs/types';
import { DEFAULT_SRS_CONFIG } from '@/lib/srs/types';
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

  it('DueCard has exercise data for display', () => {
    expectTypeOf<DueCard>().toMatchTypeOf<{
      exerciseId: string;
      state: CardState;
      isNew: boolean;
    }>();
  });

  it('DEFAULT_SRS_CONFIG has correct default values', () => {
    expect(DEFAULT_SRS_CONFIG).toEqual({
      minEaseFactor: 1.3,
      maxEaseFactor: 3.0,
      initialEaseFactor: 2.5,
      initialInterval: 1,
      graduatingInterval: 6,
    });
  });
});
