# Milestone 5: Practice Session Design

> Design document for the Practice Session feature - enabling users to review due cards and learn new ones in a focused session flow.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Session scope | Review all due cards | Aligns with SRS methodology; `useSRS` already supports this |
| New cards | Mix in automatically (default 5) | Keeps sessions engaging; `getNewCards(limit)` supports this |
| Progress saving | Auto-save per card | `recordAnswer` already persists to DB; no data loss risk |
| Progress UI | Simple counter "3 of 15" + bar | Clean, matches mockup, avoids overload |
| Session summary | Basic stats (cards, accuracy, time) | Meaningful feedback without complexity |
| Entry point | Dashboard → "Start Practice" → `/practice` | Natural flow with stats visibility |

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
| Mid-session quit | Allow freely (auto-save), show partial summary |

---

## Architecture

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
interface UseSessionReturn {
  cards: DueCard[];        // Combined due + new cards queue
  currentIndex: number;    // Position in queue (0-based)
  currentCard: DueCard | null;  // Card at currentIndex
  isComplete: boolean;     // true when currentIndex >= cards.length
  stats: SessionStats;     // { total, correct, incorrect, startTime }
  advance: () => void;     // Move to next card
  recordResult: (quality: Quality) => Promise<void>;  // Record + advance
  endSession: () => void;  // Mark complete early
}
```

### Component Hierarchy

```
/practice (page.tsx)
└── ProtectedRoute
    └── PracticeSession (client component)
        ├── SessionProgress (currentIndex, total)
        ├── ExerciseCard (currentCard) ──▶ calls recordResult on answer
        └── [isComplete ? SessionSummary : null]
```

---

## Data Flow

### Session Initialization

```typescript
// In useSession hook initialization:
1. Fetch due cards via getDueCards(userProgress)
2. Fetch new cards via getNewCards(exercises, userProgress, limit=5)
3. Interleave: [due1, new1, due2, due3, new2, due4, ...]
4. Set cards queue, currentIndex=0, startTime=now
```

**Interleaving algorithm**: Insert one new card after every 2-3 due cards to keep variety without overwhelming with unfamiliar content.

### Per-Card Flow

```
User answers in ExerciseCard
        │
        ▼
ExerciseCard calls onComplete(quality)
        │
        ▼
PracticeSession receives quality
        │
        ▼
useSession.recordResult(quality)
   ├── Calls useSRS.recordAnswer(exerciseId, quality)  ◀── DB write
   ├── Updates stats (correct++ or incorrect++)
   └── Advances currentIndex
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
| Fetching cards | Skeleton/spinner on practice page |
| Saving answer | None visible (async, non-blocking) |
| Loading dashboard | Skeleton for stats + CTA |

### Error States

| Error | Handling |
|-------|----------|
| Failed to fetch cards | Show error with "Retry" button; use ErrorBoundary |
| Failed to save answer | Toast error, continue session (don't block UX) |
| Network loss mid-session | Toast warning; continue session |

### Recovery Strategy

```typescript
// In useSession.recordResult:
try {
  await recordAnswer(exerciseId, quality);
} catch (error) {
  showToast({ type: 'error', message: 'Failed to save - will retry' });
  // MVP: Continue anyway, answer is "lost"
  // Future: Queue for retry
}
// Always advance to next card regardless of save success
advance();
```

**Rationale**: UX should never block on network. Losing one answer is better than freezing the session.

---

## Testing Strategy

### Unit Tests (~10 tests)

```
src/lib/hooks/__tests__/useSession.test.ts
├── initializes with combined due + new cards
├── interleaves new cards correctly (1 per 2-3 due)
├── advances currentIndex on recordResult
├── tracks correct/incorrect stats accurately
├── marks isComplete when all cards done
├── handles empty queue (no cards due, no new)
└── endSession marks complete early with partial stats
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
└── handles early exit gracefully
```

**Estimated total**: ~25-30 new tests

---

## Implementation Plan

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/hooks/useSession.ts` | Session state management |
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
| `src/components/index.ts` | Export session + dashboard components |
| `src/lib/hooks/index.ts` | Export useSession |

### Implementation Order

1. `useSession` hook (core logic, TDD)
2. `SessionProgress` component
3. `SessionSummary` component
4. `/practice` page (wire up ExerciseCard + session)
5. Dashboard components (DueCardsBanner, EmptyState)
6. `/dashboard` page
7. Integration tests

---

## Dependencies

### Existing Infrastructure Used

- `useSRS` hook - `recordAnswer`, `dueCards` fetching
- `getDueCards`, `getNewCards` from `src/lib/srs/algorithm.ts`
- `ExerciseCard` component - individual exercise UI
- `ProtectedRoute` - auth guard
- `useToast` - error notifications
- `ErrorBoundary` - error recovery

### No External Dependencies Required

All functionality built on existing infrastructure.

---

## Future Enhancements (Not in MVP)

- Offline queue for failed saves
- Session history/replay
- Configurable new card limit in settings
- Skip/bookmark cards
- Keyboard shortcuts for power users
