// tests/unit/exercise/quality.test.ts
import { describe, it, expect } from 'vitest';
import { inferQuality, FAST_THRESHOLD_MS, SLOW_THRESHOLD_MS, MIN_REPS_FOR_EASY } from '@/lib/exercise';
import type { QualityInputs } from '@/lib/exercise';

describe('inferQuality', () => {
  describe('incorrect answers', () => {
    it('returns 2 for incorrect answer', () => {
      const inputs: QualityInputs = {
        isCorrect: false,
        hintUsed: false,
        responseTimeMs: 5000,
        usedAstMatch: false,
      };
      expect(inferQuality(inputs)).toBe(2);
    });

    it('returns 2 for incorrect even with fast time', () => {
      const inputs: QualityInputs = {
        isCorrect: false,
        hintUsed: false,
        responseTimeMs: 1000,
        usedAstMatch: false,
      };
      expect(inferQuality(inputs)).toBe(2);
    });
  });

  describe('correct with hint', () => {
    it('returns 3 when hint was used', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: true,
        responseTimeMs: 5000,
        usedAstMatch: false,
      };
      expect(inferQuality(inputs)).toBe(3);
    });

    it('returns 3 even with fast time when hint used', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: true,
        responseTimeMs: 1000,
        usedAstMatch: false,
      };
      expect(inferQuality(inputs)).toBe(3);
    });
  });

  describe('correct with AST match', () => {
    it('returns 4 when AST match was used', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: 5000,
        usedAstMatch: true,
      };
      expect(inferQuality(inputs)).toBe(4);
    });

    it('returns 4 even with fast time for AST match', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: 1000,
        usedAstMatch: true,
      };
      expect(inferQuality(inputs)).toBe(4);
    });
  });

  describe('correct without hint (time-based)', () => {
    it('returns 5 for fast answer (< 10s) when reps >= MIN_REPS_FOR_EASY', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: FAST_THRESHOLD_MS - 1,
        usedAstMatch: false,
        currentReps: MIN_REPS_FOR_EASY,
      };
      expect(inferQuality(inputs)).toBe(5);
    });

    it('returns 4 for fast answer when reps < MIN_REPS_FOR_EASY (prevents one-shot mastery)', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: FAST_THRESHOLD_MS - 1,
        usedAstMatch: false,
        currentReps: 1,
      };
      expect(inferQuality(inputs)).toBe(4);
    });

    it('returns 4 for fast answer when currentReps is 0', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: FAST_THRESHOLD_MS - 1,
        usedAstMatch: false,
        currentReps: 0,
      };
      expect(inferQuality(inputs)).toBe(4);
    });

    it('returns 5 for fast answer when currentReps is undefined (legacy behavior)', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: FAST_THRESHOLD_MS - 1,
        usedAstMatch: false,
        // currentReps not provided
      };
      expect(inferQuality(inputs)).toBe(5);
    });

    it('returns 4 for medium answer (10-30s)', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: FAST_THRESHOLD_MS,
        usedAstMatch: false,
      };
      expect(inferQuality(inputs)).toBe(4);
    });

    it('returns 4 for answer just under slow threshold', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: SLOW_THRESHOLD_MS - 1,
        usedAstMatch: false,
      };
      expect(inferQuality(inputs)).toBe(4);
    });

    it('returns 3 for slow answer (>= 30s)', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: SLOW_THRESHOLD_MS,
        usedAstMatch: false,
      };
      expect(inferQuality(inputs)).toBe(3);
    });

    it('returns 3 for very slow answer', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: 120_000,
        usedAstMatch: false,
      };
      expect(inferQuality(inputs)).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('handles zero response time with sufficient reps', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: 0,
        usedAstMatch: false,
        currentReps: MIN_REPS_FOR_EASY,
      };
      expect(inferQuality(inputs)).toBe(5);
    });

    it('handles zero response time with insufficient reps', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: 0,
        usedAstMatch: false,
        currentReps: 0,
      };
      expect(inferQuality(inputs)).toBe(4);
    });

    it('handles exactly FAST_THRESHOLD_MS', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: FAST_THRESHOLD_MS,
        usedAstMatch: false,
      };
      expect(inferQuality(inputs)).toBe(4);
    });

    it('hint takes precedence over AST match', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: true,
        responseTimeMs: 5000,
        usedAstMatch: true,
      };
      expect(inferQuality(inputs)).toBe(3);
    });
  });
});

describe('threshold constants', () => {
  it('FAST_THRESHOLD_MS is 10 seconds', () => {
    expect(FAST_THRESHOLD_MS).toBe(10_000);
  });

  it('SLOW_THRESHOLD_MS is 30 seconds', () => {
    expect(SLOW_THRESHOLD_MS).toBe(30_000);
  });

  it('MIN_REPS_FOR_EASY is 2', () => {
    expect(MIN_REPS_FOR_EASY).toBe(2);
  });
});
