# New Card Ordering Improvements

**Date:** 2026-01-09
**Status:** Ready for Implementation
**Estimated Tests:** 25-30 new unit tests

---

## Summary

Improve new card ordering with soft concept gating, dynamic limits, randomized selection, and smarter interleaving. Based on multi-AI debate consensus (Claude/Codex/Gemini).

## Scope

| Feature | Approach |
|---------|----------|
| Randomize exercise selection | Shuffle within intro/practice pool |
| Concept gating | Soft gating (parallel concepts if prereqs met) |
| Dynamic new card limit | `max(0, 5 - floor(backlog/5))` |
| Smarter interleaving | Insert teaching at concept boundaries |
| Experience → starting position | Map ExperienceLevel to curriculum start |
| Instrumentation | Drop-off rates, error patterns, backlog correlation |

**Excluded:**
- Challenge Gauntlet (deferred)
- Performance-based fast-forward (conflicts with FSRS)

---

## Architecture

### New Files

```
src/lib/curriculum/progression.ts     # Concept gating + experience mapping
src/lib/session/new-card-ordering.ts  # Dynamic limits + randomized selection
src/lib/analytics/session-metrics.ts  # Instrumentation
```

### Modified Files

```
src/lib/session/interleave-teaching.ts  # Add boundary-based interleaving
src/lib/hooks/useConceptSession.ts      # Wire up new logic
```

### Deleted Code

- `TEACHING_PAIRS_LIMIT` constant (replaced by dynamic calculation)
- `INSERT_INTERVAL` constant (replaced by boundary detection)
- `candidates.find()` pattern (replaced by randomized selection)
- `interleaveWithTeaching()` function (replaced by `interleaveAtBoundaries()`)

---

## Detailed Design

### 1. Concept Gating (`src/lib/curriculum/progression.ts`)

```typescript
interface ConceptNode {
  slug: string;
  prereqs: string[];
  subconcepts: string[];
}

/**
 * Get unlocked concepts based on completed subconcepts.
 * Soft gating: concept unlocked if ALL prereq concepts have
 * at least one subconcept completed.
 */
function getUnlockedConcepts(
  completedSubconcepts: Set<string>,
  curriculum: ConceptNode[]
): string[]

/**
 * Get next subconcepts to learn, respecting soft gating.
 * Prioritizes finishing current concept before opening new ones.
 */
function getNextSubconcepts(
  completedSubconcepts: Set<string>,
  inProgressSubconcepts: Set<string>,
  curriculum: ConceptNode[],
  limit: number
): string[]

/**
 * Map experience level to starting curriculum position.
 * Returns concepts to treat as "auto-completed".
 */
function getSkippedConceptsByExperience(level: ExperienceLevel): Set<string>
// beginner  → empty set (start at foundations)
// learning  → {foundations, strings, numbers-booleans}
// refresher → {foundations, strings, numbers-booleans, conditionals, collections, loops}
```

**Test Cases:**
1. Fresh beginner → only `foundations` subconcepts available
2. `foundations` complete → `strings` AND `numbers-booleans` unlocked (parallel)
3. Learning user → starts at `collections`
4. Partially complete concept → prioritize finishing it

### 2. Dynamic New Card Limit (`src/lib/session/new-card-ordering.ts`)

```typescript
/**
 * Calculate new card limit based on review backlog.
 *
 * backlog 0-4   → 5 new cards
 * backlog 5-9   → 4 new cards
 * backlog 10-14 → 3 new cards
 * backlog 15-19 → 2 new cards
 * backlog 20-24 → 1 new card
 * backlog 25+   → 0 new cards
 */
function calculateNewCardLimit(reviewBacklog: number): number {
  return Math.max(0, 5 - Math.floor(reviewBacklog / 5));
}

/**
 * Select exercise for new subconcept with randomization.
 * Replaces deterministic candidates.find().
 */
function selectExerciseForNewSubconcept(
  subconcept: string,
  exercises: Exercise[],
  excludeSlugs?: Set<string>
): Exercise | null
```

**Test Cases:**
1. `calculateNewCardLimit(0)` → 5
2. `calculateNewCardLimit(12)` → 3
3. `calculateNewCardLimit(25)` → 0
4. Randomized selection returns different exercises on repeated calls
5. Prefers intro/practice over edge/integrated

### 3. Smarter Interleaving (`src/lib/session/interleave-teaching.ts`)

```typescript
/**
 * Detect concept boundaries in review cards.
 * Returns indices where concept changes.
 */
function findConceptBoundaries(reviewCards: ReviewSessionCard[]): number[]

/**
 * Interleave teaching pairs at concept boundaries.
 * Falls back to prepending if no boundaries exist.
 */
function interleaveAtBoundaries(
  reviewCards: ReviewSessionCard[],
  teachingPairs: TeachingPair[]
): SessionCardType[]
```

**Test Cases:**
1. `[loops, loops, strings, strings]` + 1 teaching → inserted between loops/strings
2. `[loops, loops, loops]` + 1 teaching → prepended at start
3. 3 boundaries + 2 teaching pairs → distributed across first 2 boundaries
4. Empty reviews + teaching → just teaching pairs
5. Reviews + no teaching → reviews unchanged

### 4. Instrumentation (`src/lib/analytics/session-metrics.ts`)

```typescript
interface SessionMetrics {
  conceptPosition: number;    // For drop-off analysis
  reviewBacklog: number;      // Due cards at session start
  newCardsShown: number;      // Actual new cards shown
  newCardLimit: number;       // Calculated limit
  conceptSlug: string;        // Which concept
  exerciseSlug: string;       // Which exercise
  wasCorrect: boolean;        // Pass/fail
  isNewSubconcept: boolean;   // First exposure
}

function logSessionStart(metrics: { reviewBacklog: number; newCardLimit: number }): void
function logExerciseAttempt(metrics: ExerciseAttemptMetrics): void
function logSessionEnd(completed: boolean, conceptPosition: number): void
```

**Implementation:** Extend existing Vercel Analytics + exercise logging. No new tables.

### 5. Integration (`src/lib/hooks/useConceptSession.ts`)

**Before (to remove):**
```typescript
const TEACHING_PAIRS_LIMIT = 5;

const newSubconcepts = allSubconcepts
  .filter(slug => !progressSlugs.has(slug))
  .slice(0, TEACHING_PAIRS_LIMIT);

const sessionCards = interleaveWithTeaching(reviewCards, teachingPairs);
```

**After:**
```typescript
import { calculateNewCardLimit, selectExerciseForNewSubconcept } from '@/lib/session/new-card-ordering';
import { getNextSubconcepts, getSkippedConceptsByExperience } from '@/lib/curriculum/progression';
import { interleaveAtBoundaries } from '@/lib/session/interleave-teaching';
import { logSessionStart } from '@/lib/analytics/session-metrics';

const newCardLimit = calculateNewCardLimit(dueSubconcepts.length);
logSessionStart({ reviewBacklog: dueSubconcepts.length, newCardLimit });

const skippedConcepts = getSkippedConceptsByExperience(profile.experienceLevel);
const nextSubconcepts = getNextSubconcepts(
  completedSubconcepts,
  inProgressSubconcepts,
  curriculum,
  newCardLimit
);

const sessionCards = interleaveAtBoundaries(reviewCards, teachingPairs);
```

---

## Implementation Plan (TDD)

### Phase 1: Pure Functions with Tests First

**Step 1.1: Create `src/lib/curriculum/progression.ts`**
- [ ] Write tests for `getUnlockedConcepts()`
- [ ] Write tests for `getNextSubconcepts()`
- [ ] Write tests for `getSkippedConceptsByExperience()`
- [ ] Implement functions to pass tests

**Step 1.2: Create `src/lib/session/new-card-ordering.ts`**
- [ ] Write tests for `calculateNewCardLimit()`
- [ ] Write tests for `selectExerciseForNewSubconcept()`
- [ ] Implement functions to pass tests

### Phase 2: Modify Interleaving

**Step 2.1: Add new functions to `interleave-teaching.ts`**
- [ ] Write tests for `findConceptBoundaries()`
- [ ] Write tests for `interleaveAtBoundaries()`
- [ ] Implement functions to pass tests

**Step 2.2: Deprecate old interleaving**
- [ ] Add `@deprecated` JSDoc to `interleaveWithTeaching()`
- [ ] Keep temporarily for safety during transition

### Phase 3: Wire Up Integration

**Step 3.1: Update `useConceptSession.ts`**
- [ ] Import new modules
- [ ] Replace hardcoded logic with new functions
- [ ] Remove `TEACHING_PAIRS_LIMIT` constant
- [ ] Remove `INSERT_INTERVAL` usage

**Step 3.2: Add instrumentation**
- [ ] Create `src/lib/analytics/session-metrics.ts`
- [ ] Add logging calls to `useConceptSession`

### Phase 4: Cleanup

**Step 4.1: Remove deprecated code**
- [ ] Delete `interleaveWithTeaching()` function
- [ ] Delete orphaned constants
- [ ] Update imports

**Step 4.2: Final verification**
- [ ] Run full test suite (`pnpm test`)
- [ ] Manual E2E testing
- [ ] Update CLAUDE.md if needed

---

## Success Criteria

1. All new tests pass (~25-30 tests)
2. Existing tests still pass (2182 tests)
3. No hardcoded `TEACHING_PAIRS_LIMIT` or `INSERT_INTERVAL`
4. `candidates.find()` replaced with randomized selection
5. Experience level affects starting position
6. Instrumentation logging in place

---

## Future Extensions

These are explicitly NOT in scope but the architecture supports them:

- **Challenge Gauntlet:** Add skip mechanism using existing gating infrastructure
- **Performance-based fast-forward:** Could layer on top of progression.ts
- **A/B testing:** Instrumentation enables comparing approaches
