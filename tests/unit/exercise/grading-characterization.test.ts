// tests/unit/exercise/grading-characterization.test.ts
// Characterization tests - capture CURRENT behavior to detect regressions
// These tests document existing behavior, not necessarily correct behavior

import { describe, it, expect } from 'vitest';
import { gradeAnswer } from '@/lib/exercise/grading';
import { normalizePython } from '@/lib/exercise/matching';
import { checkConstruct } from '@/lib/exercise/construct-check';
import type { Exercise } from '@/lib/types';

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

describe('grading characterization tests', () => {
  describe('normalization behavior (current - may be buggy)', () => {
    // String literal preservation - fixed in Phase 1A1
    it('preserves commas inside strings (was bug, now fixed)', () => {
      expect(normalizePython('print("a,b,c")')).toBe('print("a,b,c")');
    });

    it('preserves colons inside strings (was bug, now fixed)', () => {
      // Note: The colon BETWEEN "key" and "value" is outside strings (dict colon),
      // so it correctly gets a space added. Colons INSIDE strings are preserved.
      expect(normalizePython('{"key":"value"}')).toBe('{"key": "value"}');
      // Colon inside string content is preserved:
      expect(normalizePython('s = "time:12:30"')).toBe('s = "time:12:30"');
    });

    // Document correct behavior to preserve
    it('removes leading tabs', () => {
      // Current behavior: tabs are trimmed, not converted to spaces
      expect(normalizePython('\tprint(x)')).toBe('print(x)');
    });

    it('normalizes comma spacing in code', () => {
      expect(normalizePython('[1,2,3]')).toBe('[1, 2, 3]');
    });

    it('preserves multiple spaces (does not collapse)', () => {
      // Current behavior: multiple spaces are NOT collapsed
      expect(normalizePython('x  =  1')).toBe('x  =  1');
    });

    it('trims trailing whitespace from lines', () => {
      expect(normalizePython('x = 1   ')).toBe('x = 1');
    });
  });

  describe('construct detection behavior (current - may have false positives)', () => {
    // These bugs have been fixed - constructs inside strings/comments are now ignored
    it('ignores comprehension inside string literal (was bug, now fixed)', () => {
      const result = checkConstruct('"[x for x in items]"', 'comprehension');
      expect(result.detected).toBe(false);
    });

    it('ignores slice inside comment (was bug, now fixed)', () => {
      const result = checkConstruct('# items[1:4] is a slice', 'slice');
      expect(result.detected).toBe(false);
    });

    // Document correct behavior to preserve
    it('detects comprehension in actual code', () => {
      const result = checkConstruct('[x for x in items]', 'comprehension');
      expect(result.detected).toBe(true);
    });

    it('detects slice in actual code', () => {
      const result = checkConstruct('items[1:4]', 'slice');
      expect(result.detected).toBe(true);
    });

    it('detects f-string in actual code', () => {
      const result = checkConstruct('f"Hello {name}"', 'f-string');
      expect(result.detected).toBe(true);
    });
  });

  describe('grading flow regression tests', () => {
    // These should NOT change - core grading flow
    it('grades write exercises with string matching', () => {
      const exercise = createExercise({
        exerciseType: 'write',
        expectedAnswer: 'print("hello")',
      });
      const result = gradeAnswer('print("hello")', exercise);
      expect(result.isCorrect).toBe(true);
      expect(result.gradingMethod).toBe('string');
    });

    it('accepts alternatives for write exercises', () => {
      const exercise = createExercise({
        exerciseType: 'write',
        expectedAnswer: 'print("hello")',
        acceptedSolutions: ["print('hello')"],
      });
      const result = gradeAnswer("print('hello')", exercise);
      expect(result.isCorrect).toBe(true);
      expect(result.matchedAlternative).toBe("print('hello')");
    });

    it('runs construct check for correct answers with targetConstruct', () => {
      const exercise = createExercise({
        exerciseType: 'write',
        expectedAnswer: 'items[1:4]',
        targetConstruct: { type: 'slice' },
      });
      const result = gradeAnswer('items[1:4]', exercise);
      expect(result.isCorrect).toBe(true);
      expect(result.usedTargetConstruct).toBe(true);
    });

    it('skips construct check for incorrect answers', () => {
      const exercise = createExercise({
        exerciseType: 'write',
        expectedAnswer: 'items[1:4]',
        targetConstruct: { type: 'slice' },
      });
      const result = gradeAnswer('wrong', exercise);
      expect(result.isCorrect).toBe(false);
      expect(result.usedTargetConstruct).toBeNull();
    });

    it('grades fill-in exercises correctly', () => {
      const exercise = createExercise({
        exerciseType: 'fill-in',
        expectedAnswer: 'append',
        template: 'items.___("new")',
      });
      const result = gradeAnswer('append', exercise);
      expect(result.isCorrect).toBe(true);
    });

    it('grades predict exercises with normalized output matching', () => {
      const exercise = createExercise({
        exerciseType: 'predict',
        expectedAnswer: 'Hello World',
        code: 'print("Hello World")',
      });
      const result = gradeAnswer('Hello World', exercise);
      expect(result.isCorrect).toBe(true);
    });

    it('normalizes predict answers by trimming whitespace', () => {
      const exercise = createExercise({
        exerciseType: 'predict',
        expectedAnswer: 'Hello',
        code: 'print("Hello")',
      });
      const result = gradeAnswer('  Hello  ', exercise);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('edge cases to preserve', () => {
    it('empty string answer is incorrect', () => {
      const exercise = createExercise({
        exerciseType: 'write',
        expectedAnswer: 'print("hello")',
      });
      const result = gradeAnswer('', exercise);
      expect(result.isCorrect).toBe(false);
    });

    it('whitespace-only answer is incorrect', () => {
      const exercise = createExercise({
        exerciseType: 'write',
        expectedAnswer: 'print("hello")',
      });
      const result = gradeAnswer('   ', exercise);
      expect(result.isCorrect).toBe(false);
    });

    it('case-sensitive matching for write exercises', () => {
      const exercise = createExercise({
        exerciseType: 'write',
        expectedAnswer: 'print("Hello")',
      });
      const result = gradeAnswer('print("hello")', exercise);
      expect(result.isCorrect).toBe(false);
    });
  });
});
