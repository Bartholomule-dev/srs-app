# Phase 2.7: Exercise Variety Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add fill-in and predict-output exercise types with user-selectable experience levels that control exercise mix ratios.

**Architecture:** Database-first approach. Add schema changes, then types, then components, then selection algorithm. TDD for all logic. Content creation after infrastructure complete.

**Tech Stack:** Next.js 16, TypeScript 5, Supabase (PostgreSQL), Vitest, React 19, Tailwind CSS 4

---

## Pre-Implementation Checklist

- [ ] Read design doc: `docs/plans/2026-01-06-phase27-exercise-variety-design.md`
- [ ] Ensure local Supabase running: `pnpm db:start`
- [ ] Ensure tests passing: `pnpm test`
- [ ] Create feature branch: `git checkout -b feat/phase27-exercise-variety`

---

## Task 1: Database Migration - Add experience_level to profiles

**Files:**
- Create: `supabase/migrations/20260106200001_add_experience_level.sql`

**Step 1: Write the migration**

```sql
-- Add experience_level column to profiles
-- Values: 'refresher' (default), 'learning', 'beginner'

ALTER TABLE profiles
ADD COLUMN experience_level TEXT
DEFAULT 'refresher'
CHECK (experience_level IN ('refresher', 'learning', 'beginner'));

-- Comment for documentation
COMMENT ON COLUMN profiles.experience_level IS 'User experience level: refresher (80% write), learning (50% write), beginner (30% write)';
```

**Step 2: Apply migration locally**

Run: `pnpm db:reset`
Expected: Migration applies successfully

**Step 3: Verify column exists**

Run: `pnpm supabase db dump --local | grep experience_level`
Expected: Shows `experience_level text DEFAULT 'refresher'`

**Step 4: Commit**

```bash
git add supabase/migrations/20260106200001_add_experience_level.sql
git commit -m "feat(db): add experience_level column to profiles"
```

---

## Task 2: Database Migration - Add code column to exercises

**Files:**
- Create: `supabase/migrations/20260106200002_add_code_to_exercises.sql`

**Step 1: Write the migration**

```sql
-- Add code column for predict-output exercises
-- This stores the read-only code snippet users must predict output for

ALTER TABLE exercises
ADD COLUMN code TEXT;

-- Comment for documentation
COMMENT ON COLUMN exercises.code IS 'Code snippet for predict-output exercises (read-only display)';
```

**Step 2: Apply migration locally**

Run: `pnpm db:reset`
Expected: Migration applies successfully

**Step 3: Commit**

```bash
git add supabase/migrations/20260106200002_add_code_to_exercises.sql
git commit -m "feat(db): add code column to exercises for predict-output type"
```

---

## Task 3: Regenerate Database Types

**Files:**
- Modify: `src/lib/types/database.generated.ts` (auto-generated)

**Step 1: Generate types from local database**

Run: `pnpm supabase gen types typescript --local > src/lib/types/database.generated.ts`
Expected: File regenerated with new columns

**Step 2: Verify new fields present**

Run: `grep -E "(experience_level|code:)" src/lib/types/database.generated.ts`
Expected: Both fields appear in output

**Step 3: Run type check**

Run: `pnpm typecheck`
Expected: May have errors (we'll fix in next tasks)

**Step 4: Commit**

```bash
git add src/lib/types/database.generated.ts
git commit -m "chore(types): regenerate database types with new columns"
```

---

## Task 4: Add ExperienceLevel Type

**Files:**
- Modify: `src/lib/types/app.types.ts`

**Step 1: Add ExperienceLevel type and update Profile interface**

Find the `Profile` interface and add the type + field. Add after existing type definitions:

```typescript
// Experience level for exercise type ratios
export type ExperienceLevel = 'refresher' | 'learning' | 'beginner';

// Experience level configuration
export const EXPERIENCE_LEVEL_RATIOS = {
  refresher: { write: 0.8, 'fill-in': 0.1, predict: 0.1 },
  learning: { write: 0.5, 'fill-in': 0.25, predict: 0.25 },
  beginner: { write: 0.3, 'fill-in': 0.35, predict: 0.35 },
} as const;
```

Then update Profile interface to include:

```typescript
experienceLevel: ExperienceLevel;
```

**Step 2: Update Exercise interface**

Add to the Exercise interface:

```typescript
code?: string; // For predict-output exercises
```

**Step 3: Run type check**

Run: `pnpm typecheck`
Expected: Errors in mappers.ts (we'll fix next)

**Step 4: Commit**

```bash
git add src/lib/types/app.types.ts
git commit -m "feat(types): add ExperienceLevel type and Exercise.code field"
```

---

## Task 5: Update Supabase Mappers

**Files:**
- Modify: `src/lib/supabase/mappers.ts`

**Step 1: Update mapProfile function**

Add `experienceLevel` to the mapping:

```typescript
experienceLevel: (db.experience_level as ExperienceLevel) ?? 'refresher',
```

**Step 2: Update mapExercise function**

Add `code` to the mapping:

```typescript
code: db.code ?? undefined,
```

**Step 3: Update toDbProfileUpdate function**

Add `experience_level` to the update mapping:

```typescript
experience_level: profile.experienceLevel,
```

**Step 4: Add import for ExperienceLevel**

Ensure ExperienceLevel is imported from app.types.ts.

**Step 5: Run type check**

Run: `pnpm typecheck`
Expected: PASS

**Step 6: Commit**

```bash
git add src/lib/supabase/mappers.ts
git commit -m "feat(mappers): add experienceLevel and code field mappings"
```

---

## Task 6: Update YAML Types

**Files:**
- Modify: `src/lib/exercise/yaml-types.ts`

**Step 1: Add code field to YamlExercise interface**

```typescript
code?: string; // For predict-output exercises
```

**Step 2: Run type check**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/exercise/yaml-types.ts
git commit -m "feat(types): add code field to YamlExercise interface"
```

---

## Task 7: Update JSON Schema for Exercises

**Files:**
- Modify: `exercises/schema.json`

**Step 1: Add code field to schema**

Add to the properties section:

```json
"code": {
  "type": "string",
  "description": "Code snippet for predict-output exercises (read-only display)"
}
```

**Step 2: Validate schema is valid JSON**

Run: `node -e "require('./exercises/schema.json')"`
Expected: No errors

**Step 3: Commit**

```bash
git add exercises/schema.json
git commit -m "feat(schema): add code field for predict-output exercises"
```

---

## Task 8: TDD - Predict Answer Matching (Write Tests)

**Files:**
- Modify: `src/lib/exercise/matching.ts`
- Create: `tests/unit/exercise/predict-matching.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { checkPredictAnswer } from '@/lib/exercise/matching';

describe('checkPredictAnswer', () => {
  it('returns true for exact match', () => {
    expect(checkPredictAnswer('10', '10')).toBe(true);
  });

  it('trims whitespace from user answer', () => {
    expect(checkPredictAnswer('  10  ', '10')).toBe(true);
  });

  it('trims trailing newlines', () => {
    expect(checkPredictAnswer('10\n', '10')).toBe(true);
    expect(checkPredictAnswer('10\n\n', '10')).toBe(true);
  });

  it('preserves case sensitivity (Python is case-sensitive)', () => {
    expect(checkPredictAnswer('True', 'True')).toBe(true);
    expect(checkPredictAnswer('true', 'True')).toBe(false);
    expect(checkPredictAnswer('TRUE', 'True')).toBe(false);
  });

  it('returns false for different values', () => {
    expect(checkPredictAnswer('10', '20')).toBe(false);
    expect(checkPredictAnswer('10', '10.0')).toBe(false);
  });

  it('handles empty strings', () => {
    expect(checkPredictAnswer('', '')).toBe(true);
    expect(checkPredictAnswer('  ', '')).toBe(true);
    expect(checkPredictAnswer('', 'something')).toBe(false);
  });

  it('handles multi-line output', () => {
    expect(checkPredictAnswer('hello\nworld', 'hello\nworld')).toBe(true);
    expect(checkPredictAnswer('hello\nworld\n', 'hello\nworld')).toBe(true);
  });

  it('checks accepted alternatives', () => {
    expect(checkPredictAnswer('10', '10', ['ten', '10'])).toBe(true);
    expect(checkPredictAnswer('ten', '10', ['ten', '10'])).toBe(true);
    expect(checkPredictAnswer('TEN', '10', ['ten', '10'])).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test tests/unit/exercise/predict-matching.test.ts`
Expected: FAIL - `checkPredictAnswer is not a function`

**Step 3: Commit failing tests**

```bash
git add tests/unit/exercise/predict-matching.test.ts
git commit -m "test: add failing tests for checkPredictAnswer"
```

---

## Task 9: TDD - Predict Answer Matching (Implementation)

**Files:**
- Modify: `src/lib/exercise/matching.ts`

**Step 1: Implement checkPredictAnswer**

Add to matching.ts:

```typescript
/**
 * Check if user's predicted output matches expected output.
 * Uses normalized matching: trim whitespace, remove trailing newlines, case-sensitive.
 */
export function checkPredictAnswer(
  userAnswer: string,
  expectedAnswer: string,
  acceptedAlternatives: string[] = []
): boolean {
  const normalize = (s: string): string => {
    return s.trim().replace(/\n+$/, '');
  };

  const normalizedUser = normalize(userAnswer);
  const normalizedExpected = normalize(expectedAnswer);

  if (normalizedUser === normalizedExpected) {
    return true;
  }

  return acceptedAlternatives.some(
    (alt) => normalize(alt) === normalizedUser
  );
}
```

**Step 2: Export from index**

Add to `src/lib/exercise/index.ts`:

```typescript
export { checkPredictAnswer } from './matching';
```

**Step 3: Run tests to verify they pass**

Run: `pnpm test tests/unit/exercise/predict-matching.test.ts`
Expected: PASS (9 tests)

**Step 4: Run all tests**

Run: `pnpm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/lib/exercise/matching.ts src/lib/exercise/index.ts
git commit -m "feat(matching): implement checkPredictAnswer with normalization"
```

---

## Task 10: TDD - Type-Balanced Selection (Write Tests)

**Files:**
- Create: `tests/unit/srs/type-balanced-selection.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { selectExerciseByType, getUnderrepresentedType } from '@/lib/srs/concept-algorithm';
import type { Exercise, ExerciseType } from '@/lib/types/app.types';

const mockExercises: Exercise[] = [
  { id: '1', exerciseType: 'write', subconcept: 'variables' } as Exercise,
  { id: '2', exerciseType: 'write', subconcept: 'variables' } as Exercise,
  { id: '3', exerciseType: 'fill-in', subconcept: 'variables' } as Exercise,
  { id: '4', exerciseType: 'predict', subconcept: 'variables' } as Exercise,
];

describe('getUnderrepresentedType', () => {
  it('returns fill-in when session has only write exercises', () => {
    const sessionHistory: ExerciseType[] = ['write', 'write', 'write'];
    const ratios = { write: 0.5, 'fill-in': 0.25, predict: 0.25 };

    const result = getUnderrepresentedType(sessionHistory, ratios);
    expect(['fill-in', 'predict']).toContain(result);
  });

  it('returns write when session has no write exercises but needs them', () => {
    const sessionHistory: ExerciseType[] = ['fill-in', 'predict', 'fill-in'];
    const ratios = { write: 0.8, 'fill-in': 0.1, predict: 0.1 };

    const result = getUnderrepresentedType(sessionHistory, ratios);
    expect(result).toBe('write');
  });

  it('returns null when ratios are approximately met', () => {
    const sessionHistory: ExerciseType[] = ['write', 'write', 'write', 'write', 'fill-in', 'predict'];
    const ratios = { write: 0.8, 'fill-in': 0.1, predict: 0.1 };

    const result = getUnderrepresentedType(sessionHistory, ratios);
    // Either null or any type is acceptable when balanced
    expect(result === null || ['write', 'fill-in', 'predict'].includes(result!)).toBe(true);
  });

  it('handles empty session history', () => {
    const sessionHistory: ExerciseType[] = [];
    const ratios = { write: 0.5, 'fill-in': 0.25, predict: 0.25 };

    const result = getUnderrepresentedType(sessionHistory, ratios);
    // Any type is valid for empty session
    expect(result === null || ['write', 'fill-in', 'predict'].includes(result!)).toBe(true);
  });
});

describe('selectExerciseByType', () => {
  it('prefers exercises of the underrepresented type', () => {
    const sessionHistory: ExerciseType[] = ['write', 'write', 'write'];
    const ratios = { write: 0.5, 'fill-in': 0.25, predict: 0.25 };

    const result = selectExerciseByType(mockExercises, sessionHistory, ratios);
    expect(result).not.toBeNull();
    expect(['fill-in', 'predict']).toContain(result!.exerciseType);
  });

  it('falls back to any exercise when preferred type unavailable', () => {
    const writeOnlyExercises = mockExercises.filter(e => e.exerciseType === 'write');
    const sessionHistory: ExerciseType[] = ['write', 'write'];
    const ratios = { write: 0.3, 'fill-in': 0.35, predict: 0.35 };

    const result = selectExerciseByType(writeOnlyExercises, sessionHistory, ratios);
    expect(result).not.toBeNull();
    expect(result!.exerciseType).toBe('write');
  });

  it('returns null when no exercises available', () => {
    const result = selectExerciseByType([], [], { write: 0.5, 'fill-in': 0.25, predict: 0.25 });
    expect(result).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test tests/unit/srs/type-balanced-selection.test.ts`
Expected: FAIL - functions not exported

**Step 3: Commit failing tests**

```bash
git add tests/unit/srs/type-balanced-selection.test.ts
git commit -m "test: add failing tests for type-balanced selection"
```

---

## Task 11: TDD - Type-Balanced Selection (Implementation)

**Files:**
- Modify: `src/lib/srs/concept-algorithm.ts`

**Step 1: Add getUnderrepresentedType function**

```typescript
import type { ExerciseType, ExperienceLevel } from '@/lib/types/app.types';

type TypeRatios = Record<'write' | 'fill-in' | 'predict', number>;

/**
 * Determine which exercise type is most underrepresented in the session.
 * Returns null if ratios are approximately balanced.
 */
export function getUnderrepresentedType(
  sessionHistory: ExerciseType[],
  targetRatios: TypeRatios
): ExerciseType | null {
  if (sessionHistory.length === 0) {
    // For empty session, prefer write (core skill)
    return 'write';
  }

  const counts: Record<string, number> = { write: 0, 'fill-in': 0, predict: 0 };
  for (const type of sessionHistory) {
    if (type in counts) {
      counts[type]++;
    }
  }

  const total = sessionHistory.length;
  let mostUnderrepresented: ExerciseType | null = null;
  let maxDeficit = 0;

  for (const [type, targetRatio] of Object.entries(targetRatios)) {
    const actualRatio = counts[type] / total;
    const deficit = targetRatio - actualRatio;

    if (deficit > maxDeficit) {
      maxDeficit = deficit;
      mostUnderrepresented = type as ExerciseType;
    }
  }

  // Only return if deficit is significant (>10%)
  return maxDeficit > 0.1 ? mostUnderrepresented : null;
}

/**
 * Select an exercise preferring the underrepresented type.
 * Falls back to any available exercise if preferred type unavailable.
 */
export function selectExerciseByType(
  exercises: Exercise[],
  sessionHistory: ExerciseType[],
  targetRatios: TypeRatios
): Exercise | null {
  if (exercises.length === 0) {
    return null;
  }

  const preferredType = getUnderrepresentedType(sessionHistory, targetRatios);

  if (preferredType) {
    const preferredExercises = exercises.filter(e => e.exerciseType === preferredType);
    if (preferredExercises.length > 0) {
      // Random selection among preferred type
      return preferredExercises[Math.floor(Math.random() * preferredExercises.length)];
    }
  }

  // Fallback: random from all available
  return exercises[Math.floor(Math.random() * exercises.length)];
}
```

**Step 2: Export functions**

Add exports to `src/lib/srs/index.ts`:

```typescript
export { getUnderrepresentedType, selectExerciseByType } from './concept-algorithm';
```

**Step 3: Run tests to verify they pass**

Run: `pnpm test tests/unit/srs/type-balanced-selection.test.ts`
Expected: PASS (7 tests)

**Step 4: Run all tests**

Run: `pnpm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/lib/srs/concept-algorithm.ts src/lib/srs/index.ts
git commit -m "feat(srs): implement type-balanced exercise selection"
```

---

## Task 12: Create PredictOutputExercise Component

**Files:**
- Create: `src/components/exercise/PredictOutputExercise.tsx`

**Step 1: Create the component**

```tsx
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PredictOutputExerciseProps {
  code: string;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export function PredictOutputExercise({
  code,
  onSubmit,
  disabled = false,
}: PredictOutputExerciseProps) {
  const [answer, setAnswer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = useCallback(() => {
    if (answer.trim() && !disabled) {
      onSubmit(answer);
    }
  }, [answer, disabled, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="space-y-4">
      {/* Code display */}
      <div className="rounded-lg bg-bg-surface-2 border border-border-subtle overflow-hidden">
        <div className="px-4 py-2 bg-bg-surface-3 border-b border-border-subtle">
          <span className="text-xs text-text-tertiary font-mono">Python</span>
        </div>
        <pre className="p-4 font-mono text-sm text-text-primary overflow-x-auto">
          <code>{code}</code>
        </pre>
      </div>

      {/* Answer input */}
      <div className="space-y-2">
        <label className="text-sm text-text-secondary">
          What will print?
        </label>
        <input
          ref={inputRef}
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Enter the exact console output"
          className={cn(
            'w-full px-4 py-3 rounded-lg font-mono text-sm',
            'bg-bg-surface-1 border border-border-subtle',
            'text-text-primary placeholder:text-text-tertiary',
            'focus:outline-none focus:ring-2 focus:ring-accent-primary/50',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        />
        <p className="text-xs text-text-tertiary">
          Enter the exact console output (case-sensitive)
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Export from index**

Add to `src/components/exercise/index.ts`:

```typescript
export { PredictOutputExercise } from './PredictOutputExercise';
```

**Step 3: Run type check**

Run: `pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/exercise/PredictOutputExercise.tsx src/components/exercise/index.ts
git commit -m "feat(components): create PredictOutputExercise component"
```

---

## Task 13: Write PredictOutputExercise Component Tests

**Files:**
- Create: `tests/component/exercise/PredictOutputExercise.test.tsx`

**Step 1: Write tests**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PredictOutputExercise } from '@/components/exercise/PredictOutputExercise';

describe('PredictOutputExercise', () => {
  const defaultProps = {
    code: 'x = 5\nprint(x * 2)',
    onSubmit: vi.fn(),
  };

  it('renders code in read-only block', () => {
    render(<PredictOutputExercise {...defaultProps} />);

    expect(screen.getByText(/x = 5/)).toBeInTheDocument();
    expect(screen.getByText(/print\(x \* 2\)/)).toBeInTheDocument();
  });

  it('renders input field with placeholder', () => {
    render(<PredictOutputExercise {...defaultProps} />);

    const input = screen.getByPlaceholderText('Enter the exact console output');
    expect(input).toBeInTheDocument();
  });

  it('displays "What will print?" label', () => {
    render(<PredictOutputExercise {...defaultProps} />);

    expect(screen.getByText('What will print?')).toBeInTheDocument();
  });

  it('calls onSubmit when Enter is pressed', async () => {
    const onSubmit = vi.fn();
    render(<PredictOutputExercise {...defaultProps} onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText('Enter the exact console output');
    await userEvent.type(input, '10{enter}');

    expect(onSubmit).toHaveBeenCalledWith('10');
  });

  it('does not submit empty answer', async () => {
    const onSubmit = vi.fn();
    render(<PredictOutputExercise {...defaultProps} onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText('Enter the exact console output');
    await userEvent.type(input, '{enter}');

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables input when disabled prop is true', () => {
    render(<PredictOutputExercise {...defaultProps} disabled />);

    const input = screen.getByPlaceholderText('Enter the exact console output');
    expect(input).toBeDisabled();
  });

  it('focuses input on mount', () => {
    render(<PredictOutputExercise {...defaultProps} />);

    const input = screen.getByPlaceholderText('Enter the exact console output');
    expect(document.activeElement).toBe(input);
  });
});
```

**Step 2: Run tests**

Run: `pnpm test tests/component/exercise/PredictOutputExercise.test.tsx`
Expected: PASS (7 tests)

**Step 3: Commit**

```bash
git add tests/component/exercise/PredictOutputExercise.test.tsx
git commit -m "test: add PredictOutputExercise component tests"
```

---

## Task 14: Update ExerciseCard for Predict Type

**Files:**
- Modify: `src/components/exercise/ExerciseCard.tsx`

**Step 1: Import PredictOutputExercise and checkPredictAnswer**

Add imports at top:

```typescript
import { PredictOutputExercise } from './PredictOutputExercise';
import { checkPredictAnswer } from '@/lib/exercise/matching';
```

**Step 2: Add handlePredictSubmit handler**

Add after existing handlers (similar to handleFillInSubmit):

```typescript
const handlePredictSubmit = useCallback((answer: string) => {
  if (startTime === null) setStartTime(Date.now());
  const isCorrect = checkPredictAnswer(
    answer,
    exercise.expectedAnswer,
    exercise.acceptedSolutions
  );
  setUserAnswer(answer);
  setAnswerResult({ isCorrect, usedAstMatch: false });
  setPhase('feedback');
}, [exercise.expectedAnswer, exercise.acceptedSolutions, startTime]);
```

**Step 3: Add predict type to render logic**

Find the exercise type conditional rendering and add predict case:

```tsx
{exercise.exerciseType === 'predict' && exercise.code ? (
  <PredictOutputExercise
    code={exercise.code}
    onSubmit={handlePredictSubmit}
    disabled={phase !== 'answering'}
  />
) : exercise.exerciseType === 'fill-in' && exercise.template ? (
  // ... existing fill-in rendering
) : (
  // ... existing write rendering
)}
```

**Step 4: Run type check**

Run: `pnpm typecheck`
Expected: PASS

**Step 5: Run existing ExerciseCard tests**

Run: `pnpm test tests/component/exercise/ExerciseCard.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/exercise/ExerciseCard.tsx
git commit -m "feat(ExerciseCard): add predict-output exercise type support"
```

---

## Task 15: Add ExerciseCard Predict Type Tests

**Files:**
- Modify: `tests/component/exercise/ExerciseCard.test.tsx`

**Step 1: Add predict exercise fixture**

Add to test file:

```typescript
const predictExercise: Exercise = {
  id: 'predict-1',
  slug: 'test-predict',
  title: 'Test Predict',
  exerciseType: 'predict',
  code: 'x = 5\nprint(x * 2)',
  expectedAnswer: '10',
  acceptedSolutions: [],
  // ... other required fields
};
```

**Step 2: Add predict tests**

```typescript
describe('predict-output exercises', () => {
  it('renders PredictOutputExercise for predict type', () => {
    render(<ExerciseCard exercise={predictExercise} onComplete={vi.fn()} />);

    expect(screen.getByText('What will print?')).toBeInTheDocument();
    expect(screen.getByText(/x = 5/)).toBeInTheDocument();
  });

  it('grades predict answer correctly', async () => {
    const onComplete = vi.fn();
    render(<ExerciseCard exercise={predictExercise} onComplete={onComplete} />);

    const input = screen.getByPlaceholderText('Enter the exact console output');
    await userEvent.type(input, '10{enter}');

    // Should show correct feedback
    expect(screen.getByText(/correct/i)).toBeInTheDocument();
  });

  it('grades predict answer incorrectly', async () => {
    const onComplete = vi.fn();
    render(<ExerciseCard exercise={predictExercise} onComplete={onComplete} />);

    const input = screen.getByPlaceholderText('Enter the exact console output');
    await userEvent.type(input, '20{enter}');

    // Should show incorrect feedback
    expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
  });
});
```

**Step 3: Run tests**

Run: `pnpm test tests/component/exercise/ExerciseCard.test.tsx`
Expected: PASS

**Step 4: Commit**

```bash
git add tests/component/exercise/ExerciseCard.test.tsx
git commit -m "test: add predict-output exercise tests to ExerciseCard"
```

---

## Task 16: Update useProfile Hook for Experience Level

**Files:**
- Modify: `src/lib/hooks/useProfile.ts`

**Step 1: Add updateExperienceLevel function**

Add to the hook return:

```typescript
const updateExperienceLevel = useCallback(async (level: ExperienceLevel) => {
  if (!profile) return;

  const { error } = await supabase
    .from('profiles')
    .update({ experience_level: level })
    .eq('id', profile.id);

  if (error) {
    console.error('Failed to update experience level:', error);
    return;
  }

  // Optimistically update local state
  setProfile(prev => prev ? { ...prev, experienceLevel: level } : null);
}, [profile, supabase]);
```

**Step 2: Return from hook**

Add to return object:

```typescript
return {
  // ... existing returns
  updateExperienceLevel,
};
```

**Step 3: Run type check**

Run: `pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/hooks/useProfile.ts
git commit -m "feat(useProfile): add updateExperienceLevel function"
```

---

## Task 17: TDD - useProfile Experience Level Tests

**Files:**
- Modify: `tests/unit/hooks/useProfile.test.tsx`

**Step 1: Add experience level tests**

```typescript
describe('updateExperienceLevel', () => {
  it('updates experience level in database', async () => {
    const { result } = renderHook(() => useProfile());

    // Wait for initial load
    await waitFor(() => expect(result.current.profile).not.toBeNull());

    await act(async () => {
      await result.current.updateExperienceLevel('beginner');
    });

    expect(result.current.profile?.experienceLevel).toBe('beginner');
  });
});
```

**Step 2: Run tests**

Run: `pnpm test tests/unit/hooks/useProfile.test.tsx`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/unit/hooks/useProfile.test.tsx
git commit -m "test: add experience level tests to useProfile"
```

---

## Task 18: Integrate Type-Balanced Selection into useConceptSession

**Files:**
- Modify: `src/lib/hooks/useConceptSession.ts`

**Step 1: Import new functions and types**

```typescript
import { selectExerciseByType } from '@/lib/srs/concept-algorithm';
import { EXPERIENCE_LEVEL_RATIOS, type ExperienceLevel } from '@/lib/types/app.types';
```

**Step 2: Add experienceLevel parameter**

Update hook signature or get from profile:

```typescript
// Add to hook state
const [sessionTypeHistory, setSessionTypeHistory] = useState<ExerciseType[]>([]);
```

**Step 3: Update exercise selection logic**

In the selectNextExercise function, wrap with type-balanced selection:

```typescript
const selectNextExercise = useCallback((
  exercises: Exercise[],
  experienceLevel: ExperienceLevel = 'refresher'
) => {
  const ratios = EXPERIENCE_LEVEL_RATIOS[experienceLevel];
  const selected = selectExerciseByType(exercises, sessionTypeHistory, ratios);

  if (selected) {
    setSessionTypeHistory(prev => [...prev, selected.exerciseType]);
  }

  return selected;
}, [sessionTypeHistory]);
```

**Step 4: Run type check**

Run: `pnpm typecheck`
Expected: PASS

**Step 5: Run session tests**

Run: `pnpm test tests/unit/hooks/useConceptSession.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add src/lib/hooks/useConceptSession.ts
git commit -m "feat(useConceptSession): integrate type-balanced exercise selection"
```

---

## Task 19: Update YAML Validation Script

**Files:**
- Modify: `scripts/validate-exercises.ts`

**Step 1: Add type-specific validation**

Add validation logic:

```typescript
// Validate type-specific required fields
if (exercise.type === 'predict' && !exercise.code) {
  errors.push(`${exercise.slug}: predict type requires 'code' field`);
}

if (exercise.type === 'fill-in') {
  if (!exercise.template) {
    errors.push(`${exercise.slug}: fill-in type requires 'template' field`);
  }
  if (exercise.blank_position === undefined) {
    errors.push(`${exercise.slug}: fill-in type requires 'blank_position' field`);
  }
}
```

**Step 2: Run validation**

Run: `pnpm run validate:exercises`
Expected: PASS (no predict/fill-in exercises yet)

**Step 3: Commit**

```bash
git add scripts/validate-exercises.ts
git commit -m "feat(validation): add type-specific field validation"
```

---

## Task 20: Update Import Script for Code Field

**Files:**
- Modify: `scripts/import-exercises.ts`

**Step 1: Add code field to import mapping**

Find the exercise mapping and add:

```typescript
code: exercise.code ?? null,
```

**Step 2: Run import (dry run)**

Run: `pnpm db:import-exercises --dry-run`
Expected: No errors

**Step 3: Commit**

```bash
git add scripts/import-exercises.ts
git commit -m "feat(import): add code field mapping for predict exercises"
```

---

## Task 21: Create Experience Level Onboarding Component

**Files:**
- Create: `src/components/onboarding/ExperienceLevelSelector.tsx`

**Step 1: Create the component**

```tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { ExperienceLevel } from '@/lib/types/app.types';

interface ExperienceLevelSelectorProps {
  onSelect: (level: ExperienceLevel) => void;
  loading?: boolean;
}

const LEVELS = [
  {
    value: 'refresher' as const,
    label: 'Shaking off rust',
    description: 'I know Python but need to rebuild muscle memory',
    icon: '🔄',
  },
  {
    value: 'learning' as const,
    label: 'Building skills',
    description: "I'm still learning Python fundamentals",
    icon: '📚',
  },
  {
    value: 'beginner' as const,
    label: 'New to Python',
    description: "I'm just getting started with Python",
    icon: '🌱',
  },
];

export function ExperienceLevelSelector({
  onSelect,
  loading = false,
}: ExperienceLevelSelectorProps) {
  const [selected, setSelected] = useState<ExperienceLevel | null>(null);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-display font-semibold text-text-primary">
          How would you describe your Python experience?
        </h2>
        <p className="mt-2 text-text-secondary">
          This helps us personalize your practice sessions
        </p>
      </div>

      <div className="space-y-3">
        {LEVELS.map((level) => (
          <button
            key={level.value}
            onClick={() => setSelected(level.value)}
            className={cn(
              'w-full p-4 rounded-lg border text-left transition-all',
              'hover:border-accent-primary/50',
              selected === level.value
                ? 'border-accent-primary bg-accent-primary/10'
                : 'border-border-subtle bg-bg-surface-1'
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{level.icon}</span>
              <div>
                <div className="font-medium text-text-primary">{level.label}</div>
                <div className="text-sm text-text-secondary">{level.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Button
        onClick={() => selected && onSelect(selected)}
        disabled={!selected || loading}
        className="w-full"
      >
        {loading ? 'Saving...' : 'Continue'}
      </Button>
    </div>
  );
}
```

**Step 2: Add cn import**

```typescript
import { cn } from '@/lib/utils';
```

**Step 3: Export from components**

Create or update `src/components/onboarding/index.ts`:

```typescript
export { ExperienceLevelSelector } from './ExperienceLevelSelector';
```

**Step 4: Run type check**

Run: `pnpm typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/onboarding/
git commit -m "feat(onboarding): create ExperienceLevelSelector component"
```

---

## Task 22: Create Content - Foundations Fill-in Exercises (8)

**Files:**
- Modify: `exercises/python/foundations.yaml`

**Step 1: Add fill-in exercises**

Add to foundations.yaml:

```yaml
# Fill-in exercises for foundations

- slug: variable-assign-fill
  title: Variable Assignment
  type: fill-in
  difficulty: 1
  concept: foundations
  subconcept: variables
  level: intro
  prereqs: []
  pattern: assignment
  objective: Complete variable assignment syntax
  prompt: Complete the code to assign the value 42 to a variable named answer
  template: "answer ___ 42"
  blank_position: 0
  expected_answer: "="
  accepted_solutions: ["="]
  hints:
    - What operator assigns a value to a variable?
  tags: [variables, assignment]

- slug: variable-naming-fill
  title: Variable Naming
  type: fill-in
  difficulty: 1
  concept: foundations
  subconcept: variables
  level: practice
  prereqs: []
  pattern: assignment
  objective: Use valid Python variable naming
  prompt: Complete the variable name following Python conventions
  template: "___count = 10"
  blank_position: 0
  expected_answer: "user_"
  accepted_solutions: ["user_", "item_", "total_"]
  hints:
    - Python uses snake_case for variable names
  tags: [variables, naming]

- slug: operator-addition-fill
  title: Addition Operator
  type: fill-in
  difficulty: 1
  concept: foundations
  subconcept: operators
  level: intro
  prereqs: [variables]
  pattern: arithmetic
  objective: Use the addition operator
  prompt: Complete the expression to add x and y
  template: "result = x ___ y"
  blank_position: 0
  expected_answer: "+"
  accepted_solutions: ["+"]
  hints:
    - Which operator adds two numbers?
  tags: [operators, arithmetic]

- slug: operator-floor-division-fill
  title: Floor Division
  type: fill-in
  difficulty: 2
  concept: foundations
  subconcept: operators
  level: practice
  prereqs: [variables]
  pattern: arithmetic
  objective: Use floor division operator
  prompt: Complete the expression for integer division (discard remainder)
  template: "result = 17 ___ 5  # result is 3"
  blank_position: 0
  expected_answer: "//"
  accepted_solutions: ["//"]
  hints:
    - Floor division uses two forward slashes
  tags: [operators, arithmetic]

- slug: expression-and-fill
  title: Boolean AND
  type: fill-in
  difficulty: 1
  concept: foundations
  subconcept: expressions
  level: intro
  prereqs: [operators]
  pattern: boolean
  objective: Use the logical AND operator
  prompt: Complete the boolean expression
  template: "is_valid = has_name ___ has_email"
  blank_position: 0
  expected_answer: "and"
  accepted_solutions: ["and"]
  hints:
    - Python uses the word 'and' for logical AND
  tags: [expressions, boolean]

- slug: expression-not-fill
  title: Boolean NOT
  type: fill-in
  difficulty: 1
  concept: foundations
  subconcept: expressions
  level: practice
  prereqs: [operators]
  pattern: boolean
  objective: Use the logical NOT operator
  prompt: Complete the expression to invert the boolean
  template: "is_invalid = ___ is_valid"
  blank_position: 0
  expected_answer: "not"
  accepted_solutions: ["not"]
  hints:
    - Python uses 'not' to negate a boolean
  tags: [expressions, boolean]

- slug: io-print-fill
  title: Print Function
  type: fill-in
  difficulty: 1
  concept: foundations
  subconcept: io
  level: intro
  prereqs: [variables]
  pattern: output
  objective: Use the print function
  prompt: Complete the code to display the message
  template: "___(\"Hello, World!\")"
  blank_position: 0
  expected_answer: "print"
  accepted_solutions: ["print"]
  hints:
    - Which function outputs text to the console?
  tags: [io, print]

- slug: io-input-fill
  title: Input Function
  type: fill-in
  difficulty: 1
  concept: foundations
  subconcept: io
  level: intro
  prereqs: [variables]
  pattern: input
  objective: Use the input function
  prompt: Complete the code to get user input
  template: "name = ___(\"Enter your name: \")"
  blank_position: 0
  expected_answer: "input"
  accepted_solutions: ["input"]
  hints:
    - Which function reads text from the user?
  tags: [io, input]
```

**Step 2: Validate exercises**

Run: `pnpm run validate:exercises`
Expected: PASS

**Step 3: Commit**

```bash
git add exercises/python/foundations.yaml
git commit -m "content: add 8 fill-in exercises for foundations"
```

---

## Task 23: Create Content - Foundations Predict Exercises (8)

**Files:**
- Modify: `exercises/python/foundations.yaml`

**Step 1: Add predict exercises**

```yaml
# Predict-output exercises for foundations

- slug: variable-predict-assign
  title: Variable Value
  type: predict
  difficulty: 1
  concept: foundations
  subconcept: variables
  level: intro
  prereqs: []
  pattern: assignment
  objective: Predict variable value after assignment
  prompt: What does this code print?
  code: |
    x = 10
    print(x)
  expected_answer: "10"
  accepted_solutions: []
  hints:
    - Variables store the value assigned to them
  tags: [variables, assignment]

- slug: variable-predict-reassign
  title: Variable Reassignment
  type: predict
  difficulty: 1
  concept: foundations
  subconcept: variables
  level: practice
  prereqs: []
  pattern: assignment
  objective: Predict value after reassignment
  prompt: What does this code print?
  code: |
    x = 5
    x = 10
    print(x)
  expected_answer: "10"
  accepted_solutions: []
  hints:
    - Variables can be reassigned to new values
  tags: [variables, assignment]

- slug: operator-predict-modulo
  title: Modulo Result
  type: predict
  difficulty: 2
  concept: foundations
  subconcept: operators
  level: practice
  prereqs: [variables]
  pattern: arithmetic
  objective: Predict modulo operation result
  prompt: What does this code print?
  code: |
    result = 17 % 5
    print(result)
  expected_answer: "2"
  accepted_solutions: []
  hints:
    - Modulo returns the remainder of division
  tags: [operators, arithmetic]

- slug: operator-predict-floor
  title: Floor Division Result
  type: predict
  difficulty: 2
  concept: foundations
  subconcept: operators
  level: practice
  prereqs: [variables]
  pattern: arithmetic
  objective: Predict floor division result
  prompt: What does this code print?
  code: |
    result = 17 // 5
    print(result)
  expected_answer: "3"
  accepted_solutions: []
  hints:
    - Floor division discards the remainder
  tags: [operators, arithmetic]

- slug: expression-predict-and
  title: Boolean AND Result
  type: predict
  difficulty: 1
  concept: foundations
  subconcept: expressions
  level: intro
  prereqs: [operators]
  pattern: boolean
  objective: Predict boolean AND result
  prompt: What does this code print?
  code: |
    result = True and False
    print(result)
  expected_answer: "False"
  accepted_solutions: []
  hints:
    - AND requires both values to be True
  tags: [expressions, boolean]

- slug: expression-predict-or
  title: Boolean OR Result
  type: predict
  difficulty: 1
  concept: foundations
  subconcept: expressions
  level: practice
  prereqs: [operators]
  pattern: boolean
  objective: Predict boolean OR result
  prompt: What does this code print?
  code: |
    result = True or False
    print(result)
  expected_answer: "True"
  accepted_solutions: []
  hints:
    - OR returns True if either value is True
  tags: [expressions, boolean]

- slug: io-predict-print-concat
  title: Print Concatenation
  type: predict
  difficulty: 1
  concept: foundations
  subconcept: io
  level: practice
  prereqs: [variables]
  pattern: output
  objective: Predict print output with multiple arguments
  prompt: What does this code print?
  code: |
    name = "Alice"
    print("Hello", name)
  expected_answer: "Hello Alice"
  accepted_solutions: []
  hints:
    - print() separates arguments with spaces
  tags: [io, print]

- slug: io-predict-print-sep
  title: Print Separator
  type: predict
  difficulty: 2
  concept: foundations
  subconcept: io
  level: edge
  prereqs: [variables]
  pattern: output
  objective: Predict print output with custom separator
  prompt: What does this code print?
  code: |
    print("a", "b", "c", sep="-")
  expected_answer: "a-b-c"
  accepted_solutions: []
  hints:
    - The sep parameter changes what goes between arguments
  tags: [io, print]
```

**Step 2: Validate exercises**

Run: `pnpm run validate:exercises`
Expected: PASS

**Step 3: Commit**

```bash
git add exercises/python/foundations.yaml
git commit -m "content: add 8 predict exercises for foundations"
```

---

## Task 24: Create Content - Strings Fill-in Exercises (10)

**Files:**
- Modify: `exercises/python/strings.yaml`

**Step 1: Add fill-in exercises**

```yaml
# Fill-in exercises for strings

- slug: string-len-fill
  title: String Length
  type: fill-in
  difficulty: 1
  concept: strings
  subconcept: basics
  level: intro
  prereqs: [variables]
  pattern: built-in
  objective: Use len() to get string length
  prompt: Complete the code to get the length of the string
  template: "length = ___(text)"
  blank_position: 0
  expected_answer: "len"
  accepted_solutions: ["len"]
  hints:
    - Which built-in function returns the length?
  tags: [strings, len]

- slug: string-concat-fill
  title: String Concatenation
  type: fill-in
  difficulty: 1
  concept: strings
  subconcept: basics
  level: intro
  prereqs: [variables]
  pattern: concatenation
  objective: Concatenate strings
  prompt: Complete the code to join two strings
  template: "full = first ___ last"
  blank_position: 0
  expected_answer: "+"
  accepted_solutions: ["+"]
  hints:
    - Use the addition operator to join strings
  tags: [strings, concatenation]

- slug: string-index-first-fill
  title: First Character
  type: fill-in
  difficulty: 1
  concept: strings
  subconcept: indexing
  level: intro
  prereqs: [basics]
  pattern: indexing
  objective: Access first character
  prompt: Complete the code to get the first character
  template: "first = text[___]"
  blank_position: 0
  expected_answer: "0"
  accepted_solutions: ["0"]
  hints:
    - Python uses zero-based indexing
  tags: [strings, indexing]

- slug: string-index-last-fill
  title: Last Character
  type: fill-in
  difficulty: 1
  concept: strings
  subconcept: indexing
  level: practice
  prereqs: [basics]
  pattern: indexing
  objective: Access last character with negative index
  prompt: Complete the code to get the last character
  template: "last = text[___]"
  blank_position: 0
  expected_answer: "-1"
  accepted_solutions: ["-1"]
  hints:
    - Negative indices count from the end
  tags: [strings, indexing]

- slug: string-slice-start-fill
  title: Slice from Start
  type: fill-in
  difficulty: 2
  concept: strings
  subconcept: slicing
  level: intro
  prereqs: [indexing]
  pattern: slicing
  objective: Slice first N characters
  prompt: Complete the slice to get first 3 characters
  template: "first_three = text[___]"
  blank_position: 0
  expected_answer: ":3"
  accepted_solutions: [":3", "0:3"]
  hints:
    - Omitting start defaults to 0
  tags: [strings, slicing]

- slug: string-slice-end-fill
  title: Slice from End
  type: fill-in
  difficulty: 2
  concept: strings
  subconcept: slicing
  level: practice
  prereqs: [indexing]
  pattern: slicing
  objective: Slice last N characters
  prompt: Complete the slice to get last 3 characters
  template: "last_three = text[___]"
  blank_position: 0
  expected_answer: "-3:"
  accepted_solutions: ["-3:"]
  hints:
    - Negative indices work in slices too
  tags: [strings, slicing]

- slug: string-upper-fill
  title: Uppercase Method
  type: fill-in
  difficulty: 1
  concept: strings
  subconcept: methods
  level: intro
  prereqs: [basics]
  pattern: method-call
  objective: Convert to uppercase
  prompt: Complete the code to convert to uppercase
  template: "loud = text.___()"
  blank_position: 0
  expected_answer: "upper"
  accepted_solutions: ["upper"]
  hints:
    - Which string method converts to uppercase?
  tags: [strings, methods]

- slug: string-strip-fill
  title: Strip Whitespace
  type: fill-in
  difficulty: 1
  concept: strings
  subconcept: methods
  level: practice
  prereqs: [basics]
  pattern: method-call
  objective: Remove surrounding whitespace
  prompt: Complete the code to remove whitespace from both ends
  template: "clean = text.___()"
  blank_position: 0
  expected_answer: "strip"
  accepted_solutions: ["strip"]
  hints:
    - This method removes whitespace from both ends
  tags: [strings, methods]

- slug: fstring-basic-fill
  title: F-String Variable
  type: fill-in
  difficulty: 1
  concept: strings
  subconcept: fstrings
  level: intro
  prereqs: [basics]
  pattern: formatting
  objective: Use f-string for variable interpolation
  prompt: Complete the f-string to include the name variable
  template: "greeting = f\"Hello, {___}!\""
  blank_position: 0
  expected_answer: "name"
  accepted_solutions: ["name"]
  hints:
    - Put the variable name inside the curly braces
  tags: [strings, fstrings]

- slug: fstring-expression-fill
  title: F-String Expression
  type: fill-in
  difficulty: 2
  concept: strings
  subconcept: fstrings
  level: practice
  prereqs: [basics]
  pattern: formatting
  objective: Use expression in f-string
  prompt: Complete the f-string to show the doubled value
  template: "result = f\"Double is {x ___ 2}\""
  blank_position: 0
  expected_answer: "*"
  accepted_solutions: ["*"]
  hints:
    - F-strings can contain expressions
  tags: [strings, fstrings]
```

**Step 2: Validate**

Run: `pnpm run validate:exercises`
Expected: PASS

**Step 3: Commit**

```bash
git add exercises/python/strings.yaml
git commit -m "content: add 10 fill-in exercises for strings"
```

---

## Task 25: Create Content - Strings Predict Exercises (10)

**Files:**
- Modify: `exercises/python/strings.yaml`

**Step 1: Add predict exercises**

```yaml
# Predict-output exercises for strings

- slug: string-predict-len
  title: String Length
  type: predict
  difficulty: 1
  concept: strings
  subconcept: basics
  level: intro
  prereqs: [variables]
  pattern: built-in
  objective: Predict len() result
  prompt: What does this code print?
  code: |
    text = "hello"
    print(len(text))
  expected_answer: "5"
  accepted_solutions: []
  hints:
    - len() counts all characters
  tags: [strings, len]

- slug: string-predict-concat
  title: String Concatenation
  type: predict
  difficulty: 1
  concept: strings
  subconcept: basics
  level: practice
  prereqs: [variables]
  pattern: concatenation
  objective: Predict concatenation result
  prompt: What does this code print?
  code: |
    a = "Hello"
    b = "World"
    print(a + " " + b)
  expected_answer: "Hello World"
  accepted_solutions: []
  hints:
    - + joins strings exactly as they are
  tags: [strings, concatenation]

- slug: string-predict-index
  title: String Index
  type: predict
  difficulty: 1
  concept: strings
  subconcept: indexing
  level: intro
  prereqs: [basics]
  pattern: indexing
  objective: Predict character at index
  prompt: What does this code print?
  code: |
    text = "Python"
    print(text[2])
  expected_answer: "t"
  accepted_solutions: []
  hints:
    - Index 0 is 'P', index 1 is 'y'...
  tags: [strings, indexing]

- slug: string-predict-negative
  title: Negative Index
  type: predict
  difficulty: 2
  concept: strings
  subconcept: indexing
  level: practice
  prereqs: [basics]
  pattern: indexing
  objective: Predict negative index result
  prompt: What does this code print?
  code: |
    text = "Python"
    print(text[-2])
  expected_answer: "o"
  accepted_solutions: []
  hints:
    - -1 is last, -2 is second to last
  tags: [strings, indexing]

- slug: string-predict-slice
  title: String Slice
  type: predict
  difficulty: 2
  concept: strings
  subconcept: slicing
  level: intro
  prereqs: [indexing]
  pattern: slicing
  objective: Predict slice result
  prompt: What does this code print?
  code: |
    text = "Python"
    print(text[1:4])
  expected_answer: "yth"
  accepted_solutions: []
  hints:
    - Slice includes start, excludes end
  tags: [strings, slicing]

- slug: string-predict-reverse
  title: String Reverse
  type: predict
  difficulty: 2
  concept: strings
  subconcept: slicing
  level: practice
  prereqs: [indexing]
  pattern: slicing
  objective: Predict reverse slice result
  prompt: What does this code print?
  code: |
    text = "abc"
    print(text[::-1])
  expected_answer: "cba"
  accepted_solutions: []
  hints:
    - Step of -1 reverses the string
  tags: [strings, slicing]

- slug: string-predict-upper
  title: Uppercase Result
  type: predict
  difficulty: 1
  concept: strings
  subconcept: methods
  level: intro
  prereqs: [basics]
  pattern: method-call
  objective: Predict upper() result
  prompt: What does this code print?
  code: |
    text = "Hello"
    print(text.upper())
  expected_answer: "HELLO"
  accepted_solutions: []
  hints:
    - upper() converts all letters to uppercase
  tags: [strings, methods]

- slug: string-predict-replace
  title: Replace Result
  type: predict
  difficulty: 2
  concept: strings
  subconcept: methods
  level: practice
  prereqs: [basics]
  pattern: method-call
  objective: Predict replace() result
  prompt: What does this code print?
  code: |
    text = "hello world"
    print(text.replace("l", "L"))
  expected_answer: "heLLo worLd"
  accepted_solutions: []
  hints:
    - replace() changes all occurrences
  tags: [strings, methods]

- slug: fstring-predict-basic
  title: F-String Output
  type: predict
  difficulty: 1
  concept: strings
  subconcept: fstrings
  level: intro
  prereqs: [basics]
  pattern: formatting
  objective: Predict f-string output
  prompt: What does this code print?
  code: |
    name = "Alice"
    age = 30
    print(f"{name} is {age}")
  expected_answer: "Alice is 30"
  accepted_solutions: []
  hints:
    - Variables in {} are replaced with their values
  tags: [strings, fstrings]

- slug: fstring-predict-expr
  title: F-String Expression
  type: predict
  difficulty: 2
  concept: strings
  subconcept: fstrings
  level: practice
  prereqs: [basics]
  pattern: formatting
  objective: Predict f-string with expression
  prompt: What does this code print?
  code: |
    x = 5
    print(f"Double is {x * 2}")
  expected_answer: "Double is 10"
  accepted_solutions: []
  hints:
    - Expressions in {} are evaluated
  tags: [strings, fstrings]
```

**Step 2: Validate**

Run: `pnpm run validate:exercises`
Expected: PASS

**Step 3: Commit**

```bash
git add exercises/python/strings.yaml
git commit -m "content: add 10 predict exercises for strings"
```

---

## Task 26: Create Content - Numbers-Booleans Fill-in (12)

**Files:**
- Create or modify: `exercises/python/numbers-booleans.yaml`

**Step 1: Add fill-in exercises**

```yaml
# Fill-in exercises for numbers-booleans

- slug: int-floor-div-fill
  title: Floor Division
  type: fill-in
  difficulty: 1
  concept: numbers-booleans
  subconcept: integers
  level: intro
  prereqs: [variables]
  pattern: arithmetic
  objective: Use floor division operator
  prompt: Complete the expression for integer division
  template: "result = 10 ___ 3  # result is 3"
  blank_position: 0
  expected_answer: "//"
  accepted_solutions: ["//"]
  hints:
    - Floor division uses two slashes
  tags: [integers, division]

- slug: int-power-fill
  title: Exponentiation
  type: fill-in
  difficulty: 1
  concept: numbers-booleans
  subconcept: integers
  level: practice
  prereqs: [variables]
  pattern: arithmetic
  objective: Use exponentiation operator
  prompt: Complete the expression to calculate 2 to the power of 8
  template: "result = 2 ___ 8"
  blank_position: 0
  expected_answer: "**"
  accepted_solutions: ["**"]
  hints:
    - Python uses ** for exponentiation
  tags: [integers, exponentiation]

- slug: float-round-fill
  title: Round Function
  type: fill-in
  difficulty: 2
  concept: numbers-booleans
  subconcept: floats
  level: intro
  prereqs: [integers]
  pattern: built-in
  objective: Use round() function
  prompt: Complete the code to round to 2 decimal places
  template: "result = ___(3.14159, 2)"
  blank_position: 0
  expected_answer: "round"
  accepted_solutions: ["round"]
  hints:
    - Which built-in function rounds numbers?
  tags: [floats, rounding]

- slug: float-abs-fill
  title: Absolute Value
  type: fill-in
  difficulty: 1
  concept: numbers-booleans
  subconcept: floats
  level: practice
  prereqs: [integers]
  pattern: built-in
  objective: Get absolute value
  prompt: Complete the code to get the absolute value
  template: "positive = ___(-5.5)"
  blank_position: 0
  expected_answer: "abs"
  accepted_solutions: ["abs"]
  hints:
    - Which function returns absolute value?
  tags: [floats, absolute]

- slug: bool-and-fill
  title: Logical AND
  type: fill-in
  difficulty: 1
  concept: numbers-booleans
  subconcept: booleans
  level: intro
  prereqs: [variables]
  pattern: boolean
  objective: Use logical AND
  prompt: Complete the boolean expression
  template: "valid = is_admin ___ is_active"
  blank_position: 0
  expected_answer: "and"
  accepted_solutions: ["and"]
  hints:
    - Python uses 'and' for logical AND
  tags: [booleans, logic]

- slug: bool-or-fill
  title: Logical OR
  type: fill-in
  difficulty: 1
  concept: numbers-booleans
  subconcept: booleans
  level: practice
  prereqs: [variables]
  pattern: boolean
  objective: Use logical OR
  prompt: Complete the boolean expression
  template: "allowed = is_admin ___ has_permission"
  blank_position: 0
  expected_answer: "or"
  accepted_solutions: ["or"]
  hints:
    - Python uses 'or' for logical OR
  tags: [booleans, logic]

- slug: convert-int-fill
  title: Convert to Integer
  type: fill-in
  difficulty: 1
  concept: numbers-booleans
  subconcept: conversion
  level: intro
  prereqs: [integers, floats]
  pattern: conversion
  objective: Convert string to integer
  prompt: Complete the code to convert string to integer
  template: "number = ___(\"42\")"
  blank_position: 0
  expected_answer: "int"
  accepted_solutions: ["int"]
  hints:
    - Which function converts to integer?
  tags: [conversion, int]

- slug: convert-str-fill
  title: Convert to String
  type: fill-in
  difficulty: 1
  concept: numbers-booleans
  subconcept: conversion
  level: practice
  prereqs: [integers]
  pattern: conversion
  objective: Convert number to string
  prompt: Complete the code to convert number to string
  template: "text = ___(123)"
  blank_position: 0
  expected_answer: "str"
  accepted_solutions: ["str"]
  hints:
    - Which function converts to string?
  tags: [conversion, str]

- slug: truthiness-if-fill
  title: Truthy Check
  type: fill-in
  difficulty: 2
  concept: numbers-booleans
  subconcept: truthiness
  level: intro
  prereqs: [booleans]
  pattern: boolean
  objective: Use truthiness in condition
  prompt: Complete the Pythonic way to check if list has items
  template: "if ___:"
  blank_position: 0
  expected_answer: "items"
  accepted_solutions: ["items", "my_list", "data"]
  hints:
    - Non-empty lists are truthy
  tags: [truthiness, idiomatic]

- slug: truthiness-not-fill
  title: Falsy Check
  type: fill-in
  difficulty: 2
  concept: numbers-booleans
  subconcept: truthiness
  level: practice
  prereqs: [booleans]
  pattern: boolean
  objective: Check for empty/falsy value
  prompt: Complete the Pythonic way to check if list is empty
  template: "if ___ items:"
  blank_position: 0
  expected_answer: "not"
  accepted_solutions: ["not"]
  hints:
    - Use 'not' to check for falsy values
  tags: [truthiness, idiomatic]

- slug: comparison-is-fill
  title: Identity Check
  type: fill-in
  difficulty: 2
  concept: numbers-booleans
  subconcept: comparisons
  level: intro
  prereqs: [booleans]
  pattern: comparison
  objective: Check for None identity
  prompt: Complete the Pythonic way to check for None
  template: "if value ___ None:"
  blank_position: 0
  expected_answer: "is"
  accepted_solutions: ["is"]
  hints:
    - Use 'is' for identity comparisons with None
  tags: [comparisons, identity]

- slug: comparison-in-fill
  title: Membership Check
  type: fill-in
  difficulty: 1
  concept: numbers-booleans
  subconcept: comparisons
  level: practice
  prereqs: [booleans]
  pattern: comparison
  objective: Check membership in collection
  prompt: Complete the code to check if item is in list
  template: "if item ___ items:"
  blank_position: 0
  expected_answer: "in"
  accepted_solutions: ["in"]
  hints:
    - Which operator checks membership?
  tags: [comparisons, membership]
```

**Step 2: Validate**

Run: `pnpm run validate:exercises`
Expected: PASS

**Step 3: Commit**

```bash
git add exercises/python/numbers-booleans.yaml
git commit -m "content: add 12 fill-in exercises for numbers-booleans"
```

---

## Task 27: Create Content - Numbers-Booleans Predict (12)

**Files:**
- Modify: `exercises/python/numbers-booleans.yaml`

**Step 1: Add predict exercises**

```yaml
# Predict-output exercises for numbers-booleans

- slug: int-predict-floor
  title: Floor Division
  type: predict
  difficulty: 1
  concept: numbers-booleans
  subconcept: integers
  level: intro
  prereqs: [variables]
  pattern: arithmetic
  objective: Predict floor division result
  prompt: What does this code print?
  code: |
    result = 7 // 2
    print(result)
  expected_answer: "3"
  accepted_solutions: []
  hints:
    - Floor division rounds down
  tags: [integers, division]

- slug: int-predict-modulo
  title: Modulo Operation
  type: predict
  difficulty: 2
  concept: numbers-booleans
  subconcept: integers
  level: practice
  prereqs: [variables]
  pattern: arithmetic
  objective: Predict modulo result
  prompt: What does this code print?
  code: |
    result = 10 % 3
    print(result)
  expected_answer: "1"
  accepted_solutions: []
  hints:
    - Modulo returns the remainder
  tags: [integers, modulo]

- slug: float-predict-division
  title: Float Division
  type: predict
  difficulty: 1
  concept: numbers-booleans
  subconcept: floats
  level: intro
  prereqs: [integers]
  pattern: arithmetic
  objective: Predict true division result
  prompt: What does this code print?
  code: |
    result = 5 / 2
    print(result)
  expected_answer: "2.5"
  accepted_solutions: []
  hints:
    - Single / always returns a float
  tags: [floats, division]

- slug: float-predict-round
  title: Round Result
  type: predict
  difficulty: 2
  concept: numbers-booleans
  subconcept: floats
  level: practice
  prereqs: [integers]
  pattern: built-in
  objective: Predict round() result
  prompt: What does this code print?
  code: |
    result = round(3.7)
    print(result)
  expected_answer: "4"
  accepted_solutions: []
  hints:
    - round() rounds to nearest integer by default
  tags: [floats, rounding]

- slug: bool-predict-and
  title: AND Result
  type: predict
  difficulty: 1
  concept: numbers-booleans
  subconcept: booleans
  level: intro
  prereqs: [variables]
  pattern: boolean
  objective: Predict AND result
  prompt: What does this code print?
  code: |
    a = True
    b = False
    print(a and b)
  expected_answer: "False"
  accepted_solutions: []
  hints:
    - AND requires both to be True
  tags: [booleans, logic]

- slug: bool-predict-not
  title: NOT Result
  type: predict
  difficulty: 1
  concept: numbers-booleans
  subconcept: booleans
  level: practice
  prereqs: [variables]
  pattern: boolean
  objective: Predict NOT result
  prompt: What does this code print?
  code: |
    value = True
    print(not value)
  expected_answer: "False"
  accepted_solutions: []
  hints:
    - not inverts the boolean
  tags: [booleans, logic]

- slug: convert-predict-int
  title: Int Conversion
  type: predict
  difficulty: 1
  concept: numbers-booleans
  subconcept: conversion
  level: intro
  prereqs: [integers, floats]
  pattern: conversion
  objective: Predict int() result
  prompt: What does this code print?
  code: |
    result = int(3.9)
    print(result)
  expected_answer: "3"
  accepted_solutions: []
  hints:
    - int() truncates toward zero
  tags: [conversion, int]

- slug: convert-predict-bool
  title: Bool Conversion
  type: predict
  difficulty: 2
  concept: numbers-booleans
  subconcept: conversion
  level: practice
  prereqs: [booleans]
  pattern: conversion
  objective: Predict bool() result
  prompt: What does this code print?
  code: |
    print(bool(0))
  expected_answer: "False"
  accepted_solutions: []
  hints:
    - 0 is a falsy value
  tags: [conversion, bool]

- slug: truthiness-predict-empty
  title: Empty List Truthiness
  type: predict
  difficulty: 2
  concept: numbers-booleans
  subconcept: truthiness
  level: intro
  prereqs: [booleans]
  pattern: boolean
  objective: Predict empty list truthiness
  prompt: What does this code print?
  code: |
    items = []
    if items:
        print("has items")
    else:
        print("empty")
  expected_answer: "empty"
  accepted_solutions: []
  hints:
    - Empty collections are falsy
  tags: [truthiness]

- slug: truthiness-predict-zero
  title: Zero Truthiness
  type: predict
  difficulty: 2
  concept: numbers-booleans
  subconcept: truthiness
  level: practice
  prereqs: [booleans]
  pattern: boolean
  objective: Predict zero truthiness
  prompt: What does this code print?
  code: |
    count = 0
    print("yes" if count else "no")
  expected_answer: "no"
  accepted_solutions: []
  hints:
    - 0 is falsy
  tags: [truthiness]

- slug: comparison-predict-chain
  title: Chained Comparison
  type: predict
  difficulty: 2
  concept: numbers-booleans
  subconcept: comparisons
  level: intro
  prereqs: [booleans]
  pattern: comparison
  objective: Predict chained comparison result
  prompt: What does this code print?
  code: |
    x = 5
    print(1 < x < 10)
  expected_answer: "True"
  accepted_solutions: []
  hints:
    - Python allows chained comparisons
  tags: [comparisons, chaining]

- slug: comparison-predict-is
  title: Identity vs Equality
  type: predict
  difficulty: 2
  concept: numbers-booleans
  subconcept: comparisons
  level: practice
  prereqs: [booleans]
  pattern: comparison
  objective: Understand is vs ==
  prompt: What does this code print?
  code: |
    a = [1, 2, 3]
    b = [1, 2, 3]
    print(a == b, a is b)
  expected_answer: "True False"
  accepted_solutions: []
  hints:
    - == checks equality, is checks identity
  tags: [comparisons, identity]
```

**Step 2: Validate**

Run: `pnpm run validate:exercises`
Expected: PASS

**Step 3: Commit**

```bash
git add exercises/python/numbers-booleans.yaml
git commit -m "content: add 12 predict exercises for numbers-booleans"
```

---

## Task 28: Import New Exercises to Database

**Files:**
- None (using existing script)

**Step 1: Run import script**

Run: `pnpm db:import-exercises`
Expected: Imports 60 new exercises (shows count)

**Step 2: Verify in database**

Run: `pnpm supabase db query "SELECT exercise_type, COUNT(*) FROM exercises GROUP BY exercise_type" --local`
Expected: Shows write, fill-in, and predict counts

**Step 3: Commit any generated changes**

```bash
git add -A
git commit -m "chore: import 60 new fill-in and predict exercises"
```

---

## Task 29: Run Full Test Suite

**Files:**
- None

**Step 1: Run all tests**

Run: `pnpm test`
Expected: All tests pass

**Step 2: Run type check**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Run lint**

Run: `pnpm lint`
Expected: No errors

**Step 4: Run E2E tests**

Run: `pnpm test:e2e`
Expected: All tests pass

---

## Task 30: Update CLAUDE.md Documentation

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update Phase 2.7 milestone**

Add to Completed Milestones:

```markdown
14. ✅ Phase 2.7 Exercise Variety - Experience levels (refresher/learning/beginner), predict-output exercises, fill-in activation, type-balanced session selection, 60 new exercises
```

**Step 2: Update exercise count**

Update any references to exercise count from 218 to 278.

**Step 3: Add experience level to Phase 2 section**

Update Phase 2 documentation to include:

```markdown
**Experience Levels:**
- `refresher` (default): 80% write, 10% fill-in, 10% predict
- `learning`: 50% write, 25% fill-in, 25% predict
- `beginner`: 30% write, 35% fill-in, 35% predict
```

**Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with Phase 2.7 completion"
```

---

## Task 31: Update Obsidian Documentation

**Files:**
- Modify: `/home/brett/GoogleDrive/Obsidian Vault/SRS-app/Index.md`
- Modify: `/home/brett/GoogleDrive/Obsidian Vault/SRS-app/Architecture.md`
- Modify: `/home/brett/GoogleDrive/Obsidian Vault/SRS-app/Database-Schema.md`
- Modify: `/home/brett/GoogleDrive/Obsidian Vault/SRS-app/Features.md`

**Step 1: Update Index.md**

Add Phase 2.7 to completed phases.

**Step 2: Update Architecture.md**

Add exercise type selection algorithm documentation.

**Step 3: Update Database-Schema.md**

Add:
- `profiles.experience_level` column
- `exercises.code` column

**Step 4: Update Features.md**

Mark Phase 2.7 as complete, update exercise counts.

---

## Task 32: Update Serena Memories

**Files:**
- Use MCP tools

**Step 1: Update project overview memory**

Use `mcp__plugin_serena_serena__edit_memory` to update project_overview with Phase 2.7 completion.

**Step 2: Update codebase structure memory**

Add new files to codebase_structure memory.

---

## Task 33: Record in Daem0nMCP

**Files:**
- Use MCP tools

**Step 1: Record completion**

Use `mcp__daem0nmcp__record_outcome` to mark Phase 2.7 decision as worked.

**Step 2: Add learning**

Use `mcp__daem0nmcp__remember` to capture key learnings from implementation.

---

## Task 34: Final Verification and Merge

**Files:**
- None

**Step 1: Run full verification**

```bash
pnpm test && pnpm typecheck && pnpm lint && pnpm build
```
Expected: All pass

**Step 2: Run E2E in headed mode**

Run: `pnpm test:e2e:headed`
Expected: Manual verification of predict/fill-in exercises

**Step 3: Review all changes**

Run: `git diff master...HEAD --stat`
Expected: Review file count and changes

**Step 4: Merge to master**

```bash
git checkout master
git merge feat/phase27-exercise-variety
git push origin master
```

---

## Summary

**Total Tasks:** 34
**New Files:** ~5 (component, tests, migrations)
**Modified Files:** ~25
**New Exercises:** 60 (30 fill-in + 30 predict)
**Test Coverage:** TDD for algorithms and components

**Key Deliverables:**
1. Experience level system with onboarding
2. PredictOutputExercise component
3. Type-balanced session selection
4. 60 new exercises across 3 concepts
5. Full documentation updates
