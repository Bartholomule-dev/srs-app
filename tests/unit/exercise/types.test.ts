// tests/unit/exercise/types.test.ts
import { describe, it, expect } from 'vitest';
import type { AnswerResult, QualityInputs } from '@/lib/exercise';
import type { Exercise } from '@/lib/types/app.types';

describe('exercise types', () => {
  describe('AnswerResult', () => {
    it('has required properties', () => {
      const result: AnswerResult = {
        isCorrect: true,
        normalizedUserAnswer: 'print(x)',
        normalizedExpectedAnswer: 'print(x)',
        usedAstMatch: false,
        matchedAlternative: null,
      };
      expect(result.isCorrect).toBe(true);
      expect(result.normalizedUserAnswer).toBe('print(x)');
      expect(result.normalizedExpectedAnswer).toBe('print(x)');
      expect(result.usedAstMatch).toBe(false);
      expect(result.matchedAlternative).toBeNull();
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

  describe('Exercise type', () => {
    it('includes slug field', () => {
      const exercise: Exercise = {
        id: 'test-id',
        slug: 'for-loop-range',
        language: 'python',
        category: 'loops',
        difficulty: 1,
        title: 'For Loop Range',
        prompt: 'Write a for loop',
        expectedAnswer: 'for i in range(5):',
        acceptedSolutions: [],
        hints: ['Use range()'],
        explanation: null,
        tags: ['loops'],
        timesPracticed: 0,
        avgSuccessRate: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      expect(exercise.slug).toBe('for-loop-range');
      expect(exercise.acceptedSolutions).toEqual([]);
    });
  });
});
