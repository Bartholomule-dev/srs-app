import { describe, it, expect } from 'vitest';
import { qualityToRating, inferRating, isPassingRating } from '@/lib/srs/fsrs/mapping';
import type { Quality } from '@/lib/types';

describe('qualityToRating', () => {
  it('maps quality 0-2 to Again', () => {
    expect(qualityToRating(0 as Quality)).toBe('Again');
    expect(qualityToRating(1 as Quality)).toBe('Again');
    expect(qualityToRating(2 as Quality)).toBe('Again');
  });

  it('maps quality 3 to Hard', () => {
    expect(qualityToRating(3 as Quality)).toBe('Hard');
  });

  it('maps quality 4 to Good', () => {
    expect(qualityToRating(4 as Quality)).toBe('Good');
  });

  it('maps quality 5 to Easy', () => {
    expect(qualityToRating(5 as Quality)).toBe('Easy');
  });
});

describe('inferRating', () => {
  it('returns Again for incorrect answers', () => {
    expect(inferRating({ isCorrect: false, hintUsed: false, responseTimeMs: 5000 })).toBe('Again');
  });

  it('returns Hard for correct with hint', () => {
    expect(inferRating({ isCorrect: true, hintUsed: true, responseTimeMs: 5000 })).toBe('Hard');
  });

  it('returns Good for correct with AST match', () => {
    expect(inferRating({ isCorrect: true, hintUsed: false, responseTimeMs: 5000, usedAstMatch: true })).toBe('Good');
  });

  it('returns Easy for fast correct answer (<15s)', () => {
    expect(inferRating({ isCorrect: true, hintUsed: false, responseTimeMs: 10000 })).toBe('Easy');
  });

  it('returns Good for medium-speed correct (15-30s)', () => {
    expect(inferRating({ isCorrect: true, hintUsed: false, responseTimeMs: 20000 })).toBe('Good');
  });

  it('returns Hard for slow correct (>30s)', () => {
    expect(inferRating({ isCorrect: true, hintUsed: false, responseTimeMs: 35000 })).toBe('Hard');
  });

  describe('boundary conditions at thresholds', () => {
    // FAST_THRESHOLD_MS = 15000 - boundary between Easy and Good
    it('returns Easy at 14999ms (just under fast threshold)', () => {
      expect(inferRating({ isCorrect: true, hintUsed: false, responseTimeMs: 14999 })).toBe('Easy');
    });

    it('returns Good at exactly 15000ms (fast threshold)', () => {
      // responseTimeMs < FAST_THRESHOLD_MS returns Easy
      // At exactly 15000ms, it's NOT less than 15000, so it falls through to Good
      expect(inferRating({ isCorrect: true, hintUsed: false, responseTimeMs: 15000 })).toBe('Good');
    });

    // SLOW_THRESHOLD_MS = 30000 - boundary between Good and Hard
    it('returns Good at 29999ms (just under slow threshold)', () => {
      expect(inferRating({ isCorrect: true, hintUsed: false, responseTimeMs: 29999 })).toBe('Good');
    });

    it('returns Hard at exactly 30000ms (slow threshold)', () => {
      // responseTimeMs < SLOW_THRESHOLD_MS returns Good
      // At exactly 30000ms, it's NOT less than 30000, so it falls through to Hard
      expect(inferRating({ isCorrect: true, hintUsed: false, responseTimeMs: 30000 })).toBe('Hard');
    });
  });
});

describe('isPassingRating', () => {
  it('returns false for Again', () => {
    expect(isPassingRating('Again')).toBe(false);
  });

  it('returns true for Hard', () => {
    expect(isPassingRating('Hard')).toBe(true);
  });

  it('returns true for Good', () => {
    expect(isPassingRating('Good')).toBe(true);
  });

  it('returns true for Easy', () => {
    expect(isPassingRating('Easy')).toBe(true);
  });
});
