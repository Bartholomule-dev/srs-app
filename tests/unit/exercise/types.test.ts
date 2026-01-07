// tests/unit/exercise/types.test.ts
import { describe, it, expect } from 'vitest';
import type { AnswerResult, QualityInputs, GradingMethod, GradingResult, ConstructCheckResult } from '@/lib/exercise';
import { createMockExercise } from '@tests/fixtures/exercise';

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
      const exercise = createMockExercise({
        slug: 'for-loop-range',
        language: 'python',
        category: 'loops',
        title: 'For Loop Range',
        prompt: 'Write a for loop',
        expectedAnswer: 'for i in range(5):',
        tags: ['loops'],
      });
      expect(exercise.slug).toBe('for-loop-range');
      expect(exercise.acceptedSolutions).toEqual([]);
    });
  });

  describe('GradingMethod', () => {
    it('accepts valid grading method values', () => {
      const stringMethod: GradingMethod = 'string';
      const executionMethod: GradingMethod = 'execution';
      const fallbackMethod: GradingMethod = 'execution-fallback';

      expect(stringMethod).toBe('string');
      expect(executionMethod).toBe('execution');
      expect(fallbackMethod).toBe('execution-fallback');
    });
  });

  describe('GradingResult', () => {
    it('has all required properties for correct answer with target construct', () => {
      const result: GradingResult = {
        isCorrect: true,
        usedTargetConstruct: true,
        coachingFeedback: null,
        gradingMethod: 'string',
        normalizedUserAnswer: 'for i in range(5):',
        normalizedExpectedAnswer: 'for i in range(5):',
        matchedAlternative: null,
      };

      expect(result.isCorrect).toBe(true);
      expect(result.usedTargetConstruct).toBe(true);
      expect(result.coachingFeedback).toBeNull();
      expect(result.gradingMethod).toBe('string');
      expect(result.normalizedUserAnswer).toBe('for i in range(5):');
      expect(result.normalizedExpectedAnswer).toBe('for i in range(5):');
      expect(result.matchedAlternative).toBeNull();
    });

    it('supports coaching feedback when correct but missing target construct', () => {
      const result: GradingResult = {
        isCorrect: true,
        usedTargetConstruct: false,
        coachingFeedback: 'Try using a list comprehension for more concise code.',
        gradingMethod: 'execution',
        normalizedUserAnswer: 'result = []\nfor i in range(5):\n  result.append(i)',
        normalizedExpectedAnswer: '[i for i in range(5)]',
        matchedAlternative: null,
      };

      expect(result.isCorrect).toBe(true);
      expect(result.usedTargetConstruct).toBe(false);
      expect(result.coachingFeedback).toBe('Try using a list comprehension for more concise code.');
      expect(result.gradingMethod).toBe('execution');
    });

    it('supports null usedTargetConstruct when no target specified', () => {
      const result: GradingResult = {
        isCorrect: true,
        usedTargetConstruct: null,
        coachingFeedback: null,
        gradingMethod: 'string',
        normalizedUserAnswer: 'print("hello")',
        normalizedExpectedAnswer: 'print("hello")',
        matchedAlternative: null,
      };

      expect(result.usedTargetConstruct).toBeNull();
    });

    it('supports matched alternative', () => {
      const result: GradingResult = {
        isCorrect: true,
        usedTargetConstruct: true,
        coachingFeedback: null,
        gradingMethod: 'string',
        normalizedUserAnswer: 'print("Hello")',
        normalizedExpectedAnswer: 'print("hello")',
        matchedAlternative: 'print("Hello")',
      };

      expect(result.matchedAlternative).toBe('print("Hello")');
    });

    it('supports execution-fallback grading method', () => {
      const result: GradingResult = {
        isCorrect: true,
        usedTargetConstruct: true,
        coachingFeedback: null,
        gradingMethod: 'execution-fallback',
        normalizedUserAnswer: 'x = 5',
        normalizedExpectedAnswer: 'x=5',
        matchedAlternative: null,
      };

      expect(result.gradingMethod).toBe('execution-fallback');
    });
  });

  describe('ConstructCheckResult', () => {
    it('has required detected and constructType properties', () => {
      const result: ConstructCheckResult = {
        detected: true,
        constructType: 'comprehension',
      };

      expect(result.detected).toBe(true);
      expect(result.constructType).toBe('comprehension');
    });

    it('supports null constructType when checking any construct', () => {
      const result: ConstructCheckResult = {
        detected: false,
        constructType: null,
      };

      expect(result.detected).toBe(false);
      expect(result.constructType).toBeNull();
    });

    it('supports various construct types', () => {
      const sliceResult: ConstructCheckResult = {
        detected: true,
        constructType: 'slice',
      };
      const fstringResult: ConstructCheckResult = {
        detected: true,
        constructType: 'f-string',
      };
      const ternaryResult: ConstructCheckResult = {
        detected: true,
        constructType: 'ternary',
      };

      expect(sliceResult.constructType).toBe('slice');
      expect(fstringResult.constructType).toBe('f-string');
      expect(ternaryResult.constructType).toBe('ternary');
    });
  });
});
