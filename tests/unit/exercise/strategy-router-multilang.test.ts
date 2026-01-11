// tests/unit/exercise/strategy-router-multilang.test.ts
// Tests for multi-language grading support in the strategy router

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { gradeWithStrategy } from '@/lib/exercise/strategy-router';
import type { Exercise } from '@/lib/types';
import type { LanguageRuntime, ExecutionResult, TokenCompareResult, AstCompareResult } from '@/lib/runtime';

// Mock the runtime module
vi.mock('@/lib/runtime', () => {
  const mockPythonRuntime = {
    language: 'python',
    isReady: vi.fn(() => true),
    setPyodide: vi.fn(),
    execute: vi.fn(),
    tokenize: vi.fn(),
    compareByTokens: vi.fn(),
    compareByAst: vi.fn(),
    initialize: vi.fn(),
    terminate: vi.fn(),
  };

  const mockJavaScriptRuntime = {
    language: 'javascript',
    isReady: vi.fn(() => true),
    execute: vi.fn(),
    tokenize: vi.fn(),
    compareByTokens: vi.fn(),
    compareByAst: vi.fn(),
    initialize: vi.fn(),
    terminate: vi.fn(),
  };

  return {
    getRuntimeForLanguage: vi.fn((lang: string) => {
      if (lang === 'python') return mockPythonRuntime;
      if (lang === 'javascript') return mockJavaScriptRuntime;
      return undefined;
    }),
    PythonRuntime: class {},
  };
});

// Mock strategy dependencies
vi.mock('@/lib/exercise/matching', () => ({
  checkAnswerWithAlternatives: vi.fn(),
  checkFillInAnswer: vi.fn(),
  checkPredictAnswer: vi.fn(),
}));

vi.mock('@/lib/exercise/token-compare', () => ({
  compareByTokens: vi.fn(),
}));

vi.mock('@/lib/exercise/ast-compare', () => ({
  compareByAst: vi.fn(),
}));

vi.mock('@/lib/exercise/verification', () => ({
  verifyWithScript: vi.fn(),
}));

vi.mock('@/lib/exercise/execution', () => ({
  verifyPredictAnswer: vi.fn(),
  verifyWriteAnswer: vi.fn(),
}));

describe('Multi-language grading in strategy-router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('JavaScript exercises', () => {
    describe('token strategy', () => {
      it('should use JavaScript runtime for token comparison', async () => {
        const { getRuntimeForLanguage } = await import('@/lib/runtime');
        const mockRuntime = getRuntimeForLanguage('javascript') as LanguageRuntime;

        vi.mocked(mockRuntime.compareByTokens).mockResolvedValue({
          match: true,
          matchedAlternative: null,
        });

        const exercise = createExercise({
          language: 'javascript',
          exerciseType: 'write',
          gradingStrategy: 'token',
          expectedAnswer: 'const x = 1;',
        });

        const result = await gradeWithStrategy('const x = 1;', exercise, null, 'javascript');

        expect(result.isCorrect).toBe(true);
        expect(result.infraAvailable).toBe(true);
        expect(result.fallbackUsed).toBe(false);
        expect(mockRuntime.compareByTokens).toHaveBeenCalledWith(
          'const x = 1;',
          'const x = 1;',
          []
        );
      });

      it('should handle JavaScript token comparison with alternatives', async () => {
        const { getRuntimeForLanguage } = await import('@/lib/runtime');
        const mockRuntime = getRuntimeForLanguage('javascript') as LanguageRuntime;

        vi.mocked(mockRuntime.compareByTokens).mockResolvedValue({
          match: true,
          matchedAlternative: 'let x = 1;',
        });

        const exercise = createExercise({
          language: 'javascript',
          exerciseType: 'write',
          gradingStrategy: 'token',
          expectedAnswer: 'const x = 1;',
          acceptedSolutions: ['let x = 1;', 'var x = 1;'],
        });

        const result = await gradeWithStrategy('let x = 1;', exercise, null, 'javascript');

        expect(result.isCorrect).toBe(true);
        expect(result.matchedAlternative).toBe('let x = 1;');
      });

      it('should fallback to exact when JavaScript runtime errors', async () => {
        const { getRuntimeForLanguage } = await import('@/lib/runtime');
        const mockRuntime = getRuntimeForLanguage('javascript') as LanguageRuntime;

        vi.mocked(mockRuntime.compareByTokens).mockRejectedValue(new Error('Parse error'));

        const { checkAnswerWithAlternatives } = await import('@/lib/exercise/matching');
        vi.mocked(checkAnswerWithAlternatives).mockReturnValue({
          isCorrect: true,
          normalizedUserAnswer: 'const x = 1;',
          normalizedExpectedAnswer: 'const x = 1;',
          usedAstMatch: false,
          matchedAlternative: null,
        });

        const exercise = createExercise({
          language: 'javascript',
          exerciseType: 'write',
          gradingStrategy: 'token',
          expectedAnswer: 'const x = 1;',
        });

        const result = await gradeWithStrategy('const x = 1;', exercise, null, 'javascript');

        // Should fallback to exact strategy
        expect(result.fallbackUsed).toBe(true);
        expect(result.fallbackReason).toBe('infra_unavailable');
        expect(result.isCorrect).toBe(true);
      });
    });

    describe('ast strategy', () => {
      it('should use JavaScript runtime for AST comparison', async () => {
        const { getRuntimeForLanguage } = await import('@/lib/runtime');
        const mockRuntime = getRuntimeForLanguage('javascript') as LanguageRuntime;

        vi.mocked(mockRuntime.compareByAst).mockResolvedValue({
          match: true,
          matchedAlternative: null,
          infraAvailable: true,
        });

        const exercise = createExercise({
          language: 'javascript',
          exerciseType: 'write',
          gradingStrategy: 'ast',
          expectedAnswer: 'const x = 1;',
        });

        const result = await gradeWithStrategy('const  x  =  1;', exercise, null, 'javascript');

        expect(result.isCorrect).toBe(true);
        expect(result.infraAvailable).toBe(true);
        expect(mockRuntime.compareByAst).toHaveBeenCalled();
      });

      it('should fallback when AST comparison fails', async () => {
        const { getRuntimeForLanguage } = await import('@/lib/runtime');
        const mockRuntime = getRuntimeForLanguage('javascript') as LanguageRuntime;

        vi.mocked(mockRuntime.compareByAst).mockResolvedValue({
          match: false,
          matchedAlternative: null,
          infraAvailable: false,
          error: 'Parse error',
        });

        const { checkAnswerWithAlternatives } = await import('@/lib/exercise/matching');
        vi.mocked(checkAnswerWithAlternatives).mockReturnValue({
          isCorrect: true,
          normalizedUserAnswer: 'const x = 1;',
          normalizedExpectedAnswer: 'const x = 1;',
          usedAstMatch: false,
          matchedAlternative: null,
        });

        const exercise = createExercise({
          language: 'javascript',
          exerciseType: 'write',
          gradingStrategy: 'ast',
          expectedAnswer: 'const x = 1;',
        });

        const result = await gradeWithStrategy('const x = 1;', exercise, null, 'javascript');

        expect(result.fallbackUsed).toBe(true);
        expect(result.isCorrect).toBe(true);
      });
    });

    describe('execution strategy', () => {
      it('should use JavaScript runtime for execution-based predict exercises', async () => {
        const { getRuntimeForLanguage } = await import('@/lib/runtime');
        const mockRuntime = getRuntimeForLanguage('javascript') as LanguageRuntime;

        vi.mocked(mockRuntime.execute).mockResolvedValue({
          success: true,
          output: '42',
          error: null,
        });

        const exercise = createExercise({
          language: 'javascript',
          exerciseType: 'predict',
          code: 'console.log(6 * 7);',
          expectedAnswer: '42',
        });

        const result = await gradeWithStrategy('42', exercise, null, 'javascript');

        expect(result.isCorrect).toBe(true);
        expect(result.infraAvailable).toBe(true);
        expect(mockRuntime.execute).toHaveBeenCalledWith('console.log(6 * 7);');
      });

      it('should check accepted solutions when execution output differs', async () => {
        const { getRuntimeForLanguage } = await import('@/lib/runtime');
        const mockRuntime = getRuntimeForLanguage('javascript') as LanguageRuntime;

        vi.mocked(mockRuntime.execute).mockResolvedValue({
          success: true,
          output: '{ a: 1, b: 2 }',
          error: null,
        });

        const { checkPredictAnswer } = await import('@/lib/exercise/matching');
        vi.mocked(checkPredictAnswer).mockReturnValue(true);

        const exercise = createExercise({
          language: 'javascript',
          exerciseType: 'predict',
          code: 'console.log({ a: 1, b: 2 });',
          expectedAnswer: '{ a: 1, b: 2 }',
          acceptedSolutions: ['{ b: 2, a: 1 }', '{ a: 1, b: 2 }'],
        });

        const result = await gradeWithStrategy('{ b: 2, a: 1 }', exercise, null, 'javascript');

        expect(result.isCorrect).toBe(true);
      });

      it('should handle JavaScript execution errors', async () => {
        const { getRuntimeForLanguage } = await import('@/lib/runtime');
        const mockRuntime = getRuntimeForLanguage('javascript') as LanguageRuntime;

        vi.mocked(mockRuntime.execute).mockResolvedValue({
          success: false,
          output: null,
          error: 'ReferenceError: x is not defined',
        });

        const exercise = createExercise({
          language: 'javascript',
          exerciseType: 'predict',
          code: 'console.log(x);',
          expectedAnswer: 'undefined',
        });

        const result = await gradeWithStrategy('undefined', exercise, null, 'javascript');

        expect(result.isCorrect).toBe(false);
        expect(result.error).toBe('ReferenceError: x is not defined');
      });
    });

    describe('exact strategy', () => {
      it('should use exact string matching for fill-in JavaScript exercises', async () => {
        const { checkFillInAnswer } = await import('@/lib/exercise/matching');
        vi.mocked(checkFillInAnswer).mockReturnValue(true);

        const exercise = createExercise({
          language: 'javascript',
          exerciseType: 'fill-in',
          expectedAnswer: 'const',
          template: '___ x = 1;',
        });

        const result = await gradeWithStrategy('const', exercise, null, 'javascript');

        expect(result.isCorrect).toBe(true);
        expect(result.infraAvailable).toBe(true);
        // Exact strategy doesn't need runtime
        expect(checkFillInAnswer).toHaveBeenCalledWith('const', 'const', []);
      });
    });
  });

  describe('Python exercises (backwards compatibility)', () => {
    it('should still use Pyodide for Python token comparison', async () => {
      const { compareByTokens } = await import('@/lib/exercise/token-compare');
      vi.mocked(compareByTokens).mockResolvedValue({
        match: true,
        matchedAlternative: null,
      });

      const mockPyodide = {} as any;
      const exercise = createExercise({
        language: 'python',
        exerciseType: 'write',
        gradingStrategy: 'token',
        expectedAnswer: 'x = 1',
      });

      const result = await gradeWithStrategy('x = 1', exercise, mockPyodide);

      expect(result.isCorrect).toBe(true);
      expect(compareByTokens).toHaveBeenCalledWith(mockPyodide, 'x = 1', 'x = 1', []);
    });

    it('should still use Pyodide for Python AST comparison', async () => {
      const { compareByAst } = await import('@/lib/exercise/ast-compare');
      vi.mocked(compareByAst).mockResolvedValue({
        match: true,
        matchedAlternative: null,
        infraAvailable: true,
      });

      const mockPyodide = {} as any;
      const exercise = createExercise({
        language: 'python',
        exerciseType: 'write',
        expectedAnswer: 'x = 1',
      });

      const result = await gradeWithStrategy('x = 1', exercise, mockPyodide);

      expect(result.isCorrect).toBe(true);
      expect(compareByAst).toHaveBeenCalled();
    });

    it('should set Pyodide on Python runtime when available', async () => {
      const { getRuntimeForLanguage } = await import('@/lib/runtime');
      const mockPythonRuntime = getRuntimeForLanguage('python');

      const { checkAnswerWithAlternatives } = await import('@/lib/exercise/matching');
      vi.mocked(checkAnswerWithAlternatives).mockReturnValue({
        isCorrect: true,
        normalizedUserAnswer: 'x',
        normalizedExpectedAnswer: 'x',
        usedAstMatch: false,
        matchedAlternative: null,
      });

      const mockPyodide = {} as any;
      const exercise = createExercise({
        language: 'python',
        exerciseType: 'write',
        gradingStrategy: 'exact',
      });

      await gradeWithStrategy('x', exercise, mockPyodide);

      expect(mockPythonRuntime?.setPyodide).toHaveBeenCalledWith(mockPyodide);
    });
  });

  describe('Language inference', () => {
    it('should use explicit language parameter over exercise.language', async () => {
      const { getRuntimeForLanguage } = await import('@/lib/runtime');
      const jsRuntime = getRuntimeForLanguage('javascript') as LanguageRuntime;

      vi.mocked(jsRuntime.compareByTokens).mockResolvedValue({
        match: true,
        matchedAlternative: null,
      });

      // Exercise says Python but explicit param says JavaScript
      const exercise = createExercise({
        language: 'python',
        exerciseType: 'write',
        gradingStrategy: 'token',
        expectedAnswer: 'const x = 1;',
      });

      await gradeWithStrategy('const x = 1;', exercise, null, 'javascript');

      // Should use JavaScript runtime because of explicit param
      expect(jsRuntime.compareByTokens).toHaveBeenCalled();
    });

    it('should use exercise.language when no explicit parameter', async () => {
      const { getRuntimeForLanguage } = await import('@/lib/runtime');
      const jsRuntime = getRuntimeForLanguage('javascript') as LanguageRuntime;

      vi.mocked(jsRuntime.compareByTokens).mockResolvedValue({
        match: true,
        matchedAlternative: null,
      });

      const exercise = createExercise({
        language: 'javascript',
        exerciseType: 'write',
        gradingStrategy: 'token',
        expectedAnswer: 'const x = 1;',
      });

      await gradeWithStrategy('const x = 1;', exercise, null);

      expect(jsRuntime.compareByTokens).toHaveBeenCalled();
    });

    it('should default to Python when no language specified', async () => {
      const { compareByTokens } = await import('@/lib/exercise/token-compare');
      vi.mocked(compareByTokens).mockResolvedValue({
        match: true,
        matchedAlternative: null,
      });

      const mockPyodide = {} as any;
      // Exercise without language field
      const exercise = {
        ...createExercise({
          exerciseType: 'write',
          gradingStrategy: 'token',
        }),
        language: undefined as any,
      };

      await gradeWithStrategy('x = 1', exercise, mockPyodide);

      // Should use Python's Pyodide-based comparison
      expect(compareByTokens).toHaveBeenCalled();
    });
  });

  describe('Unsupported languages', () => {
    it('should fallback to exact when runtime unavailable for language', async () => {
      const { getRuntimeForLanguage } = await import('@/lib/runtime');
      vi.mocked(getRuntimeForLanguage).mockImplementation((lang) => {
        if (lang === 'typescript') return undefined;
        return null as any;
      });

      const { checkAnswerWithAlternatives } = await import('@/lib/exercise/matching');
      vi.mocked(checkAnswerWithAlternatives).mockReturnValue({
        isCorrect: true,
        normalizedUserAnswer: 'x',
        normalizedExpectedAnswer: 'x',
        usedAstMatch: false,
        matchedAlternative: null,
      });

      const exercise = createExercise({
        language: 'typescript',
        exerciseType: 'write',
        gradingStrategy: 'token',
      });

      const result = await gradeWithStrategy('x', exercise, null, 'typescript' as any);

      // Should fallback because no TypeScript runtime
      expect(result.fallbackUsed).toBe(true);
      expect(result.isCorrect).toBe(true);
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
