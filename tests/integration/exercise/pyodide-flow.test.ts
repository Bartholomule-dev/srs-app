// tests/integration/exercise/pyodide-flow.test.ts
import { describe, it, expect, vi } from 'vitest';
import { gradeAnswerAsync } from '@/lib/exercise/grading';
import type { Exercise } from '@/lib/types';
import type { PyodideInterface } from '@/lib/context/PyodideContext';

// Note: These tests use mock Pyodide. E2E tests verify real Pyodide.

function createMockPyodide(output: string | Error): PyodideInterface {
  return {
    runPython: vi.fn(() => {
      if (output instanceof Error) throw output;
      return output;
    }),
    runPythonAsync: vi.fn(async () => {
      if (output instanceof Error) throw output;
      return output;
    }),
    loadPackage: vi.fn(async () => {}),
    globals: new Map(),
  };
}

const baseExercise: Partial<Exercise> = {
  id: 'test-id',
  slug: 'test-exercise',
  title: 'Test',
  hints: [],
  concept: 'strings',
  subconcept: 'test',
  level: 'practice',
  prereqs: [],
  pattern: 'output',
  objective: 'Test',
  difficulty: 1,
  language: 'python',
  category: 'test',
  tags: [],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('Pyodide grading integration', () => {
  describe('predict exercises', () => {
    it('grades predict exercise via execution', async () => {
      const mockPyodide = createMockPyodide('42\n');
      const exercise = {
        ...baseExercise,
        exerciseType: 'predict',
        code: 'print(6 * 7)',
        expectedAnswer: '42',
        acceptedSolutions: [],
      } as Exercise;

      const result = await gradeAnswerAsync('42', exercise, mockPyodide);

      expect(result.isCorrect).toBe(true);
      expect(result.gradingMethod).toBe('execution');
    });

    it('marks wrong predict answer correctly', async () => {
      const mockPyodide = createMockPyodide('42\n');
      const exercise = {
        ...baseExercise,
        exerciseType: 'predict',
        code: 'print(6 * 7)',
        expectedAnswer: '42',
        acceptedSolutions: [],
      } as Exercise;

      const result = await gradeAnswerAsync('43', exercise, mockPyodide);

      expect(result.isCorrect).toBe(false);
      expect(result.gradingMethod).toBe('execution');
    });

    it('falls back to string matching on execution error', async () => {
      const mockPyodide = createMockPyodide(new Error('Runtime error'));
      const exercise = {
        ...baseExercise,
        exerciseType: 'predict',
        code: 'print(6 * 7)',
        expectedAnswer: '42',
        acceptedSolutions: [],
      } as Exercise;

      const result = await gradeAnswerAsync('42', exercise, mockPyodide);

      expect(result.isCorrect).toBe(true); // String match works
      expect(result.gradingMethod).toBe('execution-fallback');
    });
  });

  describe('write exercises with execution', () => {
    it('verifies write exercise by execution', async () => {
      const mockPyodide = createMockPyodide('[2, 4, 6]\n');
      const exercise = {
        ...baseExercise,
        exerciseType: 'write',
        prompt: 'Double each number',
        expectedAnswer: '[2, 4, 6]',
        acceptedSolutions: [],
        verifyByExecution: true,
      } as Exercise;

      const result = await gradeAnswerAsync(
        '[x*2 for x in [1, 2, 3]]',
        exercise,
        mockPyodide
      );

      expect(result.isCorrect).toBe(true);
      expect(result.gradingMethod).toBe('execution');
    });
  });

  describe('non-execution exercises', () => {
    it('uses string matching when Pyodide available but not needed', async () => {
      const mockPyodide = createMockPyodide('unused');
      const exercise = {
        ...baseExercise,
        exerciseType: 'write',
        prompt: 'Print hello',
        expectedAnswer: 'print("hello")',
        acceptedSolutions: [],
        // verifyByExecution NOT set
      } as Exercise;

      const result = await gradeAnswerAsync(
        'print("hello")',
        exercise,
        mockPyodide
      );

      expect(result.isCorrect).toBe(true);
      expect(result.gradingMethod).toBe('string');
    });

    it('uses string matching when pyodide is null', async () => {
      const exercise = {
        ...baseExercise,
        exerciseType: 'predict',
        code: 'print("hello")',
        expectedAnswer: 'hello',
        acceptedSolutions: [],
      } as Exercise;

      const result = await gradeAnswerAsync('hello', exercise, null);

      expect(result.isCorrect).toBe(true);
      expect(result.gradingMethod).toBe('string');
    });
  });
});
