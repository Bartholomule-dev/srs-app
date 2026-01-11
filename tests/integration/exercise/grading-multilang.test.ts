// tests/integration/exercise/grading-multilang.test.ts
// Integration tests for multi-language grading flow
//
// These tests verify the full JavaScript grading flow works correctly,
// including token comparison, AST comparison, and fallback behavior.
//
// Note: Execution tests mock the worker manager since jsdom doesn't fully
// support Web Workers. E2E tests verify real worker execution.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { gradeWithStrategy } from '@/lib/exercise/strategy-router';
import type { Exercise } from '@/lib/types';
import {
  compareByTokens as jsCompareByTokens,
  compareByAst as jsCompareByAst,
  tokenizeJavaScript,
} from '@/lib/runtime/javascript-ast';

// Mock the JavaScript worker for execution tests
// Token and AST comparison use synchronous Acorn functions (no worker needed)
vi.mock('@/lib/runtime/javascript-worker', () => {
  const mockExecute = vi.fn();

  return {
    JavaScriptWorkerManager: class {
      async initialize() {}
      isReady() {
        return true;
      }
      execute = mockExecute;
      terminate() {}
    },
    getJavaScriptWorkerManager: () => ({
      initialize: async () => {},
      isReady: () => true,
      execute: mockExecute,
      terminate: () => {},
    }),
    resetJavaScriptWorkerManagerInstance: () => {},
    __mockExecute: mockExecute,
  };
});

// Helper to get the mock execute function
async function getMockExecute() {
  const mod = await import('@/lib/runtime/javascript-worker');
  return (mod as unknown as { __mockExecute: ReturnType<typeof vi.fn> }).__mockExecute;
}

// Reset runtime state between tests
beforeEach(async () => {
  vi.clearAllMocks();

  // Reset the JavaScript runtime singleton
  const { resetJavaScriptRuntimeInstance } = await import('@/lib/runtime');
  resetJavaScriptRuntimeInstance();
});

afterEach(async () => {
  const { resetJavaScriptRuntimeInstance } = await import('@/lib/runtime');
  resetJavaScriptRuntimeInstance();
});

/**
 * Create a test exercise with sensible defaults
 */
function createExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'test-id',
    slug: 'test-exercise',
    language: 'javascript',
    category: 'basics',
    difficulty: 1,
    title: 'Test',
    prompt: 'Test',
    expectedAnswer: 'const x = 1;',
    acceptedSolutions: [],
    hints: [],
    explanation: null,
    tags: [],
    timesPracticed: 0,
    avgSuccessRate: null,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    concept: 'variables',
    subconcept: 'const',
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

describe('Multi-language grading integration', () => {
  describe('JavaScript token comparison (direct)', () => {
    it('should tokenize valid JavaScript code', () => {
      const tokens = tokenizeJavaScript('const x = 1;');
      expect(tokens).not.toBeNull();
      expect(tokens!.length).toBeGreaterThan(0);

      // Should have tokens for: const, x, =, 1, ;
      const labels = tokens!.map(([label]) => label);
      expect(labels).toContain('const');
      expect(labels).toContain('name');
      expect(labels).toContain('=');
      expect(labels).toContain('num');
    });

    it('should return null for invalid JavaScript', () => {
      const tokens = tokenizeJavaScript('const x = ');
      expect(tokens).toBeNull();
    });

    it('should match identical code', () => {
      const result = jsCompareByTokens('const x = 1;', 'const x = 1;');
      expect(result.match).toBe(true);
      expect(result.matchedAlternative).toBeNull();
    });

    it('should match code with whitespace differences', () => {
      const result = jsCompareByTokens('const  x  =  1;', 'const x = 1;');
      expect(result.match).toBe(true);
    });

    it('should match code with different indentation', () => {
      const result = jsCompareByTokens('  const x = 1;  ', 'const x = 1;');
      expect(result.match).toBe(true);
    });

    it('should not match different code', () => {
      const result = jsCompareByTokens('const x = 2;', 'const x = 1;');
      expect(result.match).toBe(false);
    });

    it('should find matching alternative', () => {
      const result = jsCompareByTokens('let x = 1;', 'const x = 1;', ['let x = 1;', 'var x = 1;']);
      expect(result.match).toBe(true);
      expect(result.matchedAlternative).toBe('let x = 1;');
    });

    it('should handle multiline code', () => {
      const code1 = `function add(a, b) {
        return a + b;
      }`;
      const code2 = 'function add(a, b) { return a + b; }';

      const result = jsCompareByTokens(code1, code2);
      expect(result.match).toBe(true);
    });
  });

  describe('JavaScript AST comparison (direct)', () => {
    it('should match semantically equivalent code', () => {
      const result = jsCompareByAst('const x = 1;', 'const x = 1;');
      expect(result.match).toBe(true);
      expect(result.infraAvailable).toBe(true);
    });

    it('should match code with formatting differences', () => {
      const code1 = 'const x=1;';
      const code2 = 'const x = 1;';
      const result = jsCompareByAst(code1, code2);
      expect(result.match).toBe(true);
    });

    it('should not match different variable names', () => {
      const result = jsCompareByAst('const x = 1;', 'const y = 1;');
      expect(result.match).toBe(false);
      expect(result.infraAvailable).toBe(true);
    });

    it('should not match different values', () => {
      const result = jsCompareByAst('const x = 1;', 'const x = 2;');
      expect(result.match).toBe(false);
    });

    it('should handle parse errors gracefully', () => {
      const result = jsCompareByAst('const x = ', 'const x = 1;');
      expect(result.match).toBe(false);
      expect(result.infraAvailable).toBe(false);
      expect(result.error).toBe('Parse error');
    });

    it('should find matching alternative with AST', () => {
      const result = jsCompareByAst('let x = 1;', 'const x = 1;', ['let x = 1;', 'var x = 1;']);
      expect(result.match).toBe(true);
      expect(result.matchedAlternative).toBe('let x = 1;');
    });

    it('should match complex expressions', () => {
      const code1 = 'const sum = arr.reduce((a, b) => a + b, 0);';
      const code2 = 'const sum = arr.reduce((a, b) => a + b, 0);';
      const result = jsCompareByAst(code1, code2);
      expect(result.match).toBe(true);
    });

    it('should not match different arrow function bodies', () => {
      const code1 = 'const fn = (x) => x + 1;';
      const code2 = 'const fn = (x) => x * 2;';
      const result = jsCompareByAst(code1, code2);
      expect(result.match).toBe(false);
    });
  });

  describe('JavaScript grading via strategy router', () => {
    describe('token strategy', () => {
      it('should grade correct answer as correct', async () => {
        const exercise = createExercise({
          exerciseType: 'write',
          gradingStrategy: 'token',
          expectedAnswer: 'const x = 1;',
        });

        const result = await gradeWithStrategy('const x = 1;', exercise, null, 'javascript');

        expect(result.isCorrect).toBe(true);
        expect(result.infraAvailable).toBe(true);
        expect(result.fallbackUsed).toBe(false);
      });

      it('should match despite whitespace differences', async () => {
        const exercise = createExercise({
          exerciseType: 'write',
          gradingStrategy: 'token',
          expectedAnswer: 'const x = 1;',
        });

        const result = await gradeWithStrategy('const  x  =  1;', exercise, null, 'javascript');

        expect(result.isCorrect).toBe(true);
      });

      it('should reject different code', async () => {
        const exercise = createExercise({
          exerciseType: 'write',
          gradingStrategy: 'token',
          expectedAnswer: 'const x = 1;',
        });

        const result = await gradeWithStrategy('const x = 2;', exercise, null, 'javascript');

        expect(result.isCorrect).toBe(false);
      });

      it('should match alternatives', async () => {
        const exercise = createExercise({
          exerciseType: 'write',
          gradingStrategy: 'token',
          expectedAnswer: 'const x = 1;',
          acceptedSolutions: ['let x = 1;', 'var x = 1;'],
        });

        const result = await gradeWithStrategy('let x = 1;', exercise, null, 'javascript');

        expect(result.isCorrect).toBe(true);
        expect(result.matchedAlternative).toBe('let x = 1;');
      });
    });

    describe('AST strategy', () => {
      it('should grade correct answer as correct', async () => {
        const exercise = createExercise({
          exerciseType: 'write',
          gradingStrategy: 'ast',
          expectedAnswer: 'const x = 1;',
        });

        const result = await gradeWithStrategy('const x = 1;', exercise, null, 'javascript');

        expect(result.isCorrect).toBe(true);
        expect(result.infraAvailable).toBe(true);
      });

      it('should match code with different formatting', async () => {
        const exercise = createExercise({
          exerciseType: 'write',
          gradingStrategy: 'ast',
          expectedAnswer: 'const x = 1;',
        });

        const result = await gradeWithStrategy('const x=1;', exercise, null, 'javascript');

        expect(result.isCorrect).toBe(true);
      });

      it('should reject semantically different code', async () => {
        const exercise = createExercise({
          exerciseType: 'write',
          gradingStrategy: 'ast',
          expectedAnswer: 'const x = 1;',
        });

        const result = await gradeWithStrategy('const y = 1;', exercise, null, 'javascript');

        expect(result.isCorrect).toBe(false);
      });
    });

    describe('default AST strategy for write exercises', () => {
      it('should use AST by default for JavaScript write exercises', async () => {
        // No explicit gradingStrategy - should default to AST for write
        const exercise = createExercise({
          exerciseType: 'write',
          expectedAnswer: 'const x = 1;',
        });

        const result = await gradeWithStrategy('const x = 1;', exercise, null, 'javascript');

        expect(result.isCorrect).toBe(true);
        expect(result.infraAvailable).toBe(true);
      });
    });
  });

  describe('JavaScript predict exercises', () => {
    it('should execute code and compare output', async () => {
      const mockExecute = await getMockExecute();
      mockExecute.mockResolvedValue({
        success: true,
        output: '3',
        error: null,
      });

      const exercise = createExercise({
        exerciseType: 'predict',
        code: 'console.log(1 + 2)',
        expectedAnswer: '3',
      });

      const result = await gradeWithStrategy('3', exercise, null, 'javascript');

      expect(result.isCorrect).toBe(true);
      expect(result.infraAvailable).toBe(true);
    });

    it('should handle multiline output', async () => {
      const mockExecute = await getMockExecute();
      mockExecute.mockResolvedValue({
        success: true,
        output: '1\n2\n3',
        error: null,
      });

      const exercise = createExercise({
        exerciseType: 'predict',
        code: 'for (let i = 1; i <= 3; i++) console.log(i)',
        expectedAnswer: '1\n2\n3',
      });

      const result = await gradeWithStrategy('1\n2\n3', exercise, null, 'javascript');

      expect(result.isCorrect).toBe(true);
    });

    it('should mark wrong prediction as incorrect', async () => {
      const mockExecute = await getMockExecute();
      mockExecute.mockResolvedValue({
        success: true,
        output: '3',
        error: null,
      });

      const exercise = createExercise({
        exerciseType: 'predict',
        code: 'console.log(1 + 2)',
        expectedAnswer: '3',
      });

      const result = await gradeWithStrategy('4', exercise, null, 'javascript');

      expect(result.isCorrect).toBe(false);
    });

    it('should check accepted solutions when output differs', async () => {
      const mockExecute = await getMockExecute();
      // Output might have extra formatting
      mockExecute.mockResolvedValue({
        success: true,
        output: '{ a: 1, b: 2 }',
        error: null,
      });

      const exercise = createExercise({
        exerciseType: 'predict',
        code: 'console.log({ a: 1, b: 2 })',
        expectedAnswer: '{ a: 1, b: 2 }',
        // Accept different property order
        acceptedSolutions: ['{ b: 2, a: 1 }', '{a: 1, b: 2}'],
      });

      // User provides alternative format
      const result = await gradeWithStrategy('{ b: 2, a: 1 }', exercise, null, 'javascript');

      expect(result.isCorrect).toBe(true);
    });

    it('should return error when execution output is unexpected', async () => {
      // Note: With auto-initialization, execution will always try to run.
      // When the mock doesn't return a valid result, it reports as execution failure.
      // The runtime auto-initializes, so infraAvailable is true (not a fallback scenario)
      const mockExecute = await getMockExecute();
      // Mock execution returning undefined (simulates unexpected result)
      mockExecute.mockResolvedValue({
        success: false,
        output: null,
        error: 'Execution error',
      });

      const exercise = createExercise({
        exerciseType: 'predict',
        code: 'console.log(x)',
        expectedAnswer: 'undefined',
      });

      const result = await gradeWithStrategy('undefined', exercise, null, 'javascript');

      // Execution fails, but infra is available (auto-initialized successfully)
      expect(result.isCorrect).toBe(false);
      expect(result.infraAvailable).toBe(true);
      expect(result.fallbackUsed).toBe(false);
    });

    it('should accept answer matching acceptedSolutions when execution output differs', async () => {
      // When execution produces a different output, acceptedSolutions can still match
      const mockExecute = await getMockExecute();
      mockExecute.mockResolvedValue({
        success: true,
        output: 'some other output',
        error: null,
      });

      const exercise = createExercise({
        exerciseType: 'predict',
        code: 'console.log(1 + 2)',
        expectedAnswer: '3',
        acceptedSolutions: ['3'],
      });

      const result = await gradeWithStrategy('3', exercise, null, 'javascript');

      // User answer matches acceptedSolutions even though execution output differs
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('JavaScript fill-in exercises', () => {
    it('should use exact matching for fill-in', async () => {
      const exercise = createExercise({
        exerciseType: 'fill-in',
        template: '___ x = 1;',
        expectedAnswer: 'const',
      });

      const result = await gradeWithStrategy('const', exercise, null, 'javascript');

      expect(result.isCorrect).toBe(true);
      expect(result.infraAvailable).toBe(true);
    });

    it('should accept alternatives for fill-in', async () => {
      const exercise = createExercise({
        exerciseType: 'fill-in',
        template: '___ x = 1;',
        expectedAnswer: 'const',
        acceptedSolutions: ['let', 'var'],
      });

      const result = await gradeWithStrategy('let', exercise, null, 'javascript');

      expect(result.isCorrect).toBe(true);
    });

    it('should be case-sensitive for keywords', async () => {
      const exercise = createExercise({
        exerciseType: 'fill-in',
        template: '___ x = 1;',
        expectedAnswer: 'const',
      });

      const result = await gradeWithStrategy('CONST', exercise, null, 'javascript');

      expect(result.isCorrect).toBe(false);
    });
  });

  describe('Fallback behavior', () => {
    // Note: Token and AST strategies don't "fail" when code is invalid - they return no match.
    // Fallback only occurs when infrastructure is unavailable (runtime not loaded, throws exception).

    it('should reject invalid JavaScript in token strategy without fallback', async () => {
      const exercise = createExercise({
        exerciseType: 'write',
        gradingStrategy: 'token',
        expectedAnswer: 'const x = 1;',
      });

      // Invalid JS - can't tokenize, but this isn't a "failure" - just no match
      const result = await gradeWithStrategy('const x = ', exercise, null, 'javascript');

      // Token comparison returns no match (user code doesn't parse)
      expect(result.isCorrect).toBe(false);
      // No fallback because token comparison "succeeded" - it just returned no match
      expect(result.fallbackUsed).toBe(false);
    });

    it('should fallback to exact for invalid JavaScript in AST strategy', async () => {
      const exercise = createExercise({
        exerciseType: 'write',
        gradingStrategy: 'ast',
        expectedAnswer: 'const x = 1;',
      });

      // Invalid JS - can't parse AST
      // AST comparison explicitly returns infraAvailable: false on parse error
      const result = await gradeWithStrategy('const x = ', exercise, null, 'javascript');

      expect(result.isCorrect).toBe(false);
      expect(result.fallbackUsed).toBe(true);
    });

    it('should handle both answers being invalid in token strategy', async () => {
      const exercise = createExercise({
        exerciseType: 'write',
        gradingStrategy: 'token',
        expectedAnswer: 'const x = ',
        // Both user and expected are invalid JS
      });

      const result = await gradeWithStrategy('const x = ', exercise, null, 'javascript');

      // Token comparison: both fail to tokenize → match: false
      // Even though they're identical strings, token comparison can't verify this
      expect(result.isCorrect).toBe(false);
      expect(result.fallbackUsed).toBe(false);
    });

    it('should handle both answers being invalid in AST strategy', async () => {
      const exercise = createExercise({
        exerciseType: 'write',
        gradingStrategy: 'ast',
        expectedAnswer: 'const x = ',
        // Both user and expected are invalid JS
      });

      const result = await gradeWithStrategy('const x = ', exercise, null, 'javascript');

      // AST comparison: both fail to parse → infraAvailable: false → fallback to exact
      expect(result.fallbackUsed).toBe(true);
      // Exact match should work
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('Unsupported language fallback', () => {
    it('should fallback to exact for unsupported language', async () => {
      const exercise = createExercise({
        language: 'typescript',
        exerciseType: 'write',
        gradingStrategy: 'token',
        expectedAnswer: 'const x: number = 1;',
      });

      // TypeScript runtime not implemented yet
      const result = await gradeWithStrategy(
        'const x: number = 1;',
        exercise,
        null,
        'typescript' as 'javascript'
      );

      // Should fallback since no TypeScript runtime
      expect(result.fallbackUsed).toBe(true);
      // Exact match should work
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('Language inference', () => {
    it('should use explicit language parameter over exercise.language', async () => {
      const exercise = createExercise({
        language: 'python', // Exercise says Python
        exerciseType: 'write',
        gradingStrategy: 'token',
        expectedAnswer: 'const x = 1;', // But code is JavaScript
      });

      // Override to JavaScript
      const result = await gradeWithStrategy('const x = 1;', exercise, null, 'javascript');

      expect(result.isCorrect).toBe(true);
      // Should use JS runtime (token comparison works)
      expect(result.infraAvailable).toBe(true);
    });

    it('should use exercise.language when no explicit parameter', async () => {
      const exercise = createExercise({
        language: 'javascript',
        exerciseType: 'write',
        gradingStrategy: 'token',
        expectedAnswer: 'const x = 1;',
      });

      // No explicit language param - should infer from exercise
      const result = await gradeWithStrategy('const x = 1;', exercise, null);

      expect(result.isCorrect).toBe(true);
    });
  });

  describe('Complex JavaScript grading scenarios', () => {
    it('should handle arrow functions', async () => {
      const exercise = createExercise({
        exerciseType: 'write',
        gradingStrategy: 'ast',
        expectedAnswer: 'const double = (x) => x * 2;',
      });

      // Without parentheses (valid JS)
      const result = await gradeWithStrategy('const double = x => x * 2;', exercise, null);

      // AST should match (both are valid arrow functions)
      expect(result.isCorrect).toBe(true);
    });

    it('should handle template literals', async () => {
      const exercise = createExercise({
        exerciseType: 'write',
        gradingStrategy: 'token',
        expectedAnswer: 'const greeting = `Hello ${name}`;',
      });

      const result = await gradeWithStrategy(
        'const greeting = `Hello ${name}`;',
        exercise,
        null,
        'javascript'
      );

      expect(result.isCorrect).toBe(true);
    });

    it('should handle destructuring', async () => {
      const exercise = createExercise({
        exerciseType: 'write',
        gradingStrategy: 'ast',
        expectedAnswer: 'const { a, b } = obj;',
      });

      const result = await gradeWithStrategy(
        'const {a, b} = obj;',
        exercise,
        null,
        'javascript'
      );

      expect(result.isCorrect).toBe(true);
    });

    it('should handle spread operator', async () => {
      const exercise = createExercise({
        exerciseType: 'write',
        gradingStrategy: 'ast',
        expectedAnswer: 'const merged = [...arr1, ...arr2];',
      });

      const result = await gradeWithStrategy(
        'const merged = [...arr1, ...arr2];',
        exercise,
        null,
        'javascript'
      );

      expect(result.isCorrect).toBe(true);
    });

    it('should handle async/await', async () => {
      const exercise = createExercise({
        exerciseType: 'write',
        gradingStrategy: 'ast',
        expectedAnswer: 'const data = await fetch(url);',
      });

      const result = await gradeWithStrategy(
        'const data = await fetch(url);',
        exercise,
        null,
        'javascript'
      );

      expect(result.isCorrect).toBe(true);
    });
  });
});
