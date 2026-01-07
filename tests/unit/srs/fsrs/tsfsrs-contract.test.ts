// tests/unit/srs/fsrs/tsfsrs-contract.test.ts
// Contract tests documenting ts-fsrs library behavior
//
// PURPOSE: Pin third-party library behavior so we know if upgrades change it.
// These are NOT bugs in our code - they document how ts-fsrs handles edge cases.
//
// If these tests fail after a ts-fsrs upgrade, it means the library behavior
// changed and we need to decide if that affects our adapter logic.

import { describe, it, expect } from 'vitest';
import { reviewCard, progressToCardState } from '@/lib/srs/fsrs/adapter';
import type { FSRSState } from '@/lib/srs/fsrs/types';

describe('ts-fsrs Contract Tests', () => {
  describe('Known behaviors to watch for on upgrade', () => {
    it('negative stability produces NaN in calculations', () => {
      // ts-fsrs uses stability in exponential calculations.
      // Negative values produce NaN - this is expected library behavior.
      // If this test fails after upgrade, ts-fsrs may have added validation.
      const badProgress = {
        stability: -5,
        difficulty: 0.3,
        fsrsState: 'Review' as FSRSState,
        due: new Date(),
        lastReview: new Date(),
        reps: 5,
        lapses: 0,
        elapsedDays: 3,
        scheduledDays: 7,
      };

      const card = progressToCardState(badProgress);
      const result = reviewCard(card, 'Good', new Date());

      // Current behavior: NaN propagates through calculations
      expect(Number.isNaN(result.cardState.stability)).toBe(true);
    });

    it('NaN stability propagates through calculations', () => {
      // ts-fsrs does not sanitize NaN inputs - they propagate.
      // This documents that we must validate data BEFORE passing to ts-fsrs.
      const badProgress = {
        stability: NaN,
        difficulty: 0.3,
        fsrsState: 'Review' as FSRSState,
        due: new Date(),
        lastReview: new Date(),
        reps: 5,
        lapses: 0,
        elapsedDays: 3,
        scheduledDays: 7,
      };

      const card = progressToCardState(badProgress);
      const result = reviewCard(card, 'Good', new Date());

      // Current behavior: NaN in = NaN out
      expect(Number.isNaN(result.cardState.stability)).toBe(true);
    });

    it('difficulty outside 0-1 range is accepted without clamping', () => {
      // ts-fsrs accepts difficulty values outside the documented 0-1 range.
      // This may change in future versions.
      const badProgress = {
        stability: 5,
        difficulty: 1.5, // Outside 0-1 range
        fsrsState: 'Review' as FSRSState,
        due: new Date(),
        lastReview: new Date(),
        reps: 5,
        lapses: 0,
        elapsedDays: 3,
        scheduledDays: 7,
      };

      const card = progressToCardState(badProgress);
      // Current behavior: accepted without error or clamping
      expect(card.difficulty).toBe(1.5);
    });
  });
});
