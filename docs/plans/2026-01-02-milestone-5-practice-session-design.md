# Milestone 5: Practice Session Design

> Design document for the Practice Session feature - enabling users to review due cards and learn new ones in a focused session flow.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Session scope | Review all due cards | Aligns with SRS methodology; `getDueCards` already supports this |
| New cards | Mix in automatically (default 5) | Keeps sessions engaging; `getNewCards(exercises, progress, limit)` supports this |
| Progress saving | Auto-save per card (best-effort) | `recordAnswer` persists to DB; failures are tolerated to avoid blocking UX |
| Progress UI | Simple counter "3 of 15" + bar | Clean, matches mockup, avoids overload |
| Session summary | Basic stats (cards, accuracy, time) | Meaningful feedback without complexity |
| Entry point | Dashboard → "Start Practice" → `/practice` | Natural flow with stats visibility |
| Data fetching | Fetch all exercises + progress at session start | Simple query; MVP has ~50 exercises max |

## User Flow

```
Dashboard ──[Start Practice]──▶ Practice Session ──[Complete]──▶ Summary ──▶ Dashboard
                                      │
                                      │ [End Early]
                                      ▼
                               Partial Summary ──▶ Dashboard
```

## Empty States

| State | UI |
|-------|-----|
| No cards due | "All caught up!" + "Learn new cards" option if available |
| No exercises left | "You've mastered everything!" + come back tomorrow |
| Mid-session quit | Allow freely (auto-save best-effort), show partial summary |

---

## Architecture

### New Types

```typescript
// src/lib/srs/types.ts (extend existing file)

/**
 * A card in the practice session queue, combining exercise content with SRS state.
 * This is the type useSession works with internally and exposes to components.
 */
export interface SessionCard {
  exercise: Exercise;   // Full exercise data (prompt, answer, hints, etc.)
  state: CardState;     // SRS state (easeFactor, interval, repetitions, etc.)
  isNew: boolean;       // True if user has never seen this exercise
}
```

**Rationale**: `DueCard` only contains `exerciseId`, but `ExerciseCard` component requires a full `Exercise` object. `SessionCard` resolves this mismatch by joining exercise content with SRS state at session initialization time.

### New Routes

```
src/app/
├── dashboard/
│   └── page.tsx          # Dashboard with stats + "Start Practice" button
└── practice/
    └── page.tsx          # Practice session (protected route)
```

### New Components

```
src/components/
├── session/
│   ├── SessionProgress.tsx    # "3 of 15" counter + progress bar
│   ├── SessionSummary.tsx     # End-of-session stats display
│   └── index.ts               # Barrel export
└── dashboard/
    ├── DueCardsBanner.tsx     # Shows due count + "Start Practice" CTA
    ├── EmptyState.tsx         # "All caught up!" / "Nothing to review"
    └── index.ts
```

### New Hook

```typescript
// src/lib/hooks/useSession.ts

interface SessionStats {
  total: number;        // cards.length at start
  completed: number;    // cards answered so far
  correct: number;      // quality >= 3
  incorrect: number;    // quality < 3
  startTime: Date;      // session start
  endTime?: Date;       // set on completion
}

interface UseSessionReturn {
  // State
  cards: SessionCard[];           // Combined due + new cards queue (with full Exercise data)
  currentIndex: number;           // Position in queue (0-based)
  currentCard: SessionCard | null;// Card at currentIndex (null if complete/empty)
  isComplete: boolean;            // true when currentIndex >= cards.length
  stats: SessionStats;            // Session statistics
  loading: boolean;               // True while fetching exercises/progress
  error: AppError | null;         // Fetch error if any

  // Actions
  recordResult: (quality: Quality) => Promise<void>;  // Record answer + advance
  endSession: () => void;         // Mark complete early
  retry: () => void;              // Retry failed fetch
}
```

### Component Hierarchy

```
/practice (page.tsx)
└── ProtectedRoute
    └── PracticeSession (client component)
        ├── SessionProgress (currentIndex, total)
        ├── ExerciseCard (currentCard.exercise) ──▶ calls recordResult on answer
        └── [isComplete ? SessionSummary : null]
```

**Note**: `ExerciseCard` receives `currentCard.exercise` (the full `Exercise` object), not the raw `SessionCard`.

---

## Data Flow

### Session Initialization

```typescript
// In useSession hook initialization:

// 1. Fetch all exercises from database
const { data: exercises } = await supabase
  .from('exercises')
  .select('*');

// 2. Fetch user's progress for all exercises
const { data: userProgress } = await supabase
  .from('user_progress')
  .select('*')
  .eq('user_id', userId);

// 3. Build exercise lookup map for O(1) access
const exerciseMap = new Map(exercises.map(e => [e.id, e]));

// 4. Get due cards and convert to SessionCards
const dueCards: DueCard[] = getDueCards(userProgress);
const dueSessionCards: SessionCard[] = dueCards.map(dc => ({
  exercise: exerciseMap.get(dc.exerciseId)!,
  state: dc.state,
  isNew: false,
}));

// 5. Get new cards and convert to SessionCards
const newCards: DueCard[] = getNewCards(exercises, userProgress, 5);
const newSessionCards: SessionCard[] = newCards.map(dc => ({
  exercise: exerciseMap.get(dc.exerciseId)!,
  state: dc.state,
  isNew: true,
}));

// 6. Interleave: insert 1 new card after every 2-3 due cards
const cards: SessionCard[] = interleave(dueSessionCards, newSessionCards);

// 7. Initialize session state
setCards(cards);
setCurrentIndex(0);
setStats({ total: cards.length, completed: 0, correct: 0, incorrect: 0, startTime: new Date() });
```

**Interleaving algorithm**: Insert one new card after every 2-3 due cards to keep variety without overwhelming with unfamiliar content.

### Per-Card Flow

```
User answers in ExerciseCard
        │
        ▼
ExerciseCard calls onComplete(exerciseId, quality)
        │
        ▼
PracticeSession receives callback
        │
        ▼
useSession.recordResult(quality)
   ├── Updates stats (correct++ or incorrect++ based on quality >= 3)
   ├── Advances currentIndex
   └── Calls recordAnswer(exerciseId, quality) async (fire-and-forget with error toast)
        │
        ▼
Re-render with next card (or SessionSummary if complete)
```

### Session Stats (In-Memory)

```typescript
interface SessionStats {
  total: number;        // cards.length at start
  completed: number;    // currentIndex (cards answered)
  correct: number;      // quality >= 3
  incorrect: number;    // quality < 3
  startTime: Date;      // session start
  endTime?: Date;       // set on completion
}
```

---

## Error Handling

### Loading States

| State | UI |
|-------|-----|
| Fetching exercises/progress | Skeleton/spinner on practice page |
| Saving answer | None visible (async, non-blocking) |
| Loading dashboard | Skeleton for stats + CTA |

### Error States

| Error | Handling |
|-------|----------|
| Failed to fetch exercises/progress | Show error with "Retry" button; use ErrorBoundary |
| Failed to save answer | Toast error, continue session (don't block UX) |
| Network loss mid-session | Toast warning; continue session |

### Recovery Strategy

```typescript
// In useSession.recordResult:
const recordResult = async (quality: Quality) => {
  const card = cards[currentIndex];

  // Update local stats immediately (optimistic)
  setStats(prev => ({
    ...prev,
    completed: prev.completed + 1,
    correct: quality >= 3 ? prev.correct + 1 : prev.correct,
    incorrect: quality < 3 ? prev.incorrect + 1 : prev.incorrect,
  }));

  // Advance to next card immediately
  setCurrentIndex(prev => prev + 1);

  // Persist to database (fire-and-forget with error handling)
  try {
    await recordAnswer(card.exercise.id, quality);
  } catch (error) {
    showToast({ type: 'error', message: 'Failed to save progress' });
    // MVP: Answer is lost, but session continues
    // Future: Queue for retry when online
  }
};
```

**Rationale**: UX should never block on network. Losing one answer is better than freezing the session. The user can always re-review the card later since it will come back around in the SRS cycle.

---

## Testing Strategy

### Unit Tests (~12 tests)

```
src/lib/hooks/__tests__/useSession.test.ts
├── initializes with combined due + new cards as SessionCards
├── joins exercises with DueCards correctly
├── interleaves new cards correctly (1 per 2-3 due)
├── advances currentIndex on recordResult
├── tracks correct/incorrect stats accurately (quality >= 3 threshold)
├── marks isComplete when all cards done
├── handles empty queue (no cards due, no new)
├── handles exercises-only (no progress yet)
├── handles progress but missing exercises gracefully
├── endSession marks complete early with partial stats
├── retry re-fetches exercises and progress
└── loading/error states work correctly
```

### Component Tests (~10 tests)

```
src/components/session/__tests__/
├── SessionProgress.test.tsx
│   ├── displays "X of Y" correctly
│   ├── shows progress bar at correct percentage
│   └── handles edge cases (1/1, 0/0)
│
└── SessionSummary.test.tsx
    ├── shows correct/incorrect counts
    ├── calculates accuracy percentage
    ├── displays time spent (formatted)
    └── "Back to Dashboard" navigates correctly
```

### Integration Tests (~8 tests)

```
src/app/practice/__tests__/page.test.tsx
├── redirects to login if unauthenticated
├── shows loading state while fetching
├── displays first card on load
├── advances through cards on answer
├── shows summary after last card
├── handles early exit gracefully
├── shows error state on fetch failure
└── retry button refetches data
```

**Estimated total**: ~30 new tests

---

## Implementation Plan

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/hooks/useSession.ts` | Session state management + data fetching |
| `src/components/session/SessionProgress.tsx` | Progress counter + bar |
| `src/components/session/SessionSummary.tsx` | End stats display |
| `src/components/session/index.ts` | Barrel export |
| `src/components/dashboard/DueCardsBanner.tsx` | CTA with due count |
| `src/components/dashboard/EmptyState.tsx` | "All caught up" states |
| `src/components/dashboard/index.ts` | Barrel export |
| `src/app/dashboard/page.tsx` | Dashboard page |
| `src/app/practice/page.tsx` | Practice session page |

### Files to Modify

| File | Change |
|------|--------|
| `src/lib/srs/types.ts` | Add `SessionCard` interface |
| `src/lib/srs/index.ts` | Export `SessionCard` |
| `src/components/index.ts` | Export session + dashboard components |
| `src/lib/hooks/index.ts` | Export useSession |

### Implementation Order

1. Add `SessionCard` type to `src/lib/srs/types.ts`
2. `useSession` hook (core logic, TDD)
3. `SessionProgress` component
4. `SessionSummary` component
5. `/practice` page (wire up ExerciseCard + session)
6. Dashboard components (DueCardsBanner, EmptyState)
7. `/dashboard` page
8. Integration tests

---

## Dependencies

### Existing Infrastructure Used

- `recordAnswer` from `useSRS` hook - persists answer to database
- `getDueCards(userProgress)` from `src/lib/srs/algorithm.ts` - gets cards due for review
- `getNewCards(exercises, existingProgress, limit)` from `src/lib/srs/algorithm.ts` - gets unseen exercises
- `ExerciseCard` component - renders individual exercise (expects `Exercise` object)
- `ProtectedRoute` - auth guard for practice page
- `useToast` - error notifications
- `ErrorBoundary` - error recovery
- Supabase client - direct queries for exercises and user_progress

### No External Dependencies Required

All functionality built on existing infrastructure.

---

## Future Enhancements (Not in MVP)

- Offline queue for failed saves (retry when back online)
- Session history/replay
- Configurable new card limit in settings
- Skip/bookmark cards
- Keyboard shortcuts for power users
- Prefetch exercises on dashboard load (cache for faster session start)
