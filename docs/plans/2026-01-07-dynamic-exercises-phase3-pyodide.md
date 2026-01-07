# Dynamic Exercise System - Phase 3: Pyodide Integration

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Pyodide for client-side Python execution to verify predict-output exercises and opt-in write exercises via actual code execution rather than string matching.

**Architecture:** Lazy-loaded React context provides Pyodide instance on demand. Session preloads when predict exercises detected. Execution grading has graceful fallback to string matching on failure. ~6.4MB initial download with 4-5s cold start.

**Tech Stack:** Pyodide (Python in WebAssembly), React Context, TypeScript

---

## Overview

Phase 3 adds execution-based verification:
1. PyodideContext for lazy loading
2. Execution helpers for running Python code
3. Integration with grading system
4. Preloading strategy in session hook
5. Fallback handling for load failures

**Dependencies:** Phase 2 (grading infrastructure)

**Files Created:**
- `src/lib/context/PyodideContext.tsx`
- `src/lib/exercise/execution.ts`
- `tests/unit/exercise/execution.test.ts`

**Files Modified:**
- `src/lib/exercise/grading.ts` (add execution path)
- `src/lib/hooks/useConceptSession.ts` (preload trigger)
- `src/app/layout.tsx` (add PyodideProvider)

---

## Task 1: Install Pyodide

**Files:**
- Modify: `package.json`

**Step 1: Install pyodide package**

```bash
pnpm add pyodide
```

**Step 2: Verify installation**

Run: `pnpm ls pyodide`
Expected: pyodide package listed

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add pyodide dependency

For client-side Python execution in predict exercises"
```

---

## Task 2: Create Pyodide Context

**Files:**
- Create: `src/lib/context/PyodideContext.tsx`
- Test: Type verification

**Step 1: Create the context provider**

Create `src/lib/context/PyodideContext.tsx`:

```typescript
// src/lib/context/PyodideContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';

/**
 * Pyodide interface type (minimal subset we use).
 * Full type from 'pyodide' package, but we define minimal interface
 * to avoid importing the large module in type definitions.
 */
export interface PyodideInterface {
  runPython(code: string): unknown;
  runPythonAsync(code: string): Promise<unknown>;
  loadPackage(packages: string | string[]): Promise<void>;
  globals: Map<string, unknown>;
}

export interface PyodideContextValue {
  /** Pyodide instance, null until loaded */
  pyodide: PyodideInterface | null;
  /** Whether Pyodide is currently loading */
  loading: boolean;
  /** Any error during loading */
  error: Error | null;
  /** Trigger lazy loading of Pyodide */
  loadPyodide: () => Promise<PyodideInterface | null>;
  /** Whether Pyodide has been loaded */
  isReady: boolean;
}

const PyodideContext = createContext<PyodideContextValue | null>(null);

/** CDN URL for Pyodide - update version as needed */
const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/';

export interface PyodideProviderProps {
  children: ReactNode;
}

/**
 * PyodideProvider - Lazy-loads Pyodide on demand.
 *
 * Usage:
 * 1. Wrap app in <PyodideProvider>
 * 2. Call loadPyodide() when needed (e.g., predict exercise in session)
 * 3. Use pyodide instance for code execution
 */
export function PyodideProvider({ children }: PyodideProviderProps) {
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Ref to prevent multiple simultaneous loads
  const loadPromiseRef = useRef<Promise<PyodideInterface | null> | null>(null);

  const loadPyodideInstance = useCallback(async (): Promise<PyodideInterface | null> => {
    // Already loaded
    if (pyodide) {
      return pyodide;
    }

    // Load in progress - return existing promise
    if (loadPromiseRef.current) {
      return loadPromiseRef.current;
    }

    setLoading(true);
    setError(null);

    loadPromiseRef.current = (async () => {
      try {
        // Dynamic import to avoid loading Pyodide until needed
        const { loadPyodide: loadPyodideFromCDN } = await import('pyodide');

        const instance = await loadPyodideFromCDN({
          indexURL: PYODIDE_CDN_URL,
        });

        setPyodide(instance as unknown as PyodideInterface);
        return instance as unknown as PyodideInterface;
      } catch (err) {
        const loadError = err instanceof Error
          ? err
          : new Error('Failed to load Pyodide');
        setError(loadError);
        console.error('Pyodide load failed:', err);
        return null;
      } finally {
        setLoading(false);
        loadPromiseRef.current = null;
      }
    })();

    return loadPromiseRef.current;
  }, [pyodide]);

  const value: PyodideContextValue = {
    pyodide,
    loading,
    error,
    loadPyodide: loadPyodideInstance,
    isReady: pyodide !== null,
  };

  return (
    <PyodideContext.Provider value={value}>
      {children}
    </PyodideContext.Provider>
  );
}

/**
 * Hook to access Pyodide context.
 */
export function usePyodide(): PyodideContextValue {
  const context = useContext(PyodideContext);
  if (!context) {
    throw new Error('usePyodide must be used within a PyodideProvider');
  }
  return context;
}
```

**Step 2: Verify it compiles**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/context/PyodideContext.tsx
git commit -m "feat(pyodide): add PyodideContext for lazy loading

- PyodideProvider wraps app
- Lazy loads from CDN on demand
- Prevents duplicate loads with ref
- Exposes loading/error state"
```

---

## Task 3: Create Execution Helpers

**Files:**
- Create: `src/lib/exercise/execution.ts`
- Test: `tests/unit/exercise/execution.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/exercise/execution.test.ts`:

```typescript
// tests/unit/exercise/execution.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  executePythonCode,
  verifyPredictAnswer,
  verifyWriteAnswer,
  captureStdout,
  type ExecutionResult,
} from '@/lib/exercise/execution';
import type { PyodideInterface } from '@/lib/context/PyodideContext';

// Mock Pyodide interface
function createMockPyodide(
  runPythonResult: unknown = undefined,
  throwError: Error | null = null
): PyodideInterface {
  return {
    runPython: vi.fn((code: string) => {
      if (throwError) throw throwError;
      return runPythonResult;
    }),
    runPythonAsync: vi.fn(async (code: string) => {
      if (throwError) throw throwError;
      return runPythonResult;
    }),
    loadPackage: vi.fn(async () => {}),
    globals: new Map(),
  };
}

describe('captureStdout', () => {
  it('returns wrapper code that captures stdout', () => {
    const code = 'print("hello")';
    const wrapped = captureStdout(code);

    expect(wrapped).toContain('import io');
    expect(wrapped).toContain('sys.stdout');
    expect(wrapped).toContain('print("hello")');
  });
});

describe('executePythonCode', () => {
  it('returns success result with output', async () => {
    const mockPyodide = createMockPyodide('hello\n');

    const result = await executePythonCode(mockPyodide, 'print("hello")');

    expect(result.success).toBe(true);
    expect(result.output).toBe('hello\n');
    expect(result.error).toBeNull();
  });

  it('returns error result on execution failure', async () => {
    const mockPyodide = createMockPyodide(undefined, new Error('SyntaxError'));

    const result = await executePythonCode(mockPyodide, 'invalid python');

    expect(result.success).toBe(false);
    expect(result.output).toBeNull();
    expect(result.error).toBe('SyntaxError');
  });

  it('handles timeout', async () => {
    // Create a pyodide that hangs
    const mockPyodide: PyodideInterface = {
      runPython: vi.fn(() => {
        // Simulate hang - but test should use timeout
        return new Promise(() => {}); // never resolves
      }),
      runPythonAsync: vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        return 'result';
      }),
      loadPackage: vi.fn(async () => {}),
      globals: new Map(),
    };

    const result = await executePythonCode(mockPyodide, 'while True: pass', {
      timeoutMs: 100,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('timeout');
  });
});

describe('verifyPredictAnswer', () => {
  it('returns true when output matches expected', async () => {
    const mockPyodide = createMockPyodide('42\n');

    const isCorrect = await verifyPredictAnswer(
      mockPyodide,
      'print(6 * 7)',
      '42'
    );

    expect(isCorrect).toBe(true);
  });

  it('returns false when output differs', async () => {
    const mockPyodide = createMockPyodide('43\n');

    const isCorrect = await verifyPredictAnswer(
      mockPyodide,
      'print(6 * 7)',
      '42'
    );

    expect(isCorrect).toBe(false);
  });

  it('normalizes whitespace in comparison', async () => {
    const mockPyodide = createMockPyodide('hello\n\n');

    const isCorrect = await verifyPredictAnswer(
      mockPyodide,
      'print("hello")',
      'hello'
    );

    expect(isCorrect).toBe(true);
  });

  it('returns false on execution error', async () => {
    const mockPyodide = createMockPyodide(undefined, new Error('Error'));

    const isCorrect = await verifyPredictAnswer(
      mockPyodide,
      'invalid',
      'expected'
    );

    expect(isCorrect).toBe(false);
  });
});

describe('verifyWriteAnswer', () => {
  it('returns true when user code produces expected output', async () => {
    const mockPyodide = createMockPyodide('[2, 4, 6]\n');

    const isCorrect = await verifyWriteAnswer(
      mockPyodide,
      '[x*2 for x in [1, 2, 3]]',
      '[2, 4, 6]',
      'result = {{answer}}\nprint(result)'
    );

    expect(isCorrect).toBe(true);
  });

  it('substitutes {{answer}} in verification template', async () => {
    const mockPyodide = createMockPyodide('6\n');

    await verifyWriteAnswer(
      mockPyodide,
      '1 + 2 + 3',
      '6',
      'print({{answer}})'
    );

    expect(mockPyodide.runPython).toHaveBeenCalledWith(
      expect.stringContaining('print(1 + 2 + 3)')
    );
  });

  it('uses default template when none provided', async () => {
    const mockPyodide = createMockPyodide('result\n');

    await verifyWriteAnswer(mockPyodide, '"result"', 'result');

    expect(mockPyodide.runPython).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/exercise/execution.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write the implementation**

Create `src/lib/exercise/execution.ts`:

```typescript
// src/lib/exercise/execution.ts
// Python code execution helpers using Pyodide

import type { PyodideInterface } from '@/lib/context/PyodideContext';

/** Default execution timeout in milliseconds */
const DEFAULT_TIMEOUT_MS = 5000;

/** Default template for verifying write exercises */
const DEFAULT_VERIFICATION_TEMPLATE = 'print({{answer}})';

/**
 * Result of executing Python code.
 */
export interface ExecutionResult {
  success: boolean;
  output: string | null;
  error: string | null;
}

/**
 * Options for code execution.
 */
export interface ExecutionOptions {
  /** Timeout in milliseconds */
  timeoutMs?: number;
}

/**
 * Wrap Python code to capture stdout.
 */
export function captureStdout(code: string): string {
  return `
import sys
import io

__captured_stdout = io.StringIO()
__original_stdout = sys.stdout
sys.stdout = __captured_stdout

try:
    ${code.split('\n').join('\n    ')}
finally:
    sys.stdout = __original_stdout

__captured_stdout.getvalue()
`.trim();
}

/**
 * Execute Python code and capture output.
 */
export async function executePythonCode(
  pyodide: PyodideInterface,
  code: string,
  options: ExecutionOptions = {}
): Promise<ExecutionResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  try {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Execution timeout')), timeoutMs);
    });

    // Wrap code to capture stdout
    const wrappedCode = captureStdout(code);

    // Execute with timeout
    const executionPromise = Promise.resolve(pyodide.runPython(wrappedCode));
    const output = await Promise.race([executionPromise, timeoutPromise]);

    return {
      success: true,
      output: String(output ?? ''),
      error: null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      output: null,
      error: errorMessage,
    };
  }
}

/**
 * Verify a predict-output exercise by executing the code.
 *
 * @param pyodide - Pyodide instance
 * @param code - Code to execute
 * @param expectedOutput - Expected output to compare against
 * @returns Whether actual output matches expected
 */
export async function verifyPredictAnswer(
  pyodide: PyodideInterface,
  code: string,
  expectedOutput: string
): Promise<boolean> {
  const result = await executePythonCode(pyodide, code);

  if (!result.success || result.output === null) {
    return false;
  }

  // Normalize both outputs for comparison
  const normalizedActual = normalizeOutput(result.output);
  const normalizedExpected = normalizeOutput(expectedOutput);

  return normalizedActual === normalizedExpected;
}

/**
 * Verify a write exercise by substituting answer into template and executing.
 *
 * @param pyodide - Pyodide instance
 * @param userAnswer - User's code answer
 * @param expectedOutput - Expected output after execution
 * @param verificationTemplate - Template with {{answer}} placeholder
 * @returns Whether execution output matches expected
 */
export async function verifyWriteAnswer(
  pyodide: PyodideInterface,
  userAnswer: string,
  expectedOutput: string,
  verificationTemplate: string = DEFAULT_VERIFICATION_TEMPLATE
): Promise<boolean> {
  // Substitute user's answer into template
  const codeToRun = verificationTemplate.replace('{{answer}}', userAnswer);

  const result = await executePythonCode(pyodide, codeToRun);

  if (!result.success || result.output === null) {
    return false;
  }

  const normalizedActual = normalizeOutput(result.output);
  const normalizedExpected = normalizeOutput(expectedOutput);

  return normalizedActual === normalizedExpected;
}

/**
 * Normalize output for comparison.
 * Trims whitespace and removes trailing newlines.
 */
function normalizeOutput(output: string): string {
  return output.trim().replace(/\n+$/, '');
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/exercise/execution.test.ts`
Expected: PASS (or some tests may need adjustment based on actual Pyodide behavior)

**Step 5: Commit**

```bash
git add src/lib/exercise/execution.ts tests/unit/exercise/execution.test.ts
git commit -m "feat(pyodide): add execution helpers

- executePythonCode with stdout capture
- verifyPredictAnswer for predict exercises
- verifyWriteAnswer with template substitution
- Timeout handling for runaway code"
```

---

## Task 4: Update Grading to Support Execution

**Files:**
- Modify: `src/lib/exercise/grading.ts`
- Test: `tests/unit/exercise/grading.test.ts`

**Step 1: Add execution imports and types**

Update `src/lib/exercise/grading.ts`:

```typescript
// Add to imports
import type { PyodideInterface } from '@/lib/context/PyodideContext';
import { verifyPredictAnswer, verifyWriteAnswer } from './execution';
```

**Step 2: Create async grading function**

Add new function to `src/lib/exercise/grading.ts`:

```typescript
/**
 * Grade a user's answer with optional Pyodide execution.
 *
 * For predict exercises (or write exercises with verifyByExecution),
 * attempts execution grading first, falls back to string matching.
 *
 * @param userAnswer - User's submitted answer
 * @param exercise - Exercise being graded
 * @param pyodide - Optional Pyodide instance for execution grading
 * @returns Full grading result
 */
export async function gradeAnswerAsync(
  userAnswer: string,
  exercise: Exercise,
  pyodide: PyodideInterface | null
): Promise<GradingResult> {
  // Determine if we should use execution grading
  const shouldUseExecution =
    pyodide !== null &&
    (exercise.exerciseType === 'predict' || exercise.verifyByExecution === true);

  if (shouldUseExecution && pyodide) {
    try {
      let isCorrect = false;

      if (exercise.exerciseType === 'predict' && exercise.code) {
        // For predict: execute the exercise code and compare output with user's answer
        isCorrect = await verifyPredictAnswer(
          pyodide,
          exercise.code,
          userAnswer
        );
      } else if (exercise.verifyByExecution) {
        // For write with execution: run user's code and check output
        isCorrect = await verifyWriteAnswer(
          pyodide,
          userAnswer,
          exercise.expectedAnswer
        );
      }

      if (isCorrect) {
        // Execution succeeded and matched
        return buildGradingResult(
          true,
          userAnswer,
          exercise,
          'execution'
        );
      } else {
        // Execution ran but didn't match - this is a real wrong answer
        return buildGradingResult(
          false,
          userAnswer,
          exercise,
          'execution'
        );
      }
    } catch {
      // Execution failed - fall back to string matching
      console.warn('Execution grading failed, falling back to string matching');
      const result = gradeAnswer(userAnswer, exercise);
      return {
        ...result,
        gradingMethod: 'execution-fallback',
      };
    }
  }

  // Use standard string matching
  return gradeAnswer(userAnswer, exercise);
}

/**
 * Helper to build grading result from execution result.
 */
function buildGradingResult(
  isCorrect: boolean,
  userAnswer: string,
  exercise: Exercise,
  gradingMethod: GradingResult['gradingMethod']
): GradingResult {
  const normalizedUser = userAnswer.trim();
  const normalizedExpected = exercise.expectedAnswer.trim();

  // Run construct check if correct and target defined
  let usedTargetConstruct: boolean | null = null;
  let coachingFeedback: string | null = null;

  if (isCorrect && exercise.targetConstruct) {
    const constructResult = checkConstruct(
      userAnswer,
      exercise.targetConstruct.type as ConstructType
    );
    usedTargetConstruct = constructResult.detected;

    if (!usedTargetConstruct) {
      coachingFeedback =
        exercise.targetConstruct.feedback ?? DEFAULT_COACHING_FEEDBACK;
    }
  }

  return {
    isCorrect,
    usedTargetConstruct,
    coachingFeedback,
    gradingMethod,
    normalizedUserAnswer: normalizedUser,
    normalizedExpectedAnswer: normalizedExpected,
    matchedAlternative: null,
  };
}
```

**Step 3: Add tests for async grading**

Add to `tests/unit/exercise/grading.test.ts`:

```typescript
import { gradeAnswerAsync } from '@/lib/exercise/grading';
import type { PyodideInterface } from '@/lib/context/PyodideContext';

// Mock Pyodide
function createMockPyodide(output: string): PyodideInterface {
  return {
    runPython: vi.fn(() => output),
    runPythonAsync: vi.fn(async () => output),
    loadPackage: vi.fn(async () => {}),
    globals: new Map(),
  };
}

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
      const mockPyodide = createMockPyodide('hello\n');
      const exercise = createExercise({
        exerciseType: 'predict',
        code: 'print("hello")',
        expectedAnswer: 'hello',
      });

      const result = await gradeAnswerAsync('hello', exercise, mockPyodide);

      expect(result.gradingMethod).toBe('execution');
    });

    it('falls back to string on execution error', async () => {
      const mockPyodide: PyodideInterface = {
        runPython: vi.fn(() => {
          throw new Error('Execution error');
        }),
        runPythonAsync: vi.fn(async () => {
          throw new Error('Execution error');
        }),
        loadPackage: vi.fn(async () => {}),
        globals: new Map(),
      };

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
      const mockPyodide = createMockPyodide('[2, 4, 6]\n');
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
```

**Step 4: Run tests**

Run: `pnpm test tests/unit/exercise/grading.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/exercise/grading.ts tests/unit/exercise/grading.test.ts
git commit -m "feat(grading): add async grading with Pyodide support

- gradeAnswerAsync for execution-based grading
- Uses execution for predict and verifyByExecution
- Graceful fallback to string matching on error"
```

---

## Task 5: Add Pyodide Preloading to Session Hook

**Files:**
- Modify: `src/lib/hooks/useConceptSession.ts`

**Step 1: Add Pyodide preloading**

Add to `src/lib/hooks/useConceptSession.ts`:

```typescript
// Add import
import { usePyodide } from '@/lib/context/PyodideContext';

// Inside useConceptSession function, add:
const { loadPyodide } = usePyodide();

// Add useEffect for preloading (after session build effect):
useEffect(() => {
  // Preload Pyodide if session contains predict exercises or execution-verified exercises
  const needsPyodide = cards.some((card) => {
    if (card.type === 'teaching') return false;
    const exercise = card.exercise;
    return exercise.exerciseType === 'predict' || exercise.verifyByExecution === true;
  });

  if (needsPyodide && !sessionInitialized) {
    // Don't await - fire and forget to preload in background
    loadPyodide().catch((err) => {
      console.warn('Pyodide preload failed:', err);
      // Non-fatal - will fall back to string matching
    });
  }
}, [cards, loadPyodide, sessionInitialized]);
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/hooks/useConceptSession.ts
git commit -m "feat(session): preload Pyodide when needed

- Detects predict/execution exercises in session
- Fires preload in background
- Non-blocking, falls back on failure"
```

---

## Task 6: Add PyodideProvider to App Layout

**Files:**
- Modify: `src/app/layout.tsx`

**Step 1: Wrap app with PyodideProvider**

Add to `src/app/layout.tsx`:

```typescript
// Add import
import { PyodideProvider } from '@/lib/context/PyodideContext';

// Wrap children with PyodideProvider (inside other providers):
<PyodideProvider>
  {children}
</PyodideProvider>
```

**Step 2: Verify app starts**

Run: `pnpm dev`
Expected: App loads without errors

**Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(app): add PyodideProvider to root layout

- Makes Pyodide context available throughout app
- Lazy loading - no impact until first use"
```

---

## Task 7: Update ExerciseCard for Async Grading

**Files:**
- Modify: `src/components/exercise/ExerciseCard.tsx`

**Step 1: Add Pyodide usage**

Update `src/components/exercise/ExerciseCard.tsx`:

```typescript
// Add imports
import { usePyodide } from '@/lib/context/PyodideContext';
import { gradeAnswerAsync } from '@/lib/exercise';

// Inside component:
const { pyodide, loading: pyodideLoading } = usePyodide();

// Update handleSubmit to be async:
const handleSubmit = async () => {
  if (!userAnswer.trim()) return;
  if (pyodideLoading) return; // Wait for Pyodide if loading

  const result = await gradeAnswerAsync(userAnswer, exercise, pyodide);
  setGradingResult(result);

  if (result.isCorrect) {
    setPhase('correct');
  } else {
    setPhase('incorrect');
  }
};

// Add loading state to submit button:
disabled={!userAnswer.trim() || pyodideLoading}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/exercise/ExerciseCard.tsx
git commit -m "feat(ui): integrate async grading with Pyodide

- Use gradeAnswerAsync for all exercises
- Disable submit while Pyodide loading
- Graceful handling of loading states"
```

---

## Task 8: Add Pyodide Loading Indicator

**Files:**
- Modify: `src/components/exercise/ExerciseCard.tsx`

**Step 1: Add loading indicator**

Add to ExerciseCard when Pyodide is loading for a predict exercise:

```typescript
// Before the main exercise content, add conditional loading message:
{exercise.exerciseType === 'predict' && pyodideLoading && (
  <div className="text-sm text-text-secondary flex items-center gap-2 mb-4">
    <span className="animate-spin">⟳</span>
    Loading Python runtime...
  </div>
)}
```

**Step 2: Visual verification**

Run: `pnpm dev` and verify loading indicator appears for predict exercises.

**Step 3: Commit**

```bash
git add src/components/exercise/ExerciseCard.tsx
git commit -m "feat(ui): add Pyodide loading indicator

- Shows spinner for predict exercises
- Non-blocking - user can still type"
```

---

## Task 9: Export Execution Module

**Files:**
- Modify: `src/lib/exercise/index.ts`

**Step 1: Add exports**

Add to `src/lib/exercise/index.ts`:

```typescript
// Execution
export {
  executePythonCode,
  verifyPredictAnswer,
  verifyWriteAnswer,
  captureStdout,
  type ExecutionResult,
  type ExecutionOptions,
} from './execution';

// Async grading
export { gradeAnswerAsync } from './grading';
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/exercise/index.ts
git commit -m "feat(exercise): export execution module and async grading"
```

---

## Task 10: Integration Test - Pyodide Flow

**Files:**
- Create: `tests/integration/exercise/pyodide-flow.test.ts`

**Step 1: Write integration test**

Create `tests/integration/exercise/pyodide-flow.test.ts`:

```typescript
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
  createdAt: new Date(),
  updatedAt: new Date(),
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
  });
});
```

**Step 2: Run integration test**

Run: `pnpm test tests/integration/exercise/pyodide-flow.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/integration/exercise/pyodide-flow.test.ts
git commit -m "test(pyodide): add integration tests for execution grading

- Tests predict exercise execution
- Tests write exercise with verifyByExecution
- Tests fallback behavior"
```

---

## Task 11: Final Phase 3 Verification

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

**Step 4: Manual verification**

Run: `pnpm dev`
- Navigate to a predict exercise
- Verify Pyodide loading indicator appears briefly
- Submit answer and verify grading works

**Step 5: Create Phase 3 completion commit**

```bash
git add -A
git commit -m "feat(pyodide): complete Phase 3 - Pyodide Integration

Phase 3 adds execution-based grading:
- PyodideContext for lazy loading from CDN
- Execution helpers with stdout capture
- Async grading with execution/fallback
- Session preloading for predict exercises
- Loading indicator in ExerciseCard

Ready for Phase 4: Metrics & Logging"
```

---

## Phase 3 Checklist

- [ ] Pyodide package installed
- [ ] PyodideContext provider created
- [ ] Execution helpers working
- [ ] gradeAnswerAsync implemented
- [ ] Fallback to string matching working
- [ ] Session preloads Pyodide when needed
- [ ] PyodideProvider in app layout
- [ ] ExerciseCard uses async grading
- [ ] Loading indicator displayed
- [ ] Integration tests passing
- [ ] All tests passing
- [ ] No type errors
- [ ] No lint errors

---

## Next Phase

Proceed to **Phase 4: Metrics & Logging** which builds:
- Database schema extensions for audit logging
- exercise_attempts column additions
- transfer_assessments table
- Metric queries for retention/transfer
