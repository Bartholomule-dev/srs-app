# SM-2 to FSRS Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the SM-2 spaced repetition algorithm with FSRS (Free Spaced Repetition Scheduler) using the ts-fsrs library for improved scheduling accuracy.

**Architecture:** Create an adapter layer that isolates FSRS specifics, allowing the existing Quality-based input system to continue working while internally mapping to FSRS Ratings. The adapter pattern keeps ts-fsrs types contained and enables future algorithm swaps.

**Tech Stack:** ts-fsrs ^4.x, TypeScript, Supabase/PostgreSQL, Vitest

**External AI Consensus (Codex + Gemini):**
- Keep hybrid Quality input (UI sends performance signals, adapter maps to Rating)
- Quality 0-2 → Again, 3 → Hard, 4 → Good, 5 → Easy
- Persist ALL FSRS card fields (stability, difficulty, state, reps, lapses)
- Watch for timezone issues with Date handling

---

## Task Overview

| Task | Description | Est. Steps |
|------|-------------|------------|
| 1 | Install ts-fsrs and create types | 6 |
| 2 | Create FSRS adapter with rating mapping | 12 |
| 3 | Database migration for FSRS columns | 8 |
| 4 | Update SubconceptProgress type | 6 |
| 5 | Update useConceptSRS hook | 10 |
| 6 | Update algorithm exports | 4 |
| 7 | Integration testing | 8 |

---

## Task 1: Install ts-fsrs and Create Types

**Files:**
- Create: `src/lib/srs/fsrs/types.ts`
- Modify: `package.json`

**Step 1: Install ts-fsrs**

Run:
```bash
pnpm add ts-fsrs
```

Expected: Package added to dependencies

**Step 2: Verify installation**

Run:
```bash
pnpm list ts-fsrs
```

Expected: Shows ts-fsrs version ^4.x

**Step 3: Create FSRS types file**

Create `src/lib/srs/fsrs/types.ts`:

```typescript
// src/lib/srs/fsrs/types.ts
// Local wrapper types to avoid leaking ts-fsrs types throughout codebase

import type { Card, Rating, State } from 'ts-fsrs';

/**
 * FSRS card state for a subconcept
 * Maps to ts-fsrs Card but uses our naming conventions
 */
export interface FSRSCardState {
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: FSRSState;
  lastReview: Date | null;
}

/**
 * FSRS state enum (mirrors ts-fsrs State)
 */
export type FSRSState = 'New' | 'Learning' | 'Review' | 'Relearning';

/**
 * FSRS rating enum (mirrors ts-fsrs Rating)
 */
export type FSRSRating = 'Again' | 'Hard' | 'Good' | 'Easy';

/**
 * Input for review calculation (what the UI provides)
 */
export interface ReviewInput {
  isCorrect: boolean;
  hintUsed: boolean;
  responseTimeMs: number;
  usedAstMatch?: boolean;
}

/**
 * Result of a review calculation
 */
export interface FSRSReviewResult {
  cardState: FSRSCardState;
  rating: FSRSRating;
  wasCorrect: boolean;
}

/**
 * Map our FSRSState to ts-fsrs State numeric values
 */
export const STATE_MAP: Record<FSRSState, number> = {
  New: 0,
  Learning: 1,
  Review: 2,
  Relearning: 3,
};

/**
 * Map ts-fsrs State numeric values to our FSRSState
 */
export const STATE_REVERSE_MAP: Record<number, FSRSState> = {
  0: 'New',
  1: 'Learning',
  2: 'Review',
  3: 'Relearning',
};

/**
 * Map our FSRSRating to ts-fsrs Rating numeric values
 */
export const RATING_MAP: Record<FSRSRating, number> = {
  Again: 1,
  Hard: 2,
  Good: 3,
  Easy: 4,
};
```

**Step 4: Run typecheck**

Run:
```bash
pnpm typecheck
```

Expected: PASS (no type errors)

**Step 5: Create index export**

Create `src/lib/srs/fsrs/index.ts`:

```typescript
// src/lib/srs/fsrs/index.ts
export * from './types';
export * from './adapter';
export * from './mapping';
```

Note: adapter.ts and mapping.ts will be created in Task 2.

**Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/srs/fsrs/
git commit -m "feat(srs): add ts-fsrs dependency and FSRS types"
```

---

## Task 2: Create FSRS Adapter with Rating Mapping

**Files:**
- Create: `src/lib/srs/fsrs/mapping.ts`
- Create: `src/lib/srs/fsrs/adapter.ts`
- Create: `tests/unit/srs/fsrs/mapping.test.ts`
- Create: `tests/unit/srs/fsrs/adapter.test.ts`

**Step 1: Write failing tests for Quality-to-Rating mapping**

Create `tests/unit/srs/fsrs/mapping.test.ts`:

```typescript
// tests/unit/srs/fsrs/mapping.test.ts
import { describe, it, expect } from 'vitest';
import { qualityToRating, inferRating } from '@/lib/srs/fsrs/mapping';
import type { Quality } from '@/lib/types';

describe('qualityToRating', () => {
  it('maps quality 0-2 to Again', () => {
    expect(qualityToRating(0)).toBe('Again');
    expect(qualityToRating(1)).toBe('Again');
    expect(qualityToRating(2)).toBe('Again');
  });

  it('maps quality 3 to Hard', () => {
    expect(qualityToRating(3)).toBe('Hard');
  });

  it('maps quality 4 to Good', () => {
    expect(qualityToRating(4)).toBe('Good');
  });

  it('maps quality 5 to Easy', () => {
    expect(qualityToRating(5)).toBe('Easy');
  });
});

describe('inferRating', () => {
  it('returns Again for incorrect answers', () => {
    const result = inferRating({
      isCorrect: false,
      hintUsed: false,
      responseTimeMs: 5000,
    });
    expect(result).toBe('Again');
  });

  it('returns Hard for correct with hint', () => {
    const result = inferRating({
      isCorrect: true,
      hintUsed: true,
      responseTimeMs: 5000,
    });
    expect(result).toBe('Hard');
  });

  it('returns Good for correct with AST match', () => {
    const result = inferRating({
      isCorrect: true,
      hintUsed: false,
      responseTimeMs: 5000,
      usedAstMatch: true,
    });
    expect(result).toBe('Good');
  });

  it('returns Easy for fast correct answer', () => {
    const result = inferRating({
      isCorrect: true,
      hintUsed: false,
      responseTimeMs: 10000, // < 15s threshold
    });
    expect(result).toBe('Easy');
  });

  it('returns Good for medium-speed correct answer', () => {
    const result = inferRating({
      isCorrect: true,
      hintUsed: false,
      responseTimeMs: 20000, // 15-30s
    });
    expect(result).toBe('Good');
  });

  it('returns Hard for slow correct answer', () => {
    const result = inferRating({
      isCorrect: true,
      hintUsed: false,
      responseTimeMs: 35000, // > 30s
    });
    expect(result).toBe('Hard');
  });
});
```

**Step 2: Run tests to verify they fail**

Run:
```bash
pnpm test tests/unit/srs/fsrs/mapping.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Implement mapping functions**

Create `src/lib/srs/fsrs/mapping.ts`:

```typescript
// src/lib/srs/fsrs/mapping.ts
// Maps Quality (0-5) and ReviewInput to FSRS Rating

import type { Quality } from '@/lib/types';
import type { ReviewInput, FSRSRating } from './types';

/** Response time threshold for "fast" (perfect recall) - 15 seconds */
const FAST_THRESHOLD_MS = 15_000;

/** Response time threshold for "slow" (struggle) - 30 seconds */
const SLOW_THRESHOLD_MS = 30_000;

/**
 * Map SM-2 Quality (0-5) to FSRS Rating
 *
 * Mapping (consensus from Codex + Gemini):
 * - 0-2 (fail) → Again
 * - 3 (hard)   → Hard
 * - 4 (good)   → Good
 * - 5 (easy)   → Easy
 */
export function qualityToRating(quality: Quality): FSRSRating {
  if (quality <= 2) return 'Again';
  if (quality === 3) return 'Hard';
  if (quality === 4) return 'Good';
  return 'Easy'; // quality === 5
}

/**
 * Infer FSRS Rating directly from review inputs
 * This is the preferred method - bypasses Quality for cleaner mapping
 *
 * Rating logic:
 * - Again: incorrect
 * - Hard: correct with hint OR slow (>30s)
 * - Good: correct with AST match OR medium time (15-30s)
 * - Easy: correct, no hint, fast (<15s)
 */
export function inferRating(input: ReviewInput): FSRSRating {
  const { isCorrect, hintUsed, responseTimeMs, usedAstMatch } = input;

  // Incorrect always returns Again
  if (!isCorrect) {
    return 'Again';
  }

  // Hint used caps at Hard
  if (hintUsed) {
    return 'Hard';
  }

  // AST match (format differs) caps at Good
  if (usedAstMatch) {
    return 'Good';
  }

  // Time-based rating for exact matches
  if (responseTimeMs < FAST_THRESHOLD_MS) {
    return 'Easy';
  }

  if (responseTimeMs < SLOW_THRESHOLD_MS) {
    return 'Good';
  }

  return 'Hard'; // Slow response
}

/**
 * Check if a rating represents a passing (correct) answer
 */
export function isPassingRating(rating: FSRSRating): boolean {
  return rating !== 'Again';
}
```

**Step 4: Run tests to verify they pass**

Run:
```bash
pnpm test tests/unit/srs/fsrs/mapping.test.ts
```

Expected: PASS (all tests green)

**Step 5: Write failing tests for adapter**

Create `tests/unit/srs/fsrs/adapter.test.ts`:

```typescript
// tests/unit/srs/fsrs/adapter.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createEmptyFSRSCard,
  reviewCard,
  cardStateToProgress,
  progressToCardState,
} from '@/lib/srs/fsrs/adapter';
import type { FSRSCardState } from '@/lib/srs/fsrs/types';

describe('createEmptyFSRSCard', () => {
  it('creates a new card with default values', () => {
    const card = createEmptyFSRSCard();

    expect(card.state).toBe('New');
    expect(card.stability).toBe(0);
    expect(card.difficulty).toBe(0);
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
    expect(card.due).toBeInstanceOf(Date);
  });

  it('accepts a custom due date', () => {
    const customDate = new Date('2026-01-15');
    const card = createEmptyFSRSCard(customDate);

    expect(card.due.toISOString()).toBe(customDate.toISOString());
  });
});

describe('reviewCard', () => {
  let newCard: FSRSCardState;

  beforeEach(() => {
    newCard = createEmptyFSRSCard(new Date('2026-01-01'));
  });

  it('schedules next review after Good rating', () => {
    const result = reviewCard(newCard, 'Good', new Date('2026-01-01'));

    expect(result.cardState.state).toBe('Learning');
    expect(result.cardState.due > new Date('2026-01-01')).toBe(true);
    expect(result.cardState.reps).toBe(1);
    expect(result.rating).toBe('Good');
    expect(result.wasCorrect).toBe(true);
  });

  it('handles Again rating (lapse)', () => {
    // First get card to Review state
    const afterGood = reviewCard(newCard, 'Good', new Date('2026-01-01'));
    const afterGood2 = reviewCard(
      afterGood.cardState,
      'Good',
      new Date('2026-01-02')
    );

    // Now fail it
    const result = reviewCard(
      afterGood2.cardState,
      'Again',
      new Date('2026-01-10')
    );

    expect(result.cardState.lapses).toBeGreaterThanOrEqual(1);
    expect(result.wasCorrect).toBe(false);
  });

  it('increases stability after successful reviews', () => {
    const result1 = reviewCard(newCard, 'Good', new Date('2026-01-01'));
    const result2 = reviewCard(
      result1.cardState,
      'Good',
      new Date('2026-01-02')
    );

    expect(result2.cardState.stability).toBeGreaterThan(0);
  });
});

describe('cardStateToProgress / progressToCardState', () => {
  it('round-trips card state correctly', () => {
    const original = createEmptyFSRSCard(new Date('2026-01-01'));
    const reviewed = reviewCard(original, 'Good', new Date('2026-01-01'));

    const progressFields = cardStateToProgress(reviewed.cardState);
    const restored = progressToCardState(progressFields);

    expect(restored.state).toBe(reviewed.cardState.state);
    expect(restored.stability).toBe(reviewed.cardState.stability);
    expect(restored.difficulty).toBe(reviewed.cardState.difficulty);
    expect(restored.reps).toBe(reviewed.cardState.reps);
    expect(restored.lapses).toBe(reviewed.cardState.lapses);
  });
});
```

**Step 6: Run tests to verify they fail**

Run:
```bash
pnpm test tests/unit/srs/fsrs/adapter.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 7: Implement adapter**

Create `src/lib/srs/fsrs/adapter.ts`:

```typescript
// src/lib/srs/fsrs/adapter.ts
// Adapter layer isolating ts-fsrs from the rest of the codebase

import { FSRS, createEmptyCard, Rating, State } from 'ts-fsrs';
import type { Card } from 'ts-fsrs';
import type {
  FSRSCardState,
  FSRSRating,
  FSRSReviewResult,
  FSRSState,
} from './types';
import { STATE_MAP, STATE_REVERSE_MAP, RATING_MAP } from './types';

// Singleton FSRS instance with default parameters
// Can be configured later with custom parameters if needed
const fsrs = new FSRS();

/**
 * Create an empty FSRS card (for new subconcepts)
 */
export function createEmptyFSRSCard(due: Date = new Date()): FSRSCardState {
  const card = createEmptyCard(due);
  return tsfsrsCardToState(card);
}

/**
 * Review a card with a given rating
 */
export function reviewCard(
  cardState: FSRSCardState,
  rating: FSRSRating,
  now: Date = new Date()
): FSRSReviewResult {
  const card = stateToTsfsrsCard(cardState);
  const tsRating = RATING_MAP[rating] as Rating;

  const result = fsrs.next(card, now, tsRating);

  return {
    cardState: tsfsrsCardToState(result.card),
    rating,
    wasCorrect: rating !== 'Again',
  };
}

/**
 * Convert ts-fsrs Card to our FSRSCardState
 */
function tsfsrsCardToState(card: Card): FSRSCardState {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: STATE_REVERSE_MAP[card.state as number] ?? 'New',
    lastReview: card.last_review ?? null,
  };
}

/**
 * Convert our FSRSCardState to ts-fsrs Card
 */
function stateToTsfsrsCard(state: FSRSCardState): Card {
  return {
    due: state.due,
    stability: state.stability,
    difficulty: state.difficulty,
    elapsed_days: state.elapsedDays,
    scheduled_days: state.scheduledDays,
    reps: state.reps,
    lapses: state.lapses,
    state: STATE_MAP[state.state] as State,
    last_review: state.lastReview ?? undefined,
  };
}

/**
 * Extract database-persistable fields from FSRSCardState
 * Used when saving to subconcept_progress table
 */
export function cardStateToProgress(state: FSRSCardState): {
  stability: number;
  difficulty: number;
  fsrsState: FSRSState;
  due: Date;
  lastReview: Date | null;
  reps: number;
  lapses: number;
  elapsedDays: number;
  scheduledDays: number;
} {
  return {
    stability: state.stability,
    difficulty: state.difficulty,
    fsrsState: state.state,
    due: state.due,
    lastReview: state.lastReview,
    reps: state.reps,
    lapses: state.lapses,
    elapsedDays: state.elapsedDays,
    scheduledDays: state.scheduledDays,
  };
}

/**
 * Reconstruct FSRSCardState from database fields
 */
export function progressToCardState(progress: {
  stability: number;
  difficulty: number;
  fsrsState: FSRSState;
  due: Date;
  lastReview: Date | null;
  reps: number;
  lapses: number;
  elapsedDays: number;
  scheduledDays: number;
}): FSRSCardState {
  return {
    due: progress.due,
    stability: progress.stability,
    difficulty: progress.difficulty,
    elapsedDays: progress.elapsedDays,
    scheduledDays: progress.scheduledDays,
    reps: progress.reps,
    lapses: progress.lapses,
    state: progress.fsrsState,
    lastReview: progress.lastReview,
  };
}

/**
 * Map our phase ('learning'/'review') to approximate FSRS state
 * Used only during migration from SM-2 data
 */
export function legacyPhaseToFSRSState(
  phase: 'learning' | 'review'
): FSRSState {
  return phase === 'review' ? 'Review' : 'Learning';
}

/**
 * Map FSRS state back to legacy phase for backward compatibility
 */
export function fsrsStateToLegacyPhase(
  state: FSRSState
): 'learning' | 'review' {
  return state === 'Review' ? 'review' : 'learning';
}
```

**Step 8: Run tests to verify they pass**

Run:
```bash
pnpm test tests/unit/srs/fsrs/adapter.test.ts
```

Expected: PASS (all tests green)

**Step 9: Update index export**

Update `src/lib/srs/fsrs/index.ts`:

```typescript
// src/lib/srs/fsrs/index.ts
export * from './types';
export * from './adapter';
export * from './mapping';
```

**Step 10: Run all FSRS tests**

Run:
```bash
pnpm test tests/unit/srs/fsrs/
```

Expected: PASS (all tests green)

**Step 11: Run typecheck**

Run:
```bash
pnpm typecheck
```

Expected: PASS

**Step 12: Commit**

```bash
git add src/lib/srs/fsrs/ tests/unit/srs/fsrs/
git commit -m "feat(srs): add FSRS adapter with Quality-to-Rating mapping"
```

---

## Task 3: Database Migration for FSRS Columns

**Files:**
- Create: `supabase/migrations/20260106100000_add_fsrs_columns.sql`

**Step 1: Create migration file**

Create `supabase/migrations/20260106100000_add_fsrs_columns.sql`:

```sql
-- Add FSRS-specific columns to subconcept_progress
-- These columns store FSRS card state alongside existing SM-2 fields

-- Add new FSRS columns
ALTER TABLE subconcept_progress
ADD COLUMN IF NOT EXISTS stability double precision DEFAULT 0,
ADD COLUMN IF NOT EXISTS difficulty double precision DEFAULT 0,
ADD COLUMN IF NOT EXISTS fsrs_state smallint DEFAULT 0, -- 0=New, 1=Learning, 2=Review, 3=Relearning
ADD COLUMN IF NOT EXISTS reps integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS lapses integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS elapsed_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_days integer DEFAULT 0;

-- Add check constraint for fsrs_state
ALTER TABLE subconcept_progress
ADD CONSTRAINT chk_fsrs_state CHECK (fsrs_state >= 0 AND fsrs_state <= 3);

-- Comment on new columns
COMMENT ON COLUMN subconcept_progress.stability IS 'FSRS stability - information retention measure';
COMMENT ON COLUMN subconcept_progress.difficulty IS 'FSRS difficulty - content difficulty (0-10 range)';
COMMENT ON COLUMN subconcept_progress.fsrs_state IS 'FSRS state: 0=New, 1=Learning, 2=Review, 3=Relearning';
COMMENT ON COLUMN subconcept_progress.reps IS 'FSRS total review count';
COMMENT ON COLUMN subconcept_progress.lapses IS 'FSRS forgotten/incorrect count';
COMMENT ON COLUMN subconcept_progress.elapsed_days IS 'FSRS days since last review';
COMMENT ON COLUMN subconcept_progress.scheduled_days IS 'FSRS scheduled interval in days';

-- Create index on fsrs_state for filtering
CREATE INDEX IF NOT EXISTS idx_subconcept_progress_fsrs_state ON subconcept_progress(fsrs_state);
```

**Step 2: Apply migration to local database**

Run:
```bash
pnpm db:reset
```

Expected: Migration applies successfully

**Step 3: Verify columns exist**

Run:
```bash
pnpm supabase db dump --local --data-only=false | grep -A 20 "subconcept_progress"
```

Expected: Shows new columns (stability, difficulty, fsrs_state, reps, lapses, elapsed_days, scheduled_days)

**Step 4: Regenerate TypeScript types**

Run:
```bash
pnpm supabase gen types typescript --local > src/lib/types/database.generated.ts
```

**Step 5: Verify generated types include new columns**

Run:
```bash
grep -A 5 "stability" src/lib/types/database.generated.ts
```

Expected: Shows stability, difficulty, fsrs_state, reps, lapses columns in Row type

**Step 6: Run typecheck**

Run:
```bash
pnpm typecheck
```

Expected: May have type errors (will fix in Task 4)

**Step 7: Commit migration**

```bash
git add supabase/migrations/ src/lib/types/database.generated.ts
git commit -m "feat(db): add FSRS columns to subconcept_progress table"
```

**Step 8: Document migration for production**

Note: When deploying to production, run:
```bash
pnpm supabase db push
```

---

## Task 4: Update SubconceptProgress Type

**Files:**
- Modify: `src/lib/curriculum/types.ts`
- Modify: `src/lib/hooks/useConceptSRS.ts` (mapper function)

**Step 1: Update SubconceptProgress interface**

Edit `src/lib/curriculum/types.ts`, find the `SubconceptProgress` interface and update:

```typescript
/** Subconcept progress tracking with FSRS state */
export interface SubconceptProgress {
  id: string;
  userId: string;
  subconceptSlug: string;
  conceptSlug: ConceptSlug;

  // Legacy SM-2 fields (kept for backward compatibility during transition)
  phase: LearningPhase;
  easeFactor: number;
  interval: number;

  // FSRS fields
  stability: number;
  difficulty: number;
  fsrsState: 0 | 1 | 2 | 3; // 0=New, 1=Learning, 2=Review, 3=Relearning
  reps: number;
  lapses: number;
  elapsedDays: number;
  scheduledDays: number;

  // Timestamps
  nextReview: Date;
  lastReviewed: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Step 2: Update mapper in useConceptSRS**

Edit `src/lib/hooks/useConceptSRS.ts`, find `mapDbToSubconceptProgress` and update:

```typescript
function mapDbToSubconceptProgress(db: DbSubconceptProgress): SubconceptProgress {
  return {
    id: db.id,
    userId: db.user_id,
    subconceptSlug: db.subconcept_slug,
    conceptSlug: db.concept_slug as ConceptSlug,
    phase: db.phase as LearningPhase,
    easeFactor: db.ease_factor,
    interval: db.interval,
    stability: db.stability ?? 0,
    difficulty: db.difficulty ?? 0,
    fsrsState: (db.fsrs_state ?? 0) as 0 | 1 | 2 | 3,
    reps: db.reps ?? 0,
    lapses: db.lapses ?? 0,
    elapsedDays: db.elapsed_days ?? 0,
    scheduledDays: db.scheduled_days ?? 0,
    nextReview: new Date(db.next_review),
    lastReviewed: db.last_reviewed ? new Date(db.last_reviewed) : null,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}
```

**Step 3: Update DbSubconceptProgress interface**

Edit `src/lib/hooks/useConceptSRS.ts`, find `DbSubconceptProgress` and update:

```typescript
interface DbSubconceptProgress {
  id: string;
  user_id: string;
  subconcept_slug: string;
  concept_slug: string;
  phase: string;
  ease_factor: number;
  interval: number;
  stability: number | null;
  difficulty: number | null;
  fsrs_state: number | null;
  reps: number | null;
  lapses: number | null;
  elapsed_days: number | null;
  scheduled_days: number | null;
  next_review: string;
  last_reviewed: string | null;
  created_at: string;
  updated_at: string;
}
```

**Step 4: Run typecheck**

Run:
```bash
pnpm typecheck
```

Expected: PASS (or shows remaining errors to fix)

**Step 5: Run existing tests**

Run:
```bash
pnpm test
```

Expected: All tests pass (may need minor fixes)

**Step 6: Commit**

```bash
git add src/lib/curriculum/types.ts src/lib/hooks/useConceptSRS.ts
git commit -m "feat(types): update SubconceptProgress with FSRS fields"
```

---

## Task 5: Update useConceptSRS Hook

**Files:**
- Modify: `src/lib/hooks/useConceptSRS.ts`
- Modify: `src/lib/srs/concept-algorithm.ts`

**Step 1: Import FSRS adapter in useConceptSRS**

Add imports at top of `src/lib/hooks/useConceptSRS.ts`:

```typescript
import {
  createEmptyFSRSCard,
  reviewCard,
  cardStateToProgress,
  progressToCardState,
  fsrsStateToLegacyPhase,
} from '@/lib/srs/fsrs';
import { inferRating } from '@/lib/srs/fsrs/mapping';
import type { FSRSState } from '@/lib/srs/fsrs/types';
```

**Step 2: Create helper to map fsrsState number to FSRSState**

Add helper function in `src/lib/hooks/useConceptSRS.ts`:

```typescript
const FSRS_STATE_MAP: Record<number, FSRSState> = {
  0: 'New',
  1: 'Learning',
  2: 'Review',
  3: 'Relearning',
};

function numToFsrsState(num: number): FSRSState {
  return FSRS_STATE_MAP[num] ?? 'New';
}
```

**Step 3: Update createInitialSubconceptState**

Update the import and function call to use FSRS:

```typescript
// In createInitialSubconceptState or where new progress is created
const emptyCard = createEmptyFSRSCard(new Date());

// Initial progress object now includes FSRS fields
const initialProgress: SubconceptProgress = {
  id: generateId(),
  userId,
  subconceptSlug,
  conceptSlug,
  // Legacy fields
  phase: 'learning',
  easeFactor: 2.5,
  interval: 0,
  // FSRS fields
  stability: emptyCard.stability,
  difficulty: emptyCard.difficulty,
  fsrsState: 0, // New
  reps: emptyCard.reps,
  lapses: emptyCard.lapses,
  elapsedDays: emptyCard.elapsedDays,
  scheduledDays: emptyCard.scheduledDays,
  // Timestamps
  nextReview: emptyCard.due,
  lastReviewed: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

**Step 4: Update recordSubconceptResult to use FSRS**

Find `recordSubconceptResult` in `src/lib/hooks/useConceptSRS.ts` and update the calculation:

```typescript
// Inside recordSubconceptResult, replace:
// const result = calculateSubconceptReview(quality, targetProgress);

// With FSRS calculation:
const cardState = progressToCardState({
  stability: targetProgress.stability,
  difficulty: targetProgress.difficulty,
  fsrsState: numToFsrsState(targetProgress.fsrsState),
  due: targetProgress.nextReview,
  lastReview: targetProgress.lastReviewed,
  reps: targetProgress.reps,
  lapses: targetProgress.lapses,
  elapsedDays: targetProgress.elapsedDays,
  scheduledDays: targetProgress.scheduledDays,
});

// Map quality to rating (or use inferRating with ReviewInput)
const rating = qualityToRating(quality);
const fsrsResult = reviewCard(cardState, rating, new Date());
const progressFields = cardStateToProgress(fsrsResult.cardState);

// Update upsert to include FSRS fields:
const { error: upsertError } = await supabase
  .from('subconcept_progress')
  .upsert({
    user_id: user.id,
    subconcept_slug: targetSlug,
    concept_slug: targetProgress.conceptSlug,
    // Legacy fields for backward compatibility
    phase: fsrsStateToLegacyPhase(progressFields.fsrsState),
    ease_factor: targetProgress.easeFactor, // Keep existing
    interval: progressFields.scheduledDays,
    // FSRS fields
    stability: progressFields.stability,
    difficulty: progressFields.difficulty,
    fsrs_state: STATE_MAP[progressFields.fsrsState],
    reps: progressFields.reps,
    lapses: progressFields.lapses,
    elapsed_days: progressFields.elapsedDays,
    scheduled_days: progressFields.scheduledDays,
    // Timestamps
    next_review: progressFields.due.toISOString(),
    last_reviewed: progressFields.lastReview?.toISOString() ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  .select()
  .single();
```

**Step 5: Add STATE_MAP import**

Add to imports:

```typescript
import { STATE_MAP } from '@/lib/srs/fsrs/types';
import { qualityToRating } from '@/lib/srs/fsrs/mapping';
```

**Step 6: Run typecheck**

Run:
```bash
pnpm typecheck
```

Expected: PASS

**Step 7: Run tests**

Run:
```bash
pnpm test
```

Expected: PASS (may need test updates)

**Step 8: Fix any failing tests**

Update tests that mock SubconceptProgress to include new FSRS fields.

**Step 9: Run full test suite**

Run:
```bash
pnpm test
```

Expected: All tests pass

**Step 10: Commit**

```bash
git add src/lib/hooks/useConceptSRS.ts
git commit -m "feat(srs): integrate FSRS into useConceptSRS hook"
```

---

## Task 6: Update Algorithm Exports

**Files:**
- Modify: `src/lib/srs/index.ts`

**Step 1: Update SRS index exports**

Edit `src/lib/srs/index.ts`:

```typescript
// src/lib/srs/index.ts
// Re-export all SRS functionality

// Legacy SM-2 (kept for reference/testing)
export * from './algorithm';
export * from './concept-algorithm';
export * from './types';
export * from './multi-target';

// FSRS (new)
export * from './fsrs';
```

**Step 2: Run typecheck**

Run:
```bash
pnpm typecheck
```

Expected: PASS

**Step 3: Run tests**

Run:
```bash
pnpm test
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/srs/index.ts
git commit -m "feat(srs): update index exports to include FSRS"
```

---

## Task 7: Integration Testing

**Files:**
- Modify: `tests/integration/srs/concept-algorithm.test.ts` (or create new)
- Create: `tests/integration/srs/fsrs-integration.test.ts`

**Step 1: Create FSRS integration test**

Create `tests/integration/srs/fsrs-integration.test.ts`:

```typescript
// tests/integration/srs/fsrs-integration.test.ts
import { describe, it, expect } from 'vitest';
import {
  createEmptyFSRSCard,
  reviewCard,
  cardStateToProgress,
  progressToCardState,
  fsrsStateToLegacyPhase,
} from '@/lib/srs/fsrs';
import { inferRating, qualityToRating } from '@/lib/srs/fsrs/mapping';
import type { Quality } from '@/lib/types';

describe('FSRS Integration', () => {
  describe('full review cycle', () => {
    it('progresses card through learning to review state', () => {
      // Start with new card
      const card1 = createEmptyFSRSCard(new Date('2026-01-01'));
      expect(card1.state).toBe('New');

      // First review - Good
      const result1 = reviewCard(card1, 'Good', new Date('2026-01-01'));
      expect(result1.cardState.state).toBe('Learning');
      expect(result1.cardState.reps).toBe(1);

      // Second review - Good (should progress toward Review)
      const result2 = reviewCard(
        result1.cardState,
        'Good',
        new Date('2026-01-02')
      );
      expect(result2.cardState.reps).toBe(2);

      // Continue until Review state
      let current = result2.cardState;
      let reviewCount = 2;
      while (current.state !== 'Review' && reviewCount < 10) {
        const dueDate = new Date(current.due);
        const result = reviewCard(current, 'Good', dueDate);
        current = result.cardState;
        reviewCount++;
      }

      expect(current.state).toBe('Review');
      expect(current.stability).toBeGreaterThan(0);
    });

    it('handles lapses correctly', () => {
      // Get card to Review state first
      let card = createEmptyFSRSCard(new Date('2026-01-01'));
      for (let i = 0; i < 5; i++) {
        const result = reviewCard(card, 'Good', new Date(`2026-01-0${i + 1}`));
        card = result.cardState;
      }

      // Now fail it
      const beforeLapses = card.lapses;
      const failResult = reviewCard(card, 'Again', new Date('2026-01-10'));

      expect(failResult.cardState.lapses).toBe(beforeLapses + 1);
      expect(failResult.cardState.state).toBe('Relearning');
      expect(failResult.wasCorrect).toBe(false);
    });
  });

  describe('Quality to Rating mapping integration', () => {
    it('maps all Quality values correctly', () => {
      const mappings: [Quality, string][] = [
        [0, 'Again'],
        [1, 'Again'],
        [2, 'Again'],
        [3, 'Hard'],
        [4, 'Good'],
        [5, 'Easy'],
      ];

      for (const [quality, expectedRating] of mappings) {
        expect(qualityToRating(quality)).toBe(expectedRating);
      }
    });

    it('infers rating from review inputs correctly', () => {
      // Incorrect -> Again
      expect(
        inferRating({ isCorrect: false, hintUsed: false, responseTimeMs: 5000 })
      ).toBe('Again');

      // Correct with hint -> Hard
      expect(
        inferRating({ isCorrect: true, hintUsed: true, responseTimeMs: 5000 })
      ).toBe('Hard');

      // Correct, fast -> Easy
      expect(
        inferRating({ isCorrect: true, hintUsed: false, responseTimeMs: 10000 })
      ).toBe('Easy');

      // Correct, medium -> Good
      expect(
        inferRating({ isCorrect: true, hintUsed: false, responseTimeMs: 20000 })
      ).toBe('Good');

      // Correct, slow -> Hard
      expect(
        inferRating({ isCorrect: true, hintUsed: false, responseTimeMs: 40000 })
      ).toBe('Hard');
    });
  });

  describe('cardState persistence round-trip', () => {
    it('preserves all fields through progress conversion', () => {
      const card = createEmptyFSRSCard(new Date('2026-01-01'));
      const reviewed = reviewCard(card, 'Good', new Date('2026-01-01'));

      const progress = cardStateToProgress(reviewed.cardState);
      const restored = progressToCardState(progress);

      expect(restored.state).toBe(reviewed.cardState.state);
      expect(restored.stability).toBe(reviewed.cardState.stability);
      expect(restored.difficulty).toBe(reviewed.cardState.difficulty);
      expect(restored.reps).toBe(reviewed.cardState.reps);
      expect(restored.lapses).toBe(reviewed.cardState.lapses);
      expect(restored.elapsedDays).toBe(reviewed.cardState.elapsedDays);
      expect(restored.scheduledDays).toBe(reviewed.cardState.scheduledDays);
    });
  });

  describe('legacy phase compatibility', () => {
    it('maps FSRS states to legacy phases', () => {
      expect(fsrsStateToLegacyPhase('New')).toBe('learning');
      expect(fsrsStateToLegacyPhase('Learning')).toBe('learning');
      expect(fsrsStateToLegacyPhase('Review')).toBe('review');
      expect(fsrsStateToLegacyPhase('Relearning')).toBe('learning');
    });
  });
});
```

**Step 2: Run integration tests**

Run:
```bash
pnpm test tests/integration/srs/fsrs-integration.test.ts
```

Expected: PASS

**Step 3: Run full test suite**

Run:
```bash
pnpm test
```

Expected: All 747+ tests pass

**Step 4: Run typecheck**

Run:
```bash
pnpm typecheck
```

Expected: PASS

**Step 5: Run lint**

Run:
```bash
pnpm lint
```

Expected: PASS

**Step 6: Run E2E tests**

Run:
```bash
pnpm test:e2e
```

Expected: PASS (E2E tests exercise the full flow)

**Step 7: Commit integration tests**

```bash
git add tests/integration/srs/
git commit -m "test(srs): add FSRS integration tests"
```

**Step 8: Final commit - feature complete**

```bash
git add -A
git commit -m "feat(srs): complete SM-2 to FSRS migration

- Add ts-fsrs dependency
- Create FSRS adapter layer with Quality-to-Rating mapping
- Add FSRS columns to subconcept_progress table
- Update useConceptSRS hook to use FSRS
- Maintain backward compatibility with legacy phase field
- Add comprehensive unit and integration tests

BREAKING: Database schema change - run migrations before deploying"
```

---

## Verification Checklist

Before considering this migration complete:

- [ ] All unit tests pass (`pnpm test`)
- [ ] All integration tests pass
- [ ] E2E tests pass (`pnpm test:e2e`)
- [ ] TypeScript compiles (`pnpm typecheck`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Local database has new columns
- [ ] Manual test: Complete a practice session
- [ ] Manual test: Verify scheduled review dates are reasonable

---

## Rollback Plan

If issues arise in production:

1. The legacy `phase`, `ease_factor`, `interval` columns are preserved
2. Revert to previous `useConceptSRS.ts` that uses `calculateSubconceptReview`
3. FSRS columns can be ignored (nullable with defaults)

---

## Future Enhancements

1. **Parameter optimization**: Use `@open-spaced-repetition/binding` to train custom FSRS parameters on user data
2. **Direct rating UI**: Add optional "How hard was this?" UI instead of inferring from quality
3. **Analytics**: Track FSRS metrics (stability distribution, lapse rate) for insights
4. **Remove SM-2 legacy**: Once confident, remove legacy SM-2 code and columns
