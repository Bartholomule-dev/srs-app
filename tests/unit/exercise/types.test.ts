// tests/unit/exercise/types.test.ts
import { describe, it, expect } from 'vitest';
import type { AnswerResult, QualityInputs } from '@/lib/exercise';

describe('exercise types', () => {
  describe('AnswerResult', () => {
    it('has required properties', () => {
      const result: AnswerResult = {
        isCorrect: true,
        normalizedUserAnswer: 'print(x)',
        normalizedExpectedAnswer: 'print(x)',
        usedAstMatch: false,
      };
      expect(result.isCorrect).toBe(true);
      expect(result.normalizedUserAnswer).toBe('print(x)');
      expect(result.normalizedExpectedAnswer).toBe('print(x)');
      expect(result.usedAstMatch).toBe(false);
    });
  });

  describe('QualityInputs', () => {
    it('has required properties', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: 5000,
        usedAstMatch: false,
      };
      expect(inputs.isCorrect).toBe(true);
      expect(inputs.hintUsed).toBe(false);
      expect(inputs.responseTimeMs).toBe(5000);
      expect(inputs.usedAstMatch).toBe(false);
    });
  });
});
