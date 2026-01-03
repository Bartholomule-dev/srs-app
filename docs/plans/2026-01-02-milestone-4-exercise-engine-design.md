# Milestone 4: Exercise Engine Design

> Single-card exercise interaction - the core learning experience.

**Date:** 2026-01-02
**Status:** Approved
**Scope:** Single-card focus (practice session flow is a separate milestone)

---

## Decisions Summary

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Focus | Single-card first | Get the feel right before session flow |
| Input | Simple textarea | No cheating via syntax hints; lightweight |
| Feedback | Syntax-highlighted | Helps learning after submission |
| Matching | Whitespace-normalized | Practical; ignores formatting differences |
| Correctness | Binary + auto quality | Snappy flow; no manual rating friction |
| Hints | Single hint (from DB) | Already in schema; SRS penalty for using |
| On incorrect | Show answer, move on | Simple; SRS brings it back soon |
| Give up | Explicit button | Clearer intent than blank submit |
| Time tracking | Hidden | Data for quality inference without pressure |

---

## Quality Inference

**Inputs:**
- `isCorrect: boolean`
- `hintUsed: boolean`
- `responseTimeMs: number`
- `usedAstMatch: boolean`

**Rules:**

| Condition | Quality | SM-2 Meaning |
|-----------|---------|--------------|
| Correct, no hint, <15s | 5 | Perfect recall |
| Correct, no hint, 15–30s | 4 | Hesitation |
| Correct, no hint, >=30s | 3 | Struggle |
| Correct, AST match (format differs) | 4 | Minor format mismatch |
| Correct, with hint | 3 | Difficulty |
| Incorrect / Give up | 2 | Failed |

---

## Component Architecture

```
src/components/exercise/
├── ExerciseCard.tsx        # Main container - orchestrates the flow
├── ExercisePrompt.tsx      # Displays question/instructions
├── CodeInput.tsx           # Textarea for answer entry
├── ExerciseFeedback.tsx    # Correct/incorrect + answer display
├── HintButton.tsx          # Hint reveal with penalty warning
└── index.ts                # Barrel export
```

### ExerciseCard

The orchestrator component.

**Props:**
- `exercise: Exercise` - exercise data from DB
- `onComplete: (exerciseId: string, quality: number) => void`

**Internal State:**
- `phase: 'answering' | 'feedback'`
- `userAnswer: string`
- `hintUsed: boolean`
- `startTime: number` (set on first input)
- `pausedMs: number` (accumulated time while tab is hidden)

**Flow:**
1. Mount → wait for first input
2. User types in CodeInput → record startTime
3. Track visibility changes to pause timing
4. Optional: user clicks HintButton (sets hintUsed=true)
5. User submits (Enter) or clicks Give Up
6. Check answer with normalizePython() and AST match
7. Transition to feedback phase
8. User clicks Continue
9. Calculate quality via inferQuality()
10. Call onComplete(exerciseId, quality)

### ExercisePrompt

Pure presentational. Shows:
- Category badge (e.g., "Python > Variables")
- Exercise instructions/question

### CodeInput

Controlled textarea component.

- Monospace font, dark background
- Enter to submit (propagates to parent)
- Shift+Enter for newline
- Auto-focus on mount
- Subtle helper text: "Python: indentation matters"

### ExerciseFeedback

Post-submission display.

- Green "Correct!" or red "Incorrect" banner
- User's answer (always shown)
- Correct answer (shown if incorrect)
- Optional "Show whitespace" toggle
- "Next review: X days" info
- Continue button

### HintButton

- Shows hint text from exercise.hint when clicked
- Visually changes to disabled state after use
- Optional: tooltip warning about score penalty

---

## Answer Matching Logic (Python-First)

**Location:** `src/lib/exercise/matching.ts`

```typescript
function normalizePython(code: string): string {
  return code
    .replace(/\r\n/g, '\n')          // Normalize line endings
    .replace(/\t/g, '    ')          // Tabs → 4 spaces
    .replace(/ +$/gm, '');           // Remove trailing spaces per line
}

function checkAnswerPython(userAnswer: string, correctAnswer: string): boolean {
  const normalizedUser = normalizePython(userAnswer);
  const normalizedCorrect = normalizePython(correctAnswer);

  const userAst = tryParsePythonAst(normalizedUser);
  const correctAst = tryParsePythonAst(normalizedCorrect);

  if (userAst && correctAst) {
    // Semantic match ignores formatting; still case-sensitive.
    return astDump(userAst) === astDump(correctAst);
  }

  return normalizedUser === normalizedCorrect;
}
```

**Future Enhancements (not MVP):**
- Multiple accepted answers per exercise
- Regex-based pattern matching
- Language-specific matching (beyond Python)

---

## Quality Inference Algorithm (Python-First)

**Location:** `src/lib/exercise/quality.ts`

```typescript
const FAST_THRESHOLD_MS = 15_000;  // 15 seconds
const SLOW_THRESHOLD_MS = 30_000;  // 30 seconds

function inferQuality(
  isCorrect: boolean,
  hintUsed: boolean,
  responseTimeMs: number,
  usedAstMatch: boolean
): number {
  if (!isCorrect) {
    return 2;
  }

  if (hintUsed) {
    return 3;
  }

  if (usedAstMatch) {
    return 4;
  }

  if (responseTimeMs < FAST_THRESHOLD_MS) {
    return 5;
  }

  if (responseTimeMs < SLOW_THRESHOLD_MS) {
    return 4;
  }

  return 3;
}
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Page Component                          │
│  (uses useSRS hook)                                            │
├─────────────────────────────────────────────────────────────────┤
│   useSRS hook                                                   │
│   ├── dueCards: DueCard[]                                      │
│   ├── currentCard: DueCard                                     │
│   └── recordAnswer(id, quality) → updates DB                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       ExerciseCard                              │
│  - Receives exercise from currentCard                          │
│  - Manages answering → feedback flow                           │
│  - Calculates quality on completion                            │
│  - Calls onComplete(id, quality)                               │
└─────────────────────────────────────────────────────────────────┘
```

ExerciseCard is stateless regarding SRS - it just reports quality. The useSRS hook handles all database interaction.

---

## UI Mockups

### Answering Phase

```
┌─────────────────────────────────────────────────────────────────┐
│  Python › Variables                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Print the value of variable `name`:                           │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ print(name)█                                              │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [💡 Hint]                              [Give Up]  [Submit ↵]  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Feedback - Correct

```
┌─────────────────────────────────────────────────────────────────┐
│  ✓ Correct!                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Your answer:                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ print(name)                                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Next review: 6 days                                           │
│                                                                 │
│                                            [Continue →]         │
└─────────────────────────────────────────────────────────────────┘
```

### Feedback - Incorrect

```
┌─────────────────────────────────────────────────────────────────┐
│  ✗ Incorrect                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Your answer:                 Correct answer:                   │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │ print name              │  │ print(name)                 │  │
│  └─────────────────────────┘  └─────────────────────────────┘  │
│                                                                 │
│  Next review: 1 day                                            │
│                                                                 │
│                                            [Continue →]         │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

### New Files

```
src/
├── lib/
│   └── exercise/
│       ├── matching.ts      # normalizePython, checkAnswerPython
│       ├── quality.ts       # inferQuality
│       └── index.ts         # barrel export
│
└── components/
    └── exercise/
        ├── ExerciseCard.tsx
        ├── ExercisePrompt.tsx
        ├── CodeInput.tsx
        ├── ExerciseFeedback.tsx
        ├── HintButton.tsx
        └── index.ts

tests/
├── unit/
│   └── exercise/
│       ├── matching.test.ts
│       └── quality.test.ts
│
└── component/
    └── exercise/
        ├── ExerciseCard.test.tsx
        ├── CodeInput.test.tsx
        └── ExerciseFeedback.test.tsx
```

### Test Coverage

| Area | Key Test Cases |
|------|---------------|
| `normalizePython` | Whitespace, tabs, line endings |
| `checkAnswerPython` | Exact match, normalized match, AST match, edge cases |
| `inferQuality` | All quality paths (5/4/3/2), AST cap |
| `ExerciseCard` | Full flow: answer → feedback → complete |
| `CodeInput` | Enter to submit, Shift+Enter for newline |
| `HintButton` | Click reveals, disables after use |

**Estimated:** ~25-30 new tests

---

## Future Enhancements (Not MVP)

- Syntax highlighting in feedback (Prism.js or similar)
- Side-by-side diff for incorrect answers
- Multiple accepted answers per exercise
- Semantic/AST-based answer comparison
- Progressive hints (multiple levels)
- "Strict mode" requiring re-typing correct answer after failure
- Visible timer option for gamification
- Difficulty levels affecting hint availability

---

## Related Documents

- [[Features]] - Feature roadmap
- [[Architecture]] - System design
- [[Database-Schema]] - Exercise table schema
