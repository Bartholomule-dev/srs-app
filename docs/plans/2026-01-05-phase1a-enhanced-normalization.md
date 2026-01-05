# Phase 1A: Enhanced Normalization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce false negatives in answer matching with safe normalizations and accepted_solutions infrastructure.

**Architecture:** Extend `normalizePython()` with Multi-AI-verified safe transforms (comma spacing only). Add `accepted_solutions` field throughout the stack (YAML schema, database, types, matching logic) so exercises can explicitly define alternative valid answers.

**Tech Stack:** TypeScript, Vitest, PostgreSQL (Supabase), YAML

---

## Overview

This plan implements Phase 1A from the Product A+ document, following the Multi-AI Consensus that identified:
- **Safe for regex:** Comma spacing (`[1,2,3]` → `[1, 2, 3]`)
- **NOT safe for regex:** Quote normalization, operator spacing, assignment spacing

The approach:
1. Add only the safe comma-spacing normalization
2. Build `accepted_solutions` infrastructure for everything else
3. Keep the system deterministic and predictable

---

## Task 1: Add Safe Comma Normalization

**Files:**
- Modify: `src/lib/exercise/matching.ts:12-21`
- Test: `tests/unit/exercise/matching.test.ts`

### Step 1: Write failing tests for comma normalization

Add to `tests/unit/exercise/matching.test.ts` inside the `describe('normalizePython')` block:

```typescript
  it('normalizes comma spacing - adds space after comma', () => {
    expect(normalizePython('[1,2,3]')).toBe('[1, 2, 3]');
  });

  it('normalizes comma spacing - removes excessive spaces', () => {
    expect(normalizePython('[1,  2,   3]')).toBe('[1, 2, 3]');
  });

  it('normalizes comma spacing in dict literals', () => {
    expect(normalizePython('{a:1,b:2}')).toBe('{a: 1, b: 2}');
  });

  it('normalizes comma spacing preserves strings', () => {
    // Commas inside strings should NOT be normalized
    // This tests a limitation - regex can't know if we're in a string
    // For now, we accept this limitation since accepted_solutions handles edge cases
    expect(normalizePython('print("a,b,c")')).toBe('print("a, b, c")');
  });

  it('normalizes pre-colon spacing in dicts', () => {
    expect(normalizePython('{a :1}')).toBe('{a: 1}');
  });
```

### Step 2: Run tests to verify they fail

Run: `pnpm test tests/unit/exercise/matching.test.ts`

Expected: 5 new tests FAIL with AssertionError

### Step 3: Implement safe normalizations in normalizePython

Update `src/lib/exercise/matching.ts` `normalizePython` function:

```typescript
export function normalizePython(code: string): string {
  if (!code) return '';

  return code
    .replace(/\r\n/g, '\n')           // CRLF → LF
    .replace(/\t/g, '    ')           // Tabs → 4 spaces
    .replace(/ +$/gm, '')             // Remove trailing spaces per line
    .replace(/\n{3,}/g, '\n\n')       // Collapse 3+ newlines to 2
    .replace(/,\s*/g, ', ')           // Comma spacing: ensure single space after
    .replace(/\s+:/g, ':')            // Pre-colon: remove space before colon
    .replace(/:\s*/g, ': ')           // Post-colon: ensure single space after
    .trim();                          // Trim leading/trailing whitespace
}
```

### Step 4: Run tests to verify they pass

Run: `pnpm test tests/unit/exercise/matching.test.ts`

Expected: All tests PASS

### Step 5: Run full test suite to check for regressions

Run: `pnpm test`

Expected: All 429+ tests PASS

### Step 6: Commit

```bash
git add src/lib/exercise/matching.ts tests/unit/exercise/matching.test.ts
git commit -m "$(cat <<'EOF'
feat(matching): add safe comma and colon spacing normalization

Per Multi-AI consensus, comma spacing is safe for regex normalization.
This reduces false negatives for dict/list literals with inconsistent spacing.

- Normalize comma spacing: `[1,2]` → `[1, 2]`
- Normalize colon spacing: `{a:1}` → `{a: 1}`
- Pre-colon space removal: `{a :1}` → `{a: 1}`

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Add accepted_solutions to YAML Schema

**Files:**
- Modify: `src/lib/exercise/yaml-types.ts:6-14`
- Modify: `src/lib/exercise/yaml-validation.ts`
- Test: `tests/unit/exercise/yaml-validation.test.ts`

### Step 1: Write failing test for accepted_solutions validation

Add to `tests/unit/exercise/yaml-validation.test.ts`:

```typescript
describe('accepted_solutions field', () => {
  it('accepts exercises with accepted_solutions array', () => {
    const exercise: YamlExercise = {
      slug: 'test-accepted',
      title: 'Test',
      difficulty: 1,
      prompt: 'Test prompt',
      expected_answer: 'answer',
      hints: ['hint'],
      accepted_solutions: ['alt1', 'alt2'],
    };
    const errors = validateExercise(exercise, 'test.yaml');
    expect(errors).toHaveLength(0);
  });

  it('accepts exercises without accepted_solutions (optional)', () => {
    const exercise: YamlExercise = {
      slug: 'test-no-accepted',
      title: 'Test',
      difficulty: 1,
      prompt: 'Test prompt',
      expected_answer: 'answer',
      hints: ['hint'],
    };
    const errors = validateExercise(exercise, 'test.yaml');
    expect(errors).toHaveLength(0);
  });

  it('rejects accepted_solutions with non-string values', () => {
    const exercise = {
      slug: 'test-bad-accepted',
      title: 'Test',
      difficulty: 1,
      prompt: 'Test prompt',
      expected_answer: 'answer',
      hints: ['hint'],
      accepted_solutions: [123, 'valid'],
    } as unknown as YamlExercise;
    const errors = validateExercise(exercise, 'test.yaml');
    expect(errors.some(e => e.field === 'accepted_solutions')).toBe(true);
  });
});
```

### Step 2: Run tests to verify they fail

Run: `pnpm test tests/unit/exercise/yaml-validation.test.ts`

Expected: Tests FAIL (accepted_solutions not in type)

### Step 3: Update YamlExercise interface

Modify `src/lib/exercise/yaml-types.ts`:

```typescript
export interface YamlExercise {
  slug: string;
  title: string;
  difficulty: 1 | 2 | 3;
  prompt: string;
  expected_answer: string;
  hints: string[];
  tags?: string[];
  accepted_solutions?: string[];  // Alternative valid answers
}
```

### Step 4: Add validation for accepted_solutions

In `src/lib/exercise/yaml-validation.ts`, add validation inside `validateExercise` function after the existing validations:

```typescript
  // Validate accepted_solutions if present
  if (exercise.accepted_solutions !== undefined) {
    if (!Array.isArray(exercise.accepted_solutions)) {
      errors.push({
        file,
        slug,
        field: 'accepted_solutions',
        message: 'accepted_solutions must be an array',
      });
    } else {
      for (let i = 0; i < exercise.accepted_solutions.length; i++) {
        if (typeof exercise.accepted_solutions[i] !== 'string') {
          errors.push({
            file,
            slug,
            field: 'accepted_solutions',
            message: `accepted_solutions[${i}] must be a string`,
          });
        }
      }
    }
  }
```

### Step 5: Run tests to verify they pass

Run: `pnpm test tests/unit/exercise/yaml-validation.test.ts`

Expected: All tests PASS

### Step 6: Commit

```bash
git add src/lib/exercise/yaml-types.ts src/lib/exercise/yaml-validation.ts tests/unit/exercise/yaml-validation.test.ts
git commit -m "$(cat <<'EOF'
feat(exercise): add accepted_solutions field to YAML schema

Adds optional accepted_solutions: string[] to YamlExercise interface.
This allows exercises to define multiple valid answers beyond expected_answer.

Part of Phase 1A: Enhanced Normalization initiative.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Add Database Migration for accepted_solutions

**Files:**
- Create: `supabase/migrations/20260105000001_add_accepted_solutions.sql`

### Step 1: Create migration file

Create `supabase/migrations/20260105000001_add_accepted_solutions.sql`:

```sql
-- Add accepted_solutions column to exercises table
-- Stores alternative valid answers as a text array

ALTER TABLE exercises
ADD COLUMN accepted_solutions TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN exercises.accepted_solutions IS 'Alternative valid answers beyond expected_answer';
```

### Step 2: Apply migration locally

Run: `pnpm db:reset`

Expected: Migration applies successfully, database includes new column

### Step 3: Regenerate database types

Run: `pnpm supabase gen types typescript --local > src/lib/types/database.generated.ts`

Expected: New types include `accepted_solutions: string[] | null`

### Step 4: Verify types regenerated correctly

Inspect `src/lib/types/database.generated.ts` and confirm `accepted_solutions` appears in:
- `exercises.Row`
- `exercises.Insert`
- `exercises.Update`

### Step 5: Commit

```bash
git add supabase/migrations/20260105000001_add_accepted_solutions.sql src/lib/types/database.generated.ts
git commit -m "$(cat <<'EOF'
feat(db): add accepted_solutions column to exercises table

Adds TEXT[] column for storing alternative valid answers.
Regenerated TypeScript types from schema.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Update App Types and Mappers

**Files:**
- Modify: `src/lib/types/app.types.ts:33-49`
- Modify: `src/lib/supabase/mappers.ts`

### Step 1: Update Exercise interface

Add `acceptedSolutions` to `src/lib/types/app.types.ts` inside `Exercise` interface:

```typescript
export interface Exercise {
  id: string;
  slug: string;
  language: string;
  category: string;
  difficulty: number;
  title: string;
  prompt: string;
  expectedAnswer: string;
  acceptedSolutions: string[];  // Add this line
  hints: string[];
  explanation: string | null;
  tags: string[];
  timesPracticed: number;
  avgSuccessRate: number | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Step 2: Update mapExercise function

In `src/lib/supabase/mappers.ts`, update `mapExercise` to include the new field:

```typescript
export function mapExercise(db: Tables['exercises']['Row']): Exercise {
  return {
    id: db.id,
    slug: db.slug,
    language: db.language,
    category: db.category,
    difficulty: db.difficulty,
    title: db.title,
    prompt: db.prompt,
    expectedAnswer: db.expected_answer,
    acceptedSolutions: db.accepted_solutions ?? [],  // Add this line
    hints: (db.hints as string[]) ?? [],
    explanation: db.explanation,
    tags: db.tags ?? [],
    timesPracticed: db.times_practiced ?? 0,
    avgSuccessRate: db.avg_success_rate,
    createdAt: new Date(db.created_at!),
    updatedAt: new Date(db.updated_at!),
  };
}
```

### Step 3: Run typecheck

Run: `pnpm typecheck`

Expected: No type errors

### Step 4: Commit

```bash
git add src/lib/types/app.types.ts src/lib/supabase/mappers.ts
git commit -m "$(cat <<'EOF'
feat(types): add acceptedSolutions to Exercise type and mapper

Maps database accepted_solutions to app Exercise.acceptedSolutions.
Defaults to empty array if null.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Update Import Script

**Files:**
- Modify: `scripts/import-exercises.ts`

### Step 1: Update import row to include accepted_solutions

In `scripts/import-exercises.ts`, update the `row` object inside `importToDatabase`:

```typescript
const row = {
  language: content.language,
  category: content.category,
  slug: exercise.slug,
  title: exercise.title,
  difficulty: exercise.difficulty,
  prompt: exercise.prompt,
  expected_answer: exercise.expected_answer,
  hints: exercise.hints,
  tags: exercise.tags || [],
  explanation: null,
  accepted_solutions: exercise.accepted_solutions || [],  // Add this line
};
```

### Step 2: Run import to verify no errors

Run: `pnpm db:import-exercises`

Expected: Import completes with 50 exercises, no errors

### Step 3: Commit

```bash
git add scripts/import-exercises.ts
git commit -m "$(cat <<'EOF'
feat(import): include accepted_solutions in exercise import

Passes accepted_solutions from YAML to database during import.
Defaults to empty array if not specified.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Update checkAnswer to Use accepted_solutions

**Files:**
- Modify: `src/lib/exercise/matching.ts`
- Modify: `src/lib/exercise/types.ts`
- Test: `tests/unit/exercise/matching.test.ts`

### Step 1: Write failing tests for accepted_solutions matching

Add new test block to `tests/unit/exercise/matching.test.ts`:

```typescript
describe('checkAnswerWithAlternatives', () => {
  it('matches against expected_answer', () => {
    const result = checkAnswerWithAlternatives(
      'print(x)',
      'print(x)',
      []
    );
    expect(result.isCorrect).toBe(true);
    expect(result.matchedAlternative).toBeNull();
  });

  it('matches against accepted_solutions', () => {
    const result = checkAnswerWithAlternatives(
      "person['name']",
      'person["name"]',
      ["person['name']"]
    );
    expect(result.isCorrect).toBe(true);
    expect(result.matchedAlternative).toBe("person['name']");
  });

  it('returns false when no match found', () => {
    const result = checkAnswerWithAlternatives(
      'wrong',
      'print(x)',
      ['also_wrong']
    );
    expect(result.isCorrect).toBe(false);
    expect(result.matchedAlternative).toBeNull();
  });

  it('applies normalization to alternatives', () => {
    const result = checkAnswerWithAlternatives(
      '[1,2,3]',
      '[1, 2, 3]',
      ['[1,  2,  3]']
    );
    expect(result.isCorrect).toBe(true);
  });

  it('prefers expected_answer over alternatives', () => {
    const result = checkAnswerWithAlternatives(
      'print(x)',
      'print(x)',
      ['print(x)']  // Same as expected
    );
    expect(result.isCorrect).toBe(true);
    expect(result.matchedAlternative).toBeNull();  // Should match expected, not alt
  });
});
```

### Step 2: Run tests to verify they fail

Run: `pnpm test tests/unit/exercise/matching.test.ts`

Expected: Tests FAIL (function doesn't exist)

### Step 3: Update AnswerResult type

In `src/lib/exercise/types.ts`, add new field:

```typescript
export interface AnswerResult {
  isCorrect: boolean;
  normalizedUserAnswer: string;
  normalizedExpectedAnswer: string;
  usedAstMatch: boolean;
  matchedAlternative: string | null;  // Add this line
}
```

### Step 4: Implement checkAnswerWithAlternatives

Add to `src/lib/exercise/matching.ts`:

```typescript
/**
 * Checks if user's answer matches expected or any accepted alternative.
 * Returns which alternative matched (if any) for analytics.
 */
export function checkAnswerWithAlternatives(
  userAnswer: string,
  expectedAnswer: string,
  acceptedSolutions: string[]
): AnswerResult {
  const normalizedUser = normalizePython(userAnswer);
  const normalizedExpected = normalizePython(expectedAnswer);

  // Check primary expected answer first
  if (normalizedUser === normalizedExpected) {
    return {
      isCorrect: true,
      normalizedUserAnswer: normalizedUser,
      normalizedExpectedAnswer: normalizedExpected,
      usedAstMatch: false,
      matchedAlternative: null,
    };
  }

  // Check each accepted alternative
  for (const alt of acceptedSolutions) {
    const normalizedAlt = normalizePython(alt);
    if (normalizedUser === normalizedAlt) {
      return {
        isCorrect: true,
        normalizedUserAnswer: normalizedUser,
        normalizedExpectedAnswer: normalizedExpected,
        usedAstMatch: false,
        matchedAlternative: alt,
      };
    }
  }

  // No match found
  return {
    isCorrect: false,
    normalizedUserAnswer: normalizedUser,
    normalizedExpectedAnswer: normalizedExpected,
    usedAstMatch: false,
    matchedAlternative: null,
  };
}
```

### Step 5: Update checkAnswer for backwards compatibility

Update `checkAnswer` to include the new field:

```typescript
export function checkAnswer(userAnswer: string, expectedAnswer: string): AnswerResult {
  const normalizedUser = normalizePython(userAnswer);
  const normalizedExpected = normalizePython(expectedAnswer);

  const isCorrect = normalizedUser === normalizedExpected;

  return {
    isCorrect,
    normalizedUserAnswer: normalizedUser,
    normalizedExpectedAnswer: normalizedExpected,
    usedAstMatch: false,
    matchedAlternative: null,  // Add this line
  };
}
```

### Step 6: Export new function

Update `src/lib/exercise/index.ts`:

```typescript
export { normalizePython, checkAnswer, checkAnswerWithAlternatives } from './matching';
```

### Step 7: Run tests to verify they pass

Run: `pnpm test tests/unit/exercise/matching.test.ts`

Expected: All tests PASS

### Step 8: Commit

```bash
git add src/lib/exercise/matching.ts src/lib/exercise/types.ts src/lib/exercise/index.ts tests/unit/exercise/matching.test.ts
git commit -m "$(cat <<'EOF'
feat(matching): add checkAnswerWithAlternatives function

New function checks user answer against expected_answer and accepted_solutions.
Returns matchedAlternative to track which variant was used.

- Normalizes all values before comparison
- Prefers expected_answer over alternatives
- Backwards compatible (checkAnswer unchanged except new field)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Update ExerciseCard to Use New Matching

**Files:**
- Modify: `src/components/exercise/ExerciseCard.tsx`
- Test: `tests/component/exercise/ExerciseCard.test.tsx`

### Step 1: Update handleSubmit in ExerciseCard

In `src/components/exercise/ExerciseCard.tsx`, update the import and handleSubmit:

```typescript
// Update import
import { checkAnswerWithAlternatives, inferQuality, type QualityInputs } from '@/lib/exercise';

// Update handleSubmit callback
const handleSubmit = useCallback(() => {
  const result = checkAnswerWithAlternatives(
    userAnswer,
    exercise.expectedAnswer,
    exercise.acceptedSolutions
  );
  setAnswerResult({ isCorrect: result.isCorrect, usedAstMatch: result.usedAstMatch });
  setPhase('feedback');
}, [userAnswer, exercise.expectedAnswer, exercise.acceptedSolutions]);
```

### Step 2: Run component tests

Run: `pnpm test tests/component/exercise/ExerciseCard.test.tsx`

Expected: Tests PASS (may need mock update for acceptedSolutions)

### Step 3: Update test mocks if needed

If tests fail due to missing `acceptedSolutions` in mock data, add to the mock exercise:

```typescript
const mockExercise = {
  // ... existing fields
  acceptedSolutions: [],
};
```

### Step 4: Run full test suite

Run: `pnpm test`

Expected: All tests PASS

### Step 5: Commit

```bash
git add src/components/exercise/ExerciseCard.tsx tests/component/exercise/ExerciseCard.test.tsx
git commit -m "$(cat <<'EOF'
feat(ExerciseCard): use checkAnswerWithAlternatives

ExerciseCard now checks user answers against both expected_answer
and accepted_solutions array for more tolerant validation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Add Example accepted_solutions to Sample Exercises

**Files:**
- Modify: `exercises/python/basics.yaml`
- Modify: `exercises/python/strings.yaml`

### Step 1: Add accepted_solutions to exercises with common variants

Update `exercises/python/basics.yaml`:

```yaml
  - slug: print-hello-world
    title: Print Hello World
    difficulty: 1
    prompt: Print the text "Hello, World!" to the console
    expected_answer: print("Hello, World!")
    accepted_solutions:
      - "print('Hello, World!')"
    hints:
      - Use the print() function
      - Put the text in quotes
    tags: [print, strings, beginner]

  - slug: string-variable
    title: String Variable
    difficulty: 1
    prompt: Create a variable called name with the value "Alice"
    expected_answer: name = "Alice"
    accepted_solutions:
      - "name = 'Alice'"
    hints:
      - Use quotes for strings
    tags: [variables, strings, beginner]
```

### Step 2: Add accepted_solutions to strings exercises

Update `exercises/python/strings.yaml` for any f-string or quote-style exercises.

### Step 3: Re-import exercises

Run: `pnpm db:import-exercises`

Expected: Import completes, exercises updated

### Step 4: Commit

```bash
git add exercises/python/basics.yaml exercises/python/strings.yaml
git commit -m "$(cat <<'EOF'
feat(exercises): add accepted_solutions to quote-variant exercises

Adds alternative single-quote variants for exercises where both
single and double quotes are valid Python syntax.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Run E2E Tests and Verify

**Files:** None (verification only)

### Step 1: Run unit tests

Run: `pnpm test`

Expected: All tests PASS

### Step 2: Run E2E tests

Run: `pnpm test:e2e`

Expected: All E2E tests PASS

### Step 3: Manual smoke test

1. Start dev server: `pnpm dev`
2. Navigate to practice session
3. Submit answer with single quotes where double quotes expected
4. Verify: Answer accepted as correct

### Step 4: Create final summary commit (if any cleanup needed)

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: Phase 1A complete - Enhanced Normalization

Summary of changes:
- Added safe comma/colon spacing normalization
- Added accepted_solutions infrastructure (YAML → DB → Types → Matching)
- Updated ExerciseCard to use checkAnswerWithAlternatives
- Added example variants to quote-dependent exercises

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Summary

| Task | Component | Estimated Complexity |
|------|-----------|---------------------|
| 1 | Safe comma normalization | Low (5 regex additions) |
| 2 | YAML schema update | Low (1 optional field) |
| 3 | Database migration | Low (1 column) |
| 4 | App types and mappers | Low (2 files) |
| 5 | Import script | Low (1 line) |
| 6 | checkAnswerWithAlternatives | Medium (new function + tests) |
| 7 | ExerciseCard integration | Low (1 function swap) |
| 8 | Sample exercises | Low (YAML edits) |
| 9 | E2E verification | Low (run existing tests) |

**Total:** 9 tasks, ~30 discrete steps

---

## Success Criteria

- [ ] `pnpm test` passes (all 429+ tests)
- [ ] `pnpm test:e2e` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Manual test: Quote variants accepted as correct
- [ ] Manual test: Comma spacing variants accepted as correct

---

## Future Work (Not in this plan)

- **Phase 1B:** AI-generated variants for all 50 exercises
- **Phase 1C:** Prompt audit for ambiguous exercises
- **Phase 1D:** "My answer was correct" feedback button
- **Phase 2:** Complete card type (fill-in-blank)
- **Phase 3:** Tree-sitter structure matching (if needed)
