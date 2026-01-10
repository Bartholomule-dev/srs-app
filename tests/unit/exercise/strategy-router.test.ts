// tests/unit/exercise/strategy-router.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gradeWithStrategy } from '@/lib/exercise/strategy-router';
import { getDefaultStrategy } from '@/lib/exercise/strategy-defaults';
import type { Exercise } from '@/lib/types';

// Mock strategy implementations
vi.mock('@/lib/exercise/matching', () => ({
  checkAnswerWithAlternatives: vi.fn(),
  checkFillInAnswer: vi.fn(),
  checkPredictAnswer: vi.fn(),
}));

vi.mock('@/lib/exercise/token-compare', () => ({
  compareByTokens: vi.fn(),
}));

vi.mock('@/lib/exercise/verification', () => ({
  verifyWithScript: vi.fn(),
}));

vi.mock('@/lib/exercise/execution', () => ({
  verifyPredictAnswer: vi.fn(),
  verifyWriteAnswer: vi.fn(),
}));

describe('strategy-router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDefaultStrategy', () => {
    it('returns exact for fill-in exercises', () => {
      const exercise = createExercise({ exerciseType: 'fill-in' });
      const config = getDefaultStrategy(exercise);
      expect(config.primary).toBe('exact');
    });

    it('returns ast for write exercises with exact fallback', () => {
      const exercise = createExercise({ exerciseType: 'write' });
      const config = getDefaultStrategy(exercise);
      expect(config.primary).toBe('ast');
      expect(config.fallback).toBe('exact');
    });

    it('returns execution for predict exercises with fallback', () => {
      const exercise = createExercise({ exerciseType: 'predict' });
      const config = getDefaultStrategy(exercise);
      expect(config.primary).toBe('execution');
      expect(config.fallback).toBe('exact');
    });

    it('respects explicit gradingStrategy override', () => {
      const exercise = createExercise({
        exerciseType: 'write',
        gradingStrategy: 'token',
      });
      const config = getDefaultStrategy(exercise);
      expect(config.primary).toBe('token');
    });

    it('uses execution when verificationScript present', () => {
      const exercise = createExercise({
        exerciseType: 'write',
        verificationScript: 'assert func(1) == 2',
      });
      const config = getDefaultStrategy(exercise);
      expect(config.primary).toBe('execution');
    });

    it('supports legacy verifyByExecution flag', () => {
      const exercise = createExercise({
        exerciseType: 'write',
        verifyByExecution: true,
      });
      const config = getDefaultStrategy(exercise);
      expect(config.primary).toBe('execution');
    });
  });

  describe('gradeWithStrategy', () => {
    describe('exact strategy', () => {
      it('uses string matching without Pyodide', async () => {
        const { checkAnswerWithAlternatives } = await import('@/lib/exercise/matching');
        vi.mocked(checkAnswerWithAlternatives).mockReturnValue({
          isCorrect: true,
          normalizedUserAnswer: 'x',
          normalizedExpectedAnswer: 'x',
          usedAstMatch: false,
          matchedAlternative: null,
        });

        // Explicitly use exact strategy to test exact behavior
        const exercise = createExercise({ exerciseType: 'write', gradingStrategy: 'exact' });
        const result = await gradeWithStrategy('x', exercise, null);

        expect(result.isCorrect).toBe(true);
        expect(result.infraAvailable).toBe(true);
        expect(result.fallbackUsed).toBe(false);
      });
    });

    describe('write exercises (ast default)', () => {
      it('falls back to exact when Pyodide unavailable', async () => {
        const { checkAnswerWithAlternatives } = await import('@/lib/exercise/matching');
        vi.mocked(checkAnswerWithAlternatives).mockReturnValue({
          isCorrect: true,
          normalizedUserAnswer: 'x',
          normalizedExpectedAnswer: 'x',
          usedAstMatch: false,
          matchedAlternative: null,
        });

        // Write exercises now default to ast with exact fallback
        const exercise = createExercise({ exerciseType: 'write' });
        const result = await gradeWithStrategy('x', exercise, null);

        expect(result.isCorrect).toBe(true);
        // Fallback was used (exact strategy works without Pyodide)
        expect(result.infraAvailable).toBe(true); // From fallback result
        expect(result.fallbackUsed).toBe(true);
        expect(result.fallbackReason).toBe('infra_unavailable');
      });
    });

    describe('token strategy', () => {
      it('falls back to exact when Pyodide unavailable', async () => {
        const { checkAnswerWithAlternatives } = await import('@/lib/exercise/matching');
        vi.mocked(checkAnswerWithAlternatives).mockReturnValue({
          isCorrect: true,
          normalizedUserAnswer: 'x',
          normalizedExpectedAnswer: 'x',
          usedAstMatch: false,
          matchedAlternative: null,
        });

        const exercise = createExercise({
          exerciseType: 'write',
          gradingStrategy: 'token',
        });

        const result = await gradeWithStrategy('x', exercise, null);

        // Fallback to exact strategy should succeed
        expect(result.infraAvailable).toBe(true);
        expect(result.fallbackUsed).toBe(true);
        expect(result.fallbackReason).toBe('infra_unavailable');
      });

      it('uses token comparison when Pyodide available', async () => {
        const { compareByTokens } = await import('@/lib/exercise/token-compare');
        vi.mocked(compareByTokens).mockResolvedValue({
          match: true,
          matchedAlternative: null,
        });

        const mockPyodide = {} as any;
        const exercise = createExercise({
          exerciseType: 'write',
          gradingStrategy: 'token',
        });

        const result = await gradeWithStrategy('x', exercise, mockPyodide);

        expect(result.isCorrect).toBe(true);
        expect(result.infraAvailable).toBe(true);
      });
    });

    describe('execution strategy', () => {
      it('uses verification script when present', async () => {
        const { verifyWithScript } = await import('@/lib/exercise/verification');
        vi.mocked(verifyWithScript).mockResolvedValue({ passed: true, infraAvailable: true });

        const exercise = createExercise({
          exerciseType: 'write',
          verificationScript: 'assert func(1) == 2',
        });

        const result = await gradeWithStrategy('def func(x): return x + 1', exercise, null);

        expect(result.isCorrect).toBe(true);
        expect(result.infraAvailable).toBe(true);
      });

      it('checks accepted_solutions when predict execution returns false', async () => {
        const { verifyPredictAnswer } = await import('@/lib/exercise/execution');
        const { checkPredictAnswer } = await import('@/lib/exercise/matching');

        // Execution says output doesn't match (e.g., set order difference)
        vi.mocked(verifyPredictAnswer).mockResolvedValue(false);

        // But accepted_solutions contains the user's answer
        vi.mocked(checkPredictAnswer).mockReturnValue(true);

        const mockPyodide = {} as any;
        const exercise = createExercise({
          exerciseType: 'predict',
          code: '{x % 3 for x in [1, 2, 3]}',
          expectedAnswer: '{0, 1, 2}',
          acceptedSolutions: ['{0, 1, 2}', '{0, 2, 1}', '{1, 0, 2}'],
        });

        // User typed a different order than what Python printed
        const result = await gradeWithStrategy('{1, 0, 2}', exercise, mockPyodide);

        expect(result.isCorrect).toBe(true);
        expect(result.infraAvailable).toBe(true);
        expect(checkPredictAnswer).toHaveBeenCalledWith(
          '{1, 0, 2}',
          '{0, 1, 2}',
          ['{0, 1, 2}', '{0, 2, 1}', '{1, 0, 2}']
        );
      });

      it('returns matchedAlternative when accepted_solutions match', async () => {
        const { verifyPredictAnswer } = await import('@/lib/exercise/execution');
        const { checkPredictAnswer } = await import('@/lib/exercise/matching');

        vi.mocked(verifyPredictAnswer).mockResolvedValue(false);
        vi.mocked(checkPredictAnswer).mockReturnValue(true);

        const mockPyodide = {} as any;
        const exercise = createExercise({
          exerciseType: 'predict',
          code: 'print({1, 2})',
          expectedAnswer: '{1, 2}',
          acceptedSolutions: ['{1, 2}', '{2, 1}'],
        });

        const result = await gradeWithStrategy('{2, 1}', exercise, mockPyodide);

        expect(result.isCorrect).toBe(true);
        expect(result.matchedAlternative).toBe('{2, 1}');
      });
    });

    describe('fallback behavior', () => {
      it('falls back ONLY when infrastructure unavailable', async () => {
        const { checkAnswerWithAlternatives } = await import('@/lib/exercise/matching');
        vi.mocked(checkAnswerWithAlternatives).mockReturnValue({
          isCorrect: true,
          normalizedUserAnswer: 'x',
          normalizedExpectedAnswer: 'x',
          usedAstMatch: false,
          matchedAlternative: null,
        });

        const exercise = createExercise({
          exerciseType: 'write',
          gradingStrategy: 'token',
        });

        const result = await gradeWithStrategy('x', exercise, null);

        expect(result.fallbackUsed).toBe(true);
        expect(result.fallbackReason).toBe('infra_unavailable');
      });

      it('does NOT fallback when answer is incorrect', async () => {
        const { compareByTokens } = await import('@/lib/exercise/token-compare');
        vi.mocked(compareByTokens).mockResolvedValue({
          match: false,
          matchedAlternative: null,
        });

        const mockPyodide = {} as any;
        const exercise = createExercise({
          exerciseType: 'write',
          gradingStrategy: 'token',
        });

        const result = await gradeWithStrategy('wrong', exercise, mockPyodide);

        expect(result.isCorrect).toBe(false);
        expect(result.fallbackUsed).toBe(false);
      });
    });

    describe('Pyodide loading boundary', () => {
      it('does not trigger Pyodide load for exact strategy', async () => {
        const { checkAnswerWithAlternatives } = await import('@/lib/exercise/matching');
        vi.mocked(checkAnswerWithAlternatives).mockReturnValue({
          isCorrect: true,
          normalizedUserAnswer: 'x',
          normalizedExpectedAnswer: 'x',
          usedAstMatch: false,
          matchedAlternative: null,
        });

        const exercise = createExercise({ exerciseType: 'write' });
        const result = await gradeWithStrategy('x', exercise, null);

        expect(result.isCorrect).toBe(true);
        const { compareByTokens } = await import('@/lib/exercise/token-compare');
        expect(compareByTokens).not.toHaveBeenCalled();
      });
    });
  });
});

function createExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'test-id',
    slug: 'test-exercise',
    language: 'python',
    category: 'basics',
    difficulty: 1,
    title: 'Test',
    prompt: 'Test',
    expectedAnswer: 'x',
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
    objective: 'Test',
    targets: null,
    template: null,
    blankPosition: null,
    ...overrides,
  } as Exercise;
}
