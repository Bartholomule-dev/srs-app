# Milestone 4: Exercise Engine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the single-card exercise interaction system - the core learning experience for the SRS app.

**Architecture:** A pure TypeScript matching and quality inference layer (`src/lib/exercise/`) with React components (`src/components/exercise/`) that orchestrate the answer-feedback-complete flow. Components are stateless regarding SRS logic; they report quality scores to the existing `useSRS` hook.

**Tech Stack:** React 19, TypeScript 5 (strict), Tailwind CSS 4, Vitest + React Testing Library

**Design Document:** `docs/plans/2026-01-02-milestone-4-exercise-engine-design.md`

---

## Dependencies

**Existing code used by this milestone:**
- `src/lib/types/app.types.ts` - `Exercise` interface
- `src/lib/srs/types.ts` - `Quality` type (0-5)
- `src/lib/hooks/useSRS.ts` - `recordAnswer(exerciseId, quality)` function
- `src/components/index.ts` - barrel export pattern

**No external dependencies required** - pure TypeScript implementation.

---

## File Structure Overview

```
src/
├── lib/
│   └── exercise/
│       ├── index.ts           # Barrel export
│       ├── types.ts           # AnswerResult, QualityInputs interfaces
│       ├── matching.ts        # normalizePython, checkAnswer
│       └── quality.ts         # inferQuality
│
└── components/
    └── exercise/
        ├── index.ts           # Barrel export
        ├── ExerciseCard.tsx   # Orchestrator component
        ├── ExercisePrompt.tsx # Question display
        ├── CodeInput.tsx      # Textarea for answer
        ├── ExerciseFeedback.tsx # Result display
        └── HintButton.tsx     # Hint reveal

tests/
├── unit/
│   └── exercise/
│       ├── types.test.ts
│       ├── matching.test.ts
│       └── quality.test.ts
│
└── component/
    └── exercise/
        ├── ExerciseCard.test.tsx
        ├── ExercisePrompt.test.tsx
        ├── CodeInput.test.tsx
        ├── ExerciseFeedback.test.tsx
        └── HintButton.test.tsx
```

---

## Task 1: Exercise Types

**Files:**
- Create: `src/lib/exercise/types.ts`
- Create: `tests/unit/exercise/types.test.ts`
- Create: `src/lib/exercise/index.ts`

### Step 1: Write the failing test

```typescript
// tests/unit/exercise/types.test.ts
import { describe, it, expect } from 'vitest';
import type { AnswerResult, QualityInputs } from '@/lib/exercise';

describe('exercise types', () => {
  describe('AnswerResult', () => {
    it('has required properties', () => {
      const result: AnswerResult = {
        isCorrect: true,
        normalizedUserAnswer: 'print(x)',
        normalizedExpectedAnswer: 'print(x)',
        usedAstMatch: false,
      };
      expect(result.isCorrect).toBe(true);
      expect(result.normalizedUserAnswer).toBe('print(x)');
      expect(result.normalizedExpectedAnswer).toBe('print(x)');
      expect(result.usedAstMatch).toBe(false);
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
});
```

### Step 2: Run test to verify it fails

Run: `pnpm vitest tests/unit/exercise/types.test.ts --run`
Expected: FAIL with "Cannot find module '@/lib/exercise'"

### Step 3: Write minimal implementation

```typescript
// src/lib/exercise/types.ts

/**
 * Result of checking a user's answer against the expected answer.
 */
export interface AnswerResult {
  /** Whether the answer was correct (exact or AST match) */
  isCorrect: boolean;
  /** The user's answer after normalization */
  normalizedUserAnswer: string;
  /** The expected answer after normalization */
  normalizedExpectedAnswer: string;
  /** True if AST matching was used (format differs but semantically equivalent) */
  usedAstMatch: boolean;
}

/**
 * Inputs for inferring the SM-2 quality score.
 */
export interface QualityInputs {
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Whether the user used a hint */
  hintUsed: boolean;
  /** Time from first keystroke to submission (milliseconds) */
  responseTimeMs: number;
  /** Whether AST matching was used for correctness */
  usedAstMatch: boolean;
}
```

```typescript
// src/lib/exercise/index.ts
export type { AnswerResult, QualityInputs } from './types';
```

### Step 4: Run test to verify it passes

Run: `pnpm vitest tests/unit/exercise/types.test.ts --run`
Expected: PASS

### Step 5: Commit

```bash
git add src/lib/exercise/ tests/unit/exercise/
git commit -m "feat(exercise): add AnswerResult and QualityInputs types"
```

---

## Task 2: Python Code Normalization

**Files:**
- Create: `src/lib/exercise/matching.ts`
- Create: `tests/unit/exercise/matching.test.ts`
- Modify: `src/lib/exercise/index.ts`

### Step 1: Write the failing test for normalizePython

```typescript
// tests/unit/exercise/matching.test.ts
import { describe, it, expect } from 'vitest';
import { normalizePython } from '@/lib/exercise';

describe('normalizePython', () => {
  it('returns empty string for empty input', () => {
    expect(normalizePython('')).toBe('');
  });

  it('normalizes CRLF to LF', () => {
    expect(normalizePython('a\r\nb')).toBe('a\nb');
  });

  it('converts tabs to 4 spaces', () => {
    expect(normalizePython('\tprint(x)')).toBe('    print(x)');
  });

  it('removes trailing spaces per line', () => {
    expect(normalizePython('print(x)   ')).toBe('print(x)');
    expect(normalizePython('a   \nb   ')).toBe('a\nb');
  });

  it('preserves leading spaces (indentation)', () => {
    expect(normalizePython('    print(x)')).toBe('    print(x)');
  });

  it('preserves internal spaces', () => {
    expect(normalizePython('x = 1')).toBe('x = 1');
  });

  it('handles complex multi-line code', () => {
    const input = 'def foo():\r\n\treturn 1   ';
    const expected = 'def foo():\n    return 1';
    expect(normalizePython(input)).toBe(expected);
  });

  it('normalizes multiple consecutive tabs', () => {
    expect(normalizePython('\t\tprint(x)')).toBe('        print(x)');
  });
});
```

### Step 2: Run test to verify it fails

Run: `pnpm vitest tests/unit/exercise/matching.test.ts --run`
Expected: FAIL with "normalizePython is not exported"

### Step 3: Write minimal implementation

```typescript
// src/lib/exercise/matching.ts
import type { AnswerResult } from './types';

/**
 * Normalizes Python code for comparison:
 * - Converts CRLF to LF
 * - Converts tabs to 4 spaces
 * - Removes trailing whitespace per line
 */
export function normalizePython(code: string): string {
  if (!code) return '';

  return code
    .replace(/\r\n/g, '\n')      // CRLF → LF
    .replace(/\t/g, '    ')      // Tabs → 4 spaces
    .replace(/ +$/gm, '');       // Remove trailing spaces per line
}
```

Update barrel export:
```typescript
// src/lib/exercise/index.ts
export type { AnswerResult, QualityInputs } from './types';
export { normalizePython } from './matching';
```

### Step 4: Run test to verify it passes

Run: `pnpm vitest tests/unit/exercise/matching.test.ts --run`
Expected: PASS

### Step 5: Commit

```bash
git add src/lib/exercise/matching.ts tests/unit/exercise/matching.test.ts src/lib/exercise/index.ts
git commit -m "feat(exercise): add normalizePython function"
```

---

## Task 3: Answer Checking (checkAnswer)

**Files:**
- Modify: `src/lib/exercise/matching.ts`
- Modify: `tests/unit/exercise/matching.test.ts`
- Modify: `src/lib/exercise/index.ts`

### Step 1: Write the failing test for checkAnswer

Append to `tests/unit/exercise/matching.test.ts`:

```typescript
import { normalizePython, checkAnswer } from '@/lib/exercise';

describe('checkAnswer', () => {
  describe('exact match', () => {
    it('returns correct for identical answers', () => {
      const result = checkAnswer('print(x)', 'print(x)');
      expect(result.isCorrect).toBe(true);
      expect(result.usedAstMatch).toBe(false);
    });

    it('returns incorrect for different answers', () => {
      const result = checkAnswer('print x', 'print(x)');
      expect(result.isCorrect).toBe(false);
    });

    it('is case-sensitive', () => {
      const result = checkAnswer('Print(x)', 'print(x)');
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('normalized match', () => {
    it('matches after CRLF normalization', () => {
      const result = checkAnswer('a\r\nb', 'a\nb');
      expect(result.isCorrect).toBe(true);
      expect(result.usedAstMatch).toBe(false);
    });

    it('matches after tab normalization', () => {
      const result = checkAnswer('\tprint(x)', '    print(x)');
      expect(result.isCorrect).toBe(true);
    });

    it('matches after trailing space removal', () => {
      const result = checkAnswer('print(x)   ', 'print(x)');
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('result properties', () => {
    it('includes normalized versions of both answers', () => {
      const result = checkAnswer('\tprint(x)  ', '    print(x)');
      expect(result.normalizedUserAnswer).toBe('    print(x)');
      expect(result.normalizedExpectedAnswer).toBe('    print(x)');
    });

    it('includes normalized versions even when incorrect', () => {
      const result = checkAnswer('wrong', 'print(x)');
      expect(result.normalizedUserAnswer).toBe('wrong');
      expect(result.normalizedExpectedAnswer).toBe('print(x)');
    });
  });

  describe('edge cases', () => {
    it('handles empty user answer', () => {
      const result = checkAnswer('', 'print(x)');
      expect(result.isCorrect).toBe(false);
      expect(result.normalizedUserAnswer).toBe('');
    });

    it('handles multi-line code', () => {
      const user = 'def foo():\n    return 1';
      const expected = 'def foo():\n    return 1';
      const result = checkAnswer(user, expected);
      expect(result.isCorrect).toBe(true);
    });

    it('handles whitespace-only differences in multi-line', () => {
      const user = 'def foo():\r\n\treturn 1   ';
      const expected = 'def foo():\n    return 1';
      const result = checkAnswer(user, expected);
      expect(result.isCorrect).toBe(true);
    });
  });
});
```

### Step 2: Run test to verify it fails

Run: `pnpm vitest tests/unit/exercise/matching.test.ts --run`
Expected: FAIL with "checkAnswer is not exported"

### Step 3: Write minimal implementation

Add to `src/lib/exercise/matching.ts`:

```typescript
/**
 * Checks if user's answer matches the expected answer.
 * Currently uses whitespace-normalized string comparison.
 *
 * Future: Add AST-based matching for semantic equivalence.
 */
export function checkAnswer(userAnswer: string, expectedAnswer: string): AnswerResult {
  const normalizedUser = normalizePython(userAnswer);
  const normalizedExpected = normalizePython(expectedAnswer);

  const isCorrect = normalizedUser === normalizedExpected;

  return {
    isCorrect,
    normalizedUserAnswer: normalizedUser,
    normalizedExpectedAnswer: normalizedExpected,
    usedAstMatch: false, // Future: set true when AST matching is used
  };
}
```

Update barrel export:
```typescript
// src/lib/exercise/index.ts
export type { AnswerResult, QualityInputs } from './types';
export { normalizePython, checkAnswer } from './matching';
```

### Step 4: Run test to verify it passes

Run: `pnpm vitest tests/unit/exercise/matching.test.ts --run`
Expected: PASS

### Step 5: Commit

```bash
git add src/lib/exercise/matching.ts tests/unit/exercise/matching.test.ts src/lib/exercise/index.ts
git commit -m "feat(exercise): add checkAnswer function"
```

---

## Task 4: Quality Inference (inferQuality)

**Files:**
- Create: `src/lib/exercise/quality.ts`
- Create: `tests/unit/exercise/quality.test.ts`
- Modify: `src/lib/exercise/index.ts`

### Step 1: Write the failing test

```typescript
// tests/unit/exercise/quality.test.ts
import { describe, it, expect } from 'vitest';
import { inferQuality, FAST_THRESHOLD_MS, SLOW_THRESHOLD_MS } from '@/lib/exercise';
import type { QualityInputs } from '@/lib/exercise';

describe('inferQuality', () => {
  describe('incorrect answers', () => {
    it('returns 2 for incorrect answer', () => {
      const inputs: QualityInputs = {
        isCorrect: false,
        hintUsed: false,
        responseTimeMs: 5000,
        usedAstMatch: false,
      };
      expect(inferQuality(inputs)).toBe(2);
    });

    it('returns 2 for incorrect even with fast time', () => {
      const inputs: QualityInputs = {
        isCorrect: false,
        hintUsed: false,
        responseTimeMs: 1000,
        usedAstMatch: false,
      };
      expect(inferQuality(inputs)).toBe(2);
    });
  });

  describe('correct with hint', () => {
    it('returns 3 when hint was used', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: true,
        responseTimeMs: 5000,
        usedAstMatch: false,
      };
      expect(inferQuality(inputs)).toBe(3);
    });

    it('returns 3 even with fast time when hint used', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: true,
        responseTimeMs: 1000,
        usedAstMatch: false,
      };
      expect(inferQuality(inputs)).toBe(3);
    });
  });

  describe('correct with AST match', () => {
    it('returns 4 when AST match was used', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: 5000,
        usedAstMatch: true,
      };
      expect(inferQuality(inputs)).toBe(4);
    });

    it('returns 4 even with fast time for AST match', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: 1000,
        usedAstMatch: true,
      };
      expect(inferQuality(inputs)).toBe(4);
    });
  });

  describe('correct without hint (time-based)', () => {
    it('returns 5 for fast answer (< 15s)', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: FAST_THRESHOLD_MS - 1,
        usedAstMatch: false,
      };
      expect(inferQuality(inputs)).toBe(5);
    });

    it('returns 4 for medium answer (15-30s)', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: FAST_THRESHOLD_MS,
        usedAstMatch: false,
      };
      expect(inferQuality(inputs)).toBe(4);
    });

    it('returns 4 for answer just under slow threshold', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: SLOW_THRESHOLD_MS - 1,
        usedAstMatch: false,
      };
      expect(inferQuality(inputs)).toBe(4);
    });

    it('returns 3 for slow answer (>= 30s)', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: SLOW_THRESHOLD_MS,
        usedAstMatch: false,
      };
      expect(inferQuality(inputs)).toBe(3);
    });

    it('returns 3 for very slow answer', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: 120_000,
        usedAstMatch: false,
      };
      expect(inferQuality(inputs)).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('handles zero response time', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: 0,
        usedAstMatch: false,
      };
      expect(inferQuality(inputs)).toBe(5);
    });

    it('handles exactly FAST_THRESHOLD_MS', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: FAST_THRESHOLD_MS,
        usedAstMatch: false,
      };
      expect(inferQuality(inputs)).toBe(4);
    });

    it('hint takes precedence over AST match', () => {
      const inputs: QualityInputs = {
        isCorrect: true,
        hintUsed: true,
        responseTimeMs: 5000,
        usedAstMatch: true,
      };
      expect(inferQuality(inputs)).toBe(3);
    });
  });
});

describe('threshold constants', () => {
  it('FAST_THRESHOLD_MS is 15 seconds', () => {
    expect(FAST_THRESHOLD_MS).toBe(15_000);
  });

  it('SLOW_THRESHOLD_MS is 30 seconds', () => {
    expect(SLOW_THRESHOLD_MS).toBe(30_000);
  });
});
```

### Step 2: Run test to verify it fails

Run: `pnpm vitest tests/unit/exercise/quality.test.ts --run`
Expected: FAIL with "inferQuality is not exported"

### Step 3: Write minimal implementation

```typescript
// src/lib/exercise/quality.ts
import type { QualityInputs } from './types';
import type { Quality } from '@/lib/srs/types';

/** Response time threshold for "fast" (perfect recall) - 15 seconds */
export const FAST_THRESHOLD_MS = 15_000;

/** Response time threshold for "slow" (struggle) - 30 seconds */
export const SLOW_THRESHOLD_MS = 30_000;

/**
 * Infers the SM-2 quality score (2-5) based on answer correctness and timing.
 *
 * Quality mapping:
 * - 5: Perfect recall (correct, no hint, fast)
 * - 4: Hesitation (correct, no hint, medium time) or AST match
 * - 3: Struggle (correct with hint, or slow time)
 * - 2: Failed (incorrect or gave up)
 */
export function inferQuality(inputs: QualityInputs): Quality {
  const { isCorrect, hintUsed, responseTimeMs, usedAstMatch } = inputs;

  // Incorrect always returns 2 (failed)
  if (!isCorrect) {
    return 2;
  }

  // Hint used caps at 3 (difficulty)
  if (hintUsed) {
    return 3;
  }

  // AST match (format differs) caps at 4
  if (usedAstMatch) {
    return 4;
  }

  // Time-based quality for exact matches
  if (responseTimeMs < FAST_THRESHOLD_MS) {
    return 5; // Perfect recall
  }

  if (responseTimeMs < SLOW_THRESHOLD_MS) {
    return 4; // Hesitation
  }

  return 3; // Struggle
}
```

Update barrel export:
```typescript
// src/lib/exercise/index.ts
export type { AnswerResult, QualityInputs } from './types';
export { normalizePython, checkAnswer } from './matching';
export { inferQuality, FAST_THRESHOLD_MS, SLOW_THRESHOLD_MS } from './quality';
```

### Step 4: Run test to verify it passes

Run: `pnpm vitest tests/unit/exercise/quality.test.ts --run`
Expected: PASS

### Step 5: Commit

```bash
git add src/lib/exercise/quality.ts tests/unit/exercise/quality.test.ts src/lib/exercise/index.ts
git commit -m "feat(exercise): add inferQuality function with time thresholds"
```

---

## Task 5: CodeInput Component

**Files:**
- Create: `src/components/exercise/CodeInput.tsx`
- Create: `tests/component/exercise/CodeInput.test.tsx`
- Create: `src/components/exercise/index.ts`

### Step 1: Write the failing test

```typescript
// tests/component/exercise/CodeInput.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeInput } from '@/components/exercise';

describe('CodeInput', () => {
  describe('rendering', () => {
    it('renders a textarea', () => {
      render(<CodeInput value="" onChange={() => {}} onSubmit={() => {}} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('displays the current value', () => {
      render(<CodeInput value="print(x)" onChange={() => {}} onSubmit={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('print(x)');
    });

    it('shows placeholder text', () => {
      render(<CodeInput value="" onChange={() => {}} onSubmit={() => {}} />);
      expect(screen.getByPlaceholderText(/type your answer/i)).toBeInTheDocument();
    });

    it('auto-focuses on mount', () => {
      render(<CodeInput value="" onChange={() => {}} onSubmit={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('applies monospace font styling', () => {
      render(<CodeInput value="" onChange={() => {}} onSubmit={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveClass('font-mono');
    });
  });

  describe('onChange', () => {
    it('calls onChange when typing', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<CodeInput value="" onChange={handleChange} onSubmit={() => {}} />);

      await user.type(screen.getByRole('textbox'), 'a');
      expect(handleChange).toHaveBeenCalledWith('a');
    });
  });

  describe('onSubmit', () => {
    it('calls onSubmit when Enter is pressed', () => {
      const handleSubmit = vi.fn();
      render(<CodeInput value="test" onChange={() => {}} onSubmit={handleSubmit} />);

      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('does not call onSubmit on Shift+Enter (allows newline)', () => {
      const handleSubmit = vi.fn();
      render(<CodeInput value="test" onChange={() => {}} onSubmit={handleSubmit} />);

      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', shiftKey: true });
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('does not call onSubmit on other keys', () => {
      const handleSubmit = vi.fn();
      render(<CodeInput value="test" onChange={() => {}} onSubmit={handleSubmit} />);

      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'a' });
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('can be disabled', () => {
      render(<CodeInput value="" onChange={() => {}} onSubmit={() => {}} disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('does not call onSubmit when disabled', () => {
      const handleSubmit = vi.fn();
      render(<CodeInput value="test" onChange={() => {}} onSubmit={handleSubmit} disabled />);

      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has appropriate aria-label', () => {
      render(<CodeInput value="" onChange={() => {}} onSubmit={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Code answer input');
    });
  });
});
```

### Step 2: Run test to verify it fails

Run: `pnpm vitest tests/component/exercise/CodeInput.test.tsx --run`
Expected: FAIL with "Cannot find module '@/components/exercise'"

### Step 3: Write minimal implementation

```typescript
// src/components/exercise/CodeInput.tsx
'use client';

import { useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function CodeInput({ value, onChange, onSubmit, disabled = false }: CodeInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      placeholder="Type your answer... (Enter to submit, Shift+Enter for newline)"
      aria-label="Code answer input"
      className="font-mono w-full min-h-[100px] p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-y"
    />
  );
}
```

```typescript
// src/components/exercise/index.ts
export { CodeInput } from './CodeInput';
```

### Step 4: Run test to verify it passes

Run: `pnpm vitest tests/component/exercise/CodeInput.test.tsx --run`
Expected: PASS

### Step 5: Commit

```bash
git add src/components/exercise/ tests/component/exercise/
git commit -m "feat(exercise): add CodeInput component with Enter-to-submit"
```

---

## Task 6: ExercisePrompt Component

**Files:**
- Create: `src/components/exercise/ExercisePrompt.tsx`
- Create: `tests/component/exercise/ExercisePrompt.test.tsx`
- Modify: `src/components/exercise/index.ts`

### Step 1: Write the failing test

```typescript
// tests/component/exercise/ExercisePrompt.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExercisePrompt } from '@/components/exercise';

describe('ExercisePrompt', () => {
  const defaultProps = {
    category: 'Variables',
    language: 'Python',
    prompt: 'Print the value of variable `name`',
  };

  describe('rendering', () => {
    it('displays the prompt text', () => {
      render(<ExercisePrompt {...defaultProps} />);
      expect(screen.getByText('Print the value of variable `name`')).toBeInTheDocument();
    });

    it('displays the category', () => {
      render(<ExercisePrompt {...defaultProps} />);
      expect(screen.getByText('Variables')).toBeInTheDocument();
    });

    it('displays the language', () => {
      render(<ExercisePrompt {...defaultProps} />);
      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    it('shows language and category together as breadcrumb', () => {
      render(<ExercisePrompt {...defaultProps} />);
      // Should have both visible, separated by some indicator
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('Variables')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies appropriate heading styling to prompt', () => {
      render(<ExercisePrompt {...defaultProps} />);
      const prompt = screen.getByText('Print the value of variable `name`');
      expect(prompt.tagName).toBe('P');
    });
  });

  describe('accessibility', () => {
    it('has appropriate heading structure', () => {
      render(<ExercisePrompt {...defaultProps} />);
      // Category breadcrumb should be in a header region
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });
});
```

### Step 2: Run test to verify it fails

Run: `pnpm vitest tests/component/exercise/ExercisePrompt.test.tsx --run`
Expected: FAIL with "ExercisePrompt is not exported"

### Step 3: Write minimal implementation

```typescript
// src/components/exercise/ExercisePrompt.tsx
interface ExercisePromptProps {
  category: string;
  language: string;
  prompt: string;
}

export function ExercisePrompt({ category, language, prompt }: ExercisePromptProps) {
  return (
    <div>
      <header className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-4" role="banner">
        <span className="font-medium text-blue-600 dark:text-blue-400">{language}</span>
        <span aria-hidden="true">/</span>
        <span>{category}</span>
      </header>
      <p className="text-lg text-neutral-900 dark:text-neutral-100">{prompt}</p>
    </div>
  );
}
```

Update barrel export:
```typescript
// src/components/exercise/index.ts
export { CodeInput } from './CodeInput';
export { ExercisePrompt } from './ExercisePrompt';
```

### Step 4: Run test to verify it passes

Run: `pnpm vitest tests/component/exercise/ExercisePrompt.test.tsx --run`
Expected: PASS

### Step 5: Commit

```bash
git add src/components/exercise/ExercisePrompt.tsx tests/component/exercise/ExercisePrompt.test.tsx src/components/exercise/index.ts
git commit -m "feat(exercise): add ExercisePrompt component"
```

---

## Task 7: HintButton Component

**Files:**
- Create: `src/components/exercise/HintButton.tsx`
- Create: `tests/component/exercise/HintButton.test.tsx`
- Modify: `src/components/exercise/index.ts`

### Step 1: Write the failing test

```typescript
// tests/component/exercise/HintButton.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HintButton } from '@/components/exercise';

describe('HintButton', () => {
  describe('before reveal', () => {
    it('renders a button with hint icon', () => {
      render(<HintButton hint="Use print()" revealed={false} onReveal={() => {}} />);
      expect(screen.getByRole('button', { name: /hint/i })).toBeInTheDocument();
    });

    it('does not show hint text before click', () => {
      render(<HintButton hint="Use print()" revealed={false} onReveal={() => {}} />);
      expect(screen.queryByText('Use print()')).not.toBeInTheDocument();
    });

    it('calls onReveal when clicked', () => {
      const handleReveal = vi.fn();
      render(<HintButton hint="Use print()" revealed={false} onReveal={handleReveal} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleReveal).toHaveBeenCalledTimes(1);
    });

    it('shows penalty warning', () => {
      render(<HintButton hint="Use print()" revealed={false} onReveal={() => {}} />);
      expect(screen.getByText(/affects score/i)).toBeInTheDocument();
    });
  });

  describe('after reveal', () => {
    it('shows the hint text', () => {
      render(<HintButton hint="Use print()" revealed={true} onReveal={() => {}} />);
      expect(screen.getByText('Use print()')).toBeInTheDocument();
    });

    it('disables the button', () => {
      render(<HintButton hint="Use print()" revealed={true} onReveal={() => {}} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows revealed state styling', () => {
      render(<HintButton hint="Use print()" revealed={true} onReveal={() => {}} />);
      expect(screen.getByRole('button')).toHaveClass('opacity-50');
    });
  });

  describe('empty hint', () => {
    it('does not render when hint is empty', () => {
      render(<HintButton hint="" revealed={false} onReveal={() => {}} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not render when hint is null-like', () => {
      render(<HintButton hint={null as unknown as string} revealed={false} onReveal={() => {}} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('can be disabled independently of revealed', () => {
      render(<HintButton hint="Use print()" revealed={false} onReveal={() => {}} disabled />);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
```

### Step 2: Run test to verify it fails

Run: `pnpm vitest tests/component/exercise/HintButton.test.tsx --run`
Expected: FAIL with "HintButton is not exported"

### Step 3: Write minimal implementation

```typescript
// src/components/exercise/HintButton.tsx
'use client';

interface HintButtonProps {
  hint: string;
  revealed: boolean;
  onReveal: () => void;
  disabled?: boolean;
}

export function HintButton({ hint, revealed, onReveal, disabled = false }: HintButtonProps) {
  if (!hint) {
    return null;
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onReveal}
        disabled={disabled || revealed}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border transition-colors ${
          revealed
            ? 'opacity-50 cursor-not-allowed border-neutral-300 dark:border-neutral-700 text-neutral-500'
            : 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
        }`}
        aria-label={revealed ? 'Hint revealed' : 'Show hint'}
      >
        <span aria-hidden="true">💡</span>
        <span>Hint</span>
      </button>
      {!revealed && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Using a hint affects your score
        </p>
      )}
      {revealed && (
        <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm">
          {hint}
        </div>
      )}
    </div>
  );
}
```

Update barrel export:
```typescript
// src/components/exercise/index.ts
export { CodeInput } from './CodeInput';
export { ExercisePrompt } from './ExercisePrompt';
export { HintButton } from './HintButton';
```

### Step 4: Run test to verify it passes

Run: `pnpm vitest tests/component/exercise/HintButton.test.tsx --run`
Expected: PASS

### Step 5: Commit

```bash
git add src/components/exercise/HintButton.tsx tests/component/exercise/HintButton.test.tsx src/components/exercise/index.ts
git commit -m "feat(exercise): add HintButton component with penalty warning"
```

---

## Task 8: ExerciseFeedback Component

**Files:**
- Create: `src/components/exercise/ExerciseFeedback.tsx`
- Create: `tests/component/exercise/ExerciseFeedback.test.tsx`
- Modify: `src/components/exercise/index.ts`

### Step 1: Write the failing test

```typescript
// tests/component/exercise/ExerciseFeedback.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseFeedback } from '@/components/exercise';

describe('ExerciseFeedback', () => {
  const correctProps = {
    isCorrect: true,
    userAnswer: 'print(x)',
    expectedAnswer: 'print(x)',
    nextReviewDays: 6,
    onContinue: vi.fn(),
  };

  const incorrectProps = {
    isCorrect: false,
    userAnswer: 'print x',
    expectedAnswer: 'print(x)',
    nextReviewDays: 1,
    onContinue: vi.fn(),
  };

  describe('correct answer', () => {
    it('shows correct banner', () => {
      render(<ExerciseFeedback {...correctProps} />);
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });

    it('shows success styling', () => {
      render(<ExerciseFeedback {...correctProps} />);
      const banner = screen.getByText(/correct/i).closest('div');
      expect(banner).toHaveClass('bg-green-50');
    });

    it('shows user answer', () => {
      render(<ExerciseFeedback {...correctProps} />);
      expect(screen.getByText('print(x)')).toBeInTheDocument();
    });

    it('does not show expected answer (already matches)', () => {
      render(<ExerciseFeedback {...correctProps} />);
      // Should only have one code block with print(x), not two
      const codeBlocks = screen.getAllByText('print(x)');
      expect(codeBlocks).toHaveLength(1);
    });

    it('shows next review info', () => {
      render(<ExerciseFeedback {...correctProps} />);
      expect(screen.getByText(/next review.*6 days/i)).toBeInTheDocument();
    });
  });

  describe('incorrect answer', () => {
    it('shows incorrect banner', () => {
      render(<ExerciseFeedback {...incorrectProps} />);
      expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
    });

    it('shows error styling', () => {
      render(<ExerciseFeedback {...incorrectProps} />);
      const banner = screen.getByText(/incorrect/i).closest('div');
      expect(banner).toHaveClass('bg-red-50');
    });

    it('shows both user answer and expected answer', () => {
      render(<ExerciseFeedback {...incorrectProps} />);
      expect(screen.getByText('print x')).toBeInTheDocument();
      expect(screen.getByText('print(x)')).toBeInTheDocument();
    });

    it('labels both answers', () => {
      render(<ExerciseFeedback {...incorrectProps} />);
      expect(screen.getByText(/your answer/i)).toBeInTheDocument();
      expect(screen.getByText(/correct answer/i)).toBeInTheDocument();
    });

    it('shows next review info for incorrect', () => {
      render(<ExerciseFeedback {...incorrectProps} />);
      expect(screen.getByText(/next review.*1 day/i)).toBeInTheDocument();
    });
  });

  describe('continue button', () => {
    it('renders continue button', () => {
      render(<ExerciseFeedback {...correctProps} />);
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    it('calls onContinue when clicked', () => {
      const handleContinue = vi.fn();
      render(<ExerciseFeedback {...correctProps} onContinue={handleContinue} />);

      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      expect(handleContinue).toHaveBeenCalledTimes(1);
    });
  });

  describe('next review text', () => {
    it('uses singular "day" for 1 day', () => {
      render(<ExerciseFeedback {...incorrectProps} nextReviewDays={1} />);
      expect(screen.getByText(/1 day/i)).toBeInTheDocument();
      expect(screen.queryByText(/1 days/i)).not.toBeInTheDocument();
    });

    it('uses plural "days" for multiple days', () => {
      render(<ExerciseFeedback {...correctProps} nextReviewDays={6} />);
      expect(screen.getByText(/6 days/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has appropriate role for result banner', () => {
      render(<ExerciseFeedback {...correctProps} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
```

### Step 2: Run test to verify it fails

Run: `pnpm vitest tests/component/exercise/ExerciseFeedback.test.tsx --run`
Expected: FAIL with "ExerciseFeedback is not exported"

### Step 3: Write minimal implementation

```typescript
// src/components/exercise/ExerciseFeedback.tsx
'use client';

interface ExerciseFeedbackProps {
  isCorrect: boolean;
  userAnswer: string;
  expectedAnswer: string;
  nextReviewDays: number;
  onContinue: () => void;
}

export function ExerciseFeedback({
  isCorrect,
  userAnswer,
  expectedAnswer,
  nextReviewDays,
  onContinue,
}: ExerciseFeedbackProps) {
  const dayText = nextReviewDays === 1 ? 'day' : 'days';

  return (
    <div className="space-y-4">
      {/* Result Banner */}
      <div
        role="alert"
        className={`flex items-center gap-2 p-4 rounded-lg ${
          isCorrect
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
        }`}
      >
        <span className="text-xl" aria-hidden="true">
          {isCorrect ? '✓' : '✗'}
        </span>
        <span className="font-semibold">{isCorrect ? 'Correct!' : 'Incorrect'}</span>
      </div>

      {/* Answer Display */}
      <div className={isCorrect ? 'space-y-2' : 'grid grid-cols-2 gap-4'}>
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Your answer:</p>
          <pre className="p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 font-mono text-sm overflow-x-auto">
            {userAnswer || <span className="text-neutral-400 italic">(empty)</span>}
          </pre>
        </div>
        {!isCorrect && (
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Correct answer:</p>
            <pre className="p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 font-mono text-sm overflow-x-auto">
              {expectedAnswer}
            </pre>
          </div>
        )}
      </div>

      {/* Next Review Info */}
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Next review: {nextReviewDays} {dayText}
      </p>

      {/* Continue Button */}
      <button
        type="button"
        onClick={onContinue}
        className="w-full py-2 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Continue →
      </button>
    </div>
  );
}
```

Update barrel export:
```typescript
// src/components/exercise/index.ts
export { CodeInput } from './CodeInput';
export { ExercisePrompt } from './ExercisePrompt';
export { HintButton } from './HintButton';
export { ExerciseFeedback } from './ExerciseFeedback';
```

### Step 4: Run test to verify it passes

Run: `pnpm vitest tests/component/exercise/ExerciseFeedback.test.tsx --run`
Expected: PASS

### Step 5: Commit

```bash
git add src/components/exercise/ExerciseFeedback.tsx tests/component/exercise/ExerciseFeedback.test.tsx src/components/exercise/index.ts
git commit -m "feat(exercise): add ExerciseFeedback component"
```

---

## Task 9: ExerciseCard Component (Orchestrator)

**Files:**
- Create: `src/components/exercise/ExerciseCard.tsx`
- Create: `tests/component/exercise/ExerciseCard.test.tsx`
- Modify: `src/components/exercise/index.ts`

### Step 1: Write the failing test

```typescript
// tests/component/exercise/ExerciseCard.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExerciseCard } from '@/components/exercise';
import type { Exercise } from '@/lib/types';

// Mock visibility API
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

describe('ExerciseCard', () => {
  const mockExercise: Exercise = {
    id: 'ex-1',
    language: 'Python',
    category: 'Variables',
    difficulty: 1,
    title: 'Print Variable',
    prompt: 'Print the value of variable `name`',
    expectedAnswer: 'print(name)',
    hints: ['Use the print() function'],
    explanation: null,
    tags: ['basics'],
    timesPracticed: 0,
    avgSuccessRate: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.useFakeTimers();
    document.addEventListener = mockAddEventListener;
    document.removeEventListener = mockRemoveEventListener;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('answering phase', () => {
    it('renders the exercise prompt', () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);
      expect(screen.getByText('Print the value of variable `name`')).toBeInTheDocument();
    });

    it('renders the code input', () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders the hint button', () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);
      expect(screen.getByRole('button', { name: /hint/i })).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('renders give up button', () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);
      expect(screen.getByRole('button', { name: /give up/i })).toBeInTheDocument();
    });
  });

  describe('hint interaction', () => {
    it('reveals hint when hint button clicked', async () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /hint/i }));
      });

      expect(screen.getByText('Use the print() function')).toBeInTheDocument();
    });
  });

  describe('submit flow', () => {
    it('transitions to feedback phase on submit', async () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);

      // Type correct answer
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'print(name)' } });
      });

      // Submit
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      });

      // Should show feedback
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });

    it('shows correct feedback for correct answer', async () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);

      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'print(name)' } });
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      });

      expect(screen.getByRole('alert')).toHaveTextContent(/correct/i);
    });

    it('shows incorrect feedback for wrong answer', async () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);

      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'print name' } });
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      });

      expect(screen.getByRole('alert')).toHaveTextContent(/incorrect/i);
    });

    it('Enter key submits the answer', async () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);

      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'print(name)' } });
        fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
      });

      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });
  });

  describe('give up flow', () => {
    it('transitions to feedback phase on give up', async () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /give up/i }));
      });

      expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
    });

    it('shows the correct answer when giving up', async () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /give up/i }));
      });

      expect(screen.getByText('print(name)')).toBeInTheDocument();
    });
  });

  describe('onComplete callback', () => {
    it('calls onComplete with exerciseId and quality when continue clicked', async () => {
      const handleComplete = vi.fn();
      render(<ExerciseCard exercise={mockExercise} onComplete={handleComplete} />);

      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'print(name)' } });
        vi.advanceTimersByTime(5000); // Fast answer
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      });

      expect(handleComplete).toHaveBeenCalledWith('ex-1', 5); // Fast correct = quality 5
    });

    it('calls onComplete with quality 2 for give up', async () => {
      const handleComplete = vi.fn();
      render(<ExerciseCard exercise={mockExercise} onComplete={handleComplete} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /give up/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      });

      expect(handleComplete).toHaveBeenCalledWith('ex-1', 2);
    });

    it('calls onComplete with quality 3 when hint used', async () => {
      const handleComplete = vi.fn();
      render(<ExerciseCard exercise={mockExercise} onComplete={handleComplete} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /hint/i }));
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'print(name)' } });
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      });

      expect(handleComplete).toHaveBeenCalledWith('ex-1', 3);
    });
  });

  describe('time tracking', () => {
    it('starts timer on first input', async () => {
      const handleComplete = vi.fn();
      render(<ExerciseCard exercise={mockExercise} onComplete={handleComplete} />);

      // First keypress starts timer
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'p' } });
      });

      // Wait 20 seconds (slow threshold)
      await act(async () => {
        vi.advanceTimersByTime(20_000);
      });

      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'print(name)' } });
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      });

      // 20s is in the "hesitation" range (15-30s), quality 4
      expect(handleComplete).toHaveBeenCalledWith('ex-1', 4);
    });
  });

  describe('no hints available', () => {
    it('does not show hint button when no hints', () => {
      const exerciseNoHints = { ...mockExercise, hints: [] };
      render(<ExerciseCard exercise={exerciseNoHints} onComplete={() => {}} />);

      expect(screen.queryByRole('button', { name: /hint/i })).not.toBeInTheDocument();
    });
  });
});
```

### Step 2: Run test to verify it fails

Run: `pnpm vitest tests/component/exercise/ExerciseCard.test.tsx --run`
Expected: FAIL with "ExerciseCard is not exported"

### Step 3: Write minimal implementation

```typescript
// src/components/exercise/ExerciseCard.tsx
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Exercise } from '@/lib/types';
import type { Quality } from '@/lib/srs/types';
import { checkAnswer, inferQuality, type QualityInputs } from '@/lib/exercise';
import { CodeInput } from './CodeInput';
import { ExercisePrompt } from './ExercisePrompt';
import { HintButton } from './HintButton';
import { ExerciseFeedback } from './ExerciseFeedback';

type Phase = 'answering' | 'feedback';

interface ExerciseCardProps {
  exercise: Exercise;
  onComplete: (exerciseId: string, quality: Quality) => void;
}

export function ExerciseCard({ exercise, onComplete }: ExerciseCardProps) {
  const [phase, setPhase] = useState<Phase>('answering');
  const [userAnswer, setUserAnswer] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedMs, setPausedMs] = useState(0);
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean; usedAstMatch: boolean } | null>(null);

  const pauseStartRef = useRef<number | null>(null);

  // Track page visibility for pausing timer
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && startTime !== null) {
        pauseStartRef.current = Date.now();
      } else if (!document.hidden && pauseStartRef.current !== null) {
        setPausedMs((prev) => prev + (Date.now() - pauseStartRef.current!));
        pauseStartRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [startTime]);

  const handleInputChange = useCallback((value: string) => {
    if (startTime === null && value.length > 0) {
      setStartTime(Date.now());
    }
    setUserAnswer(value);
  }, [startTime]);

  const handleHintReveal = useCallback(() => {
    setHintUsed(true);
  }, []);

  const handleSubmit = useCallback(() => {
    const result = checkAnswer(userAnswer, exercise.expectedAnswer);
    setAnswerResult({ isCorrect: result.isCorrect, usedAstMatch: result.usedAstMatch });
    setPhase('feedback');
  }, [userAnswer, exercise.expectedAnswer]);

  const handleGiveUp = useCallback(() => {
    setAnswerResult({ isCorrect: false, usedAstMatch: false });
    setPhase('feedback');
  }, []);

  const handleContinue = useCallback(() => {
    const responseTimeMs = startTime !== null ? Date.now() - startTime - pausedMs : 0;

    const inputs: QualityInputs = {
      isCorrect: answerResult?.isCorrect ?? false,
      hintUsed,
      responseTimeMs,
      usedAstMatch: answerResult?.usedAstMatch ?? false,
    };

    const quality = inferQuality(inputs);
    onComplete(exercise.id, quality);
  }, [exercise.id, startTime, pausedMs, hintUsed, answerResult, onComplete]);

  // Calculate next review days (rough estimate based on current state)
  const nextReviewDays = answerResult?.isCorrect ? 6 : 1;

  const firstHint = exercise.hints[0] ?? '';

  if (phase === 'answering') {
    return (
      <div className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6">
        <ExercisePrompt
          category={exercise.category}
          language={exercise.language}
          prompt={exercise.prompt}
        />

        <CodeInput
          value={userAnswer}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
        />

        <div className="flex items-start justify-between gap-4">
          {firstHint && (
            <HintButton
              hint={firstHint}
              revealed={hintUsed}
              onReveal={handleHintReveal}
            />
          )}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={handleGiveUp}
              className="px-4 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Give Up
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
            >
              Submit ↵
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
      <ExerciseFeedback
        isCorrect={answerResult?.isCorrect ?? false}
        userAnswer={userAnswer}
        expectedAnswer={exercise.expectedAnswer}
        nextReviewDays={nextReviewDays}
        onContinue={handleContinue}
      />
    </div>
  );
}
```

Update barrel export:
```typescript
// src/components/exercise/index.ts
export { CodeInput } from './CodeInput';
export { ExercisePrompt } from './ExercisePrompt';
export { HintButton } from './HintButton';
export { ExerciseFeedback } from './ExerciseFeedback';
export { ExerciseCard } from './ExerciseCard';
```

### Step 4: Run test to verify it passes

Run: `pnpm vitest tests/component/exercise/ExerciseCard.test.tsx --run`
Expected: PASS

### Step 5: Commit

```bash
git add src/components/exercise/ExerciseCard.tsx tests/component/exercise/ExerciseCard.test.tsx src/components/exercise/index.ts
git commit -m "feat(exercise): add ExerciseCard orchestrator component"
```

---

## Task 10: Update Main Components Barrel Export

**Files:**
- Modify: `src/components/index.ts`

### Step 1: Write the failing test

```typescript
// Add to an existing test file or create tests/unit/components/index.test.ts
import { describe, it, expect } from 'vitest';
import * as components from '@/components';

describe('components barrel export', () => {
  it('exports exercise components', () => {
    expect(components.ExerciseCard).toBeDefined();
    expect(components.ExercisePrompt).toBeDefined();
    expect(components.CodeInput).toBeDefined();
    expect(components.ExerciseFeedback).toBeDefined();
    expect(components.HintButton).toBeDefined();
  });
});
```

### Step 2: Run test to verify it fails

Run: `pnpm vitest tests/unit/components/index.test.ts --run`
Expected: FAIL with "ExerciseCard is not exported"

### Step 3: Write minimal implementation

```typescript
// src/components/index.ts
export { ProtectedRoute } from './ProtectedRoute';
export { ErrorBoundary } from './ErrorBoundary';
export { Toast } from './Toast';

// Exercise components
export {
  ExerciseCard,
  ExercisePrompt,
  CodeInput,
  ExerciseFeedback,
  HintButton,
} from './exercise';
```

### Step 4: Run test to verify it passes

Run: `pnpm vitest tests/unit/components/index.test.ts --run`
Expected: PASS

### Step 5: Commit

```bash
git add src/components/index.ts tests/unit/components/
git commit -m "feat(components): export exercise components from main barrel"
```

---

## Task 11: Run Full Test Suite & Verify

**Files:**
- No new files

### Step 1: Run all tests

Run: `pnpm test`
Expected: All tests pass (existing + ~35 new tests)

### Step 2: Run TypeScript check

Run: `pnpm tsc --noEmit`
Expected: No type errors

### Step 3: Run linter

Run: `pnpm lint`
Expected: No lint errors

### Step 4: Build production

Run: `pnpm build`
Expected: Successful build

### Step 5: Commit verification milestone

```bash
git add -A
git commit -m "test(exercise): verify milestone 4 implementation complete

All tests pass:
- types.test.ts: 2 tests
- matching.test.ts: 17 tests
- quality.test.ts: 14 tests
- CodeInput.test.tsx: 10 tests
- ExercisePrompt.test.tsx: 5 tests
- HintButton.test.tsx: 8 tests
- ExerciseFeedback.test.tsx: 12 tests
- ExerciseCard.test.tsx: 15 tests

Total new tests: ~83
TypeScript: PASS
ESLint: PASS
Build: PASS"
```

---

## Summary

| Task | Description | New Tests |
|------|-------------|-----------|
| 1 | Exercise Types | 2 |
| 2 | normalizePython | 9 |
| 3 | checkAnswer | 12 |
| 4 | inferQuality | 14 |
| 5 | CodeInput | 10 |
| 6 | ExercisePrompt | 5 |
| 7 | HintButton | 8 |
| 8 | ExerciseFeedback | 12 |
| 9 | ExerciseCard | 15 |
| 10 | Barrel Export | 1 |
| 11 | Full Verification | 0 |

**Total new tests:** ~83
**Total commits:** 11

---

## Extension Points

This implementation is designed for easy extension:

1. **AST Matching:** Add `tryParsePythonAst()` and `astDump()` to `matching.ts`, update `checkAnswer()` to use them and set `usedAstMatch: true`

2. **Multiple Hints:** `HintButton` already receives a single hint - parent can manage which hint to show from the array

3. **Syntax Highlighting:** Add Prism.js/highlight.js to `ExerciseFeedback` for the code blocks

4. **Multi-language Support:** Add language-specific normalizers (e.g., `normalizeJavaScript()`) and a `checkAnswerByLanguage()` dispatcher

5. **Difficulty Levels:** Adjust time thresholds in `quality.ts` based on exercise difficulty

---

## Related Documents

- Design: `docs/plans/2026-01-02-milestone-4-exercise-engine-design.md`
- Types: `src/lib/types/app.types.ts` - `Exercise` interface
- SRS: `src/lib/srs/` - `calculateNextReview`, `Quality` type
- Hook: `src/lib/hooks/useSRS.ts` - `recordAnswer(exerciseId, quality)`
