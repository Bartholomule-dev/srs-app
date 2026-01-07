# Dynamic Exercise System - Phase 2: Grading Infrastructure

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a two-pass grading system that separates correctness checking from construct coaching, with AST pattern detection for target constructs.

**Architecture:** Pass 1 determines correctness (string match or execution). Pass 2 checks if target construct was used (AST pattern matching). Users get full credit for correct answers; coaching feedback is educational, not punitive.

**Tech Stack:** TypeScript, Python AST patterns via regex (for simple constructs), existing matching.ts infrastructure

---

## Overview

Phase 2 creates the grading infrastructure:
1. GradingResult type with correctness + construct info
2. Two-pass grading orchestrator
3. AST construct checking (regex-based for Phase 2)
4. Updated ExerciseCard to use new grading
5. CoachingFeedback component for non-punitive hints
6. Updated AnswerResult type

**Dependencies:** Phase 1 (generator types, render pipeline)

**Files Created:**
- `src/lib/exercise/grading.ts`
- `src/lib/exercise/construct-check.ts`
- `src/components/exercise/CoachingFeedback.tsx`
- `tests/unit/exercise/grading.test.ts`
- `tests/unit/exercise/construct-check.test.ts`

**Files Modified:**
- `src/lib/exercise/types.ts` (extend AnswerResult)
- `src/lib/exercise/index.ts` (export new modules)
- `src/components/exercise/ExerciseCard.tsx` (use two-pass grading)
- `src/components/exercise/ExerciseFeedback.tsx` (show coaching)

---

## Task 1: Extend Answer Result Types

**Files:**
- Modify: `src/lib/exercise/types.ts`
- Test: `tests/unit/exercise/types.test.ts`

**Step 1: Write the failing test**

Add to `tests/unit/exercise/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { GradingResult, ConstructCheckResult } from '@/lib/exercise/types';

describe('GradingResult type', () => {
  it('has all required fields', () => {
    const result: GradingResult = {
      isCorrect: true,
      usedTargetConstruct: true,
      coachingFeedback: null,
      gradingMethod: 'string',
      normalizedUserAnswer: 's[1:4]',
      normalizedExpectedAnswer: 's[1:4]',
      matchedAlternative: null,
    };

    expect(result.isCorrect).toBe(true);
    expect(result.usedTargetConstruct).toBe(true);
    expect(result.coachingFeedback).toBeNull();
    expect(result.gradingMethod).toBe('string');
  });

  it('supports all grading methods', () => {
    const methods: GradingResult['gradingMethod'][] = [
      'string',
      'execution',
      'execution-fallback',
    ];
    expect(methods).toHaveLength(3);
  });

  it('usedTargetConstruct can be null when no target defined', () => {
    const result: GradingResult = {
      isCorrect: true,
      usedTargetConstruct: null,
      coachingFeedback: null,
      gradingMethod: 'string',
      normalizedUserAnswer: 'answer',
      normalizedExpectedAnswer: 'answer',
      matchedAlternative: null,
    };
    expect(result.usedTargetConstruct).toBeNull();
  });
});

describe('ConstructCheckResult type', () => {
  it('has detected and construct fields', () => {
    const result: ConstructCheckResult = {
      detected: true,
      construct: 'slice',
    };
    expect(result.detected).toBe(true);
    expect(result.construct).toBe('slice');
  });

  it('construct is undefined when not detected', () => {
    const result: ConstructCheckResult = {
      detected: false,
    };
    expect(result.detected).toBe(false);
    expect(result.construct).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/exercise/types.test.ts`
Expected: FAIL (types not exported)

**Step 3: Update the types file**

Edit `src/lib/exercise/types.ts`:

```typescript
// src/lib/exercise/types.ts

/**
 * Result of checking a user's answer against expected answer.
 */
export interface AnswerResult {
  isCorrect: boolean;
  normalizedUserAnswer: string;
  normalizedExpectedAnswer: string;
  usedAstMatch: boolean;
  matchedAlternative: string | null;
}

/**
 * Grading method used for correctness check.
 */
export type GradingMethod = 'string' | 'execution' | 'execution-fallback';

/**
 * Result of the full two-pass grading process.
 *
 * Pass 1: Correctness (isCorrect)
 * Pass 2: Construct check (usedTargetConstruct, coachingFeedback)
 */
export interface GradingResult {
  /** Whether the answer is correct (Pass 1) */
  isCorrect: boolean;

  /** Whether user used the target construct (Pass 2, null if no target) */
  usedTargetConstruct: boolean | null;

  /** Coaching feedback if correct but didn't use target construct */
  coachingFeedback: string | null;

  /** Method used for correctness grading */
  gradingMethod: GradingMethod;

  /** Normalized user answer for display */
  normalizedUserAnswer: string;

  /** Normalized expected answer for display */
  normalizedExpectedAnswer: string;

  /** Which alternative matched (if any) */
  matchedAlternative: string | null;
}

/**
 * Result of checking for a specific construct in code.
 */
export interface ConstructCheckResult {
  /** Whether the construct was detected */
  detected: boolean;

  /** Which construct was found (if detected) */
  construct?: string;
}

/**
 * Inputs for calculating SRS quality from grading result.
 */
export interface QualityInputs {
  isCorrect: boolean;
  hintUsed: boolean;
  responseTimeMs: number;
  usedAstMatch: boolean;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/exercise/types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/exercise/types.ts tests/unit/exercise/types.test.ts
git commit -m "feat(grading): add GradingResult and ConstructCheckResult types

- GradingResult for two-pass grading output
- GradingMethod enum (string, execution, execution-fallback)
- ConstructCheckResult for AST pattern detection"
```

---

## Task 2: Create Construct Check Module

**Files:**
- Create: `src/lib/exercise/construct-check.ts`
- Test: `tests/unit/exercise/construct-check.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/exercise/construct-check.test.ts`:

```typescript
// tests/unit/exercise/construct-check.test.ts
import { describe, it, expect } from 'vitest';
import { checkConstruct, CONSTRUCT_PATTERNS } from '@/lib/exercise/construct-check';
import type { ConstructType } from '@/lib/generators/types';

describe('CONSTRUCT_PATTERNS', () => {
  it('defines patterns for common constructs', () => {
    expect(CONSTRUCT_PATTERNS.slice).toBeDefined();
    expect(CONSTRUCT_PATTERNS.comprehension).toBeDefined();
    expect(CONSTRUCT_PATTERNS['f-string']).toBeDefined();
    expect(CONSTRUCT_PATTERNS.ternary).toBeDefined();
    expect(CONSTRUCT_PATTERNS.enumerate).toBeDefined();
    expect(CONSTRUCT_PATTERNS.zip).toBeDefined();
    expect(CONSTRUCT_PATTERNS.lambda).toBeDefined();
  });
});

describe('checkConstruct', () => {
  describe('slice detection', () => {
    it('detects basic slice notation', () => {
      expect(checkConstruct('s[1:4]', 'slice').detected).toBe(true);
      expect(checkConstruct('text[0:10]', 'slice').detected).toBe(true);
      expect(checkConstruct('arr[2:]', 'slice').detected).toBe(true);
      expect(checkConstruct('arr[:5]', 'slice').detected).toBe(true);
      expect(checkConstruct('arr[::2]', 'slice').detected).toBe(true);
    });

    it('detects slice with step', () => {
      expect(checkConstruct('s[1:10:2]', 'slice').detected).toBe(true);
      expect(checkConstruct('s[::-1]', 'slice').detected).toBe(true);
    });

    it('does not detect simple indexing as slice', () => {
      expect(checkConstruct('s[0]', 'slice').detected).toBe(false);
      expect(checkConstruct('arr[i]', 'slice').detected).toBe(false);
    });
  });

  describe('comprehension detection', () => {
    it('detects list comprehensions', () => {
      expect(checkConstruct('[x for x in items]', 'comprehension').detected).toBe(true);
      expect(checkConstruct('[x*2 for x in range(10)]', 'comprehension').detected).toBe(true);
      expect(checkConstruct('[x for x in items if x > 0]', 'comprehension').detected).toBe(true);
    });

    it('detects dict comprehensions', () => {
      expect(checkConstruct('{k: v for k, v in items}', 'comprehension').detected).toBe(true);
    });

    it('detects set comprehensions', () => {
      expect(checkConstruct('{x for x in items}', 'comprehension').detected).toBe(true);
    });

    it('does not detect regular loops', () => {
      expect(checkConstruct('for x in items: print(x)', 'comprehension').detected).toBe(false);
    });
  });

  describe('f-string detection', () => {
    it('detects f-strings', () => {
      expect(checkConstruct('f"Hello {name}"', 'f-string').detected).toBe(true);
      expect(checkConstruct("f'Value: {x}'", 'f-string').detected).toBe(true);
      expect(checkConstruct('f"{a} + {b} = {a+b}"', 'f-string').detected).toBe(true);
    });

    it('does not detect regular strings', () => {
      expect(checkConstruct('"Hello {name}"', 'f-string').detected).toBe(false);
      expect(checkConstruct("'Value: {x}'", 'f-string').detected).toBe(false);
    });
  });

  describe('ternary detection', () => {
    it('detects ternary expressions', () => {
      expect(checkConstruct('x if condition else y', 'ternary').detected).toBe(true);
      expect(checkConstruct('value = a if a > b else b', 'ternary').detected).toBe(true);
      expect(checkConstruct('"yes" if flag else "no"', 'ternary').detected).toBe(true);
    });

    it('does not detect regular if statements', () => {
      expect(checkConstruct('if condition: x', 'ternary').detected).toBe(false);
    });
  });

  describe('enumerate detection', () => {
    it('detects enumerate usage', () => {
      expect(checkConstruct('for i, x in enumerate(items)', 'enumerate').detected).toBe(true);
      expect(checkConstruct('list(enumerate(arr))', 'enumerate').detected).toBe(true);
      expect(checkConstruct('enumerate(items, start=1)', 'enumerate').detected).toBe(true);
    });
  });

  describe('zip detection', () => {
    it('detects zip usage', () => {
      expect(checkConstruct('for a, b in zip(x, y)', 'zip').detected).toBe(true);
      expect(checkConstruct('list(zip(a, b, c))', 'zip').detected).toBe(true);
      expect(checkConstruct('zip(*matrix)', 'zip').detected).toBe(true);
    });
  });

  describe('lambda detection', () => {
    it('detects lambda expressions', () => {
      expect(checkConstruct('lambda x: x * 2', 'lambda').detected).toBe(true);
      expect(checkConstruct('lambda a, b: a + b', 'lambda').detected).toBe(true);
      expect(checkConstruct('sorted(items, key=lambda x: x[0])', 'lambda').detected).toBe(true);
    });
  });

  describe('generator-expr detection', () => {
    it('detects generator expressions', () => {
      expect(checkConstruct('(x for x in items)', 'generator-expr').detected).toBe(true);
      expect(checkConstruct('sum(x*x for x in range(10))', 'generator-expr').detected).toBe(true);
    });

    it('does not confuse with list comprehension', () => {
      // Generator expressions use () not []
      expect(checkConstruct('[x for x in items]', 'generator-expr').detected).toBe(false);
    });
  });

  describe('unknown construct', () => {
    it('returns detected: false for unknown construct types', () => {
      const result = checkConstruct('some code', 'unknown-type' as ConstructType);
      expect(result.detected).toBe(false);
    });
  });

  describe('result structure', () => {
    it('includes construct type when detected', () => {
      const result = checkConstruct('s[1:4]', 'slice');
      expect(result.detected).toBe(true);
      expect(result.construct).toBe('slice');
    });

    it('omits construct when not detected', () => {
      const result = checkConstruct('s[0]', 'slice');
      expect(result.detected).toBe(false);
      expect(result.construct).toBeUndefined();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/exercise/construct-check.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write the implementation**

Create `src/lib/exercise/construct-check.ts`:

```typescript
// src/lib/exercise/construct-check.ts
// AST construct detection using regex patterns

import type { ConstructType } from '@/lib/generators/types';
import type { ConstructCheckResult } from './types';

/**
 * Regex patterns for detecting Python constructs.
 *
 * These are simplified patterns for common constructs.
 * They work well for typical exercise answers but aren't
 * full AST parsers. Edge cases are handled gracefully.
 */
export const CONSTRUCT_PATTERNS: Record<ConstructType, RegExp> = {
  // Slice: [start:end] or [start:end:step] - must have at least one colon inside brackets
  slice: /\[[^\]]*:[^\]]*\]/,

  // List/dict/set comprehension: [expr for var in iterable] or {expr for ...}
  comprehension: /[\[{][^}\]]*\bfor\b[^}\]]+\bin\b[^}\]]+[\]}]/,

  // F-string: f"..." or f'...'
  'f-string': /f["'][^"']*\{[^}]+\}[^"']*["']/,

  // Ternary: expr if condition else expr (not at start of line with colon)
  ternary: /\S+\s+if\s+.+\s+else\s+\S+/,

  // Enumerate: enumerate(...)
  enumerate: /\benumerate\s*\(/,

  // Zip: zip(...)
  zip: /\bzip\s*\(/,

  // Lambda: lambda args: expr
  lambda: /\blambda\b[^:]*:/,

  // Generator expression: (expr for var in iterable) - parens not brackets
  'generator-expr': /\([^)]*\bfor\b[^)]+\bin\b[^)]+\)/,
};

/**
 * Check if code contains a specific Python construct.
 *
 * @param code - User's code to check
 * @param constructType - Type of construct to look for
 * @returns Whether construct was detected
 */
export function checkConstruct(
  code: string,
  constructType: ConstructType
): ConstructCheckResult {
  const pattern = CONSTRUCT_PATTERNS[constructType];

  if (!pattern) {
    // Unknown construct type - gracefully return not detected
    return { detected: false };
  }

  const detected = pattern.test(code);

  if (detected) {
    return {
      detected: true,
      construct: constructType,
    };
  }

  return { detected: false };
}

/**
 * Check if code contains any of several constructs.
 * Useful for exercises that accept multiple approaches.
 *
 * @param code - User's code to check
 * @param constructTypes - Construct types to look for
 * @returns First construct detected, or not detected
 */
export function checkAnyConstruct(
  code: string,
  constructTypes: ConstructType[]
): ConstructCheckResult {
  for (const type of constructTypes) {
    const result = checkConstruct(code, type);
    if (result.detected) {
      return result;
    }
  }
  return { detected: false };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/exercise/construct-check.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/exercise/construct-check.ts tests/unit/exercise/construct-check.test.ts
git commit -m "feat(grading): add construct detection patterns

- CONSTRUCT_PATTERNS for 8 Python constructs
- checkConstruct for single construct detection
- checkAnyConstruct for multi-construct exercises
- Regex-based for simplicity and speed"
```

---

## Task 3: Create Two-Pass Grading Orchestrator

**Files:**
- Create: `src/lib/exercise/grading.ts`
- Test: `tests/unit/exercise/grading.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/exercise/grading.test.ts`:

```typescript
// tests/unit/exercise/grading.test.ts
import { describe, it, expect } from 'vitest';
import { gradeAnswer } from '@/lib/exercise/grading';
import type { Exercise } from '@/lib/types';

// Helper to create minimal exercise for testing
function createExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'test-id',
    slug: 'test-exercise',
    title: 'Test',
    prompt: 'Test prompt',
    expectedAnswer: 's[1:4]',
    acceptedSolutions: [],
    hints: [],
    concept: 'strings',
    subconcept: 'slicing',
    level: 'practice',
    prereqs: [],
    exerciseType: 'write',
    pattern: 'indexing',
    objective: 'Test objective',
    difficulty: 1,
    language: 'python',
    category: 'strings',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Exercise;
}

describe('gradeAnswer', () => {
  describe('Pass 1: Correctness', () => {
    it('returns isCorrect: true for exact match', () => {
      const exercise = createExercise({ expectedAnswer: 's[1:4]' });
      const result = gradeAnswer('s[1:4]', exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.gradingMethod).toBe('string');
    });

    it('returns isCorrect: true for normalized match', () => {
      const exercise = createExercise({ expectedAnswer: 's[1:4]' });
      const result = gradeAnswer('s[1 : 4]', exercise); // extra spaces

      expect(result.isCorrect).toBe(true);
    });

    it('returns isCorrect: false for wrong answer', () => {
      const exercise = createExercise({ expectedAnswer: 's[1:4]' });
      const result = gradeAnswer('s[0:3]', exercise);

      expect(result.isCorrect).toBe(false);
    });

    it('matches accepted solutions', () => {
      const exercise = createExercise({
        expectedAnswer: 's[1:4]',
        acceptedSolutions: ['text[1:4]', 's[1:4]'],
      });
      const result = gradeAnswer('text[1:4]', exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.matchedAlternative).toBe('text[1:4]');
    });

    it('normalizes answers before comparison', () => {
      const exercise = createExercise({ expectedAnswer: 's[1:4]' });
      const result = gradeAnswer('  s[1:4]  ', exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.normalizedUserAnswer).toBe('s[1:4]');
    });
  });

  describe('Pass 2: Construct Check', () => {
    it('usedTargetConstruct is null when no target defined', () => {
      const exercise = createExercise(); // no targetConstruct
      const result = gradeAnswer('s[1:4]', exercise);

      expect(result.usedTargetConstruct).toBeNull();
      expect(result.coachingFeedback).toBeNull();
    });

    it('usedTargetConstruct is true when construct used', () => {
      const exercise = createExercise({
        expectedAnswer: 's[1:4]',
        targetConstruct: { type: 'slice' },
      });
      const result = gradeAnswer('s[1:4]', exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.usedTargetConstruct).toBe(true);
      expect(result.coachingFeedback).toBeNull();
    });

    it('usedTargetConstruct is false with feedback when construct not used', () => {
      const exercise = createExercise({
        expectedAnswer: 'result',
        acceptedSolutions: ['result'],
        targetConstruct: {
          type: 'comprehension',
          feedback: 'Try using a list comprehension!',
        },
      });
      // User gave correct answer but without comprehension
      const result = gradeAnswer('result', exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.usedTargetConstruct).toBe(false);
      expect(result.coachingFeedback).toBe('Try using a list comprehension!');
    });

    it('provides default feedback when none specified', () => {
      const exercise = createExercise({
        expectedAnswer: 'result',
        targetConstruct: { type: 'f-string' }, // no feedback
      });
      const result = gradeAnswer('result', exercise);

      expect(result.usedTargetConstruct).toBe(false);
      expect(result.coachingFeedback).toBe(
        'Great job! Consider trying the suggested approach next time.'
      );
    });

    it('skips construct check for incorrect answers', () => {
      const exercise = createExercise({
        expectedAnswer: 's[1:4]',
        targetConstruct: {
          type: 'slice',
          feedback: 'Use slice notation',
        },
      });
      const result = gradeAnswer('wrong answer', exercise);

      expect(result.isCorrect).toBe(false);
      expect(result.usedTargetConstruct).toBeNull();
      expect(result.coachingFeedback).toBeNull();
    });
  });

  describe('fill-in exercises', () => {
    it('grades fill-in answers correctly', () => {
      const exercise = createExercise({
        exerciseType: 'fill-in',
        expectedAnswer: '1',
        template: 's[___:4]',
      });
      const result = gradeAnswer('1', exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.gradingMethod).toBe('string');
    });
  });

  describe('predict exercises', () => {
    it('grades predict answers correctly', () => {
      const exercise = createExercise({
        exerciseType: 'predict',
        expectedAnswer: 'hello',
        code: 'print("hello")',
      });
      const result = gradeAnswer('hello', exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.gradingMethod).toBe('string');
    });

    it('normalizes predict output for comparison', () => {
      const exercise = createExercise({
        exerciseType: 'predict',
        expectedAnswer: 'hello',
      });
      const result = gradeAnswer('  hello\n\n', exercise);

      expect(result.isCorrect).toBe(true);
    });
  });

  describe('grading method tracking', () => {
    it('tracks string grading method', () => {
      const exercise = createExercise();
      const result = gradeAnswer('s[1:4]', exercise);

      expect(result.gradingMethod).toBe('string');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/exercise/grading.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write the implementation**

Create `src/lib/exercise/grading.ts`:

```typescript
// src/lib/exercise/grading.ts
// Two-pass grading system for dynamic exercises

import type { Exercise } from '@/lib/types';
import type { GradingResult } from './types';
import type { ConstructType } from '@/lib/generators/types';
import {
  checkAnswerWithAlternatives,
  checkFillInAnswer,
  checkPredictAnswer,
  normalizePython,
} from './matching';
import { checkConstruct } from './construct-check';

/** Default coaching feedback when construct wasn't used */
const DEFAULT_COACHING_FEEDBACK =
  'Great job! Consider trying the suggested approach next time.';

/**
 * Grade a user's answer using two-pass grading.
 *
 * Pass 1: Check correctness (string matching)
 * Pass 2: Check if target construct was used (if defined and correct)
 *
 * @param userAnswer - User's submitted answer
 * @param exercise - Exercise being graded (may have targetConstruct)
 * @returns Full grading result with correctness and construct info
 */
export function gradeAnswer(
  userAnswer: string,
  exercise: Exercise
): GradingResult {
  // === PASS 1: Correctness ===
  let isCorrect = false;
  let normalizedUserAnswer = '';
  let normalizedExpectedAnswer = '';
  let matchedAlternative: string | null = null;

  if (exercise.exerciseType === 'fill-in') {
    // Fill-in uses simpler matching
    isCorrect = checkFillInAnswer(
      userAnswer,
      exercise.expectedAnswer,
      exercise.acceptedSolutions ?? []
    );
    normalizedUserAnswer = userAnswer.trim();
    normalizedExpectedAnswer = exercise.expectedAnswer.trim();
  } else if (exercise.exerciseType === 'predict') {
    // Predict uses output matching
    isCorrect = checkPredictAnswer(
      userAnswer,
      exercise.expectedAnswer,
      exercise.acceptedSolutions ?? []
    );
    normalizedUserAnswer = userAnswer.trim().replace(/\n+$/, '');
    normalizedExpectedAnswer = exercise.expectedAnswer.trim().replace(/\n+$/, '');
  } else {
    // Write exercises use full Python normalization
    const result = checkAnswerWithAlternatives(
      userAnswer,
      exercise.expectedAnswer,
      exercise.acceptedSolutions ?? []
    );
    isCorrect = result.isCorrect;
    normalizedUserAnswer = result.normalizedUserAnswer;
    normalizedExpectedAnswer = result.normalizedExpectedAnswer;
    matchedAlternative = result.matchedAlternative;
  }

  // === PASS 2: Construct Check (only if correct and target defined) ===
  let usedTargetConstruct: boolean | null = null;
  let coachingFeedback: string | null = null;

  if (isCorrect && exercise.targetConstruct) {
    const constructResult = checkConstruct(
      userAnswer,
      exercise.targetConstruct.type as ConstructType
    );

    usedTargetConstruct = constructResult.detected;

    if (!usedTargetConstruct) {
      // User got correct answer but didn't use target construct
      coachingFeedback =
        exercise.targetConstruct.feedback ?? DEFAULT_COACHING_FEEDBACK;
    }
  }

  return {
    isCorrect,
    usedTargetConstruct,
    coachingFeedback,
    gradingMethod: 'string', // Phase 2: always string; Phase 3 adds execution
    normalizedUserAnswer,
    normalizedExpectedAnswer,
    matchedAlternative,
  };
}

/**
 * Check if grading result should show coaching feedback.
 * (Correct answer but didn't use target construct)
 */
export function shouldShowCoaching(result: GradingResult): boolean {
  return result.isCorrect && result.usedTargetConstruct === false;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/exercise/grading.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/exercise/grading.ts tests/unit/exercise/grading.test.ts
git commit -m "feat(grading): add two-pass grading orchestrator

- Pass 1: correctness via string matching
- Pass 2: construct check if target defined
- Handles write, fill-in, predict exercise types
- Non-punitive coaching feedback"
```

---

## Task 4: Update Exercise Index Exports

**Files:**
- Modify: `src/lib/exercise/index.ts`

**Step 1: Add exports**

Edit `src/lib/exercise/index.ts` to add:

```typescript
// Grading
export { gradeAnswer, shouldShowCoaching } from './grading';
export { checkConstruct, checkAnyConstruct, CONSTRUCT_PATTERNS } from './construct-check';
export type { GradingResult, ConstructCheckResult, GradingMethod } from './types';
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/exercise/index.ts
git commit -m "feat(exercise): export grading and construct-check modules"
```

---

## Task 5: Create CoachingFeedback Component

**Files:**
- Create: `src/components/exercise/CoachingFeedback.tsx`
- Test: Visual verification (component)

**Step 1: Create the component**

Create `src/components/exercise/CoachingFeedback.tsx`:

```typescript
// src/components/exercise/CoachingFeedback.tsx
'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface CoachingFeedbackProps {
  /** The coaching feedback message */
  feedback: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * CoachingFeedback displays non-punitive learning suggestions.
 *
 * Shown when user gets correct answer but didn't use target construct.
 * Uses a warm, encouraging tone with a subtle info style.
 */
export function CoachingFeedback({ feedback, className }: CoachingFeedbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={cn(
        'rounded-lg border px-4 py-3',
        'bg-blue-500/10 border-blue-500/30',
        'text-sm text-text-secondary',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-blue-400 text-lg" aria-hidden="true">
          💡
        </span>
        <div>
          <p className="font-medium text-blue-300 mb-1">Pro tip</p>
          <p>{feedback}</p>
        </div>
      </div>
    </motion.div>
  );
}
```

**Step 2: Verify component compiles**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/exercise/CoachingFeedback.tsx
git commit -m "feat(ui): add CoachingFeedback component

- Non-punitive pro-tip style
- Blue info styling with lightbulb icon
- Animated entrance with framer-motion"
```

---

## Task 6: Update ExerciseFeedback to Show Coaching

**Files:**
- Modify: `src/components/exercise/ExerciseFeedback.tsx`

**Step 1: Read current implementation**

Run: Read the current ExerciseFeedback.tsx to understand its structure.

**Step 2: Add coaching feedback support**

Edit `src/components/exercise/ExerciseFeedback.tsx` to accept and display coaching:

Add to props interface:
```typescript
/** Optional coaching feedback for construct hints */
coachingFeedback?: string | null;
```

Add to component body (after success message, before solution reveal):
```typescript
{/* Coaching feedback for correct answers that didn't use target construct */}
{isCorrect && coachingFeedback && (
  <CoachingFeedback feedback={coachingFeedback} className="mt-3" />
)}
```

Add import:
```typescript
import { CoachingFeedback } from './CoachingFeedback';
```

**Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/exercise/ExerciseFeedback.tsx
git commit -m "feat(ui): integrate coaching feedback into ExerciseFeedback

- Add coachingFeedback prop
- Show CoachingFeedback component for correct answers
- Maintains existing feedback behavior"
```

---

## Task 7: Update ExerciseCard to Use Two-Pass Grading

**Files:**
- Modify: `src/components/exercise/ExerciseCard.tsx`

**Step 1: Read current implementation**

Review ExerciseCard.tsx to understand the current grading flow.

**Step 2: Update to use gradeAnswer**

Replace the current answer checking logic with gradeAnswer:

Add import:
```typescript
import { gradeAnswer, type GradingResult } from '@/lib/exercise';
```

Update state to track grading result:
```typescript
const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
```

Update the submission handler to use gradeAnswer:
```typescript
const handleSubmit = () => {
  if (!userAnswer.trim()) return;

  const result = gradeAnswer(userAnswer, exercise);
  setGradingResult(result);

  if (result.isCorrect) {
    setPhase('correct');
  } else {
    setPhase('incorrect');
  }
};
```

Pass coaching feedback to ExerciseFeedback:
```typescript
<ExerciseFeedback
  isCorrect={phase === 'correct'}
  expectedAnswer={exercise.expectedAnswer}
  coachingFeedback={gradingResult?.coachingFeedback}
  // ... other props
/>
```

**Step 3: Run typecheck and tests**

Run: `pnpm typecheck && pnpm test`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/exercise/ExerciseCard.tsx
git commit -m "feat(ui): integrate two-pass grading into ExerciseCard

- Use gradeAnswer instead of direct matching
- Track GradingResult in state
- Pass coaching feedback to ExerciseFeedback"
```

---

## Task 8: Integration Test - Full Grading Flow

**Files:**
- Create: `tests/integration/exercise/grading-flow.test.ts`

**Step 1: Write integration test**

Create `tests/integration/exercise/grading-flow.test.ts`:

```typescript
// tests/integration/exercise/grading-flow.test.ts
import { describe, it, expect } from 'vitest';
import { gradeAnswer, shouldShowCoaching } from '@/lib/exercise/grading';
import type { Exercise } from '@/lib/types';

describe('Two-pass grading integration', () => {
  const baseExercise: Partial<Exercise> = {
    id: 'test-id',
    slug: 'test-exercise',
    title: 'Test',
    hints: [],
    concept: 'strings',
    subconcept: 'slicing',
    level: 'practice',
    prereqs: [],
    pattern: 'indexing',
    objective: 'Test',
    difficulty: 1,
    language: 'python',
    category: 'strings',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Write exercise with target construct', () => {
    const exercise = {
      ...baseExercise,
      exerciseType: 'write',
      prompt: 'Use list comprehension to double numbers',
      expectedAnswer: '[x*2 for x in nums]',
      acceptedSolutions: ['[n*2 for n in nums]', '[2*x for x in nums]'],
      targetConstruct: {
        type: 'comprehension',
        feedback: 'Try using a list comprehension for a more Pythonic solution!',
      },
    } as Exercise;

    it('correct answer using comprehension gets no coaching', () => {
      const result = gradeAnswer('[x*2 for x in nums]', exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.usedTargetConstruct).toBe(true);
      expect(result.coachingFeedback).toBeNull();
      expect(shouldShowCoaching(result)).toBe(false);
    });

    it('correct answer without comprehension gets coaching', () => {
      // Imagine the exercise accepted a loop-based solution too
      const exerciseWithLoop = {
        ...exercise,
        acceptedSolutions: [
          ...exercise.acceptedSolutions!,
          'result', // placeholder for loop result
        ],
      };

      const result = gradeAnswer('result', exerciseWithLoop);

      expect(result.isCorrect).toBe(true);
      expect(result.usedTargetConstruct).toBe(false);
      expect(result.coachingFeedback).toBe(
        'Try using a list comprehension for a more Pythonic solution!'
      );
      expect(shouldShowCoaching(result)).toBe(true);
    });

    it('incorrect answer gets no coaching', () => {
      const result = gradeAnswer('wrong answer', exercise);

      expect(result.isCorrect).toBe(false);
      expect(result.usedTargetConstruct).toBeNull();
      expect(result.coachingFeedback).toBeNull();
      expect(shouldShowCoaching(result)).toBe(false);
    });
  });

  describe('Fill-in exercise', () => {
    const exercise = {
      ...baseExercise,
      exerciseType: 'fill-in',
      prompt: 'Complete the slice',
      template: 's[___:4]',
      expectedAnswer: '1',
      acceptedSolutions: [],
    } as Exercise;

    it('grades fill-in correctly', () => {
      const result = gradeAnswer('1', exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.gradingMethod).toBe('string');
    });

    it('normalizes fill-in whitespace', () => {
      const result = gradeAnswer('  1  ', exercise);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('Predict exercise', () => {
    const exercise = {
      ...baseExercise,
      exerciseType: 'predict',
      prompt: 'What does this print?',
      code: 'print("hello")',
      expectedAnswer: 'hello',
      acceptedSolutions: [],
    } as Exercise;

    it('grades predict correctly', () => {
      const result = gradeAnswer('hello', exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.gradingMethod).toBe('string');
    });

    it('handles trailing newlines in predict', () => {
      const result = gradeAnswer('hello\n\n', exercise);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('Exercise without target construct', () => {
    const exercise = {
      ...baseExercise,
      exerciseType: 'write',
      prompt: 'Print hello',
      expectedAnswer: 'print("hello")',
      acceptedSolutions: ["print('hello')"],
    } as Exercise;

    it('skips construct check entirely', () => {
      const result = gradeAnswer('print("hello")', exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.usedTargetConstruct).toBeNull();
      expect(result.coachingFeedback).toBeNull();
    });
  });
});
```

**Step 2: Run integration test**

Run: `pnpm test tests/integration/exercise/grading-flow.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/integration/exercise/grading-flow.test.ts
git commit -m "test(grading): add integration tests for two-pass flow

- Tests write exercises with target constructs
- Tests fill-in and predict exercises
- Tests coaching feedback logic"
```

---

## Task 9: Final Phase 2 Verification

**Step 1: Run full test suite**

```bash
pnpm test
```

Expected: All tests pass

**Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: No type errors

**Step 3: Run lint**

```bash
pnpm lint
```

Expected: No lint errors

**Step 4: Create Phase 2 completion commit**

```bash
git add -A
git commit -m "feat(grading): complete Phase 2 - Grading Infrastructure

Phase 2 establishes two-pass grading:
- GradingResult type with correctness + construct info
- Construct detection patterns for 8 Python constructs
- Two-pass grading orchestrator
- CoachingFeedback component for non-punitive hints
- ExerciseCard integration with gradeAnswer
- Full test coverage

Ready for Phase 3: Pyodide Integration"
```

---

## Phase 2 Checklist

- [ ] GradingResult type defined
- [ ] ConstructCheckResult type defined
- [ ] Construct patterns implemented (8 types)
- [ ] checkConstruct function working
- [ ] gradeAnswer orchestrator working
- [ ] shouldShowCoaching helper working
- [ ] CoachingFeedback component created
- [ ] ExerciseFeedback updated with coaching
- [ ] ExerciseCard using gradeAnswer
- [ ] Integration tests passing
- [ ] All tests passing
- [ ] No type errors
- [ ] No lint errors

---

## Next Phase

Proceed to **Phase 3: Pyodide Integration** which builds:
- PyodideContext provider for lazy loading
- Execution verification for predict exercises
- Fallback to string matching
- Loading states and error handling
