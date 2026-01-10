# New Card Ordering Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve new card ordering with soft concept gating, dynamic limits, randomized selection, and smarter interleaving based on multi-AI debate consensus.

**Architecture:** Pure functions in dedicated modules (`progression.ts`, `new-card-ordering.ts`) that are composed in `useConceptSession`. Existing interleaving gets a parallel implementation (`interleaveAtBoundaries`) that replaces the old one. Session metrics extend existing `log-attempt.ts` patterns.

**Tech Stack:** TypeScript, Vitest for TDD, existing curriculum types and session types.

---

## Summary

| Feature | Approach |
|---------|----------|
| Randomize exercise selection | Already exists in `exercise-selection.ts` - leverage existing randomization |
| Concept gating | Soft gating via `getUnlockedConcepts()` and `getNextSubconcepts()` |
| Dynamic new card limit | `max(0, 5 - floor(backlog/5))` via `calculateNewCardLimit()` |
| Smarter interleaving | `interleaveAtBoundaries()` inserts teaching at concept changes |
| Experience -> starting position | `getSkippedConceptsByExperience()` maps level to auto-completed concepts |
| Instrumentation | Extend existing logging with session-level metrics |

**Files to Create:**
- `src/lib/curriculum/progression.ts` - Concept gating and experience mapping
- `src/lib/session/new-card-ordering.ts` - Dynamic limits
- `src/lib/analytics/session-metrics.ts` - Session-level instrumentation
- `tests/unit/curriculum/progression.test.ts` - Tests for progression
- `tests/unit/session/new-card-ordering.test.ts` - Tests for new card logic
- `tests/unit/session/interleave-boundaries.test.ts` - Tests for boundary interleaving
- `tests/unit/analytics/session-metrics.test.ts` - Tests for metrics

**Files to Modify:**
- `src/lib/session/interleave-teaching.ts` - Add `findConceptBoundaries()` and `interleaveAtBoundaries()`
- `src/lib/hooks/useConceptSession.ts` - Wire up new modules, remove hardcoded constants
- `src/lib/curriculum/loader.ts` - Add helper to get curriculum graph
- `src/lib/curriculum/index.ts` - Export new functions

**Constants to Remove:**
- `TEACHING_PAIRS_LIMIT` in `useConceptSession.ts:39`
- `INSERT_INTERVAL` in `interleave-teaching.ts:3`

---

## Task 1: Create Concept Gating Tests

**Files:**
- Create: `tests/unit/curriculum/progression.test.ts`

**Step 1.1: Write failing tests for `getUnlockedConcepts()`**

```typescript
// tests/unit/curriculum/progression.test.ts
import { describe, it, expect } from 'vitest';
import {
  getUnlockedConcepts,
  getNextSubconcepts,
  getSkippedConceptsByExperience,
} from '@/lib/curriculum/progression';
import type { Concept } from '@/lib/curriculum/types';

// Test curriculum graph (simplified subset)
const testCurriculum: Concept[] = [
  {
    slug: 'foundations',
    name: 'Foundations',
    description: 'Basic concepts',
    prereqs: [],
    subconcepts: ['variables', 'operators', 'expressions'],
  },
  {
    slug: 'strings',
    name: 'Strings',
    description: 'String manipulation',
    prereqs: ['foundations'],
    subconcepts: ['basics', 'indexing', 'slicing'],
  },
  {
    slug: 'numbers-booleans',
    name: 'Numbers & Booleans',
    description: 'Numeric types',
    prereqs: ['foundations'],
    subconcepts: ['integers', 'floats', 'booleans'],
  },
  {
    slug: 'conditionals',
    name: 'Conditionals',
    description: 'Branching logic',
    prereqs: ['numbers-booleans'],
    subconcepts: ['if-else', 'elif-chains', 'ternary'],
  },
  {
    slug: 'collections',
    name: 'Collections',
    description: 'Lists, dicts, etc.',
    prereqs: ['strings', 'numbers-booleans'],
    subconcepts: ['lists', 'tuples', 'dicts'],
  },
  {
    slug: 'loops',
    name: 'Loops',
    description: 'Iteration',
    prereqs: ['conditionals', 'collections'],
    subconcepts: ['for', 'while', 'range'],
  },
];

describe('getUnlockedConcepts', () => {
  it('returns only foundations for fresh beginner (no completed subconcepts)', () => {
    const completed = new Set<string>();
    const unlocked = getUnlockedConcepts(completed, testCurriculum);

    expect(unlocked).toEqual(['foundations']);
  });

  it('unlocks strings AND numbers-booleans when foundations has one subconcept completed', () => {
    const completed = new Set(['variables']);
    const unlocked = getUnlockedConcepts(completed, testCurriculum);

    expect(unlocked).toContain('foundations');
    expect(unlocked).toContain('strings');
    expect(unlocked).toContain('numbers-booleans');
    expect(unlocked).not.toContain('conditionals');
  });

  it('unlocks conditionals when numbers-booleans has subconcept completed', () => {
    const completed = new Set(['variables', 'integers']);
    const unlocked = getUnlockedConcepts(completed, testCurriculum);

    expect(unlocked).toContain('conditionals');
  });

  it('unlocks collections when both strings AND numbers-booleans have subconcepts', () => {
    const completed = new Set(['variables', 'basics', 'integers']);
    const unlocked = getUnlockedConcepts(completed, testCurriculum);

    expect(unlocked).toContain('collections');
  });

  it('does NOT unlock loops until both conditionals AND collections have progress', () => {
    const completed = new Set(['variables', 'basics', 'integers', 'lists']);
    const unlocked = getUnlockedConcepts(completed, testCurriculum);

    expect(unlocked).not.toContain('loops');
  });

  it('unlocks loops when conditionals AND collections have subconcepts', () => {
    const completed = new Set(['variables', 'basics', 'integers', 'lists', 'if-else']);
    const unlocked = getUnlockedConcepts(completed, testCurriculum);

    expect(unlocked).toContain('loops');
  });
});
```

**Step 1.2: Run tests to verify they fail**

Run: `pnpm test tests/unit/curriculum/progression.test.ts`
Expected: FAIL with "Cannot find module '@/lib/curriculum/progression'"

---

## Task 2: Implement `getUnlockedConcepts()`

**Files:**
- Create: `src/lib/curriculum/progression.ts`

**Step 2.1: Write minimal implementation**

```typescript
// src/lib/curriculum/progression.ts
import type { Concept, ConceptSlug, ExperienceLevel } from './types';

/**
 * Get unlocked concepts based on completed subconcepts.
 *
 * Soft gating rules:
 * - A concept is always unlocked if it has no prerequisites
 * - A concept is unlocked if ALL its prereq concepts have at least one subconcept completed
 *
 * This allows parallel progression through concepts that share prerequisites.
 */
export function getUnlockedConcepts(
  completedSubconcepts: Set<string>,
  curriculum: Concept[]
): ConceptSlug[] {
  // Build map of concept slug -> its subconcepts
  const conceptSubconcepts = new Map<string, string[]>();
  for (const concept of curriculum) {
    conceptSubconcepts.set(concept.slug, concept.subconcepts);
  }

  // Check if a concept has at least one completed subconcept
  const hasProgress = (conceptSlug: string): boolean => {
    const subconcepts = conceptSubconcepts.get(conceptSlug) ?? [];
    return subconcepts.some(s => completedSubconcepts.has(s));
  };

  const unlocked: ConceptSlug[] = [];

  for (const concept of curriculum) {
    // No prereqs = always unlocked
    if (concept.prereqs.length === 0) {
      unlocked.push(concept.slug);
      continue;
    }

    // Check if ALL prereqs have progress
    const allPrereqsHaveProgress = concept.prereqs.every(prereq => hasProgress(prereq));
    if (allPrereqsHaveProgress) {
      unlocked.push(concept.slug);
    }
  }

  return unlocked;
}
```

**Step 2.2: Run tests to verify they pass**

Run: `pnpm test tests/unit/curriculum/progression.test.ts`
Expected: All `getUnlockedConcepts` tests PASS

**Step 2.3: Commit**

```bash
git add tests/unit/curriculum/progression.test.ts src/lib/curriculum/progression.ts
git commit -m "$(cat <<'EOF'
feat(curriculum): add getUnlockedConcepts with soft gating

Implements concept unlocking based on completed subconcepts.
A concept unlocks when ALL its prereqs have at least one
subconcept completed, enabling parallel progression.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Add Tests for `getNextSubconcepts()`

**Files:**
- Modify: `tests/unit/curriculum/progression.test.ts`

**Step 3.1: Write failing tests**

Add to `tests/unit/curriculum/progression.test.ts`:

```typescript
describe('getNextSubconcepts', () => {
  it('returns intro subconcepts from foundations for fresh beginner', () => {
    const completed = new Set<string>();
    const inProgress = new Set<string>();

    const next = getNextSubconcepts(completed, inProgress, testCurriculum, 3);

    // Should return up to 3 subconcepts from foundations
    expect(next.length).toBeLessThanOrEqual(3);
    expect(next.every(s => testCurriculum[0].subconcepts.includes(s))).toBe(true);
  });

  it('prioritizes finishing current concept over starting new ones', () => {
    // User has started foundations but not finished
    const completed = new Set(['variables']);
    const inProgress = new Set(['operators']);

    const next = getNextSubconcepts(completed, inProgress, testCurriculum, 3);

    // Should prioritize remaining foundations subconcepts
    expect(next).toContain('expressions');
    // inProgress subconcepts should not be returned (already being worked on)
    expect(next).not.toContain('operators');
  });

  it('returns subconcepts from multiple unlocked concepts when limit allows', () => {
    // User completed foundations
    const completed = new Set(['variables', 'operators', 'expressions']);
    const inProgress = new Set<string>();

    const next = getNextSubconcepts(completed, inProgress, testCurriculum, 5);

    // Should include subconcepts from strings AND numbers-booleans
    const fromStrings = next.filter(s => testCurriculum[1].subconcepts.includes(s));
    const fromNumbers = next.filter(s => testCurriculum[2].subconcepts.includes(s));

    expect(fromStrings.length).toBeGreaterThan(0);
    expect(fromNumbers.length).toBeGreaterThan(0);
  });

  it('excludes already completed subconcepts', () => {
    const completed = new Set(['variables', 'operators']);
    const inProgress = new Set<string>();

    const next = getNextSubconcepts(completed, inProgress, testCurriculum, 5);

    expect(next).not.toContain('variables');
    expect(next).not.toContain('operators');
  });

  it('excludes in-progress subconcepts', () => {
    const completed = new Set<string>();
    const inProgress = new Set(['variables']);

    const next = getNextSubconcepts(completed, inProgress, testCurriculum, 5);

    expect(next).not.toContain('variables');
    expect(next).toContain('operators');
  });

  it('respects the limit parameter', () => {
    const completed = new Set<string>();
    const inProgress = new Set<string>();

    const next = getNextSubconcepts(completed, inProgress, testCurriculum, 2);

    expect(next.length).toBeLessThanOrEqual(2);
  });

  it('returns empty array when all subconcepts completed or in-progress', () => {
    const allSubconcepts = testCurriculum.flatMap(c => c.subconcepts);
    const completed = new Set(allSubconcepts);
    const inProgress = new Set<string>();

    const next = getNextSubconcepts(completed, inProgress, testCurriculum, 5);

    expect(next).toEqual([]);
  });
});
```

**Step 3.2: Run tests to verify they fail**

Run: `pnpm test tests/unit/curriculum/progression.test.ts`
Expected: FAIL with "getNextSubconcepts is not a function"

---

## Task 4: Implement `getNextSubconcepts()`

**Files:**
- Modify: `src/lib/curriculum/progression.ts`

**Step 4.1: Add implementation**

Add to `src/lib/curriculum/progression.ts`:

```typescript
/**
 * Get next subconcepts to learn, respecting soft gating.
 *
 * Selection strategy:
 * 1. Get all unlocked concepts
 * 2. Prioritize concepts where user has started but not finished (in-progress)
 * 3. Then add from newly unlocked concepts
 * 4. Exclude completed and in-progress subconcepts
 * 5. Respect the limit
 */
export function getNextSubconcepts(
  completedSubconcepts: Set<string>,
  inProgressSubconcepts: Set<string>,
  curriculum: Concept[],
  limit: number
): string[] {
  if (limit <= 0) return [];

  const unlockedConceptSlugs = new Set(getUnlockedConcepts(completedSubconcepts, curriculum));

  // Build concept priority: concepts with in-progress work come first
  const conceptsWithProgress: Concept[] = [];
  const newlyUnlockedConcepts: Concept[] = [];

  for (const concept of curriculum) {
    if (!unlockedConceptSlugs.has(concept.slug)) continue;

    const hasInProgress = concept.subconcepts.some(s => inProgressSubconcepts.has(s));
    const hasCompleted = concept.subconcepts.some(s => completedSubconcepts.has(s));

    if (hasInProgress || hasCompleted) {
      conceptsWithProgress.push(concept);
    } else {
      newlyUnlockedConcepts.push(concept);
    }
  }

  // Order: in-progress concepts first, then newly unlocked
  const orderedConcepts = [...conceptsWithProgress, ...newlyUnlockedConcepts];

  // Collect available subconcepts (not completed, not in-progress)
  const result: string[] = [];

  for (const concept of orderedConcepts) {
    if (result.length >= limit) break;

    for (const subconcept of concept.subconcepts) {
      if (result.length >= limit) break;

      if (!completedSubconcepts.has(subconcept) && !inProgressSubconcepts.has(subconcept)) {
        result.push(subconcept);
      }
    }
  }

  return result;
}
```

**Step 4.2: Run tests to verify they pass**

Run: `pnpm test tests/unit/curriculum/progression.test.ts`
Expected: All tests PASS

**Step 4.3: Commit**

```bash
git add tests/unit/curriculum/progression.test.ts src/lib/curriculum/progression.ts
git commit -m "$(cat <<'EOF'
feat(curriculum): add getNextSubconcepts with priority ordering

Selects next subconcepts to learn:
- Prioritizes concepts with in-progress work
- Then newly unlocked concepts
- Excludes completed/in-progress subconcepts
- Respects limit parameter

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Add Tests for `getSkippedConceptsByExperience()`

**Files:**
- Modify: `tests/unit/curriculum/progression.test.ts`

**Step 5.1: Write failing tests**

Add to `tests/unit/curriculum/progression.test.ts`:

```typescript
describe('getSkippedConceptsByExperience', () => {
  it('returns empty set for beginner (start from scratch)', () => {
    const skipped = getSkippedConceptsByExperience('beginner');

    expect(skipped.size).toBe(0);
  });

  it('returns foundations + strings + numbers-booleans for learning level', () => {
    const skipped = getSkippedConceptsByExperience('learning');

    expect(skipped.has('foundations')).toBe(true);
    expect(skipped.has('strings')).toBe(true);
    expect(skipped.has('numbers-booleans')).toBe(true);
    expect(skipped.has('conditionals')).toBe(false);
  });

  it('returns early concepts for refresher (experienced developers)', () => {
    const skipped = getSkippedConceptsByExperience('refresher');

    expect(skipped.has('foundations')).toBe(true);
    expect(skipped.has('strings')).toBe(true);
    expect(skipped.has('numbers-booleans')).toBe(true);
    expect(skipped.has('conditionals')).toBe(true);
    expect(skipped.has('collections')).toBe(true);
    expect(skipped.has('loops')).toBe(true);
    // Should NOT skip advanced concepts
    expect(skipped.has('functions')).toBe(false);
    expect(skipped.has('oop')).toBe(false);
  });
});
```

**Step 5.2: Run tests to verify they fail**

Run: `pnpm test tests/unit/curriculum/progression.test.ts`
Expected: FAIL with "getSkippedConceptsByExperience is not a function"

---

## Task 6: Implement `getSkippedConceptsByExperience()`

**Files:**
- Modify: `src/lib/curriculum/progression.ts`

**Step 6.1: Add implementation**

Add to `src/lib/curriculum/progression.ts`:

```typescript
/**
 * Map experience level to concepts that should be treated as "auto-completed".
 *
 * This allows experienced users to skip basic concepts and start further
 * into the curriculum based on their self-reported experience level.
 *
 * beginner  -> empty set (start at foundations)
 * learning  -> foundations, strings, numbers-booleans
 * refresher -> foundations through loops (skip basics, focus on advanced)
 */
export function getSkippedConceptsByExperience(level: ExperienceLevel): Set<ConceptSlug> {
  switch (level) {
    case 'beginner':
      return new Set();

    case 'learning':
      return new Set([
        'foundations',
        'strings',
        'numbers-booleans',
      ]);

    case 'refresher':
      return new Set([
        'foundations',
        'strings',
        'numbers-booleans',
        'conditionals',
        'collections',
        'loops',
      ]);

    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = level;
      return _exhaustive;
  }
}
```

**Step 6.2: Run tests to verify they pass**

Run: `pnpm test tests/unit/curriculum/progression.test.ts`
Expected: All tests PASS

**Step 6.3: Commit**

```bash
git add tests/unit/curriculum/progression.test.ts src/lib/curriculum/progression.ts
git commit -m "$(cat <<'EOF'
feat(curriculum): add getSkippedConceptsByExperience

Maps experience level to auto-completed concepts:
- beginner: start from scratch
- learning: skip foundations/strings/numbers-booleans
- refresher: skip through loops, focus on advanced

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Add Tests for Dynamic New Card Limit

**Files:**
- Create: `tests/unit/session/new-card-ordering.test.ts`

**Step 7.1: Write failing tests**

```typescript
// tests/unit/session/new-card-ordering.test.ts
import { describe, it, expect } from 'vitest';
import { calculateNewCardLimit } from '@/lib/session/new-card-ordering';

describe('calculateNewCardLimit', () => {
  it('returns 5 when backlog is 0', () => {
    expect(calculateNewCardLimit(0)).toBe(5);
  });

  it('returns 5 when backlog is 1-4', () => {
    expect(calculateNewCardLimit(1)).toBe(5);
    expect(calculateNewCardLimit(4)).toBe(5);
  });

  it('returns 4 when backlog is 5-9', () => {
    expect(calculateNewCardLimit(5)).toBe(4);
    expect(calculateNewCardLimit(9)).toBe(4);
  });

  it('returns 3 when backlog is 10-14', () => {
    expect(calculateNewCardLimit(10)).toBe(3);
    expect(calculateNewCardLimit(14)).toBe(3);
  });

  it('returns 2 when backlog is 15-19', () => {
    expect(calculateNewCardLimit(15)).toBe(2);
    expect(calculateNewCardLimit(19)).toBe(2);
  });

  it('returns 1 when backlog is 20-24', () => {
    expect(calculateNewCardLimit(20)).toBe(1);
    expect(calculateNewCardLimit(24)).toBe(1);
  });

  it('returns 0 when backlog is 25 or more', () => {
    expect(calculateNewCardLimit(25)).toBe(0);
    expect(calculateNewCardLimit(100)).toBe(0);
  });

  it('handles edge case of negative backlog (treats as 0)', () => {
    expect(calculateNewCardLimit(-1)).toBe(5);
  });
});
```

**Step 7.2: Run tests to verify they fail**

Run: `pnpm test tests/unit/session/new-card-ordering.test.ts`
Expected: FAIL with "Cannot find module '@/lib/session/new-card-ordering'"

---

## Task 8: Implement `calculateNewCardLimit()`

**Files:**
- Create: `src/lib/session/new-card-ordering.ts`

**Step 8.1: Write implementation**

```typescript
// src/lib/session/new-card-ordering.ts
// Dynamic new card limit based on review backlog

/**
 * Calculate how many new cards to show based on review backlog.
 *
 * Formula: max(0, 5 - floor(backlog / 5))
 *
 * This creates a sliding scale:
 * - backlog 0-4:   5 new cards (no pressure)
 * - backlog 5-9:   4 new cards
 * - backlog 10-14: 3 new cards
 * - backlog 15-19: 2 new cards
 * - backlog 20-24: 1 new card
 * - backlog 25+:   0 new cards (focus on reviews)
 *
 * The goal is to prevent backlog from growing out of control
 * while still introducing new material when possible.
 */
export function calculateNewCardLimit(reviewBacklog: number): number {
  // Handle negative backlog as 0
  const normalizedBacklog = Math.max(0, reviewBacklog);
  return Math.max(0, 5 - Math.floor(normalizedBacklog / 5));
}
```

**Step 8.2: Run tests to verify they pass**

Run: `pnpm test tests/unit/session/new-card-ordering.test.ts`
Expected: All tests PASS

**Step 8.3: Commit**

```bash
git add tests/unit/session/new-card-ordering.test.ts src/lib/session/new-card-ordering.ts
git commit -m "$(cat <<'EOF'
feat(session): add calculateNewCardLimit for dynamic limits

Implements sliding scale for new cards based on backlog:
max(0, 5 - floor(backlog / 5))

Prevents backlog growth while still introducing new material.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Add Tests for Boundary-Based Interleaving

**Files:**
- Create: `tests/unit/session/interleave-boundaries.test.ts`

**Step 9.1: Write failing tests for `findConceptBoundaries()`**

```typescript
// tests/unit/session/interleave-boundaries.test.ts
import { describe, it, expect } from 'vitest';
import {
  findConceptBoundaries,
  interleaveAtBoundaries,
} from '@/lib/session/interleave-teaching';
import type { ReviewSessionCard } from '@/lib/session/types';
import type { TeachingPair } from '@/lib/session/teaching-cards';
import { createMockExercise } from '@tests/fixtures/exercise';

function createReviewCardWithConcept(id: string, concept: string): ReviewSessionCard {
  return {
    type: 'review',
    exercise: createMockExercise({ id, slug: `review-${id}`, concept }),
  };
}

function createTeachingPair(subconcept: string): TeachingPair {
  return {
    teachingCard: {
      type: 'teaching',
      subconcept,
      teaching: { explanation: `Learn ${subconcept}` },
      exampleExercise: createMockExercise({ slug: `${subconcept}-intro` }),
    },
    practiceCard: {
      type: 'practice',
      exercise: createMockExercise({ slug: `${subconcept}-practice` }),
      isNew: true,
    },
  };
}

describe('findConceptBoundaries', () => {
  it('returns empty array for empty input', () => {
    expect(findConceptBoundaries([])).toEqual([]);
  });

  it('returns empty array when all cards are same concept', () => {
    const cards = [
      createReviewCardWithConcept('1', 'loops'),
      createReviewCardWithConcept('2', 'loops'),
      createReviewCardWithConcept('3', 'loops'),
    ];

    expect(findConceptBoundaries(cards)).toEqual([]);
  });

  it('returns index where concept changes', () => {
    const cards = [
      createReviewCardWithConcept('1', 'loops'),
      createReviewCardWithConcept('2', 'loops'),
      createReviewCardWithConcept('3', 'strings'), // boundary at index 2
    ];

    expect(findConceptBoundaries(cards)).toEqual([2]);
  });

  it('returns multiple boundaries for multiple concept changes', () => {
    const cards = [
      createReviewCardWithConcept('1', 'loops'),
      createReviewCardWithConcept('2', 'strings'),  // boundary at 1
      createReviewCardWithConcept('3', 'strings'),
      createReviewCardWithConcept('4', 'functions'), // boundary at 3
    ];

    expect(findConceptBoundaries(cards)).toEqual([1, 3]);
  });

  it('handles single card (no boundaries)', () => {
    const cards = [createReviewCardWithConcept('1', 'loops')];

    expect(findConceptBoundaries(cards)).toEqual([]);
  });
});

describe('interleaveAtBoundaries', () => {
  it('returns empty array when both inputs empty', () => {
    expect(interleaveAtBoundaries([], [])).toEqual([]);
  });

  it('returns only review cards when no teaching pairs', () => {
    const reviewCards = [
      createReviewCardWithConcept('1', 'loops'),
      createReviewCardWithConcept('2', 'strings'),
    ];

    const result = interleaveAtBoundaries(reviewCards, []);

    expect(result).toHaveLength(2);
    expect(result.every(c => c.type === 'review')).toBe(true);
  });

  it('returns teaching pairs when no review cards', () => {
    const pairs = [createTeachingPair('for')];

    const result = interleaveAtBoundaries([], pairs);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('teaching');
    expect(result[1].type).toBe('practice');
  });

  it('inserts teaching pair at concept boundary', () => {
    const reviewCards = [
      createReviewCardWithConcept('1', 'loops'),
      createReviewCardWithConcept('2', 'loops'),
      createReviewCardWithConcept('3', 'strings'),
      createReviewCardWithConcept('4', 'strings'),
    ];
    const pairs = [createTeachingPair('for')];

    const result = interleaveAtBoundaries(reviewCards, pairs);

    // loops, loops, teaching, practice, strings, strings
    expect(result).toHaveLength(6);
    expect(result[0].type).toBe('review');
    expect(result[1].type).toBe('review');
    expect(result[2].type).toBe('teaching');
    expect(result[3].type).toBe('practice');
    expect(result[4].type).toBe('review');
    expect(result[5].type).toBe('review');
  });

  it('prepends teaching when no boundaries exist (all same concept)', () => {
    const reviewCards = [
      createReviewCardWithConcept('1', 'loops'),
      createReviewCardWithConcept('2', 'loops'),
      createReviewCardWithConcept('3', 'loops'),
    ];
    const pairs = [createTeachingPair('for')];

    const result = interleaveAtBoundaries(reviewCards, pairs);

    // teaching, practice, loops, loops, loops
    expect(result).toHaveLength(5);
    expect(result[0].type).toBe('teaching');
    expect(result[1].type).toBe('practice');
    expect(result[2].type).toBe('review');
  });

  it('distributes multiple teaching pairs across boundaries', () => {
    const reviewCards = [
      createReviewCardWithConcept('1', 'loops'),
      createReviewCardWithConcept('2', 'strings'),  // boundary
      createReviewCardWithConcept('3', 'functions'), // boundary
    ];
    const pairs = [createTeachingPair('for'), createTeachingPair('while')];

    const result = interleaveAtBoundaries(reviewCards, pairs);

    // loops, T1, P1, strings, T2, P2, functions
    expect(result).toHaveLength(7);
    expect(result[0].type).toBe('review'); // loops
    expect(result[1].type).toBe('teaching');
    expect(result[2].type).toBe('practice');
    expect(result[3].type).toBe('review'); // strings
    expect(result[4].type).toBe('teaching');
    expect(result[5].type).toBe('practice');
    expect(result[6].type).toBe('review'); // functions
  });

  it('prepends extra teaching pairs when more pairs than boundaries', () => {
    const reviewCards = [
      createReviewCardWithConcept('1', 'loops'),
      createReviewCardWithConcept('2', 'strings'), // one boundary
    ];
    const pairs = [
      createTeachingPair('for'),
      createTeachingPair('while'),
      createTeachingPair('range'),
    ];

    const result = interleaveAtBoundaries(reviewCards, pairs);

    // T2, P2, T3, P3, loops, T1, P1, strings (prepend extras, then boundary)
    // OR: prepend T2, T3, insert T1 at boundary
    // Expected: T2, P2, T3, P3, loops, T1, P1, strings
    expect(result.length).toBe(8);

    // First 4 cards should be prepended teaching pairs
    expect(result[0].type).toBe('teaching');
    expect(result[1].type).toBe('practice');
    expect(result[2].type).toBe('teaching');
    expect(result[3].type).toBe('practice');

    // Then loops, then teaching pair at boundary, then strings
    expect(result[4].type).toBe('review');
    expect(result[5].type).toBe('teaching');
    expect(result[6].type).toBe('practice');
    expect(result[7].type).toBe('review');
  });

  it('preserves order of review cards', () => {
    const reviewCards = [
      createReviewCardWithConcept('a', 'loops'),
      createReviewCardWithConcept('b', 'strings'),
      createReviewCardWithConcept('c', 'strings'),
    ];
    const pairs = [createTeachingPair('for')];

    const result = interleaveAtBoundaries(reviewCards, pairs);

    const reviewOnly = result.filter((c): c is ReviewSessionCard => c.type === 'review');
    expect(reviewOnly.map(c => c.exercise.id)).toEqual(['a', 'b', 'c']);
  });
});
```

**Step 9.2: Run tests to verify they fail**

Run: `pnpm test tests/unit/session/interleave-boundaries.test.ts`
Expected: FAIL with "findConceptBoundaries is not exported"

---

## Task 10: Implement Boundary-Based Interleaving

**Files:**
- Modify: `src/lib/session/interleave-teaching.ts`

**Step 10.1: Add new functions alongside existing ones**

Add to `src/lib/session/interleave-teaching.ts`:

```typescript
/**
 * Find indices where concept changes in a sequence of review cards.
 * Returns the index of the first card of each new concept.
 */
export function findConceptBoundaries(reviewCards: ReviewSessionCard[]): number[] {
  if (reviewCards.length <= 1) {
    return [];
  }

  const boundaries: number[] = [];

  for (let i = 1; i < reviewCards.length; i++) {
    const prevConcept = reviewCards[i - 1].exercise.concept;
    const currConcept = reviewCards[i].exercise.concept;

    if (prevConcept !== currConcept) {
      boundaries.push(i);
    }
  }

  return boundaries;
}

/**
 * Interleave teaching pairs at concept boundaries.
 *
 * Strategy:
 * 1. Find concept boundaries in review cards
 * 2. Insert one teaching pair at each boundary (in order)
 * 3. If more teaching pairs than boundaries, prepend extras at start
 * 4. If no boundaries, prepend all teaching pairs at start
 *
 * This places learning breaks at natural topic transitions,
 * which is pedagogically better than fixed intervals.
 */
export function interleaveAtBoundaries(
  reviewCards: ReviewSessionCard[],
  teachingPairs: TeachingPair[]
): SessionCardType[] {
  if (reviewCards.length === 0 && teachingPairs.length === 0) {
    return [];
  }

  if (teachingPairs.length === 0) {
    return [...reviewCards];
  }

  if (reviewCards.length === 0) {
    return teachingPairs.flatMap(pair => [pair.teachingCard, pair.practiceCard]);
  }

  const boundaries = findConceptBoundaries(reviewCards);
  const result: SessionCardType[] = [];

  // Determine how to distribute teaching pairs
  const pairsAtBoundaries = Math.min(teachingPairs.length, boundaries.length);
  const extraPairs = teachingPairs.length - pairsAtBoundaries;

  // Prepend extra pairs that don't fit at boundaries
  for (let i = pairsAtBoundaries; i < teachingPairs.length; i++) {
    const pair = teachingPairs[i];
    result.push(pair.teachingCard, pair.practiceCard);
  }

  // If no boundaries, prepend all remaining pairs and add reviews
  if (boundaries.length === 0) {
    for (let i = 0; i < pairsAtBoundaries; i++) {
      const pair = teachingPairs[i];
      result.push(pair.teachingCard, pair.practiceCard);
    }
    result.push(...reviewCards);
    return result;
  }

  // Insert reviews with teaching pairs at boundaries
  let boundaryIdx = 0;
  let pairIdx = 0;

  for (let i = 0; i < reviewCards.length; i++) {
    // Check if we're at a boundary (before adding this card)
    if (boundaryIdx < boundaries.length && i === boundaries[boundaryIdx]) {
      // Insert teaching pair at this boundary
      if (pairIdx < pairsAtBoundaries) {
        const pair = teachingPairs[pairIdx];
        result.push(pair.teachingCard, pair.practiceCard);
        pairIdx++;
      }
      boundaryIdx++;
    }

    result.push(reviewCards[i]);
  }

  return result;
}
```

**Step 10.2: Run tests to verify they pass**

Run: `pnpm test tests/unit/session/interleave-boundaries.test.ts`
Expected: All tests PASS

**Step 10.3: Commit**

```bash
git add tests/unit/session/interleave-boundaries.test.ts src/lib/session/interleave-teaching.ts
git commit -m "$(cat <<'EOF'
feat(session): add boundary-based interleaving

New functions alongside existing interval-based approach:
- findConceptBoundaries(): find concept transitions
- interleaveAtBoundaries(): insert teaching at boundaries

Places learning breaks at natural topic transitions
for better pedagogical flow.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Add Session Metrics Infrastructure

**Files:**
- Create: `src/lib/analytics/session-metrics.ts`
- Create: `tests/unit/analytics/session-metrics.test.ts`

**Step 11.1: Write failing tests**

```typescript
// tests/unit/analytics/session-metrics.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  buildSessionStartMetrics,
  buildExerciseMetrics,
  type SessionStartMetrics,
  type ExerciseMetrics,
} from '@/lib/analytics/session-metrics';

describe('buildSessionStartMetrics', () => {
  it('builds metrics with all required fields', () => {
    const metrics = buildSessionStartMetrics({
      reviewBacklog: 15,
      newCardLimit: 2,
      totalCards: 17,
    });

    expect(metrics.reviewBacklog).toBe(15);
    expect(metrics.newCardLimit).toBe(2);
    expect(metrics.totalCards).toBe(17);
    expect(metrics.timestamp).toBeInstanceOf(Date);
  });
});

describe('buildExerciseMetrics', () => {
  it('builds metrics for a practice exercise', () => {
    const metrics = buildExerciseMetrics({
      conceptSlug: 'loops',
      exerciseSlug: 'for-basic',
      wasCorrect: true,
      isNewSubconcept: true,
      conceptPosition: 3,
    });

    expect(metrics.conceptSlug).toBe('loops');
    expect(metrics.exerciseSlug).toBe('for-basic');
    expect(metrics.wasCorrect).toBe(true);
    expect(metrics.isNewSubconcept).toBe(true);
    expect(metrics.conceptPosition).toBe(3);
  });
});
```

**Step 11.2: Run tests to verify they fail**

Run: `pnpm test tests/unit/analytics/session-metrics.test.ts`
Expected: FAIL with "Cannot find module"

---

## Task 12: Implement Session Metrics

**Files:**
- Create: `src/lib/analytics/session-metrics.ts`

**Step 12.1: Write implementation**

```typescript
// src/lib/analytics/session-metrics.ts
// Session-level instrumentation for analytics

/**
 * Metrics captured at session start for drop-off analysis.
 */
export interface SessionStartMetrics {
  reviewBacklog: number;
  newCardLimit: number;
  totalCards: number;
  timestamp: Date;
}

/**
 * Metrics captured for each exercise attempt.
 */
export interface ExerciseMetrics {
  conceptSlug: string;
  exerciseSlug: string;
  wasCorrect: boolean;
  isNewSubconcept: boolean;
  conceptPosition: number;
  timestamp: Date;
}

/**
 * Build session start metrics object.
 */
export function buildSessionStartMetrics(data: {
  reviewBacklog: number;
  newCardLimit: number;
  totalCards: number;
}): SessionStartMetrics {
  return {
    ...data,
    timestamp: new Date(),
  };
}

/**
 * Build exercise attempt metrics object.
 */
export function buildExerciseMetrics(data: {
  conceptSlug: string;
  exerciseSlug: string;
  wasCorrect: boolean;
  isNewSubconcept: boolean;
  conceptPosition: number;
}): ExerciseMetrics {
  return {
    ...data,
    timestamp: new Date(),
  };
}

/**
 * Log session start event.
 * Uses Vercel Analytics if available, otherwise console.
 */
export function logSessionStart(metrics: SessionStartMetrics): void {
  if (typeof window !== 'undefined' && 'va' in window) {
    // Vercel Analytics available
    (window as { va?: (event: string, data: Record<string, unknown>) => void }).va?.('event', {
      name: 'session_start',
      ...metrics,
      timestamp: metrics.timestamp.toISOString(),
    });
  }

  // Always log for debugging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[SessionMetrics] start:', metrics);
  }
}

/**
 * Log session end event.
 */
export function logSessionEnd(data: {
  completed: boolean;
  conceptPosition: number;
  totalCards: number;
  correctCount: number;
  incorrectCount: number;
}): void {
  if (typeof window !== 'undefined' && 'va' in window) {
    (window as { va?: (event: string, data: Record<string, unknown>) => void }).va?.('event', {
      name: 'session_end',
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[SessionMetrics] end:', data);
  }
}
```

**Step 12.2: Run tests to verify they pass**

Run: `pnpm test tests/unit/analytics/session-metrics.test.ts`
Expected: All tests PASS

**Step 12.3: Commit**

```bash
git add src/lib/analytics/session-metrics.ts tests/unit/analytics/session-metrics.test.ts
git commit -m "$(cat <<'EOF'
feat(analytics): add session metrics infrastructure

New analytics module for session-level instrumentation:
- SessionStartMetrics: backlog, limits, total cards
- ExerciseMetrics: concept position, correctness
- logSessionStart/End: Vercel Analytics integration

Enables drop-off analysis and backlog correlation.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Add Curriculum Loader Helper

**Files:**
- Modify: `src/lib/curriculum/loader.ts`

**Step 13.1: Add helper to get curriculum concepts**

Add to `src/lib/curriculum/loader.ts`:

```typescript
/**
 * Get all concepts from the curriculum as typed array.
 * Used by progression functions that need the full concept graph.
 */
export function getCurriculumConcepts(): Concept[] {
  return curriculum.concepts as Concept[];
}
```

**Step 13.2: Export from index**

Modify `src/lib/curriculum/index.ts`:

```typescript
export {
  getSubconceptTeaching,
  getSubconceptDefinition,
  getAllSubconcepts,
  getCurriculumConcepts,
} from './loader';

export {
  getUnlockedConcepts,
  getNextSubconcepts,
  getSkippedConceptsByExperience,
} from './progression';

export * from './types';
```

**Step 13.3: Commit**

```bash
git add src/lib/curriculum/loader.ts src/lib/curriculum/index.ts
git commit -m "$(cat <<'EOF'
feat(curriculum): add getCurriculumConcepts helper

Exposes typed concept array for progression functions.
Updates exports in curriculum index.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Wire Up Integration in useConceptSession

**Files:**
- Modify: `src/lib/hooks/useConceptSession.ts`

**Step 14.1: Update imports**

Replace/add imports at top of file:

```typescript
import { calculateNewCardLimit } from '@/lib/session/new-card-ordering';
import { getNextSubconcepts, getSkippedConceptsByExperience, getCurriculumConcepts } from '@/lib/curriculum';
import { interleaveAtBoundaries } from '@/lib/session/interleave-teaching';
import { logSessionStart, buildSessionStartMetrics } from '@/lib/analytics/session-metrics';
```

**Step 14.2: Remove hardcoded constant**

Delete line ~39:
```typescript
// DELETE THIS LINE:
const TEACHING_PAIRS_LIMIT = 5;
```

**Step 14.3: Update session building logic**

In the `buildSession()` function (around line 205-290), replace:

```typescript
// OLD (around line ~285):
for (const slug of newSubconcepts.slice(0, TEACHING_PAIRS_LIMIT)) {

// NEW:
const newCardLimit = calculateNewCardLimit(dueSubconcepts.length);
const curriculum = getCurriculumConcepts();

// Get completed subconcepts from progress data
const completedSubconcepts = new Set(
  (allProgressData ?? [])
    .filter(p => p.subconcept_slug) // Has progress
    .map(p => p.subconcept_slug)
);

// Get in-progress subconcepts (due but started)
const inProgressSubconcepts = new Set(
  dueSubconcepts.map(p => p.subconceptSlug)
);

// Apply experience-based skipping
const skippedConcepts = getSkippedConceptsByExperience(experienceLevel);
const skippedSubconcepts = curriculum
  .filter(c => skippedConcepts.has(c.slug))
  .flatMap(c => c.subconcepts);

// Merge skipped subconcepts into completed set
for (const s of skippedSubconcepts) {
  completedSubconcepts.add(s);
}

// Get next subconcepts using progression algorithm
const nextSubconcepts = getNextSubconcepts(
  completedSubconcepts,
  inProgressSubconcepts,
  curriculum,
  newCardLimit
);

// Log session start metrics
logSessionStart(buildSessionStartMetrics({
  reviewBacklog: dueSubconcepts.length,
  newCardLimit,
  totalCards: reviewCards.length + nextSubconcepts.length * 2, // estimate
}));

for (const slug of nextSubconcepts) {
```

**Step 14.4: Replace interleaving call**

Replace (around line ~310):
```typescript
// OLD:
const sessionCards = interleaveWithTeaching(reviewCards, teachingPairs);

// NEW:
const sessionCards = interleaveAtBoundaries(reviewCards, teachingPairs);
```

**Step 14.5: Run tests to verify integration works**

Run: `pnpm test`
Expected: All 2182+ tests PASS

**Step 14.6: Commit**

```bash
git add src/lib/hooks/useConceptSession.ts
git commit -m "$(cat <<'EOF'
feat(session): integrate new card ordering improvements

- Replace TEACHING_PAIRS_LIMIT with calculateNewCardLimit()
- Use getNextSubconcepts() for concept-gated progression
- Apply getSkippedConceptsByExperience() for experience levels
- Switch to interleaveAtBoundaries() for smarter interleaving
- Add session start metrics logging

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: Clean Up Legacy Code

**Files:**
- Modify: `src/lib/session/interleave-teaching.ts`

**Step 15.1: Mark old function as deprecated**

Add JSDoc to `interleaveWithTeaching`:

```typescript
/**
 * @deprecated Use interleaveAtBoundaries() instead.
 * This function uses fixed intervals (every 3 cards).
 * The new boundary-based approach places teaching at concept transitions.
 */
export function interleaveWithTeaching(
```

**Step 15.2: Remove INSERT_INTERVAL constant usage (but keep for backwards compat)**

The constant can stay for now since `interleaveWithTeaching` still uses it.
We'll remove it completely in a future cleanup when the old function is deleted.

**Step 15.3: Run full test suite**

Run: `pnpm test`
Expected: All tests PASS

**Step 15.4: Commit**

```bash
git add src/lib/session/interleave-teaching.ts
git commit -m "$(cat <<'EOF'
chore: deprecate interleaveWithTeaching

Mark legacy interval-based interleaving as deprecated.
Will be removed in future version after migration confirmed stable.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: Update Session Index Exports

**Files:**
- Modify: `src/lib/session/index.ts`

**Step 16.1: Export new functions**

```typescript
export {
  interleaveWithTeaching,
  interleaveAtBoundaries,
  findConceptBoundaries,
} from './interleave-teaching';

export { calculateNewCardLimit } from './new-card-ordering';
```

**Step 16.2: Commit**

```bash
git add src/lib/session/index.ts
git commit -m "$(cat <<'EOF'
chore: export new session functions from index

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 17: Final Verification

**Step 17.1: Run full test suite**

Run: `pnpm test`
Expected: All tests PASS (2182+ existing + ~25 new)

**Step 17.2: Run type check**

Run: `pnpm typecheck`
Expected: No errors

**Step 17.3: Run lint**

Run: `pnpm lint`
Expected: No errors

**Step 17.4: Manual E2E verification**

1. Start dev server: `pnpm dev`
2. Create test user or use existing
3. Start practice session
4. Verify:
   - New cards limited based on backlog
   - Teaching appears at concept boundaries
   - Experience level affects starting position

**Step 17.5: Commit final changes**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: complete new card ordering improvements

Summary of changes:
- Soft concept gating via getUnlockedConcepts()
- Dynamic new card limits via calculateNewCardLimit()
- Boundary-based interleaving via interleaveAtBoundaries()
- Experience-based starting position via getSkippedConceptsByExperience()
- Session metrics infrastructure for analytics

Removed:
- TEACHING_PAIRS_LIMIT constant (dynamic calculation)
- Fixed interval interleaving (boundary-based now)

Total new tests: ~25
All 2200+ tests passing.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Success Criteria

1. All new tests pass (~25-30 tests)
2. Existing tests still pass (2182 tests)
3. No hardcoded `TEACHING_PAIRS_LIMIT` in active code paths
4. `interleaveWithTeaching` deprecated, `interleaveAtBoundaries` in use
5. Experience level affects starting position
6. Session metrics logging in place
7. Clean separation of concerns (pure functions in dedicated modules)
8. No legacy code left behind (deprecated function marked for future removal)

---

## Future Extensions

These are explicitly NOT in scope but the architecture supports them:

- **Challenge Gauntlet:** Add skip mechanism using existing gating infrastructure
- **Performance-based fast-forward:** Could layer on top of progression.ts
- **A/B testing:** Instrumentation enables comparing approaches
- **Delete deprecated code:** Remove `interleaveWithTeaching` and `INSERT_INTERVAL` after stable period
