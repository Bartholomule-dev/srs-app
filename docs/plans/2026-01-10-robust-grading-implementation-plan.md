# Robust Answer Grading System - Implementation Plan

**Date:** 2026-01-10
**Status:** ✅ COMPLETE (All 5 Phases Implemented)
**Design Document:** [2026-01-10-robust-answer-grading-design.md](./2026-01-10-robust-answer-grading-design.md)
**Actual Effort:** Completed in single session

---

## TL;DR

This plan implements a strategy-based grading system that fixes 5 documented failure modes in the current string-matching approach. Work is organized into 5 phases:

1. **Phase 0 (Quick)** - Baseline characterization tests to prevent regressions
2. **Phase 1 (Short)** - Quick wins: string literal masking, construct detection fix, telemetry
3. **Phase 2 (Medium)** - Infrastructure: token comparison, strategy router, execution improvements
4. **Phase 3 (Medium)** - Content: YAML field additions, validation tooling, content audit
5. **Phase 4 (Medium-Large)** - AST normalization: slice canonicalization, local variable renaming

**Key Architecture Decision:** `gradeAnswer()` and `gradeAnswerAsync()` remain the public APIs (UI uses `gradeAnswerAsync`). The strategy router is used internally by `gradeAnswerAsync()`. Token comparison is opt-in (not default) to avoid loading Pyodide unnecessarily.

**Important Scope Clarification:** Token comparison handles **whitespace and comment tolerance only**—it does NOT solve semantic equivalence (e.g., `items[:3]` vs `items[0:3]`) or variable renames (e.g., `for i in` vs `for x in`). Those require AST normalization, which is deferred to a future phase.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PUBLIC API LAYER                                │
│  gradeAnswerAsync() - main entry (UI uses this)                             │
│  gradeAnswer() - sync fallback for non-execution grading                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ORCHESTRATION LAYER                                │
│  grading.ts - delegates to strategy router, runs construct check             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STRATEGY ROUTER LAYER                              │
│  strategy-router.ts - selects strategy, handles fallbacks                    │
│                                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐                 │
│  │  exact   │  │  token   │  │   ast    │  │  execution  │                 │
│  │ (string) │  │(Pyodide) │  │(Pyodide) │  │  (verify)   │                 │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UTILITY LAYER                                   │
│  matching.ts      │ token-compare.ts │ execution.ts  │ construct-check.ts   │
│  (normalization)  │ (Pyodide tokens) │ (worker/main) │ (regex detection)    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SUPPORT LAYER                                   │
│  telemetry.ts - logging    │ strategy-defaults.ts - config resolution       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Layering Policy

| Layer | Responsibility | Can Import From |
|-------|---------------|-----------------|
| Public API | Entry point for all grading | Orchestration |
| Orchestration | Coordinates strategy + construct check | Strategy Router, Utilities |
| Strategy Router | Strategy selection, fallback logic | Utilities |
| Utilities | Individual grading mechanisms | Support, external deps |
| Support | Telemetry, configuration | Nothing (leaf layer) |

### Pyodide Loading Boundary

**CRITICAL:** Only `execution.ts` and `token-compare.ts` may load/use Pyodide. The strategy router checks Pyodide availability but never triggers loading - that's the caller's responsibility via `useConceptSession.ts`.

**Required Update:** `useConceptSession.ts` (line ~576) currently only preloads Pyodide for `predict` and `verifyByExecution` exercises. This must be extended to also check for `gradingStrategy === 'token'`:

```typescript
// Current (needs update in Phase 2):
const needsPyodide = cards.some((card) => {
  if (card.type === 'teaching') return false;
  const exercise = card.exercise;
  return exercise.exerciseType === 'predict' ||
         exercise.verifyByExecution === true ||
         exercise.gradingStrategy === 'token';  // ADD THIS
});
```

---

## Failure Modes Addressed

| # | Problem | Current Behavior | Fix | Phase | Status |
|---|---------|------------------|-----|-------|--------|
| 1 | String literal corruption | `"a,b"` → `"a, b"` | Mask strings before normalize | Phase 1 (A1) | ✅ **Solved** |
| 2 | Semantic equivalence misses | `items[:3]` ≠ `items[0:3]` | AST slice normalization | Phase 4 (A2) | ✅ **Solved** |
| 3 | Variable name variations | `for i in` ≠ `for x in` | AST local alpha-rename | **Phase 4 (A2)** | **Planned** |
| 4 | Construct false positives | `"[x for x]"` triggers comprehension | Strip strings before check | Phase 1 (A3) | **Fully solved** |
| 5 | Behavior vs syntax mismatch | Different code, same output | Execution strategy + verification | Phase 2 (B2) | **Fully solved** |

> **Note on Failure Modes 2 & 3:** Token comparison using Python's `tokenize` module produces different token streams for semantically equivalent code (e.g., `[:3]` vs `[0:3]` have different tokens). These are solved in **Phase 4** via AST normalization using Python's `ast` module in Pyodide. The current token strategy (Phase 2) only handles **whitespace tolerance** and **comment stripping**.

---

## Phase 0: Baseline Safety Net

**Goal:** Create characterization tests that capture current behavior before making changes.
**Effort:** Quick (<1 hour)
**Risk mitigation:** Ensures no regressions during refactoring.

### Tests to Write FIRST

Create `tests/unit/exercise/grading-characterization.test.ts`:

```typescript
// tests/unit/exercise/grading-characterization.test.ts
// Characterization tests - capture CURRENT behavior to detect regressions
// These tests document existing behavior, not necessarily correct behavior

import { describe, it, expect } from 'vitest';
import { gradeAnswer } from '@/lib/exercise/grading';
import { normalizePython } from '@/lib/exercise/matching';
import { checkConstruct } from '@/lib/exercise/construct-check';

describe('grading characterization tests', () => {
  describe('normalization behavior (current - may be buggy)', () => {
    // Document current string literal corruption
    it('KNOWN BUG: currently corrupts commas inside strings', () => {
      // This documents the bug - change expectation when fixed
      expect(normalizePython('print("a,b,c")')).toBe('print("a, b, c")');
    });

    it('KNOWN BUG: currently corrupts colons inside strings', () => {
      expect(normalizePython('{"key":"value"}')).toBe('{"key": "value"}');
    });

    // Document correct behavior to preserve
    it('normalizes tabs to 4 spaces', () => {
      expect(normalizePython('\tprint(x)')).toBe('    print(x)');
    });

    it('normalizes comma spacing in code', () => {
      expect(normalizePython('[1,2,3]')).toBe('[1, 2, 3]');
    });
  });

  describe('construct detection behavior (current - may have false positives)', () => {
    // Document current false positive issue
    it('KNOWN BUG: detects comprehension inside string literal', () => {
      const result = checkConstruct('"[x for x in items]"', 'comprehension');
      // Current behavior: detects it (false positive)
      expect(result.detected).toBe(true);
    });

    it('KNOWN BUG: detects slice inside comment', () => {
      const result = checkConstruct('# items[1:4] is a slice', 'slice');
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
  });
});

// Helper (copy from grading.test.ts)
function createExercise(overrides = {}) {
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
```

### Implementation Steps

- [ ] Create `tests/unit/exercise/grading-characterization.test.ts`
- [ ] Run tests to verify they pass with current behavior
- [ ] Document any unexpected behaviors discovered

### Validation Criteria

```bash
# All characterization tests pass
pnpm test tests/unit/exercise/grading-characterization.test.ts
```

---

## Phase 1: Quick Wins (Track A)

**Goal:** Fix string literal corruption, construct false positives, add telemetry
**Effort:** Short (2-4 hours)
**Dependencies:** Phase 0 complete

### A1: String Literal Preservation

**Files to modify:**
- `src/lib/exercise/matching.ts`
- `tests/unit/exercise/matching.test.ts`

#### Tests to Write FIRST

Add to `tests/unit/exercise/matching.test.ts`:

```typescript
describe('string literal preservation', () => {
  it('preserves commas inside double-quoted strings', () => {
    expect(normalizePython('print("a,b,c")')).toBe('print("a,b,c")');
  });

  it('preserves commas inside single-quoted strings', () => {
    expect(normalizePython("print('a,b,c')")).toBe("print('a,b,c')");
  });

  it('preserves colons inside strings', () => {
    expect(normalizePython('d = {"key":"value"}')).toBe('d = {"key":"value"}');
  });

  it('still normalizes commas in code outside strings', () => {
    expect(normalizePython('print("a,b"),print("c,d")')).toBe('print("a,b"), print("c,d")');
  });

  it('handles escaped quotes inside strings', () => {
    expect(normalizePython('print("he said \\"hi,there\\"")')).toBe('print("he said \\"hi,there\\"")');
  });

  it('handles mixed quotes', () => {
    expect(normalizePython("print('a,b') + print(\"c,d\")")).toBe("print('a,b') + print(\"c,d\")");
  });

  it('handles strings with colons (dict-like)', () => {
    expect(normalizePython('f"{time:02d}:{mins:02d}"')).toBe('f"{time:02d}:{mins:02d}"');
  });
});
```

#### Implementation Steps

- [ ] Add string literal preservation tests to `matching.test.ts`
- [ ] Run tests (should fail - documenting current bug)
- [ ] Implement mask-before-normalize pattern in `normalizePython()`:

```typescript
// src/lib/exercise/matching.ts
export function normalizePython(code: string): string {
  if (!code) return '';

  // Step 1: Mask string literals to protect them from normalization
  const strings: string[] = [];
  let masked = code.replace(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    (match) => {
      strings.push(match);
      return `__STR_${strings.length - 1}__`;
    }
  );

  // Step 2: Apply normalizations to non-string code
  masked = masked
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/ +$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/, */g, ', ')
    .replace(/ +:/g, ':')
    .replace(/:(?![\n$]) */g, ': ')
    .trim();

  // Step 3: Restore string literals
  return masked.replace(/__STR_(\d+)__/g, (_, i) => strings[parseInt(i)]);
}
```

- [ ] Run tests (should pass)
- [ ] Update characterization test expectations (remove KNOWN BUG comments)
- [ ] Run full test suite to catch regressions

#### Validation Criteria

```bash
pnpm test tests/unit/exercise/matching.test.ts
pnpm test  # Full suite - no regressions
```

---

### A2: Grading Telemetry

**Files to create:**
- `src/lib/exercise/telemetry.ts`
- `tests/unit/exercise/telemetry.test.ts`

**Files to modify:**
- `src/lib/exercise/grading.ts`
- `src/lib/exercise/types.ts`
- `src/lib/exercise/index.ts`

#### Tests to Write FIRST

Create `tests/unit/exercise/telemetry.test.ts`:

```typescript
// tests/unit/exercise/telemetry.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logGradingTelemetry, createTelemetryEntry } from '@/lib/exercise/telemetry';
import type { GradingTelemetry } from '@/lib/exercise/telemetry';

describe('telemetry', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createTelemetryEntry', () => {
    it('creates entry with required fields', () => {
      const entry = createTelemetryEntry({
        exerciseSlug: 'test-exercise',
        strategy: 'exact',
        wasCorrect: true,
        fallbackUsed: false,
        userAnswer: 'print("hello")',
      });

      expect(entry.exerciseSlug).toBe('test-exercise');
      expect(entry.strategy).toBe('exact');
      expect(entry.wasCorrect).toBe(true);
      expect(entry.fallbackUsed).toBe(false);
      expect(entry.timestamp).toBeInstanceOf(Date);
    });

    it('hashes user answer instead of storing raw', () => {
      const entry = createTelemetryEntry({
        exerciseSlug: 'test',
        strategy: 'exact',
        wasCorrect: true,
        fallbackUsed: false,
        userAnswer: 'print("secret")',
      });

      expect(entry.userAnswerHash).toBeDefined();
      expect(entry.userAnswerHash).not.toContain('secret');
      expect(entry.userAnswerHash.length).toBeGreaterThan(0);
    });

    it('includes optional fields when provided', () => {
      const entry = createTelemetryEntry({
        exerciseSlug: 'test',
        strategy: 'execution',
        wasCorrect: false,
        fallbackUsed: true,
        fallbackReason: 'pyodide_unavailable',
        matchedAlternative: 'alt1',
        userAnswer: 'code',
      });

      expect(entry.fallbackReason).toBe('pyodide_unavailable');
      expect(entry.matchedAlternative).toBe('alt1');
    });
  });

  describe('logGradingTelemetry', () => {
    it('logs to console in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const entry: GradingTelemetry = {
        exerciseSlug: 'test',
        strategy: 'exact',
        wasCorrect: true,
        fallbackUsed: false,
        userAnswerHash: 'abc123',
        timestamp: new Date(),
      };

      logGradingTelemetry(entry);

      expect(console.log).toHaveBeenCalledWith('[Grading]', entry);

      process.env.NODE_ENV = originalEnv;
    });

    it('does not log in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const entry: GradingTelemetry = {
        exerciseSlug: 'test',
        strategy: 'exact',
        wasCorrect: true,
        fallbackUsed: false,
        userAnswerHash: 'abc123',
        timestamp: new Date(),
      };

      logGradingTelemetry(entry);

      expect(console.log).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
```

#### Implementation Steps

- [ ] Create telemetry test file
- [ ] Create `src/lib/exercise/telemetry.ts`:

```typescript
// src/lib/exercise/telemetry.ts
import type { GradingStrategy } from './types';

export interface GradingTelemetry {
  exerciseSlug: string;
  strategy: GradingStrategy;
  wasCorrect: boolean;
  fallbackUsed: boolean;
  fallbackReason?: string;
  matchedAlternative?: string | null;
  userAnswerHash: string;
  timestamp: Date;
}

export interface CreateTelemetryParams {
  exerciseSlug: string;
  strategy: GradingStrategy;
  wasCorrect: boolean;
  fallbackUsed: boolean;
  fallbackReason?: string;
  matchedAlternative?: string | null;
  userAnswer: string;
}

/**
 * Create a telemetry entry, hashing the user answer for privacy.
 */
export function createTelemetryEntry(params: CreateTelemetryParams): GradingTelemetry {
  return {
    exerciseSlug: params.exerciseSlug,
    strategy: params.strategy,
    wasCorrect: params.wasCorrect,
    fallbackUsed: params.fallbackUsed,
    fallbackReason: params.fallbackReason,
    matchedAlternative: params.matchedAlternative,
    userAnswerHash: hashString(params.userAnswer),
    timestamp: new Date(),
  };
}

/**
 * Log grading telemetry. Currently console-only; future: analytics.
 */
export function logGradingTelemetry(telemetry: GradingTelemetry): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Grading]', telemetry);
  }
  // Future: send to analytics endpoint
}

/**
 * Simple hash for privacy. Not cryptographically secure, just for anonymization.
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
```

- [ ] Add `GradingStrategy` type to `src/lib/exercise/types.ts`:

```typescript
export type GradingStrategy = 'exact' | 'token' | 'ast' | 'execution';
```

- [ ] Export from `src/lib/exercise/index.ts`
- [ ] Integrate telemetry into `gradeAnswer()` (optional - wire up later)
- [ ] Run tests

#### Validation Criteria

```bash
pnpm test tests/unit/exercise/telemetry.test.ts
pnpm typecheck
```

---

### A3: Construct Detection Fix

**Files to modify:**
- `src/lib/exercise/construct-check.ts`
- `tests/unit/exercise/construct-check.test.ts`

#### Tests to Write FIRST

Add to `tests/unit/exercise/construct-check.test.ts`:

```typescript
describe('string/comment stripping', () => {
  describe('should NOT detect constructs inside strings', () => {
    it('ignores comprehension in double-quoted string', () => {
      const result = checkConstruct('"[x for x in items]"', 'comprehension');
      expect(result.detected).toBe(false);
    });

    it('ignores comprehension in single-quoted string', () => {
      const result = checkConstruct("'[x for x in items]'", 'comprehension');
      expect(result.detected).toBe(false);
    });

    it('ignores slice in string', () => {
      const result = checkConstruct('"items[1:4]"', 'slice');
      expect(result.detected).toBe(false);
    });

    it('ignores f-string pattern in regular string', () => {
      const result = checkConstruct('"f\\"{name}\\"', 'f-string');
      expect(result.detected).toBe(false);
    });
  });

  describe('should NOT detect constructs inside comments', () => {
    it('ignores comprehension in comment', () => {
      const result = checkConstruct('# [x for x in items]', 'comprehension');
      expect(result.detected).toBe(false);
    });

    it('ignores slice in comment', () => {
      const result = checkConstruct('# items[1:4] is a slice', 'slice');
      expect(result.detected).toBe(false);
    });

    it('ignores construct after code', () => {
      const result = checkConstruct('x = 1  # [x for x in items]', 'comprehension');
      expect(result.detected).toBe(false);
    });
  });

  describe('should still detect constructs in actual code', () => {
    it('detects comprehension in code with strings nearby', () => {
      const result = checkConstruct('result = [x for x in items]; print("done")', 'comprehension');
      expect(result.detected).toBe(true);
    });

    it('detects slice in code with comments nearby', () => {
      const code = `# Get a slice
result = items[1:4]`;
      const result = checkConstruct(code, 'slice');
      expect(result.detected).toBe(true);
    });
  });
});
```

#### Implementation Steps

- [ ] Add string/comment stripping tests
- [ ] Run tests (should fail - documenting current bug)
- [ ] Add `stripStringsAndComments` helper function:

```typescript
// src/lib/exercise/construct-check.ts

/**
 * Strip string literals and comments from code to prevent false positive matches.
 * Replaces strings with empty quotes and removes comments entirely.
 */
function stripStringsAndComments(code: string): string {
  // Replace string literals with empty strings (preserves structure)
  let cleaned = code.replace(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    '""'
  );
  // Remove # comments (to end of line)
  cleaned = cleaned.replace(/#.*/g, '');
  return cleaned;
}

export function checkConstruct(
  code: string,
  constructType: ConstructType
): ConstructCheckResult {
  const pattern = CONSTRUCT_PATTERNS[constructType];

  if (!pattern) {
    return {
      detected: false,
      constructType: constructType,
    };
  }

  // Strip strings and comments before matching
  const cleanCode = stripStringsAndComments(code);
  const detected = pattern.test(cleanCode);

  return {
    detected,
    constructType: constructType,
  };
}
```

- [ ] Run tests (should pass)
- [ ] Update characterization test expectations
- [ ] Run full test suite

#### Validation Criteria

```bash
pnpm test tests/unit/exercise/construct-check.test.ts
pnpm test  # Full suite
```

---

## Phase 2: Infrastructure (Track B)

**Goal:** Build strategy router, token comparison, execution improvements
**Effort:** Medium (4-8 hours)
**Dependencies:** Phase 1 complete (A1 string masking used by token comparison)

### B1: Token Comparison

**Scope Clarification:** Token comparison handles **whitespace and comment tolerance only**. It does NOT normalize:
- Slice notation (`[:3]` vs `[0:3]` - different tokens)
- Variable names (`for i` vs `for x` - different tokens)

For semantic equivalence, AST normalization with tree-sitter is required (future phase).

**Files to create:**
- `src/lib/exercise/token-compare.ts`
- `tests/unit/exercise/token-compare.test.ts`
- Update `tests/fixtures/pyodide.ts` to support dynamic `runPythonFn`

#### Prerequisite: Update Pyodide Mock Fixture

First, update `tests/fixtures/pyodide.ts` to support dynamic responses:

```typescript
// tests/fixtures/pyodide.ts
export interface MockPyodideOptions {
  output?: string;
  error?: Error;
  /** Dynamic runPython implementation for multi-call tests */
  runPythonFn?: (code: string) => string | null;
}

export function createMockPyodide(options: MockPyodideOptions = {}): PyodideInterface {
  const { output = '', error, runPythonFn } = options;

  const execute = (code?: string) => {
    if (error) throw error;
    if (runPythonFn) return runPythonFn(code ?? '');
    return output;
  };

  return {
    runPython: vi.fn(execute),
    runPythonAsync: vi.fn(async (code?: string) => execute(code)),
    loadPackage: vi.fn(async () => {}),
    globals: new Map(),
  };
}
```

#### Tests to Write FIRST

Create `tests/unit/exercise/token-compare.test.ts`:

```typescript
// tests/unit/exercise/token-compare.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tokenizeCode, compareByTokens, initTokenizer } from '@/lib/exercise/token-compare';
import { createMockPyodide } from '@tests/fixtures/pyodide';

describe('token-compare', () => {
  describe('tokenizeCode', () => {
    it('returns token array for valid code', async () => {
      // Note: runPython is called twice - once for initTokenizer, once for tokenize_code
      let callCount = 0;
      const mockPyodide = createMockPyodide({
        runPythonFn: () => {
          callCount++;
          if (callCount === 1) return ''; // initTokenizer call
          return '[[1, "x"], [54, "="], [2, "1"]]';
        },
      });

      const tokens = await tokenizeCode(mockPyodide, 'x = 1');

      expect(tokens).toBeDefined();
      expect(Array.isArray(tokens)).toBe(true);
    });

    it('returns null for invalid/untokenizable code', async () => {
      const mockPyodide = createMockPyodide({
        runPythonFn: () => null,
      });

      const tokens = await tokenizeCode(mockPyodide, 'invalid code fragment');

      expect(tokens).toBeNull();
    });
  });

  describe('compareByTokens - whitespace tolerance', () => {
    it('matches code with different whitespace', async () => {
      // "x=1" vs "x = 1" - same tokens after whitespace stripping
      let callCount = 0;
      const mockPyodide = createMockPyodide({
        runPythonFn: () => {
          callCount++;
          if (callCount === 1) return ''; // initTokenizer
          // Both normalize to same tokens (tokenizer ignores whitespace)
          return '[[1, "x"], [54, "="], [2, "1"]]';
        },
      });

      const result = await compareByTokens(mockPyodide, 'x=1', 'x = 1', []);
      expect(result.match).toBe(true);
    });

    it('matches code with different comments', async () => {
      // Comments are filtered out by tokenizer
      let callCount = 0;
      const mockPyodide = createMockPyodide({
        runPythonFn: () => {
          callCount++;
          if (callCount === 1) return '';
          return '[[1, "x"], [54, "="], [2, "1"]]';
        },
      });

      const result = await compareByTokens(
        mockPyodide,
        'x = 1  # comment',
        'x = 1',
        []
      );
      expect(result.match).toBe(true);
    });

    it('does NOT match different slice notation (limitation)', async () => {
      // IMPORTANT: Token comparison CANNOT solve this - tokens are different
      // items[:3] tokens: [items, [, :, 3, ]]
      // items[0:3] tokens: [items, [, 0, :, 3, ]]
      let callCount = 0;
      const mockPyodide = createMockPyodide({
        runPythonFn: () => {
          callCount++;
          if (callCount === 1) return '';
          if (callCount === 2) return '[[1, "items"], [54, "["], [54, ":"], [2, "3"], [54, "]"]]';
          return '[[1, "items"], [54, "["], [2, "0"], [54, ":"], [2, "3"], [54, "]"]]';
        },
      });

      const result = await compareByTokens(mockPyodide, 'items[:3]', 'items[0:3]', []);
      // This WILL NOT match - tokens are different. This is a documented limitation.
      expect(result.match).toBe(false);
    });

    it('matches against accepted alternatives', async () => {
      const answers = ['items[:3]', 'items[0:3]', 'items[0:3:1]'];
      let idx = 0;
      const mockPyodide = createMockPyodide({
        runPythonFn: () => {
          const tokens = [
            '[[1, "a"]]',  // user
            '[[1, "b"]]',  // expected (no match)
            '[[1, "a"]]',  // alt1 (match!)
          ];
          return tokens[idx++];
        },
      });

      const result = await compareByTokens(
        mockPyodide,
        'user_answer',
        'expected',
        ['alternative1', 'alternative2']
      );

      expect(result.match).toBe(true);
      expect(result.matchedAlternative).toBe('alternative1');
    });

    it('returns false when no match', async () => {
      let idx = 0;
      const mockPyodide = createMockPyodide({
        runPythonFn: () => {
          const tokens = ['[[1, "a"]]', '[[1, "b"]]', '[[1, "c"]]'];
          return tokens[idx++];
        },
      });

      const result = await compareByTokens(
        mockPyodide,
        'wrong',
        'expected',
        ['also_wrong']
      );

      expect(result.match).toBe(false);
      expect(result.matchedAlternative).toBeNull();
    });

    it('handles pyodide errors gracefully', async () => {
      const mockPyodide = createMockPyodide({
        error: new Error('Tokenize failed'),
      });

      const result = await compareByTokens(
        mockPyodide,
        'code',
        'expected',
        []
      );

      expect(result.match).toBe(false);
    });
  });
});
```

#### Implementation Steps

- [ ] Create token comparison test file
- [ ] Update `tests/fixtures/pyodide.ts` if needed for `runPythonFn` support
- [ ] Create `src/lib/exercise/token-compare.ts`:

```typescript
// src/lib/exercise/token-compare.ts
import type { PyodideInterface } from '@/lib/context/PyodideContext';

const TOKENIZE_CODE = `
import tokenize
import io
import json

def tokenize_code(code):
    try:
        tokens = tokenize.generate_tokens(io.StringIO(code).readline)
        result = [
            (t.type, t.string) for t in tokens
            if t.type not in (
                tokenize.COMMENT, tokenize.NL,
                tokenize.NEWLINE, tokenize.ENCODING,
                tokenize.ENDMARKER
            )
        ]
        return json.dumps(result)
    except tokenize.TokenizeError:
        return None
`;

let tokenizeInitialized = false;

export async function initTokenizer(pyodide: PyodideInterface): Promise<void> {
  if (tokenizeInitialized) return;
  pyodide.runPython(TOKENIZE_CODE);
  tokenizeInitialized = true;
}

export async function tokenizeCode(
  pyodide: PyodideInterface,
  code: string
): Promise<[number, string][] | null> {
  try {
    await initTokenizer(pyodide);
    const result = pyodide.runPython(`tokenize_code(${JSON.stringify(code)})`);
    return result ? JSON.parse(result) : null;
  } catch {
    return null;
  }
}

export interface TokenCompareResult {
  match: boolean;
  matchedAlternative: string | null;
}

export async function compareByTokens(
  pyodide: PyodideInterface,
  userAnswer: string,
  expectedAnswer: string,
  acceptedSolutions: string[] = []
): Promise<TokenCompareResult> {
  const userTokens = await tokenizeCode(pyodide, userAnswer);
  if (!userTokens) return { match: false, matchedAlternative: null };

  const userTokensJson = JSON.stringify(userTokens);

  // Check expected answer
  const expectedTokens = await tokenizeCode(pyodide, expectedAnswer);
  if (expectedTokens && userTokensJson === JSON.stringify(expectedTokens)) {
    return { match: true, matchedAlternative: null };
  }

  // Check alternatives
  for (const alt of acceptedSolutions) {
    const altTokens = await tokenizeCode(pyodide, alt);
    if (altTokens && userTokensJson === JSON.stringify(altTokens)) {
      return { match: true, matchedAlternative: alt };
    }
  }

  return { match: false, matchedAlternative: null };
}
```

- [ ] Export from `src/lib/exercise/index.ts`
- [ ] Run tests

#### Validation Criteria

```bash
pnpm test tests/unit/exercise/token-compare.test.ts
pnpm typecheck
```

---

### B2: Verification Scripts

**Files to create:**
- `src/lib/exercise/verification.ts`
- `tests/unit/exercise/verification.test.ts`

#### Tests to Write FIRST

Create `tests/unit/exercise/verification.test.ts`:

```typescript
// tests/unit/exercise/verification.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyWithScript } from '@/lib/exercise/verification';

// Mock the worker execution
vi.mock('@/lib/exercise/execution', () => ({
  executePythonCodeIsolated: vi.fn(),
}));

import { executePythonCodeIsolated } from '@/lib/exercise/execution';
const mockExecute = vi.mocked(executePythonCodeIsolated);

describe('verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyWithScript', () => {
    it('returns passed: true when all assertions pass', async () => {
      mockExecute.mockResolvedValue({ success: true, output: '', error: null });

      const result = await verifyWithScript(
        'def add(a, b): return a + b',
        'assert add(1, 2) == 3'
      );

      expect(result.passed).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns passed: false with error on assertion failure', async () => {
      mockExecute.mockResolvedValue({
        success: false,
        output: null,
        error: 'AssertionError: add(1, 2) should equal 3',
      });

      const result = await verifyWithScript(
        'def add(a, b): return a - b',  // Wrong implementation
        'assert add(1, 2) == 3, "add(1, 2) should equal 3"'
      );

      expect(result.passed).toBe(false);
      expect(result.error).toContain('AssertionError');
    });

    it('combines user code with verification script', async () => {
      mockExecute.mockResolvedValue({ success: true, output: '', error: null });

      await verifyWithScript(
        'def multiply(a, b): return a * b',
        'assert multiply(2, 3) == 6'
      );

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('def multiply(a, b): return a * b')
      );
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('assert multiply(2, 3) == 6')
      );
    });

    it('handles syntax errors in user code', async () => {
      mockExecute.mockResolvedValue({
        success: false,
        output: null,
        error: 'SyntaxError: invalid syntax',
      });

      const result = await verifyWithScript(
        'def add(a, b) return a + b',  // Missing colon
        'assert add(1, 2) == 3'
      );

      expect(result.passed).toBe(false);
      expect(result.error).toContain('SyntaxError');
    });

    it('handles runtime errors in user code', async () => {
      mockExecute.mockResolvedValue({
        success: false,
        output: null,
        error: 'NameError: name "undefined_var" is not defined',
      });

      const result = await verifyWithScript(
        'def broken(): return undefined_var',
        'broken()'
      );

      expect(result.passed).toBe(false);
      expect(result.error).toContain('NameError');
    });

    it('handles multiple assertions', async () => {
      mockExecute.mockResolvedValue({ success: true, output: '', error: null });

      const script = `
assert add(1, 2) == 3
assert add(-1, 1) == 0
assert add(0, 0) == 0
`;
      const result = await verifyWithScript('def add(a, b): return a + b', script);

      expect(result.passed).toBe(true);
      expect(result.infraAvailable).toBe(true);
    });
  });

  describe('infrastructure failure detection', () => {
    it('returns infraAvailable: false on worker crash', async () => {
      mockExecute.mockResolvedValue({
        success: false,
        output: null,
        error: 'Worker execution error',
      });

      const result = await verifyWithScript('def add(a, b): return a + b', 'assert add(1, 2) == 3');

      expect(result.passed).toBe(false);
      expect(result.infraAvailable).toBe(false);  // Should trigger fallback
    });

    it('returns infraAvailable: false on Pyodide not loaded', async () => {
      mockExecute.mockResolvedValue({
        success: false,
        output: null,
        error: 'Pyodide not loaded',
      });

      const result = await verifyWithScript('code', 'assert True');

      expect(result.passed).toBe(false);
      expect(result.infraAvailable).toBe(false);
    });

    it('returns infraAvailable: true on assertion failure (user error)', async () => {
      mockExecute.mockResolvedValue({
        success: false,
        output: null,
        error: 'AssertionError: Expected 3, got 2',
      });

      const result = await verifyWithScript('def add(a, b): return a - b', 'assert add(1, 2) == 3');

      expect(result.passed).toBe(false);
      expect(result.infraAvailable).toBe(true);  // Should NOT trigger fallback
    });

    it('returns infraAvailable: true on syntax error (user error)', async () => {
      mockExecute.mockResolvedValue({
        success: false,
        output: null,
        error: 'SyntaxError: invalid syntax',
      });

      const result = await verifyWithScript('def add(a, b) return a + b', 'assert True');

      expect(result.passed).toBe(false);
      expect(result.infraAvailable).toBe(true);  // Infra worked, user code is wrong
    });
  });
});
```

#### Implementation Steps

- [ ] Create verification test file
- [ ] Create `src/lib/exercise/verification.ts`:

```typescript
// src/lib/exercise/verification.ts
import { executePythonCodeIsolated, type ExecutionResult } from './execution';

export interface VerificationResult {
  passed: boolean;
  /** True if execution ran successfully (even if assertions failed) */
  infraAvailable: boolean;
  error?: string;
}

/** Error patterns that indicate infrastructure failure, not user code issues */
const INFRA_ERROR_PATTERNS = [
  'Worker execution error',
  'Worker not ready',
  'Pyodide not loaded',
  'Module not found',
  'NetworkError',
  'Failed to fetch',
];

/**
 * Check if an error indicates infrastructure failure vs user code error.
 */
function isInfraError(error: string | null): boolean {
  if (!error) return false;
  return INFRA_ERROR_PATTERNS.some(pattern =>
    error.includes(pattern)
  );
}

/**
 * Run verification script against user code in isolated worker.
 * Uses worker execution to avoid blocking UI during assertion checks.
 *
 * IMPORTANT: Returns infraAvailable: false for worker/Pyodide failures,
 * allowing the strategy router to fall back. User code errors (syntax,
 * assertion failures) return infraAvailable: true with passed: false.
 */
export async function verifyWithScript(
  userCode: string,
  verificationScript: string
): Promise<VerificationResult> {
  const fullCode = `${userCode}\n\n${verificationScript}`;

  let result: ExecutionResult;
  try {
    result = await executePythonCodeIsolated(fullCode);
  } catch (err) {
    // Worker crashed or network error - infrastructure failure
    return {
      passed: false,
      infraAvailable: false,
      error: err instanceof Error ? err.message : 'Worker execution failed',
    };
  }

  // Check for infrastructure errors vs user code errors
  if (!result.success && isInfraError(result.error)) {
    return {
      passed: false,
      infraAvailable: false,
      error: result.error ?? 'Infrastructure error',
    };
  }

  if (!result.success) {
    // User code error (syntax, assertion, runtime) - infra worked fine
    return {
      passed: false,
      infraAvailable: true,
      error: result.error ?? 'Verification failed',
    };
  }

  return { passed: true, infraAvailable: true };
}
```

- [ ] Export from index
- [ ] Run tests

#### Validation Criteria

```bash
pnpm test tests/unit/exercise/verification.test.ts
```

---

### B3: Strategy Router

**Files to create:**
- `src/lib/exercise/strategy-router.ts`
- `src/lib/exercise/strategy-defaults.ts`
- `tests/unit/exercise/strategy-router.test.ts`

#### Tests to Write FIRST

Create `tests/unit/exercise/strategy-router.test.ts`:

```typescript
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

describe('strategy-router', () => {
  describe('getDefaultStrategy', () => {
    it('returns exact for fill-in exercises', () => {
      const exercise = createExercise({ exerciseType: 'fill-in' });
      const config = getDefaultStrategy(exercise);
      expect(config.primary).toBe('exact');
    });

    it('returns exact for write exercises (default)', () => {
      const exercise = createExercise({ exerciseType: 'write' });
      const config = getDefaultStrategy(exercise);
      expect(config.primary).toBe('exact');
    });

    it('returns execution for predict exercises with fallback', () => {
      const exercise = createExercise({ exerciseType: 'predict' });
      const config = getDefaultStrategy(exercise);
      expect(config.primary).toBe('execution');
      expect(config.fallback).toBe('exact');
    });

    it('respects explicit grading_strategy override', () => {
      const exercise = createExercise({
        exerciseType: 'write',
        gradingStrategy: 'token',
      });
      const config = getDefaultStrategy(exercise);
      expect(config.primary).toBe('token');
    });

    it('uses execution when verification_script present', () => {
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

        const exercise = createExercise({ exerciseType: 'write' });
        const result = await gradeWithStrategy('x', exercise, null);

        expect(result.isCorrect).toBe(true);
        expect(result.infraAvailable).toBe(true);
        expect(result.fallbackUsed).toBe(false);
      });
    });

    describe('token strategy', () => {
      it('returns infraAvailable: false when Pyodide unavailable', async () => {
        const exercise = createExercise({
          exerciseType: 'write',
          gradingStrategy: 'token',
        });

        const result = await gradeWithStrategy('x', exercise, null);

        expect(result.infraAvailable).toBe(false);
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
        vi.mocked(verifyWithScript).mockResolvedValue({ passed: true });

        const exercise = createExercise({
          exerciseType: 'write',
          verificationScript: 'assert func(1) == 2',
        });

        const result = await gradeWithStrategy('def func(x): return x + 1', exercise, null);

        expect(result.isCorrect).toBe(true);
        expect(result.infraAvailable).toBe(true);
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
          gradingStrategy: 'token',  // Requires Pyodide
        });

        // No Pyodide - should fallback
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

        // Should NOT fallback - token strategy ran successfully, answer was just wrong
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

        // Pass null Pyodide - should work fine for exact strategy
        const result = await gradeWithStrategy('x', exercise, null);

        expect(result.isCorrect).toBe(true);
        // Token compare should NOT have been called
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
```

#### Important: GradingResult Type Mapping

The strategy router defines `StrategyResult` with different fields than the existing `GradingResult` in `types.ts`. The existing `GradingResult` includes:

```typescript
// Existing GradingResult (must be preserved for UI compatibility)
interface GradingResult {
  isCorrect: boolean;
  usedTargetConstruct: boolean | null;
  coachingFeedback: string | null;
  gradingMethod: GradingMethod;
  normalizedUserAnswer: string;
  normalizedExpectedAnswer: string;
  matchedAlternative: string | null;
}
```

**Solution:** The strategy router returns an internal `StrategyResult`. The orchestrator (`gradeAnswerAsync`) maps this to the public `GradingResult`:

```typescript
// In gradeAnswerAsync - map StrategyResult to GradingResult
const strategyResult = await gradeWithStrategy(userAnswer, exercise, pyodide);

const result: GradingResult = {
  isCorrect: strategyResult.isCorrect,
  usedTargetConstruct: /* run construct check if correct */,
  coachingFeedback: /* derive from construct check */,
  gradingMethod: mapStrategyToMethod(strategyResult, config.fallbackUsed),
  normalizedUserAnswer: userAnswer.trim(),
  normalizedExpectedAnswer: exercise.expectedAnswer.trim(),
  matchedAlternative: strategyResult.matchedAlternative,
};
```

#### Implementation Steps

- [ ] Create strategy router test file
- [ ] Create `src/lib/exercise/strategy-defaults.ts`:

```typescript
// src/lib/exercise/strategy-defaults.ts
import type { Exercise } from '@/lib/types';
import type { GradingStrategy } from './types';

export interface StrategyConfig {
  primary: GradingStrategy;
  fallback?: GradingStrategy;
}

const DEFAULT_STRATEGIES: Record<string, StrategyConfig> = {
  'fill-in': { primary: 'exact' },
  'predict': { primary: 'execution', fallback: 'exact' },
  'write': { primary: 'exact' },
};

export function getDefaultStrategy(exercise: Exercise): StrategyConfig {
  // Explicit override takes precedence
  if (exercise.gradingStrategy) {
    return { primary: exercise.gradingStrategy };
  }

  // Verification script implies execution
  if (exercise.verificationScript) {
    return { primary: 'execution', fallback: 'token' };
  }

  // Legacy flag support
  if (exercise.verifyByExecution) {
    return { primary: 'execution', fallback: 'token' };
  }

  // Type-based defaults
  return DEFAULT_STRATEGIES[exercise.exerciseType] ?? { primary: 'exact' };
}
```

- [ ] Create `src/lib/exercise/strategy-router.ts`:

```typescript
// src/lib/exercise/strategy-router.ts
import type { Exercise } from '@/lib/types';
import type { PyodideInterface } from '@/lib/context/PyodideContext';
import type { GradingStrategy } from './types';
import { getDefaultStrategy } from './strategy-defaults';
import { checkAnswerWithAlternatives, checkFillInAnswer, checkPredictAnswer } from './matching';
import { compareByTokens } from './token-compare';
import { verifyWithScript } from './verification';
import { verifyPredictAnswer, verifyWriteAnswer } from './execution';

export interface StrategyResult {
  isCorrect: boolean;
  infraAvailable: boolean;
  matchedAlternative: string | null;
  error?: string;
}

export interface GradingResult extends StrategyResult {
  fallbackUsed: boolean;
  fallbackReason?: string;
}

export async function gradeWithStrategy(
  userAnswer: string,
  exercise: Exercise,
  pyodide: PyodideInterface | null
): Promise<GradingResult> {
  const config = getDefaultStrategy(exercise);

  // Try primary strategy
  const result = await executeStrategy(config.primary, userAnswer, exercise, pyodide);

  // Only fall back if infrastructure was unavailable
  if (!result.infraAvailable && config.fallback) {
    console.warn(`Strategy '${config.primary}' unavailable, falling back to '${config.fallback}'`);
    const fallbackResult = await executeStrategy(config.fallback, userAnswer, exercise, pyodide);
    return {
      ...fallbackResult,
      fallbackUsed: true,
      fallbackReason: 'infra_unavailable',
    };
  }

  return { ...result, fallbackUsed: false };
}

async function executeStrategy(
  strategy: GradingStrategy,
  userAnswer: string,
  exercise: Exercise,
  pyodide: PyodideInterface | null
): Promise<StrategyResult> {
  switch (strategy) {
    case 'exact':
      return executeExactStrategy(userAnswer, exercise);

    case 'token':
      if (!pyodide) {
        return { isCorrect: false, infraAvailable: false, matchedAlternative: null };
      }
      return executeTokenStrategy(pyodide, userAnswer, exercise);

    case 'execution':
      return executeExecutionStrategy(userAnswer, exercise, pyodide);

    default:
      return { isCorrect: false, infraAvailable: false, matchedAlternative: null };
  }
}

function executeExactStrategy(userAnswer: string, exercise: Exercise): StrategyResult {
  const { exerciseType, expectedAnswer, acceptedSolutions } = exercise;

  let isCorrect = false;
  let matchedAlternative: string | null = null;

  switch (exerciseType) {
    case 'fill-in':
      isCorrect = checkFillInAnswer(userAnswer, expectedAnswer, acceptedSolutions);
      break;

    case 'predict':
      isCorrect = checkPredictAnswer(userAnswer, expectedAnswer, acceptedSolutions);
      break;

    case 'write':
    default: {
      const result = checkAnswerWithAlternatives(userAnswer, expectedAnswer, acceptedSolutions);
      isCorrect = result.isCorrect;
      matchedAlternative = result.matchedAlternative;
    }
  }

  return { isCorrect, infraAvailable: true, matchedAlternative };
}

async function executeTokenStrategy(
  pyodide: PyodideInterface,
  userAnswer: string,
  exercise: Exercise
): Promise<StrategyResult> {
  try {
    const result = await compareByTokens(
      pyodide,
      userAnswer,
      exercise.expectedAnswer,
      exercise.acceptedSolutions
    );
    return {
      isCorrect: result.match,
      infraAvailable: true,
      matchedAlternative: result.matchedAlternative,
    };
  } catch (error) {
    return {
      isCorrect: false,
      infraAvailable: false,
      matchedAlternative: null,
      error: error instanceof Error ? error.message : 'Token comparison failed',
    };
  }
}

async function executeExecutionStrategy(
  userAnswer: string,
  exercise: Exercise,
  pyodide: PyodideInterface | null
): Promise<StrategyResult> {
  // Verification scripts run in worker (no Pyodide needed)
  if (exercise.verificationScript) {
    try {
      const result = await verifyWithScript(userAnswer, exercise.verificationScript);
      // IMPORTANT: Use infraAvailable from verifyWithScript result
      // This distinguishes worker/Pyodide failures from user code errors
      return {
        isCorrect: result.passed,
        infraAvailable: result.infraAvailable,  // Propagate from verification
        matchedAlternative: null,
        error: result.error,
      };
    } catch (error) {
      // Unexpected error (shouldn't happen - verifyWithScript catches internally)
      return {
        isCorrect: false,
        infraAvailable: false,
        matchedAlternative: null,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  // Output-based execution requires Pyodide
  if (!pyodide) {
    return { isCorrect: false, infraAvailable: false, matchedAlternative: null };
  }

  try {
    let isCorrect = false;

    if (exercise.exerciseType === 'predict' && exercise.code) {
      isCorrect = await verifyPredictAnswer(pyodide, exercise.code, userAnswer);
    } else if (exercise.verifyByExecution) {
      isCorrect = await verifyWriteAnswer(pyodide, userAnswer, exercise.expectedAnswer);
    }

    return { isCorrect, infraAvailable: true, matchedAlternative: null };
  } catch (error) {
    return {
      isCorrect: false,
      infraAvailable: false,
      matchedAlternative: null,
      error: error instanceof Error ? error.message : 'Execution failed',
    };
  }
}
```

- [ ] Export from index
- [ ] Run tests

#### Validation Criteria

```bash
pnpm test tests/unit/exercise/strategy-router.test.ts
pnpm typecheck
```

---

### B4: Execution Improvements

**Files to modify:**
- `src/lib/exercise/execution.ts`
- `tests/unit/exercise/execution.test.ts`

#### Tests to Write FIRST

Add to `tests/unit/exercise/execution.test.ts`:

```typescript
describe('output normalization options', () => {
  it('uses strict mode by default', async () => {
    const result = await executePythonCode(mockPyodide, 'print("  hello  ")');
    // Default: trim whitespace, remove trailing newlines
    expect(normalizeOutput(result.output!, { mode: 'strict' })).toBe('hello');
  });

  it('supports ignore_whitespace mode', async () => {
    const result = await executePythonCode(mockPyodide, 'print("hello world")');
    expect(normalizeOutput(result.output!, { mode: 'ignore_whitespace' })).toBe('helloworld');
  });
});

describe('error message parsing', () => {
  it('extracts assertion message', async () => {
    const error = 'AssertionError: add(1, 2) should equal 3';
    const parsed = parseExecutionError(error);
    expect(parsed.type).toBe('AssertionError');
    expect(parsed.message).toBe('add(1, 2) should equal 3');
  });

  it('handles timeout errors', async () => {
    const error = 'Execution timeout';
    const parsed = parseExecutionError(error);
    expect(parsed.type).toBe('Timeout');
  });
});
```

#### Implementation Steps

> **Note:** `normalizeOutput` is currently private in `execution.ts`. These tests require either:
> 1. Exporting the functions (preferred), or
> 2. Testing through public APIs like `verifyPredictAnswer`

- [ ] Add execution improvement tests
- [ ] **Export** `normalizeOutput` and add options:

```typescript
export interface NormalizeOptions {
  mode: 'strict' | 'trim' | 'ignore_whitespace';
}

export function normalizeOutput(output: string, options: NormalizeOptions = { mode: 'strict' }): string {
  switch (options.mode) {
    case 'strict':
      return output.trim().replace(/\n+$/, '');
    case 'trim':
      return output.trim();
    case 'ignore_whitespace':
      return output.replace(/\s+/g, '');
    default:
      return output.trim();
  }
}
```

- [ ] Add `parseExecutionError` helper:

```typescript
export interface ParsedError {
  type: string;
  message: string;
}

export function parseExecutionError(error: string): ParsedError {
  if (error.includes('timeout') || error.includes('Timeout')) {
    return { type: 'Timeout', message: 'Code execution timed out' };
  }

  const match = error.match(/^(\w+Error): (.+)$/);
  if (match) {
    return { type: match[1], message: match[2] };
  }

  return { type: 'Unknown', message: error };
}
```

- [ ] Run tests

#### Validation Criteria

```bash
pnpm test tests/unit/exercise/execution.test.ts
```

---

## Phase 3: Content & Migration (Track C)

**Goal:** Add YAML fields, validation tooling, content audit
**Effort:** Medium (4-8 hours)
**Dependencies:** Phase 2 complete (B3 strategy router must exist)

### C1: grading_strategy YAML Field

**Files to modify:**
- `src/lib/exercise/yaml-types.ts`
- `src/lib/types/app.types.ts`
- `src/lib/supabase/mappers.ts`
- `scripts/validate-exercises.ts`
- `scripts/import-exercises.ts` - **CRITICAL: Must map new fields to Supabase**

#### Tests to Write FIRST

Add to `tests/unit/exercise/yaml-validation.test.ts`:

> **Note:** The actual validators are `validateYamlExercise` (single exercise) and `validateYamlFile` (full file). YAML files are `YamlExerciseFile` objects with `{ language, category, exercises: [...] }` structure, not bare arrays.

```typescript
import { validateYamlExercise, validateYamlFile } from '@/lib/exercise/yaml-validation';
import type { YamlExercise, YamlExerciseFile } from '@/lib/exercise/yaml-types';

describe('grading_strategy field', () => {
  // Helper to create a minimal valid exercise
  const createExercise = (overrides: Partial<YamlExercise>): YamlExercise => ({
    slug: 'test',
    title: 'Test',
    prompt: 'Test prompt',
    expected_answer: 'x',
    hints: ['hint'],
    concept: 'foundations',
    subconcept: 'print',
    level: 'intro',
    prereqs: [],
    type: 'write',
    pattern: 'output',
    objective: 'Test objective',
    ...overrides,
  });

  it('accepts valid grading_strategy values', () => {
    const exercise = createExercise({ grading_strategy: 'token' });
    const errors = validateYamlExercise(exercise, 'test.yaml');
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid grading_strategy values', () => {
    const exercise = createExercise({ grading_strategy: 'invalid' as any });
    const errors = validateYamlExercise(exercise, 'test.yaml');
    expect(errors.some(e => e.field === 'grading_strategy')).toBe(true);
  });

  it('accepts verification_script with execution strategy', () => {
    const exercise = createExercise({
      grading_strategy: 'execution',
      verification_script: 'assert func(1) == 2',
    });
    const errors = validateYamlExercise(exercise, 'test.yaml');
    expect(errors).toHaveLength(0);
  });

  it('warns when verification_script used without execution strategy', () => {
    const exercise = createExercise({
      grading_strategy: 'token',
      verification_script: 'assert func(1) == 2',
    });
    const errors = validateYamlExercise(exercise, 'test.yaml');
    expect(errors.some(e => e.message.includes('verification_script'))).toBe(true);
  });
});
```

#### Implementation Steps

- [ ] Add YAML validation tests
- [ ] Update `yaml-types.ts`:

```typescript
export interface YamlExercise {
  // ... existing fields ...

  /** Grading strategy override (optional) */
  grading_strategy?: 'exact' | 'token' | 'ast' | 'execution';

  /** Verification script for execution strategy (optional) */
  verification_script?: string;
}
```

- [ ] Update `app.types.ts`:

```typescript
export interface Exercise {
  // ... existing fields ...

  gradingStrategy?: GradingStrategy;
  verificationScript?: string;
}
```

- [ ] Update `mappers.ts` to map new fields
- [ ] Update validation script (`scripts/validate-exercises.ts`) to validate new fields
- [ ] **Update `scripts/import-exercises.ts`** to persist new fields to Supabase:

```typescript
// In scripts/import-exercises.ts, add to the exercise mapping (~line 160):
const exerciseData = {
  // ... existing fields ...
  grading_strategy: exercise.grading_strategy ?? null,
  verification_script: exercise.verification_script ?? null,
};
```

- [ ] Run tests

#### Validation Criteria

```bash
pnpm validate:exercises
pnpm typecheck
pnpm db:import-exercises  # Verify import still works
```

---

### C2: Strategy Defaults Documentation

- [ ] Update `CLAUDE.md` with strategy documentation
- [ ] Add section to Obsidian `Architecture.md`

---

### C3: Content Audit Script

**Files to create:**
- `scripts/audit-grading.ts`

#### Implementation Steps

- [ ] Create audit script:

```typescript
// scripts/audit-grading.ts
// Analyzes exercises and recommends grading strategies

import { glob } from 'glob';
import { readFile } from 'fs/promises';
import yaml from 'yaml';
import type { YamlExerciseFile } from '../src/lib/exercise/yaml-types';

interface AuditResult {
  slug: string;
  currentStrategy: string | null;
  recommendedStrategy: string;
  reason: string;
  hasAcceptedSolutions: boolean;
  acceptedSolutionsCount: number;
}

async function auditExercises() {
  const files = await glob('exercises/python/*.yaml');
  const results: AuditResult[] = [];

  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    // IMPORTANT: YAML files are YamlExerciseFile objects, not arrays
    const parsed = yaml.parse(content) as YamlExerciseFile;

    for (const ex of parsed.exercises) {
      const result = analyzeExercise(ex);
      results.push(result);
    }
  }

  // Generate report
  console.log('\n=== Grading Strategy Audit ===\n');

  const needsToken = results.filter(r => r.recommendedStrategy === 'token' && !r.currentStrategy);
  console.log(`Exercises needing token strategy: ${needsToken.length}`);
  for (const r of needsToken.slice(0, 10)) {
    console.log(`  - ${r.slug}: ${r.reason}`);
  }

  const manyAlternatives = results.filter(r => r.acceptedSolutionsCount > 5);
  console.log(`\nExercises with 5+ alternatives (consider token): ${manyAlternatives.length}`);
  for (const r of manyAlternatives) {
    console.log(`  - ${r.slug}: ${r.acceptedSolutionsCount} alternatives`);
  }
}

function analyzeExercise(ex: any): AuditResult {
  const acceptedCount = ex.accepted_solutions?.length ?? 0;

  let recommended = 'exact';
  let reason = 'Default for type';

  if (ex.type === 'predict') {
    recommended = 'execution';
    reason = 'Predict exercises should use execution';
  } else if (acceptedCount > 5) {
    recommended = 'token';
    reason = `High alternative count (${acceptedCount}) suggests semantic matching needed`;
  } else if (ex.expected_answer?.includes('[') && ex.expected_answer?.includes(':')) {
    recommended = 'token';
    reason = 'Contains slice notation - semantic variations likely';
  }

  return {
    slug: ex.slug,
    currentStrategy: ex.grading_strategy ?? null,
    recommendedStrategy: recommended,
    reason,
    hasAcceptedSolutions: acceptedCount > 0,
    acceptedSolutionsCount: acceptedCount,
  };
}

auditExercises();
```

- [ ] Add to `package.json`: `"audit:grading": "tsx scripts/audit-grading.ts"`
- [ ] Run audit and document findings

#### Validation Criteria

```bash
pnpm audit:grading
```

---

### C4: Validation Tooling

**Files to create:**
- `scripts/validate-strategies.ts`

#### Implementation Steps

- [ ] Create validation script:

```typescript
// scripts/validate-strategies.ts
// CI validation for grading strategies

import { glob } from 'glob';
import { readFile } from 'fs/promises';
import yaml from 'yaml';
import type { YamlExerciseFile } from '../src/lib/exercise/yaml-types';

const errors: string[] = [];
const VALID_STRATEGIES = ['exact', 'token', 'ast', 'execution'];

async function validateStrategies() {
  const files = await glob('exercises/python/*.yaml');

  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    // IMPORTANT: YAML files are YamlExerciseFile objects, not arrays
    const parsed = yaml.parse(content) as YamlExerciseFile;

    for (const ex of parsed.exercises) {
      // Rule 1: verification_script only with execution strategy
      if (ex.verification_script && ex.grading_strategy && ex.grading_strategy !== 'execution') {
        errors.push(`${ex.slug}: verification_script requires grading_strategy: execution`);
      }

      // Rule 2: Can't have both verifyByExecution and grading_strategy
      if (ex.verify_by_execution && ex.grading_strategy) {
        errors.push(`${ex.slug}: Cannot use both verify_by_execution and grading_strategy`);
      }

      // Rule 3: Verification scripts should be valid Python (basic check)
      if (ex.verification_script) {
        if (!ex.verification_script.includes('assert')) {
          errors.push(`${ex.slug}: verification_script should contain assertions`);
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error('Validation errors:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('All strategy validations passed!');
}

validateStrategies();
```

- [ ] Add to `package.json`: `"validate:strategies": "tsx scripts/validate-strategies.ts"`
- [ ] Add to CI pipeline

#### Validation Criteria

```bash
pnpm validate:strategies
```

---

## Database Migration

**File to create:**
- `supabase/migrations/YYYYMMDD_grading_strategies.sql`

```sql
-- Add grading strategy fields to exercises table
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS grading_strategy TEXT,
ADD COLUMN IF NOT EXISTS verification_script TEXT;

-- Add constraint for valid strategies
ALTER TABLE exercises
ADD CONSTRAINT valid_grading_strategy
CHECK (grading_strategy IS NULL OR grading_strategy IN ('exact', 'token', 'ast', 'execution'));

-- Optional: Telemetry table for future analytics
CREATE TABLE IF NOT EXISTS grading_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_slug TEXT NOT NULL,
  strategy TEXT NOT NULL,
  was_correct BOOLEAN NOT NULL,
  fallback_used BOOLEAN DEFAULT FALSE,
  fallback_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_grading_telemetry_slug ON grading_telemetry(exercise_slug);
CREATE INDEX IF NOT EXISTS idx_grading_telemetry_created ON grading_telemetry(created_at);
```

---

## Deprecation Plan

| Phase | Action | Affected Code |
|-------|--------|---------------|
| Phase 1 | Keep signatures intact | All existing code works |
| Phase 2 | `gradeAnswer()` delegates internally to router | Internal refactor only |
| Phase 2 | Mark `checkAnswer()` as internal-only | Add `@internal` JSDoc |
| Phase 3 | Remove `verifyByExecution` after all YAML migrated | ~6 months after Phase 3 |
| Phase 3 | Remove unused legacy helpers | After verification |

**Backward compatibility guarantee:** Existing exercises with `accepted_solutions` continue to work unchanged. New features are additive.

---

## Definition of Done

### Phase 0 Complete When:
- [ ] `grading-characterization.test.ts` exists with 10+ tests
- [ ] All tests pass: `pnpm test tests/unit/exercise/grading-characterization.test.ts`
- [ ] Known bugs documented in test comments

### Phase 1 Complete When:
- [ ] String literal tests pass: `print("a,b")` preserved
- [ ] Construct detection tests pass: no false positives in strings/comments
- [ ] Telemetry module exists with tests
- [ ] Full test suite passes: `pnpm test`
- [ ] No type errors: `pnpm typecheck`

### Phase 2 Complete When:
- [ ] Token comparison module exists with tests
- [ ] Verification module exists with tests
- [ ] Strategy router exists with tests
- [ ] Integration test: `gradeWithStrategy()` routes correctly
- [ ] Pyodide boundary enforced: exact strategy works without Pyodide
- [ ] All tests pass: `pnpm test`

### Phase 3 Complete When:
- [ ] YAML schema updated with new fields
- [ ] Validation script exists: `pnpm validate:strategies`
- [ ] Audit script exists: `pnpm audit:grading`
- [ ] Database migration applied
- [ ] At least 10 exercises migrated with `grading_strategy: token`
- [ ] Documentation updated

### Full Implementation Complete When:
- [ ] All phases complete
- [ ] CI passes: `pnpm lint && pnpm typecheck && pnpm test`
- [ ] No regressions in existing tests
- [ ] Obsidian docs updated

---

## Verification Commands

```bash
# Phase 0
pnpm test tests/unit/exercise/grading-characterization.test.ts

# Phase 1
pnpm test tests/unit/exercise/matching.test.ts
pnpm test tests/unit/exercise/construct-check.test.ts
pnpm test tests/unit/exercise/telemetry.test.ts

# Phase 2
pnpm test tests/unit/exercise/token-compare.test.ts
pnpm test tests/unit/exercise/verification.test.ts
pnpm test tests/unit/exercise/strategy-router.test.ts

# Phase 3
pnpm validate:exercises
pnpm validate:strategies
pnpm audit:grading

# Full validation
pnpm lint && pnpm typecheck && pnpm test
```

---

## Risk Mitigations

| Risk | Mitigation | Verification |
|------|------------|--------------|
| TDD integration risk | Characterization tests first | Phase 0 complete before Phase 1 |
| Legacy cleanup risk | Deprecation plan with timeline | Mark internal, don't delete |
| Pyodide loading risk | Explicit strategy opt-in | Test exact strategy without Pyodide |
| Content migration risk | Audit script identifies candidates | Run audit before migration |
| Telemetry risk | Console-only in Phase 1 | No production analytics initially |

---

## Open Questions Resolved

### Q: Should "semantic equivalence" fixes require AST normalization, or should the plan narrow claims to whitespace/comment tolerance only?

**A: Both.** Token comparison (Phase 2) handles whitespace/comment tolerance. AST normalization (Phase 4) handles semantic equivalence.

- **Phase 2 (Token):** Whitespace tolerance, comment stripping only
- **Phase 4 (AST):** Full semantic equivalence via:
  - **Slice normalization:** `[:3]` → `[0:3]` → `[0:3:1]` all equivalent
  - **Local alpha-rename:** `for i in x` ≡ `for j in x` (but globals/builtins preserved)
  - **Docstring stripping:** Optional, configurable

**Implementation:** Uses Python's built-in `ast` module via Pyodide (not tree-sitter) for simplicity. The `Canonicalize` AST visitor normalizes code before `ast.dump()` comparison. See Phase 4 section for full implementation details.

### Q: Should verification-script failures from worker/Pyodide init be treated as infra failures (fallback) rather than incorrect answers?

**A: Yes, infrastructure failures should trigger fallback.** The implementation has been updated to:
- Add `infraAvailable` field to `VerificationResult`
- Detect infrastructure errors via pattern matching (e.g., "Worker execution error", "Pyodide not loaded")
- Return `infraAvailable: false` for infra failures, allowing strategy router to fall back
- Return `infraAvailable: true` for user code errors (syntax, assertion, runtime), preventing fallback

Error patterns that indicate infrastructure failure:
- "Worker execution error" / "Worker not ready"
- "Pyodide not loaded"
- "NetworkError" / "Failed to fetch"
- "Module not found"

Error patterns that indicate user code error (no fallback):
- "SyntaxError" / "IndentationError"
- "AssertionError"
- "NameError" / "TypeError" / "ValueError"
- Any Python runtime exception

---

## Phase 4: AST Normalization (Future)

**Goal:** Solve semantic equivalence (failure modes #2 and #3) via AST comparison
**Effort:** Medium-Large (2-3 days)
**Dependencies:** Phase 2 complete (strategy router exists)
**Status:** Planned - to be implemented after Phases 0-3

### Codex Proposal Evaluation

**What works well:**

| Element | Assessment |
|---------|------------|
| Flow mapping (ExerciseCard → gradeAnswerAsync → router → ast-compare) | Correct - matches our architecture |
| Strategy router integration (add 'ast' branch) | Clean - parallel to token/execution |
| Pyodide boundary (same as token/execution) | Correct - maintains consistency |
| Alpha-rename locals only (not globals/builtins) | Smart scoping - avoids breaking code |
| Slice normalization with config gate | Directly solves failure mode #2 |
| Fallback on infra-unavailable only | Matches our established pattern |
| `AstCompareOptions` with flags | Flexible - different exercises need different rules |

**Concerns addressed:**

| Concern | Resolution |
|---------|------------|
| `GradingMethod` type only has 3 values | Extend to include `'ast'`, `'ast-fallback'`, `'token'`, `'token-fallback'` |
| Python normalizer complexity | Comprehensive tests required; start with simple cases |
| `exec` vs `eval` mode | Try `exec` first, fall back to `eval` for expression-only answers |
| Existing `usedAstMatch` in `AnswerResult` | **Bonus:** This field already exists but is unused - AST strategy will use it |
| Pyodide preload missing AST | Add `gradingStrategy === 'ast'` to preload check |

### Architecture Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              STRATEGY ROUTER                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐                 │
│  │  exact   │  │  token   │  │   ast    │  │  execution  │                 │
│  │ (string) │  │(Pyodide) │  │(Pyodide) │  │  (verify)   │                 │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘                 │
│       ↓              ↓             ↓              ↓                         │
│   matching.ts  token-compare  ast-compare    verification                   │
│                     .ts          .ts            .ts                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### A1: Type Updates

**Files to modify:**
- `src/lib/exercise/types.ts`

```typescript
// Update GradingMethod to include all strategies
export type GradingMethod =
  | 'string'
  | 'token'
  | 'token-fallback'
  | 'ast'
  | 'ast-fallback'
  | 'execution'
  | 'execution-fallback';
```

### A2: AST Compare Module

**Files to create:**
- `src/lib/exercise/ast-compare.ts`
- `tests/unit/exercise/ast-compare.test.ts`

#### TypeScript API

```typescript
// src/lib/exercise/ast-compare.ts
import type { PyodideInterface } from '@/lib/context/PyodideContext';

export interface AstCompareOptions {
  /** Parse mode: 'auto' tries exec then eval */
  mode?: 'auto' | 'exec' | 'eval';
  /** Alpha-rename local variables (function args, loop targets, comprehension vars) */
  renameLocals?: boolean;
  /** Normalize slices: [:3] → [0:3:1], [0:3] → [0:3:1] */
  normalizeSlices?: boolean;
  /** Strip docstrings from functions/classes/modules */
  ignoreDocstrings?: boolean;
}

export interface AstCompareResult {
  match: boolean;
  matchedAlternative: string | null;
  /** True if infra worked (Pyodide loaded, code parsed). False = fallback eligible */
  infraAvailable: boolean;
  error?: string;
}

const DEFAULT_OPTIONS: AstCompareOptions = {
  mode: 'auto',
  renameLocals: true,
  normalizeSlices: true,
  ignoreDocstrings: true,
};

/**
 * Compare user answer to expected answer(s) via AST normalization.
 * Uses Pyodide to parse Python code and normalize AST structure.
 */
export async function compareByAst(
  pyodide: PyodideInterface,
  userAnswer: string,
  expectedAnswer: string,
  acceptedSolutions: string[],
  options: AstCompareOptions = {}
): Promise<AstCompareResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Initialize normalizer in Pyodide (cached after first call)
    await initAstNormalizer(pyodide);

    // Normalize user answer
    const userNorm = await normalizeAst(pyodide, userAnswer, opts);
    if (userNorm === null) {
      // Parse failed - user code is syntactically invalid
      return { match: false, matchedAlternative: null, infraAvailable: true };
    }

    // Compare against expected answer
    const expectedNorm = await normalizeAst(pyodide, expectedAnswer, opts);
    if (expectedNorm !== null && userNorm === expectedNorm) {
      return { match: true, matchedAlternative: null, infraAvailable: true };
    }

    // Compare against alternatives
    for (const alt of acceptedSolutions) {
      const altNorm = await normalizeAst(pyodide, alt, opts);
      if (altNorm !== null && userNorm === altNorm) {
        return { match: true, matchedAlternative: alt, infraAvailable: true };
      }
    }

    return { match: false, matchedAlternative: null, infraAvailable: true };
  } catch (error) {
    // Pyodide/infra error - eligible for fallback
    return {
      match: false,
      matchedAlternative: null,
      infraAvailable: false,
      error: error instanceof Error ? error.message : 'AST comparison failed',
    };
  }
}
```

#### Python Normalizer (Pyodide)

```python
# Injected into Pyodide via initAstNormalizer()
import ast
import json

class Canonicalize(ast.NodeTransformer):
    """Normalize AST for comparison: alpha-rename locals, normalize slices."""

    def __init__(self, opts):
        self.opts = opts
        self.scopes = []  # Stack of {original_name: canonical_name}

    def _push_scope(self):
        self.scopes.append({})

    def _pop_scope(self):
        self.scopes.pop()

    def _bind_local(self, name):
        """Bind a local name to a canonical form (v0, v1, ...)"""
        if not self.opts.get("renameLocals", True):
            return name
        scope = self.scopes[-1]
        if name not in scope:
            scope[name] = f"_v{len(scope)}"
        return scope[name]

    def _lookup(self, name):
        """Look up a name in scope stack; return canonical or original"""
        for scope in reversed(self.scopes):
            if name in scope:
                return scope[name]
        return name  # Not a local - keep original (global/builtin)

    # === Scope-creating nodes ===

    def visit_FunctionDef(self, node):
        self._push_scope()
        # Bind parameters
        for arg in node.args.args:
            arg.arg = self._bind_local(arg.arg)
        for arg in node.args.posonlyargs:
            arg.arg = self._bind_local(arg.arg)
        for arg in node.args.kwonlyargs:
            arg.arg = self._bind_local(arg.arg)
        if node.args.vararg:
            node.args.vararg.arg = self._bind_local(node.args.vararg.arg)
        if node.args.kwarg:
            node.args.kwarg.arg = self._bind_local(node.args.kwarg.arg)
        # Visit body
        node.body = [self.visit(n) for n in node.body]
        self._pop_scope()
        return node

    def visit_Lambda(self, node):
        self._push_scope()
        for arg in node.args.args:
            arg.arg = self._bind_local(arg.arg)
        node.body = self.visit(node.body)
        self._pop_scope()
        return node

    def visit_comprehension(self, node):
        # Bind loop target
        node.target = self._visit_target(node.target)
        node.iter = self.visit(node.iter)
        node.ifs = [self.visit(i) for i in node.ifs]
        return node

    def _visit_target(self, target):
        """Bind assignment targets (for loop, comprehension, with, except)"""
        if isinstance(target, ast.Name):
            target.id = self._bind_local(target.id)
        elif isinstance(target, ast.Tuple):
            target.elts = [self._visit_target(e) for e in target.elts]
        return target

    def visit_For(self, node):
        node.target = self._visit_target(node.target)
        node.iter = self.visit(node.iter)
        node.body = [self.visit(n) for n in node.body]
        node.orelse = [self.visit(n) for n in node.orelse]
        return node

    # === Name lookup ===

    def visit_Name(self, node):
        node.id = self._lookup(node.id)
        return node

    # === Slice normalization ===

    def visit_Slice(self, node):
        if not self.opts.get("normalizeSlices", True):
            return self.generic_visit(node)

        # Normalize lower: 0 → None (canonical form is omitted)
        if isinstance(node.lower, ast.Constant) and node.lower.value == 0:
            node.lower = None
        elif node.lower:
            node.lower = self.visit(node.lower)

        # Visit upper
        if node.upper:
            node.upper = self.visit(node.upper)

        # Normalize step: 1 → None
        if isinstance(node.step, ast.Constant) and node.step.value == 1:
            node.step = None
        elif node.step:
            node.step = self.visit(node.step)

        return node

    # === Docstring removal ===

    def visit_Module(self, node):
        if self.opts.get("ignoreDocstrings", True):
            node.body = self._strip_docstring(node.body)
        return self.generic_visit(node)

    def _strip_docstring(self, body):
        if body and isinstance(body[0], ast.Expr) and isinstance(body[0].value, ast.Constant) and isinstance(body[0].value.value, str):
            return body[1:]
        return body


def normalize_code(code, opts, mode="auto"):
    """Parse and normalize Python code. Returns canonical AST dump or None on failure."""
    try:
        # Try exec mode first (statements)
        tree = ast.parse(code, mode="exec")
    except SyntaxError:
        if mode == "auto":
            try:
                # Fall back to eval mode (expression only)
                tree = ast.parse(code, mode="eval")
            except SyntaxError:
                return None
        else:
            return None

    # Normalize
    normalizer = Canonicalize(opts)
    tree = normalizer.visit(tree)

    # Dump without location info
    return ast.dump(tree, include_attributes=False)
```

### A3: Strategy Router Update

```typescript
// Add to strategy-router.ts executeStrategy switch

case 'ast':
  if (!pyodide) {
    return { isCorrect: false, infraAvailable: false, matchedAlternative: null };
  }
  return executeAstStrategy(pyodide, userAnswer, exercise);

// New function
async function executeAstStrategy(
  pyodide: PyodideInterface,
  userAnswer: string,
  exercise: Exercise
): Promise<StrategyResult> {
  const result = await compareByAst(
    pyodide,
    userAnswer,
    exercise.expectedAnswer,
    exercise.acceptedSolutions,
    {
      renameLocals: true,
      normalizeSlices: true,
      ignoreDocstrings: true,
    }
  );

  return {
    isCorrect: result.match,
    infraAvailable: result.infraAvailable,
    matchedAlternative: result.matchedAlternative,
    error: result.error,
  };
}
```

### A4: Pyodide Preload Update

```typescript
// In useConceptSession.ts, update needsPyodide check:
const needsPyodide = cards.some((card) => {
  if (card.type === 'teaching') return false;
  const exercise = card.exercise;
  return (
    exercise.exerciseType === 'predict' ||
    exercise.verifyByExecution === true ||
    exercise.gradingStrategy === 'token' ||
    exercise.gradingStrategy === 'ast'  // ADD THIS
  );
});
```

### A5: Tests

#### Unit Tests for AST Normalization

```typescript
// tests/unit/exercise/ast-compare.test.ts
describe('ast-compare', () => {
  describe('slice normalization', () => {
    it('treats items[:3] and items[0:3] as equivalent', async () => {
      const result = await compareByAst(
        mockPyodide,
        'items[:3]',
        'items[0:3]',
        []
      );
      expect(result.match).toBe(true);
    });

    it('treats items[0:3] and items[0:3:1] as equivalent', async () => {
      const result = await compareByAst(
        mockPyodide,
        'items[0:3]',
        'items[0:3:1]',
        []
      );
      expect(result.match).toBe(true);
    });
  });

  describe('local variable renaming', () => {
    it('treats "for i in x" and "for j in x" as equivalent', async () => {
      const result = await compareByAst(
        mockPyodide,
        'for i in range(10): print(i)',
        'for j in range(10): print(j)',
        []
      );
      expect(result.match).toBe(true);
    });

    it('does NOT rename globals/builtins', async () => {
      // print and range should NOT be renamed
      const result = await compareByAst(
        mockPyodide,
        'print(range(10))',
        'foo(bar(10))',  // Different names
        []
      );
      expect(result.match).toBe(false);
    });
  });

  describe('expression mode fallback', () => {
    it('handles expression-only answers', async () => {
      const result = await compareByAst(
        mockPyodide,
        'x + 1',
        'x + 1',
        []
      );
      expect(result.match).toBe(true);
    });
  });

  describe('infra failure handling', () => {
    it('returns infraAvailable: false on Pyodide error', async () => {
      const badPyodide = createMockPyodide({
        error: new Error('Pyodide not loaded'),
      });

      const result = await compareByAst(badPyodide, 'x', 'x', []);

      expect(result.infraAvailable).toBe(false);
      expect(result.match).toBe(false);
    });
  });
});
```

### Failure Modes Solved

After Phase 4, the failure modes table becomes:

| # | Problem | Status |
|---|---------|--------|
| 1 | String literal corruption | **Solved** (Phase 1) |
| 2 | Semantic equivalence (`[:3]` vs `[0:3]`) | **Solved** (Phase 4 - slice normalization) |
| 3 | Variable renames (`for i` vs `for x`) | **Solved** (Phase 4 - local alpha-rename) |
| 4 | Construct false positives | **Solved** (Phase 1) |
| 5 | Behavior vs syntax mismatch | **Solved** (Phase 2) |

### Recommended Defaults (Post-Phase 4)

| Exercise Type | Default Strategy | Reason |
|---------------|------------------|--------|
| `fill-in` | `exact` | Short answers, whitespace matters |
| `predict` | `execution` → `exact` | Behavior check, fallback on infra failure |
| `write` (simple) | `exact` | String matching sufficient |
| `write` (slices/comprehensions) | `ast` | Semantic equivalence needed |
| `write` (functions with tests) | `execution` | Behavior verification via script |

### Audit Script Update

Add to `scripts/audit-grading.ts`:

```typescript
// Patterns that suggest AST strategy would help
const AST_PATTERNS = [
  /\[.*:.*\]/,           // Slice notation
  /\[.*for.*in.*\]/,     // List comprehension
  /\{.*for.*in.*\}/,     // Dict/set comprehension
  /if.*else/,            // Ternary expression
  /lambda\s/,            // Lambda expressions
];

function shouldRecommendAst(exercise: YamlExercise): boolean {
  const answer = exercise.expected_answer;
  const altCount = exercise.accepted_solutions?.length ?? 0;

  // Many alternatives suggest semantic variations
  if (altCount > 5) return true;

  // Code patterns that have common semantic equivalents
  if (AST_PATTERNS.some(p => p.test(answer))) return true;

  return false;
}
```

---

## References

- Design Document: [2026-01-10-robust-answer-grading-design.md](./2026-01-10-robust-answer-grading-design.md)
- Current Grading: `src/lib/exercise/grading.ts`
- Current Matching: `src/lib/exercise/matching.ts`
- Current Tests: `tests/unit/exercise/grading.test.ts`
- AST Proposal: Codex (GPT) analysis, 2026-01-10

---

*Implementation plan created 2026-01-10*
*Updated 2026-01-10: Addressed code review findings, clarified token comparison scope, fixed infrastructure failure detection*
*Updated 2026-01-10: Added Phase 4 AST normalization based on Codex proposal evaluation*
