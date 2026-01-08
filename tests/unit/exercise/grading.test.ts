// tests/unit/exercise/grading.test.ts
import { describe, it, expect } from 'vitest';
import { gradeAnswer, shouldShowCoaching, gradeAnswerAsync } from '@/lib/exercise/grading';
import type { Exercise } from '@/lib/types';
import type { GradingResult } from '@/lib/exercise/types';
import { createMockPyodide } from '@tests/fixtures/pyodide';

// Helper to create minimal exercise fixtures
function createExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'test-id',
    slug: 'test-exercise',
    language: 'python',
    category: 'basics',
    difficulty: 1,
    title: 'Test Exercise',
    prompt: 'Write some code',
    expectedAnswer: 'print("hello")',
    acceptedSolutions: [],
    hints: [],
    explanation: null,
    tags: [],
    timesPracticed: 0,
    avgSuccessRate: null,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    concept: 'foundations',
    subconcept: 'print',
    level: 'intro',
    prereqs: [],
    exerciseType: 'write',
    pattern: 'output',
    objective: 'Practice writing code',
    targets: null,
    template: null,
    blankPosition: null,
    ...overrides,
  };
}

describe('grading', () => {
  describe('gradeAnswer', () => {
    describe('Pass 1: Correctness checking', () => {
      describe('write exercises', () => {
        it('should return isCorrect: true for exact match', () => {
          const exercise = createExercise({
            exerciseType: 'write',
            expectedAnswer: 'print("hello")',
          });

          const result = gradeAnswer('print("hello")', exercise);

          expect(result.isCorrect).toBe(true);
          expect(result.gradingMethod).toBe('string');
        });

        it('should return isCorrect: true for normalized match (whitespace)', () => {
          const exercise = createExercise({
            exerciseType: 'write',
            expectedAnswer: 'print("hello")',
          });

          const result = gradeAnswer('  print("hello")  ', exercise);

          expect(result.isCorrect).toBe(true);
        });

        it('should return isCorrect: false for incorrect answer', () => {
          const exercise = createExercise({
            exerciseType: 'write',
            expectedAnswer: 'print("hello")',
          });

          const result = gradeAnswer('print("goodbye")', exercise);

          expect(result.isCorrect).toBe(false);
        });

        it('should accept accepted alternatives', () => {
          const exercise = createExercise({
            exerciseType: 'write',
            expectedAnswer: 'print("hello")',
            acceptedSolutions: ["print('hello')", 'print( "hello" )'],
          });

          const result = gradeAnswer("print('hello')", exercise);

          expect(result.isCorrect).toBe(true);
          expect(result.matchedAlternative).toBe("print('hello')");
        });

        it('should include normalized answers in result', () => {
          const exercise = createExercise({
            exerciseType: 'write',
            expectedAnswer: '  print("hello")  ',
          });

          const result = gradeAnswer('print("hello")', exercise);

          expect(result.normalizedUserAnswer).toBe('print("hello")');
          expect(result.normalizedExpectedAnswer).toBe('print("hello")');
        });
      });

      describe('fill-in exercises', () => {
        it('should grade fill-in exercises correctly', () => {
          const exercise = createExercise({
            exerciseType: 'fill-in',
            expectedAnswer: 'range',
            template: 'for i in _____(10):',
          });

          const result = gradeAnswer('range', exercise);

          expect(result.isCorrect).toBe(true);
          expect(result.gradingMethod).toBe('string');
        });

        it('should trim fill-in answers', () => {
          const exercise = createExercise({
            exerciseType: 'fill-in',
            expectedAnswer: 'range',
          });

          const result = gradeAnswer('  range  ', exercise);

          expect(result.isCorrect).toBe(true);
        });

        it('should accept fill-in alternatives', () => {
          const exercise = createExercise({
            exerciseType: 'fill-in',
            expectedAnswer: 'True',
            acceptedSolutions: ['true', '1'],
          });

          const result = gradeAnswer('true', exercise);

          expect(result.isCorrect).toBe(true);
        });

        it('should reject incorrect fill-in answer', () => {
          const exercise = createExercise({
            exerciseType: 'fill-in',
            expectedAnswer: 'range',
          });

          const result = gradeAnswer('list', exercise);

          expect(result.isCorrect).toBe(false);
        });
      });

      describe('predict exercises', () => {
        it('should grade predict exercises correctly', () => {
          const exercise = createExercise({
            exerciseType: 'predict',
            expectedAnswer: 'Hello, World!',
            code: 'print("Hello, World!")',
          });

          const result = gradeAnswer('Hello, World!', exercise);

          expect(result.isCorrect).toBe(true);
          expect(result.gradingMethod).toBe('string');
        });

        it('should normalize predict answers (trim whitespace)', () => {
          const exercise = createExercise({
            exerciseType: 'predict',
            expectedAnswer: '42',
          });

          const result = gradeAnswer('  42  \n', exercise);

          expect(result.isCorrect).toBe(true);
        });

        it('should accept predict alternatives', () => {
          const exercise = createExercise({
            exerciseType: 'predict',
            expectedAnswer: 'True',
            acceptedSolutions: ['true', '1'],
          });

          const result = gradeAnswer('true', exercise);

          expect(result.isCorrect).toBe(true);
        });

        it('should reject incorrect predict answer', () => {
          const exercise = createExercise({
            exerciseType: 'predict',
            expectedAnswer: '10',
          });

          const result = gradeAnswer('5', exercise);

          expect(result.isCorrect).toBe(false);
        });
      });
    });

    describe('Pass 2: Target construct checking', () => {
      it('should set usedTargetConstruct to null when no targetConstruct defined', () => {
        const exercise = createExercise({
          exerciseType: 'write',
          expectedAnswer: 'items[1:4]',
          targetConstruct: undefined,
        });

        const result = gradeAnswer('items[1:4]', exercise);

        expect(result.isCorrect).toBe(true);
        expect(result.usedTargetConstruct).toBeNull();
        expect(result.coachingFeedback).toBeNull();
      });

      it('should set usedTargetConstruct: true when target construct was used', () => {
        const exercise = createExercise({
          exerciseType: 'write',
          expectedAnswer: 'items[1:4]',
          targetConstruct: { type: 'slice' },
        });

        const result = gradeAnswer('items[1:4]', exercise);

        expect(result.isCorrect).toBe(true);
        expect(result.usedTargetConstruct).toBe(true);
        expect(result.coachingFeedback).toBeNull();
      });

      it('should set usedTargetConstruct: false and add coaching when target not used', () => {
        const exercise = createExercise({
          exerciseType: 'write',
          expectedAnswer: 'items[1:4]',
          acceptedSolutions: ['items[1], items[2], items[3]'],
          targetConstruct: { type: 'slice' },
        });

        // User uses index-based approach instead of slicing
        const result = gradeAnswer('items[1], items[2], items[3]', exercise);

        expect(result.isCorrect).toBe(true);
        expect(result.usedTargetConstruct).toBe(false);
        expect(result.coachingFeedback).not.toBeNull();
      });

      it('should use custom feedback when provided', () => {
        const customFeedback = 'Try using slice syntax for cleaner code!';
        const exercise = createExercise({
          exerciseType: 'write',
          expectedAnswer: 'items[1:4]',
          acceptedSolutions: ['items[1], items[2], items[3]'],
          targetConstruct: { type: 'slice', feedback: customFeedback },
        });

        const result = gradeAnswer('items[1], items[2], items[3]', exercise);

        expect(result.coachingFeedback).toBe(customFeedback);
      });

      it('should use default feedback when no custom feedback specified', () => {
        const exercise = createExercise({
          exerciseType: 'write',
          expectedAnswer: 'items[1:4]',
          acceptedSolutions: ['items[1], items[2], items[3]'],
          targetConstruct: { type: 'slice' },
        });

        const result = gradeAnswer('items[1], items[2], items[3]', exercise);

        expect(result.coachingFeedback).toBe(
          'Great job! Consider trying the suggested approach next time.'
        );
      });

      it('should skip construct check for incorrect answers', () => {
        const exercise = createExercise({
          exerciseType: 'write',
          expectedAnswer: 'items[1:4]',
          targetConstruct: { type: 'slice' },
        });

        const result = gradeAnswer('wrong_answer', exercise);

        expect(result.isCorrect).toBe(false);
        expect(result.usedTargetConstruct).toBeNull();
        expect(result.coachingFeedback).toBeNull();
      });
    });

    describe('various construct types', () => {
      it('should detect comprehension construct', () => {
        const exercise = createExercise({
          exerciseType: 'write',
          expectedAnswer: '[x * 2 for x in items]',
          targetConstruct: { type: 'comprehension' },
        });

        const result = gradeAnswer('[x * 2 for x in items]', exercise);

        expect(result.usedTargetConstruct).toBe(true);
      });

      it('should detect f-string construct', () => {
        const exercise = createExercise({
          exerciseType: 'write',
          expectedAnswer: 'f"Hello {name}"',
          targetConstruct: { type: 'f-string' },
        });

        const result = gradeAnswer('f"Hello {name}"', exercise);

        expect(result.usedTargetConstruct).toBe(true);
      });

      it('should detect enumerate construct', () => {
        const exercise = createExercise({
          exerciseType: 'write',
          expectedAnswer: 'for i, x in enumerate(items):',
          targetConstruct: { type: 'enumerate' },
        });

        const result = gradeAnswer('for i, x in enumerate(items):', exercise);

        expect(result.usedTargetConstruct).toBe(true);
      });
    });
  });

  describe('shouldShowCoaching', () => {
    it('should return true when correct but did not use target construct', () => {
      const result: GradingResult = {
        isCorrect: true,
        usedTargetConstruct: false,
        coachingFeedback: 'Try using slice syntax!',
        gradingMethod: 'string',
        normalizedUserAnswer: 'answer',
        normalizedExpectedAnswer: 'answer',
        matchedAlternative: null,
      };

      expect(shouldShowCoaching(result)).toBe(true);
    });

    it('should return false when correct and used target construct', () => {
      const result: GradingResult = {
        isCorrect: true,
        usedTargetConstruct: true,
        coachingFeedback: null,
        gradingMethod: 'string',
        normalizedUserAnswer: 'answer',
        normalizedExpectedAnswer: 'answer',
        matchedAlternative: null,
      };

      expect(shouldShowCoaching(result)).toBe(false);
    });

    it('should return false when incorrect', () => {
      const result: GradingResult = {
        isCorrect: false,
        usedTargetConstruct: null,
        coachingFeedback: null,
        gradingMethod: 'string',
        normalizedUserAnswer: 'wrong',
        normalizedExpectedAnswer: 'answer',
        matchedAlternative: null,
      };

      expect(shouldShowCoaching(result)).toBe(false);
    });

    it('should return false when no target construct defined', () => {
      const result: GradingResult = {
        isCorrect: true,
        usedTargetConstruct: null,
        coachingFeedback: null,
        gradingMethod: 'string',
        normalizedUserAnswer: 'answer',
        normalizedExpectedAnswer: 'answer',
        matchedAlternative: null,
      };

      expect(shouldShowCoaching(result)).toBe(false);
    });
  });

  describe('gradeAnswerAsync', () => {
    describe('without Pyodide', () => {
      it('uses string matching when pyodide is null', async () => {
        const exercise = createExercise({ expectedAnswer: 's[1:4]' });
        const result = await gradeAnswerAsync('s[1:4]', exercise, null);

        expect(result.isCorrect).toBe(true);
        expect(result.gradingMethod).toBe('string');
      });
    });

    describe('with Pyodide for predict exercises', () => {
      it('uses execution grading for predict exercises', async () => {
        const mockPyodide = createMockPyodide({ output: 'hello\n' });
        const exercise = createExercise({
          exerciseType: 'predict',
          code: 'print("hello")',
          expectedAnswer: 'hello',
        });

        const result = await gradeAnswerAsync('hello', exercise, mockPyodide);

        expect(result.gradingMethod).toBe('execution');
      });

      it('falls back to string on execution error', async () => {
        const mockPyodide = createMockPyodide({ error: new Error('Execution error') });

        const exercise = createExercise({
          exerciseType: 'predict',
          code: 'print("hello")',
          expectedAnswer: 'hello',
        });

        const result = await gradeAnswerAsync('hello', exercise, mockPyodide);

        expect(result.gradingMethod).toBe('execution-fallback');
      });
    });

    describe('with verifyByExecution flag', () => {
      it('uses execution for write exercises with flag', async () => {
        const mockPyodide = createMockPyodide({ output: '[2, 4, 6]\n' });
        const exercise = createExercise({
          exerciseType: 'write',
          expectedAnswer: '[2, 4, 6]',
          verifyByExecution: true,
        });

        const result = await gradeAnswerAsync(
          '[x*2 for x in [1, 2, 3]]',
          exercise,
          mockPyodide
        );

        expect(result.gradingMethod).toBe('execution');
      });
    });
  });
});
