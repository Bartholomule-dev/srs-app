# Milestone 5: Practice Session Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the practice session flow that lets users review due cards and learn new ones in a focused, interleaved session.

**Architecture:** A `useSession` hook manages session state (card queue, progress, stats) and fetches data from Supabase. Pure TypeScript utility functions handle interleaving logic. React components display progress and summary. The existing `ExerciseCard` component handles individual card interactions.

**Tech Stack:** React 19, TypeScript 5 (strict), Tailwind CSS 4, Vitest + React Testing Library, Supabase

**Design Document:** `docs/plans/2026-01-02-milestone-5-practice-session-design.md`

---

## Dependencies

**Existing code used by this milestone:**
- `src/lib/types/app.types.ts` - `Exercise`, `UserProgress`, `Quality` types
- `src/lib/srs/types.ts` - `CardState`, `DueCard` interfaces
- `src/lib/srs/algorithm.ts` - `getDueCards`, `getNewCards` functions
- `src/lib/hooks/useSRS.ts` - `recordAnswer(exerciseId, quality)` function
- `src/components/exercise/ExerciseCard.tsx` - renders single exercise
- `src/components/ProtectedRoute.tsx` - auth guard wrapper
- `src/lib/context/ToastContext.tsx` - `useToast` for error notifications
- `src/lib/supabase/client.ts` - Supabase client
- `src/lib/errors/AppError.ts` - error handling

**No external dependencies required** - built on existing infrastructure.

---

## File Structure Overview

```
src/
├── lib/
│   ├── session/
│   │   ├── index.ts           # Barrel export
│   │   ├── types.ts           # SessionCard, SessionStats interfaces
│   │   └── interleave.ts      # interleaveCards utility function
│   │
│   ├── srs/
│   │   └── types.ts           # Add SessionCard (MODIFY)
│   │
│   └── hooks/
│       ├── useSession.ts      # Main session hook
│       └── index.ts           # Export useSession (MODIFY)
│
├── components/
│   ├── session/
│   │   ├── index.ts           # Barrel export
│   │   ├── SessionProgress.tsx
│   │   └── SessionSummary.tsx
│   │
│   ├── dashboard/
│   │   ├── index.ts           # Barrel export
│   │   ├── DueCardsBanner.tsx
│   │   └── EmptyState.tsx
│   │
│   └── index.ts               # Export session + dashboard (MODIFY)
│
└── app/
    ├── dashboard/
    │   └── page.tsx
    └── practice/
        └── page.tsx

tests/
├── unit/
│   ├── session/
│   │   ├── types.test.ts
│   │   └── interleave.test.ts
│   └── hooks/
│       └── useSession.test.tsx
│
└── component/
    ├── session/
    │   ├── SessionProgress.test.tsx
    │   └── SessionSummary.test.tsx
    └── dashboard/
        ├── DueCardsBanner.test.tsx
        └── EmptyState.test.tsx
```

---

## Task 1: Session Types

**Files:**
- Create: `src/lib/session/types.ts`
- Create: `tests/unit/session/types.test.ts`
- Create: `src/lib/session/index.ts`

### Step 1: Write the failing test

```typescript
// tests/unit/session/types.test.ts
import { describe, it, expect } from 'vitest';
import type { SessionCard, SessionStats } from '@/lib/session';

describe('session types', () => {
  describe('SessionCard', () => {
    it('has required properties', () => {
      const card: SessionCard = {
        exercise: {
          id: 'ex-1',
          language: 'python',
          category: 'basics',
          difficulty: 1,
          title: 'Print Statement',
          prompt: 'Write a print statement',
          expectedAnswer: 'print("hello")',
          hints: ['Use print()'],
          explanation: null,
          tags: ['print'],
          timesPracticed: 0,
          avgSuccessRate: null,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
        state: {
          easeFactor: 2.5,
          interval: 1,
          repetitions: 0,
          nextReview: new Date(),
          lastReviewed: null,
        },
        isNew: true,
      };
      expect(card.exercise.id).toBe('ex-1');
      expect(card.state.easeFactor).toBe(2.5);
      expect(card.isNew).toBe(true);
    });
  });

  describe('SessionStats', () => {
    it('has required properties', () => {
      const stats: SessionStats = {
        total: 10,
        completed: 5,
        correct: 4,
        incorrect: 1,
        startTime: new Date(),
        endTime: undefined,
      };
      expect(stats.total).toBe(10);
      expect(stats.completed).toBe(5);
      expect(stats.correct).toBe(4);
      expect(stats.incorrect).toBe(1);
      expect(stats.startTime).toBeInstanceOf(Date);
      expect(stats.endTime).toBeUndefined();
    });

    it('can have endTime set', () => {
      const stats: SessionStats = {
        total: 10,
        completed: 10,
        correct: 8,
        incorrect: 2,
        startTime: new Date('2026-01-01T10:00:00Z'),
        endTime: new Date('2026-01-01T10:15:00Z'),
      };
      expect(stats.endTime).toBeInstanceOf(Date);
    });
  });
});
```

### Step 2: Run test to verify it fails

Run: `pnpm vitest tests/unit/session/types.test.ts --run`
Expected: FAIL with "Cannot find module '@/lib/session'"

### Step 3: Write minimal implementation

```typescript
// src/lib/session/types.ts
import type { Exercise } from '@/lib/types';
import type { CardState } from '@/lib/srs';

/**
 * A card in the practice session queue, combining exercise content with SRS state.
 * This is the type useSession works with internally and exposes to components.
 */
export interface SessionCard {
  /** Full exercise data (prompt, answer, hints, etc.) */
  exercise: Exercise;
  /** SRS state (easeFactor, interval, repetitions, etc.) */
  state: CardState;
  /** True if user has never seen this exercise */
  isNew: boolean;
}

/**
 * Statistics tracked during a practice session.
 */
export interface SessionStats {
  /** Total cards in session (set at start) */
  total: number;
  /** Cards answered so far */
  completed: number;
  /** Cards answered correctly (quality >= 3) */
  correct: number;
  /** Cards answered incorrectly (quality < 3) */
  incorrect: number;
  /** When session started */
  startTime: Date;
  /** When session ended (undefined while in progress) */
  endTime?: Date;
}
```

```typescript
// src/lib/session/index.ts
export type { SessionCard, SessionStats } from './types';
```

### Step 4: Run test to verify it passes

Run: `pnpm vitest tests/unit/session/types.test.ts --run`
Expected: PASS

### Step 5: Commit

```bash
git add src/lib/session/ tests/unit/session/
git commit -m "feat(session): add SessionCard and SessionStats types"
```

---

## Task 2: Interleave Utility Function

**Files:**
- Create: `src/lib/session/interleave.ts`
- Create: `tests/unit/session/interleave.test.ts`
- Modify: `src/lib/session/index.ts`

### Step 1: Write the failing tests

```typescript
// tests/unit/session/interleave.test.ts
import { describe, it, expect } from 'vitest';
import { interleaveCards } from '@/lib/session';
import type { SessionCard } from '@/lib/session';
import type { Exercise } from '@/lib/types';
import type { CardState } from '@/lib/srs';

// Helper to create mock SessionCard
function createMockCard(id: string, isNew: boolean): SessionCard {
  const exercise: Exercise = {
    id,
    language: 'python',
    category: 'basics',
    difficulty: 1,
    title: `Exercise ${id}`,
    prompt: 'Test prompt',
    expectedAnswer: 'test',
    hints: [],
    explanation: null,
    tags: [],
    timesPracticed: 0,
    avgSuccessRate: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
  const state: CardState = {
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReview: new Date(),
    lastReviewed: null,
  };
  return { exercise, state, isNew };
}

describe('interleaveCards', () => {
  it('returns empty array when both inputs are empty', () => {
    const result = interleaveCards([], []);
    expect(result).toEqual([]);
  });

  it('returns only due cards when no new cards', () => {
    const dueCards = [createMockCard('d1', false), createMockCard('d2', false)];
    const result = interleaveCards(dueCards, []);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.exercise.id)).toEqual(['d1', 'd2']);
  });

  it('returns only new cards when no due cards', () => {
    const newCards = [createMockCard('n1', true), createMockCard('n2', true)];
    const result = interleaveCards([], newCards);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.exercise.id)).toEqual(['n1', 'n2']);
  });

  it('interleaves one new card after every 2-3 due cards', () => {
    const dueCards = [
      createMockCard('d1', false),
      createMockCard('d2', false),
      createMockCard('d3', false),
      createMockCard('d4', false),
      createMockCard('d5', false),
      createMockCard('d6', false),
    ];
    const newCards = [createMockCard('n1', true), createMockCard('n2', true)];
    const result = interleaveCards(dueCards, newCards);

    // Should have all 8 cards
    expect(result).toHaveLength(8);

    // New cards should not be at the very beginning
    expect(result[0].isNew).toBe(false);
    expect(result[1].isNew).toBe(false);

    // New cards should be spread out, not bunched together
    const newCardIndices = result
      .map((c, i) => (c.isNew ? i : -1))
      .filter((i) => i !== -1);
    expect(newCardIndices).toHaveLength(2);

    // Should have gap of at least 2 between new cards
    if (newCardIndices.length === 2) {
      expect(newCardIndices[1] - newCardIndices[0]).toBeGreaterThanOrEqual(2);
    }
  });

  it('handles more new cards than slots allow', () => {
    const dueCards = [createMockCard('d1', false), createMockCard('d2', false)];
    const newCards = [
      createMockCard('n1', true),
      createMockCard('n2', true),
      createMockCard('n3', true),
      createMockCard('n4', true),
    ];
    const result = interleaveCards(dueCards, newCards);

    // All cards should be included
    expect(result).toHaveLength(6);

    // Check all IDs are present
    const ids = result.map((c) => c.exercise.id);
    expect(ids).toContain('d1');
    expect(ids).toContain('d2');
    expect(ids).toContain('n1');
    expect(ids).toContain('n2');
    expect(ids).toContain('n3');
    expect(ids).toContain('n4');
  });

  it('preserves original order of due cards', () => {
    const dueCards = [
      createMockCard('d1', false),
      createMockCard('d2', false),
      createMockCard('d3', false),
    ];
    const newCards = [createMockCard('n1', true)];
    const result = interleaveCards(dueCards, newCards);

    const dueOnly = result.filter((c) => !c.isNew);
    expect(dueOnly.map((c) => c.exercise.id)).toEqual(['d1', 'd2', 'd3']);
  });

  it('preserves original order of new cards', () => {
    const dueCards = [createMockCard('d1', false)];
    const newCards = [
      createMockCard('n1', true),
      createMockCard('n2', true),
      createMockCard('n3', true),
    ];
    const result = interleaveCards(dueCards, newCards);

    const newOnly = result.filter((c) => c.isNew);
    expect(newOnly.map((c) => c.exercise.id)).toEqual(['n1', 'n2', 'n3']);
  });
});
```

### Step 2: Run test to verify it fails

Run: `pnpm vitest tests/unit/session/interleave.test.ts --run`
Expected: FAIL with "interleaveCards is not exported"

### Step 3: Write minimal implementation

```typescript
// src/lib/session/interleave.ts
import type { SessionCard } from './types';

/**
 * Interleaves new cards into a queue of due cards.
 * Inserts one new card after every 2-3 due cards to keep variety
 * without overwhelming with unfamiliar content.
 *
 * @param dueCards - Cards due for review (maintains order)
 * @param newCards - New cards to introduce (maintains order)
 * @returns Combined queue with new cards interleaved
 */
export function interleaveCards(
  dueCards: SessionCard[],
  newCards: SessionCard[]
): SessionCard[] {
  if (dueCards.length === 0) {
    return [...newCards];
  }
  if (newCards.length === 0) {
    return [...dueCards];
  }

  const result: SessionCard[] = [];
  const insertInterval = 3; // Insert new card after every 3 due cards
  let dueIndex = 0;
  let newIndex = 0;

  while (dueIndex < dueCards.length || newIndex < newCards.length) {
    // Add due cards up to the interval
    let addedDue = 0;
    while (dueIndex < dueCards.length && addedDue < insertInterval) {
      result.push(dueCards[dueIndex]);
      dueIndex++;
      addedDue++;
    }

    // Add one new card if available
    if (newIndex < newCards.length) {
      result.push(newCards[newIndex]);
      newIndex++;
    }
  }

  return result;
}
```

### Step 4: Update barrel export

```typescript
// src/lib/session/index.ts
export type { SessionCard, SessionStats } from './types';
export { interleaveCards } from './interleave';
```

### Step 5: Run test to verify it passes

Run: `pnpm vitest tests/unit/session/interleave.test.ts --run`
Expected: PASS

### Step 6: Commit

```bash
git add src/lib/session/ tests/unit/session/
git commit -m "feat(session): add interleaveCards utility"
```

---

## Task 3: useSession Hook - Types and Initial State

**Files:**
- Create: `src/lib/hooks/useSession.ts`
- Create: `tests/unit/hooks/useSession.test.tsx`
- Modify: `src/lib/hooks/index.ts`

### Step 1: Write the failing tests for hook interface

```typescript
// tests/unit/hooks/useSession.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/context/AuthContext';
import { ToastProvider } from '@/lib/context/ToastContext';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      update: vi.fn(),
      insert: vi.fn(),
      upsert: vi.fn(),
    })),
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase/client';
import { useSession } from '@/lib/hooks/useSession';

const mockUser = { id: 'user-123', email: 'test@example.com' };

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>
    <ToastProvider>{children}</ToastProvider>
  </AuthProvider>
);

describe('useSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });
  });

  describe('initialization', () => {
    it('returns loading true initially', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(result.current.loading).toBe(true);
    });

    it('returns empty cards initially', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(result.current.cards).toEqual([]);
    });

    it('returns currentIndex 0 initially', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(result.current.currentIndex).toBe(0);
    });

    it('returns null currentCard initially', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(result.current.currentCard).toBeNull();
    });

    it('returns isComplete false initially', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(result.current.isComplete).toBe(false);
    });

    it('returns initial stats with zero counts', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(result.current.stats.total).toBe(0);
      expect(result.current.stats.completed).toBe(0);
      expect(result.current.stats.correct).toBe(0);
      expect(result.current.stats.incorrect).toBe(0);
      expect(result.current.stats.startTime).toBeInstanceOf(Date);
    });

    it('returns null error initially', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(result.current.error).toBeNull();
    });

    it('exposes recordResult function', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(typeof result.current.recordResult).toBe('function');
    });

    it('exposes endSession function', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(typeof result.current.endSession).toBe('function');
    });

    it('exposes retry function', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(typeof result.current.retry).toBe('function');
    });
  });
});
```

### Step 2: Run test to verify it fails

Run: `pnpm vitest tests/unit/hooks/useSession.test.tsx --run`
Expected: FAIL with "useSession is not exported"

### Step 3: Write minimal implementation

```typescript
// src/lib/hooks/useSession.ts
'use client';

import { useState, useCallback } from 'react';
import type { SessionCard, SessionStats } from '@/lib/session';
import type { Quality } from '@/lib/types';
import type { AppError } from '@/lib/errors';

export interface UseSessionReturn {
  /** Combined due + new cards queue (with full Exercise data) */
  cards: SessionCard[];
  /** Position in queue (0-based) */
  currentIndex: number;
  /** Card at currentIndex (null if complete/empty) */
  currentCard: SessionCard | null;
  /** True when currentIndex >= cards.length */
  isComplete: boolean;
  /** Session statistics */
  stats: SessionStats;
  /** True while fetching exercises/progress */
  loading: boolean;
  /** Fetch error if any */
  error: AppError | null;
  /** Record answer + advance to next card */
  recordResult: (quality: Quality) => Promise<void>;
  /** Mark session complete early */
  endSession: () => void;
  /** Retry failed fetch */
  retry: () => void;
}

function createInitialStats(): SessionStats {
  return {
    total: 0,
    completed: 0,
    correct: 0,
    incorrect: 0,
    startTime: new Date(),
    endTime: undefined,
  };
}

export function useSession(): UseSessionReturn {
  const [cards, setCards] = useState<SessionCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState<SessionStats>(createInitialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const currentCard = cards[currentIndex] ?? null;
  const isComplete = currentIndex >= cards.length && cards.length > 0;

  const recordResult = useCallback(async (_quality: Quality) => {
    // To be implemented
  }, []);

  const endSession = useCallback(() => {
    // To be implemented
  }, []);

  const retry = useCallback(() => {
    // To be implemented
  }, []);

  return {
    cards,
    currentIndex,
    currentCard,
    isComplete,
    stats,
    loading,
    error,
    recordResult,
    endSession,
    retry,
  };
}
```

### Step 4: Update barrel export

```typescript
// src/lib/hooks/index.ts
export { useAuth } from './useAuth';
export { useProfile } from './useProfile';
export { useRequireAuth } from './useRequireAuth';
export { useSRS } from './useSRS';
export { useSession } from './useSession';
export type { UseSessionReturn } from './useSession';
```

### Step 5: Run test to verify it passes

Run: `pnpm vitest tests/unit/hooks/useSession.test.tsx --run`
Expected: PASS

### Step 6: Commit

```bash
git add src/lib/hooks/ tests/unit/hooks/useSession.test.tsx
git commit -m "feat(hooks): add useSession hook skeleton"
```

---

## Task 4: useSession Hook - Data Fetching

**Files:**
- Modify: `src/lib/hooks/useSession.ts`
- Modify: `tests/unit/hooks/useSession.test.tsx`

### Step 1: Write the failing tests for data fetching

Add to `tests/unit/hooks/useSession.test.tsx`:

```typescript
// Add these imports at the top
import { mapToExercise, mapToUserProgress } from '@/lib/supabase/mappers';

// Add mock data before describe block
const mockExercisesDb = [
  {
    id: 'ex-1',
    language: 'python',
    category: 'basics',
    difficulty: 1,
    title: 'Print Statement',
    prompt: 'Write a print statement',
    expected_answer: 'print("hello")',
    hints: ['Use print()'],
    explanation: null,
    tags: ['print'],
    times_practiced: 0,
    avg_success_rate: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ex-2',
    language: 'python',
    category: 'basics',
    difficulty: 1,
    title: 'Variables',
    prompt: 'Assign x = 5',
    expected_answer: 'x = 5',
    hints: [],
    explanation: null,
    tags: ['variables'],
    times_practiced: 0,
    avg_success_rate: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const mockProgressDb = [
  {
    id: 'progress-1',
    user_id: 'user-123',
    exercise_id: 'ex-1',
    ease_factor: 2.5,
    interval: 1,
    repetitions: 1,
    next_review: '2026-01-01T00:00:00Z', // Due (in past)
    last_reviewed: '2025-12-31T00:00:00Z',
    times_seen: 1,
    times_correct: 1,
    created_at: '2025-12-31T00:00:00Z',
    updated_at: '2025-12-31T00:00:00Z',
  },
];

// Add new describe block for data fetching
describe('data fetching', () => {
  it('fetches exercises and progress on mount', async () => {
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'exercises') {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockExercisesDb,
            error: null,
          }),
        } as any;
      }
      if (table === 'user_progress') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockProgressDb,
              error: null,
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFrom).toHaveBeenCalledWith('exercises');
    expect(mockFrom).toHaveBeenCalledWith('user_progress');
  });

  it('populates cards with due and new cards combined', async () => {
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'exercises') {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockExercisesDb,
            error: null,
          }),
        } as any;
      }
      if (table === 'user_progress') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockProgressDb,
              error: null,
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have 1 due card (ex-1) + 1 new card (ex-2) = 2 cards
    expect(result.current.cards).toHaveLength(2);
    expect(result.current.stats.total).toBe(2);
  });

  it('sets currentCard to first card after loading', async () => {
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'exercises') {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockExercisesDb,
            error: null,
          }),
        } as any;
      }
      if (table === 'user_progress') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockProgressDb,
              error: null,
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.currentCard).not.toBeNull();
    expect(result.current.currentCard?.exercise.id).toBeDefined();
  });

  it('handles fetch error gracefully', async () => {
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'exercises') {
        return {
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Network error', code: 'NETWORK_ERROR' },
          }),
        } as any;
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      } as any;
    });

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.cards).toHaveLength(0);
  });

  it('handles empty state (no exercises)', async () => {
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'exercises') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        } as any;
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      } as any;
    });

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.cards).toHaveLength(0);
    expect(result.current.currentCard).toBeNull();
  });
});
```

### Step 2: Run test to verify it fails

Run: `pnpm vitest tests/unit/hooks/useSession.test.tsx --run`
Expected: Some tests FAIL (loading never changes, cards never populated)

### Step 3: Implement data fetching

```typescript
// src/lib/hooks/useSession.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { mapToExercise, mapToUserProgress } from '@/lib/supabase/mappers';
import { getDueCards, getNewCards } from '@/lib/srs';
import { interleaveCards, type SessionCard, type SessionStats } from '@/lib/session';
import type { Quality, Exercise, UserProgress } from '@/lib/types';
import { AppError, ErrorCode } from '@/lib/errors';
import { handleSupabaseError } from '@/lib/errors/handleSupabaseError';
import { useAuth } from './useAuth';

const NEW_CARDS_LIMIT = 5;

export interface UseSessionReturn {
  /** Combined due + new cards queue (with full Exercise data) */
  cards: SessionCard[];
  /** Position in queue (0-based) */
  currentIndex: number;
  /** Card at currentIndex (null if complete/empty) */
  currentCard: SessionCard | null;
  /** True when currentIndex >= cards.length */
  isComplete: boolean;
  /** Session statistics */
  stats: SessionStats;
  /** True while fetching exercises/progress */
  loading: boolean;
  /** Fetch error if any */
  error: AppError | null;
  /** Record answer + advance to next card */
  recordResult: (quality: Quality) => Promise<void>;
  /** Mark session complete early */
  endSession: () => void;
  /** Retry failed fetch */
  retry: () => void;
}

function createInitialStats(): SessionStats {
  return {
    total: 0,
    completed: 0,
    correct: 0,
    incorrect: 0,
    startTime: new Date(),
    endTime: undefined,
  };
}

export function useSession(): UseSessionReturn {
  const { user } = useAuth();
  const [cards, setCards] = useState<SessionCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState<SessionStats>(createInitialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const currentCard = cards[currentIndex] ?? null;
  const isComplete = currentIndex >= cards.length && cards.length > 0;

  // Fetch exercises and progress, build session queue
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchSessionData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch all exercises
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('*');

        if (exercisesError) {
          throw handleSupabaseError(exercisesError);
        }

        // Fetch user progress
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id);

        if (progressError) {
          throw handleSupabaseError(progressError);
        }

        if (cancelled) return;

        // Map to app types
        const exercises: Exercise[] = (exercisesData ?? []).map(mapToExercise);
        const progress: UserProgress[] = (progressData ?? []).map(mapToUserProgress);

        // Build exercise lookup map
        const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

        // Get due cards and convert to SessionCards
        const dueCards = getDueCards(progress);
        const dueSessionCards: SessionCard[] = dueCards
          .filter((dc) => exerciseMap.has(dc.exerciseId))
          .map((dc) => ({
            exercise: exerciseMap.get(dc.exerciseId)!,
            state: dc.state,
            isNew: false,
          }));

        // Get new cards and convert to SessionCards
        const newCards = getNewCards(exercises, progress, NEW_CARDS_LIMIT);
        const newSessionCards: SessionCard[] = newCards
          .filter((dc) => exerciseMap.has(dc.exerciseId))
          .map((dc) => ({
            exercise: exerciseMap.get(dc.exerciseId)!,
            state: dc.state,
            isNew: true,
          }));

        // Interleave new cards into due cards
        const sessionCards = interleaveCards(dueSessionCards, newSessionCards);

        setCards(sessionCards);
        setCurrentIndex(0);
        setStats({
          total: sessionCards.length,
          completed: 0,
          correct: 0,
          incorrect: 0,
          startTime: new Date(),
          endTime: undefined,
        });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AppError) {
          setError(err);
        } else {
          setError(
            new AppError(
              'Failed to load session data',
              ErrorCode.UNKNOWN_ERROR,
              err instanceof Error ? err : undefined
            )
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSessionData();

    return () => {
      cancelled = true;
    };
  }, [user, fetchKey]);

  const recordResult = useCallback(async (_quality: Quality) => {
    // To be implemented in Task 5
  }, []);

  const endSession = useCallback(() => {
    // To be implemented in Task 6
  }, []);

  const retry = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  return {
    cards,
    currentIndex,
    currentCard,
    isComplete,
    stats,
    loading,
    error,
    recordResult,
    endSession,
    retry,
  };
}
```

### Step 4: Run test to verify it passes

Run: `pnpm vitest tests/unit/hooks/useSession.test.tsx --run`
Expected: PASS

### Step 5: Commit

```bash
git add src/lib/hooks/useSession.ts tests/unit/hooks/useSession.test.tsx
git commit -m "feat(hooks): add data fetching to useSession"
```

---

## Task 5: useSession Hook - recordResult Action

**Files:**
- Modify: `src/lib/hooks/useSession.ts`
- Modify: `tests/unit/hooks/useSession.test.tsx`

### Step 1: Write the failing tests for recordResult

Add to `tests/unit/hooks/useSession.test.tsx`:

```typescript
describe('recordResult', () => {
  const setupWithCards = () => {
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'exercises') {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockExercisesDb,
            error: null,
          }),
        } as any;
      }
      if (table === 'user_progress') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockProgressDb,
              error: null,
            }),
          }),
          upsert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: {}, error: null }),
            }),
          }),
        } as any;
      }
      return {} as any;
    });
  };

  it('advances currentIndex after recording', async () => {
    setupWithCards();
    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialIndex = result.current.currentIndex;
    expect(initialIndex).toBe(0);

    await act(async () => {
      await result.current.recordResult(4);
    });

    expect(result.current.currentIndex).toBe(initialIndex + 1);
  });

  it('increments completed count', async () => {
    setupWithCards();
    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats.completed).toBe(0);

    await act(async () => {
      await result.current.recordResult(4);
    });

    expect(result.current.stats.completed).toBe(1);
  });

  it('increments correct count for quality >= 3', async () => {
    setupWithCards();
    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats.correct).toBe(0);

    await act(async () => {
      await result.current.recordResult(3);
    });

    expect(result.current.stats.correct).toBe(1);
    expect(result.current.stats.incorrect).toBe(0);
  });

  it('increments incorrect count for quality < 3', async () => {
    setupWithCards();
    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats.incorrect).toBe(0);

    await act(async () => {
      await result.current.recordResult(2);
    });

    expect(result.current.stats.incorrect).toBe(1);
    expect(result.current.stats.correct).toBe(0);
  });

  it('sets isComplete when last card is answered', async () => {
    // Setup with only 1 card
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'exercises') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [mockExercisesDb[0]],
            error: null,
          }),
        } as any;
      }
      if (table === 'user_progress') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockProgressDb,
              error: null,
            }),
          }),
          upsert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: {}, error: null }),
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isComplete).toBe(false);

    await act(async () => {
      await result.current.recordResult(4);
    });

    expect(result.current.isComplete).toBe(true);
  });

  it('sets endTime when session completes', async () => {
    // Setup with only 1 card
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'exercises') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [mockExercisesDb[0]],
            error: null,
          }),
        } as any;
      }
      if (table === 'user_progress') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockProgressDb,
              error: null,
            }),
          }),
          upsert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: {}, error: null }),
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats.endTime).toBeUndefined();

    await act(async () => {
      await result.current.recordResult(4);
    });

    expect(result.current.stats.endTime).toBeInstanceOf(Date);
  });
});
```

### Step 2: Run test to verify it fails

Run: `pnpm vitest tests/unit/hooks/useSession.test.tsx --run`
Expected: Tests FAIL (recordResult doesn't update state)

### Step 3: Implement recordResult

Update `src/lib/hooks/useSession.ts`:

```typescript
// Add import at top
import { useSRS } from './useSRS';
import { useToast } from '@/lib/context/ToastContext';

// Inside useSession function, add:
const { recordAnswer } = useSRS();
const { showToast } = useToast();

// Replace the recordResult callback:
const recordResult = useCallback(
  async (quality: Quality) => {
    const card = cards[currentIndex];
    if (!card) return;

    const isCorrect = quality >= 3;
    const newCompleted = stats.completed + 1;
    const willComplete = newCompleted >= cards.length;

    // Update local stats immediately (optimistic)
    setStats((prev) => ({
      ...prev,
      completed: newCompleted,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      incorrect: !isCorrect ? prev.incorrect + 1 : prev.incorrect,
      endTime: willComplete ? new Date() : undefined,
    }));

    // Advance to next card immediately
    setCurrentIndex((prev) => prev + 1);

    // Persist to database (fire-and-forget with error handling)
    try {
      await recordAnswer(card.exercise.id, quality);
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to save progress' });
      // Session continues even if save fails
    }
  },
  [cards, currentIndex, stats.completed, recordAnswer, showToast]
);
```

### Step 4: Run test to verify it passes

Run: `pnpm vitest tests/unit/hooks/useSession.test.tsx --run`
Expected: PASS

### Step 5: Commit

```bash
git add src/lib/hooks/useSession.ts tests/unit/hooks/useSession.test.tsx
git commit -m "feat(hooks): implement recordResult in useSession"
```

---

## Task 6: useSession Hook - endSession Action

**Files:**
- Modify: `src/lib/hooks/useSession.ts`
- Modify: `tests/unit/hooks/useSession.test.tsx`

### Step 1: Write the failing tests for endSession

Add to `tests/unit/hooks/useSession.test.tsx`:

```typescript
describe('endSession', () => {
  it('marks session as complete', async () => {
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'exercises') {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockExercisesDb,
            error: null,
          }),
        } as any;
      }
      if (table === 'user_progress') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockProgressDb,
              error: null,
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isComplete).toBe(false);

    act(() => {
      result.current.endSession();
    });

    expect(result.current.isComplete).toBe(true);
  });

  it('sets endTime when ending early', async () => {
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'exercises') {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockExercisesDb,
            error: null,
          }),
        } as any;
      }
      if (table === 'user_progress') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockProgressDb,
              error: null,
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats.endTime).toBeUndefined();

    act(() => {
      result.current.endSession();
    });

    expect(result.current.stats.endTime).toBeInstanceOf(Date);
  });

  it('preserves partial stats when ending early', async () => {
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'exercises') {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockExercisesDb,
            error: null,
          }),
        } as any;
      }
      if (table === 'user_progress') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockProgressDb,
              error: null,
            }),
          }),
          upsert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: {}, error: null }),
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Answer one card first
    await act(async () => {
      await result.current.recordResult(4);
    });

    expect(result.current.stats.completed).toBe(1);

    act(() => {
      result.current.endSession();
    });

    // Stats should still show the partial progress
    expect(result.current.stats.completed).toBe(1);
    expect(result.current.stats.total).toBe(2);
  });
});
```

### Step 2: Run test to verify it fails

Run: `pnpm vitest tests/unit/hooks/useSession.test.tsx --run`
Expected: Tests FAIL (endSession doesn't mark complete)

### Step 3: Implement endSession

Update `src/lib/hooks/useSession.ts`:

```typescript
// Add new state for forced completion
const [forceComplete, setForceComplete] = useState(false);

// Update isComplete calculation
const isComplete =
  forceComplete || (currentIndex >= cards.length && cards.length > 0);

// Replace the endSession callback:
const endSession = useCallback(() => {
  setForceComplete(true);
  setStats((prev) => ({
    ...prev,
    endTime: new Date(),
  }));
}, []);
```

### Step 4: Run test to verify it passes

Run: `pnpm vitest tests/unit/hooks/useSession.test.tsx --run`
Expected: PASS

### Step 5: Commit

```bash
git add src/lib/hooks/useSession.ts tests/unit/hooks/useSession.test.tsx
git commit -m "feat(hooks): implement endSession in useSession"
```

---

## Task 7: SessionProgress Component

**Files:**
- Create: `src/components/session/SessionProgress.tsx`
- Create: `tests/component/session/SessionProgress.test.tsx`
- Create: `src/components/session/index.ts`

### Step 1: Write the failing tests

```typescript
// tests/component/session/SessionProgress.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SessionProgress } from '@/components/session';

describe('SessionProgress', () => {
  it('displays current and total count', () => {
    render(<SessionProgress current={3} total={10} />);
    expect(screen.getByText('3 of 10')).toBeInTheDocument();
  });

  it('displays correct progress bar percentage', () => {
    render(<SessionProgress current={5} total={10} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('handles edge case of 0/0', () => {
    render(<SessionProgress current={0} total={0} />);
    expect(screen.getByText('0 of 0')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('handles edge case of 1/1 (100%)', () => {
    render(<SessionProgress current={1} total={1} />);
    expect(screen.getByText('1 of 1')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('handles completed state where current exceeds total display', () => {
    render(<SessionProgress current={10} total={10} />);
    expect(screen.getByText('10 of 10')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('applies custom className', () => {
    const { container } = render(
      <SessionProgress current={1} total={5} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
```

### Step 2: Run test to verify it fails

Run: `pnpm vitest tests/component/session/SessionProgress.test.tsx --run`
Expected: FAIL with "Cannot find module '@/components/session'"

### Step 3: Write minimal implementation

```typescript
// src/components/session/SessionProgress.tsx
'use client';

interface SessionProgressProps {
  /** Current card number (1-based for display, but internally 0-indexed completed count) */
  current: number;
  /** Total cards in session */
  total: number;
  /** Additional CSS classes */
  className?: string;
}

export function SessionProgress({
  current,
  total,
  className = '',
}: SessionProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {current} of {total}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {percentage}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

```typescript
// src/components/session/index.ts
export { SessionProgress } from './SessionProgress';
```

### Step 4: Run test to verify it passes

Run: `pnpm vitest tests/component/session/SessionProgress.test.tsx --run`
Expected: PASS

### Step 5: Commit

```bash
git add src/components/session/ tests/component/session/
git commit -m "feat(components): add SessionProgress component"
```

---

## Task 8: SessionSummary Component

**Files:**
- Create: `src/components/session/SessionSummary.tsx`
- Create: `tests/component/session/SessionSummary.test.tsx`
- Modify: `src/components/session/index.ts`

### Step 1: Write the failing tests

```typescript
// tests/component/session/SessionSummary.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionSummary } from '@/components/session';
import type { SessionStats } from '@/lib/session';

const mockOnDashboard = vi.fn();

const createStats = (overrides: Partial<SessionStats> = {}): SessionStats => ({
  total: 10,
  completed: 10,
  correct: 8,
  incorrect: 2,
  startTime: new Date('2026-01-01T10:00:00Z'),
  endTime: new Date('2026-01-01T10:15:00Z'),
  ...overrides,
});

describe('SessionSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays correct count', () => {
    render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText(/correct/i)).toBeInTheDocument();
  });

  it('displays incorrect count', () => {
    render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
  });

  it('calculates and displays accuracy percentage', () => {
    render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('displays 0% accuracy when no cards completed', () => {
    render(
      <SessionSummary
        stats={createStats({ completed: 0, correct: 0, incorrect: 0 })}
        onDashboard={mockOnDashboard}
      />
    );
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('displays time spent formatted', () => {
    render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
    // 15 minutes difference
    expect(screen.getByText('15:00')).toBeInTheDocument();
  });

  it('handles missing endTime gracefully', () => {
    render(
      <SessionSummary
        stats={createStats({ endTime: undefined })}
        onDashboard={mockOnDashboard}
      />
    );
    // Should show current duration or fallback
    expect(screen.getByText(/time/i)).toBeInTheDocument();
  });

  it('calls onDashboard when button clicked', () => {
    render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
    fireEvent.click(screen.getByRole('button', { name: /dashboard/i }));
    expect(mockOnDashboard).toHaveBeenCalledTimes(1);
  });

  it('shows completion message', () => {
    render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
    expect(screen.getByText(/session complete/i)).toBeInTheDocument();
  });
});
```

### Step 2: Run test to verify it fails

Run: `pnpm vitest tests/component/session/SessionSummary.test.tsx --run`
Expected: FAIL with "SessionSummary is not exported"

### Step 3: Write minimal implementation

```typescript
// src/components/session/SessionSummary.tsx
'use client';

import type { SessionStats } from '@/lib/session';

interface SessionSummaryProps {
  /** Session statistics */
  stats: SessionStats;
  /** Callback to navigate to dashboard */
  onDashboard: () => void;
}

function formatDuration(startTime: Date, endTime?: Date): string {
  const end = endTime ?? new Date();
  const diffMs = end.getTime() - startTime.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function SessionSummary({ stats, onDashboard }: SessionSummaryProps) {
  const accuracy =
    stats.completed > 0
      ? Math.round((stats.correct / stats.completed) * 100)
      : 0;

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        Session Complete!
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {stats.correct}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">
            Correct
          </div>
        </div>

        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
            {stats.incorrect}
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">
            Incorrect
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Accuracy</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {accuracy}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Time</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatDuration(stats.startTime, stats.endTime)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Cards</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {stats.completed} / {stats.total}
          </span>
        </div>
      </div>

      <button
        onClick={onDashboard}
        className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
```

### Step 4: Update barrel export

```typescript
// src/components/session/index.ts
export { SessionProgress } from './SessionProgress';
export { SessionSummary } from './SessionSummary';
```

### Step 5: Run test to verify it passes

Run: `pnpm vitest tests/component/session/SessionSummary.test.tsx --run`
Expected: PASS

### Step 6: Commit

```bash
git add src/components/session/ tests/component/session/
git commit -m "feat(components): add SessionSummary component"
```

---

## Task 9: DueCardsBanner Component

**Files:**
- Create: `src/components/dashboard/DueCardsBanner.tsx`
- Create: `tests/component/dashboard/DueCardsBanner.test.tsx`
- Create: `src/components/dashboard/index.ts`

### Step 1: Write the failing tests

```typescript
// tests/component/dashboard/DueCardsBanner.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DueCardsBanner } from '@/components/dashboard';

const mockOnStartPractice = vi.fn();

describe('DueCardsBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays due count', () => {
    render(
      <DueCardsBanner
        dueCount={5}
        newCount={3}
        onStartPractice={mockOnStartPractice}
      />
    );
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByText(/due/i)).toBeInTheDocument();
  });

  it('displays new count', () => {
    render(
      <DueCardsBanner
        dueCount={5}
        newCount={3}
        onStartPractice={mockOnStartPractice}
      />
    );
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/new/i)).toBeInTheDocument();
  });

  it('shows start practice button', () => {
    render(
      <DueCardsBanner
        dueCount={5}
        newCount={3}
        onStartPractice={mockOnStartPractice}
      />
    );
    expect(
      screen.getByRole('button', { name: /start practice/i })
    ).toBeInTheDocument();
  });

  it('calls onStartPractice when button clicked', () => {
    render(
      <DueCardsBanner
        dueCount={5}
        newCount={3}
        onStartPractice={mockOnStartPractice}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /start practice/i }));
    expect(mockOnStartPractice).toHaveBeenCalledTimes(1);
  });

  it('disables button when loading', () => {
    render(
      <DueCardsBanner
        dueCount={5}
        newCount={3}
        onStartPractice={mockOnStartPractice}
        loading
      />
    );
    expect(screen.getByRole('button', { name: /start practice/i })).toBeDisabled();
  });

  it('shows total session size', () => {
    render(
      <DueCardsBanner
        dueCount={5}
        newCount={3}
        onStartPractice={mockOnStartPractice}
      />
    );
    // 5 due + 3 new = 8 cards
    expect(screen.getByText(/8 cards/i)).toBeInTheDocument();
  });
});
```

### Step 2: Run test to verify it fails

Run: `pnpm vitest tests/component/dashboard/DueCardsBanner.test.tsx --run`
Expected: FAIL with "Cannot find module '@/components/dashboard'"

### Step 3: Write minimal implementation

```typescript
// src/components/dashboard/DueCardsBanner.tsx
'use client';

interface DueCardsBannerProps {
  /** Number of cards due for review */
  dueCount: number;
  /** Number of new cards to learn */
  newCount: number;
  /** Callback to start practice session */
  onStartPractice: () => void;
  /** Whether data is still loading */
  loading?: boolean;
}

export function DueCardsBanner({
  dueCount,
  newCount,
  onStartPractice,
  loading = false,
}: DueCardsBannerProps) {
  const totalCards = dueCount + newCount;

  return (
    <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg text-white">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold mb-2">Ready to Practice?</h2>
          <div className="flex gap-4 text-sm">
            <span>
              <strong>{dueCount}</strong> due
            </span>
            <span>
              <strong>{newCount}</strong> new
            </span>
            <span className="text-blue-100">({totalCards} cards total)</span>
          </div>
        </div>
        <button
          onClick={onStartPractice}
          disabled={loading}
          className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Practice
        </button>
      </div>
    </div>
  );
}
```

```typescript
// src/components/dashboard/index.ts
export { DueCardsBanner } from './DueCardsBanner';
```

### Step 4: Run test to verify it passes

Run: `pnpm vitest tests/component/dashboard/DueCardsBanner.test.tsx --run`
Expected: PASS

### Step 5: Commit

```bash
git add src/components/dashboard/ tests/component/dashboard/
git commit -m "feat(components): add DueCardsBanner component"
```

---

## Task 10: EmptyState Component

**Files:**
- Create: `src/components/dashboard/EmptyState.tsx`
- Create: `tests/component/dashboard/EmptyState.test.tsx`
- Modify: `src/components/dashboard/index.ts`

### Step 1: Write the failing tests

```typescript
// tests/component/dashboard/EmptyState.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '@/components/dashboard';

const mockOnAction = vi.fn();

describe('EmptyState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('all-caught-up variant', () => {
    it('shows all caught up message', () => {
      render(
        <EmptyState
          variant="all-caught-up"
          newCardsAvailable={5}
          onLearnNew={mockOnAction}
        />
      );
      expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
    });

    it('shows learn new option when new cards available', () => {
      render(
        <EmptyState
          variant="all-caught-up"
          newCardsAvailable={5}
          onLearnNew={mockOnAction}
        />
      );
      expect(screen.getByRole('button', { name: /learn new/i })).toBeInTheDocument();
    });

    it('calls onLearnNew when button clicked', () => {
      render(
        <EmptyState
          variant="all-caught-up"
          newCardsAvailable={5}
          onLearnNew={mockOnAction}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /learn new/i }));
      expect(mockOnAction).toHaveBeenCalledTimes(1);
    });

    it('hides learn new button when no new cards', () => {
      render(
        <EmptyState
          variant="all-caught-up"
          newCardsAvailable={0}
          onLearnNew={mockOnAction}
        />
      );
      expect(
        screen.queryByRole('button', { name: /learn new/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('mastered-all variant', () => {
    it('shows mastered message', () => {
      render(<EmptyState variant="mastered-all" />);
      expect(screen.getByText(/mastered everything/i)).toBeInTheDocument();
    });

    it('shows come back tomorrow message', () => {
      render(<EmptyState variant="mastered-all" />);
      expect(screen.getByText(/come back/i)).toBeInTheDocument();
    });
  });
});
```

### Step 2: Run test to verify it fails

Run: `pnpm vitest tests/component/dashboard/EmptyState.test.tsx --run`
Expected: FAIL with "EmptyState is not exported"

### Step 3: Write minimal implementation

```typescript
// src/components/dashboard/EmptyState.tsx
'use client';

type EmptyStateVariant = 'all-caught-up' | 'mastered-all';

interface EmptyStateProps {
  /** Which empty state to show */
  variant: EmptyStateVariant;
  /** Number of new cards available (for all-caught-up variant) */
  newCardsAvailable?: number;
  /** Callback to start learning new cards */
  onLearnNew?: () => void;
}

export function EmptyState({
  variant,
  newCardsAvailable = 0,
  onLearnNew,
}: EmptyStateProps) {
  if (variant === 'all-caught-up') {
    return (
      <div className="text-center p-8 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-2">
          All Caught Up!
        </h2>
        <p className="text-green-600 dark:text-green-400 mb-4">
          You&apos;ve reviewed all your due cards. Great work!
        </p>
        {newCardsAvailable > 0 && onLearnNew && (
          <button
            onClick={onLearnNew}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Learn {newCardsAvailable} New Cards
          </button>
        )}
      </div>
    );
  }

  // mastered-all variant
  return (
    <div className="text-center p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
      <div className="text-4xl mb-4">🏆</div>
      <h2 className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mb-2">
        You&apos;ve Mastered Everything!
      </h2>
      <p className="text-yellow-600 dark:text-yellow-400">
        Amazing! Come back tomorrow for your next review.
      </p>
    </div>
  );
}
```

### Step 4: Update barrel export

```typescript
// src/components/dashboard/index.ts
export { DueCardsBanner } from './DueCardsBanner';
export { EmptyState } from './EmptyState';
```

### Step 5: Run test to verify it passes

Run: `pnpm vitest tests/component/dashboard/EmptyState.test.tsx --run`
Expected: PASS

### Step 6: Commit

```bash
git add src/components/dashboard/ tests/component/dashboard/
git commit -m "feat(components): add EmptyState component"
```

---

## Task 11: Update Component Barrel Exports

**Files:**
- Modify: `src/components/index.ts`

### Step 1: Update barrel export

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

// Session components
export { SessionProgress, SessionSummary } from './session';

// Dashboard components
export { DueCardsBanner, EmptyState } from './dashboard';
```

### Step 2: Run all tests to verify nothing broken

Run: `pnpm vitest --run`
Expected: All tests PASS

### Step 3: Commit

```bash
git add src/components/index.ts
git commit -m "feat(components): export session and dashboard components"
```

---

## Task 12: Practice Page

**Files:**
- Create: `src/app/practice/page.tsx`

### Step 1: Write the page implementation

```typescript
// src/app/practice/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute, ExerciseCard, SessionProgress, SessionSummary } from '@/components';
import { useSession } from '@/lib/hooks';
import { ErrorBoundary } from '@/components';

function PracticeSessionContent() {
  const router = useRouter();
  const {
    currentCard,
    currentIndex,
    isComplete,
    stats,
    loading,
    error,
    recordResult,
    endSession,
    retry,
  } = useSession();

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse text-gray-600 dark:text-gray-400">
          Loading session...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
            Failed to Load Session
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={retry}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              Retry
            </button>
            <button
              onClick={handleDashboard}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stats.total === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            No Cards to Practice
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There are no cards due for review right now.
          </p>
          <button
            onClick={handleDashboard}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <SessionSummary stats={stats} onDashboard={handleDashboard} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <SessionProgress
            current={stats.completed}
            total={stats.total}
            className="flex-1 mr-4"
          />
          <button
            onClick={endSession}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            End Session
          </button>
        </div>

        {currentCard && (
          <ExerciseCard
            exercise={currentCard.exercise}
            onComplete={(exerciseId, quality) => recordResult(quality)}
          />
        )}
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <ProtectedRoute redirectTo="/">
      <ErrorBoundary
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <p>Something went wrong. Please refresh the page.</p>
          </div>
        }
      >
        <PracticeSessionContent />
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
```

### Step 2: Verify no TypeScript errors

Run: `pnpm tsc --noEmit`
Expected: No errors

### Step 3: Commit

```bash
git add src/app/practice/
git commit -m "feat(pages): add practice session page"
```

---

## Task 13: Dashboard Page

**Files:**
- Create: `src/app/dashboard/page.tsx`

### Step 1: Write the page implementation

```typescript
// src/app/dashboard/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProtectedRoute, DueCardsBanner, EmptyState, ErrorBoundary } from '@/components';
import { useAuth } from '@/lib/hooks';
import { supabase } from '@/lib/supabase/client';
import { mapToExercise, mapToUserProgress } from '@/lib/supabase/mappers';
import { getDueCards, getNewCards } from '@/lib/srs';
import type { Exercise, UserProgress } from '@/lib/types';

const NEW_CARDS_LIMIT = 5;

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [dueCount, setDueCount] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [totalExercises, setTotalExercises] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchStats() {
      setLoading(true);
      setError(null);

      try {
        // Fetch exercises
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('*');

        if (exercisesError) throw exercisesError;

        // Fetch user progress
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id);

        if (progressError) throw progressError;

        const exercises: Exercise[] = (exercisesData ?? []).map(mapToExercise);
        const progress: UserProgress[] = (progressData ?? []).map(mapToUserProgress);

        const dueCards = getDueCards(progress);
        const newCards = getNewCards(exercises, progress, NEW_CARDS_LIMIT);

        setDueCount(dueCards.length);
        setNewCount(newCards.length);
        setTotalExercises(exercises.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  const handleStartPractice = () => {
    router.push('/practice');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse text-gray-600 dark:text-gray-400">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalSessionCards = dueCount + newCount;
  const hasReviewedAllExercises = totalExercises > 0 && dueCount === 0 && newCount === 0;
  const hasDueOrNewCards = dueCount > 0 || newCount > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Dashboard
        </h1>

        {hasDueOrNewCards ? (
          <DueCardsBanner
            dueCount={dueCount}
            newCount={newCount}
            onStartPractice={handleStartPractice}
          />
        ) : hasReviewedAllExercises ? (
          <EmptyState variant="mastered-all" />
        ) : dueCount === 0 && totalExercises > 0 ? (
          <EmptyState
            variant="all-caught-up"
            newCardsAvailable={newCount}
            onLearnNew={handleStartPractice}
          />
        ) : (
          <div className="text-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">
              No exercises available yet.
            </p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalExercises}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Exercises
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {dueCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Due for Review
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {newCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              New Cards
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute redirectTo="/">
      <ErrorBoundary
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <p>Something went wrong. Please refresh the page.</p>
          </div>
        }
      >
        <DashboardContent />
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
```

### Step 2: Verify no TypeScript errors

Run: `pnpm tsc --noEmit`
Expected: No errors

### Step 3: Commit

```bash
git add src/app/dashboard/
git commit -m "feat(pages): add dashboard page"
```

---

## Task 14: Integration Tests

**Files:**
- Create: `tests/integration/session/practice-flow.test.tsx`

### Step 1: Write integration tests

```typescript
// tests/integration/session/practice-flow.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { AuthProvider } from '@/lib/context/AuthContext';
import { ToastProvider } from '@/lib/context/ToastContext';
import type { ReactNode } from 'react';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
    })),
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase/client';

const mockUser = { id: 'user-123', email: 'test@example.com' };

const mockExercise = {
  id: 'ex-1',
  language: 'python',
  category: 'basics',
  difficulty: 1,
  title: 'Print Statement',
  prompt: 'Write a print statement',
  expected_answer: 'print("hello")',
  hints: ['Use print()'],
  explanation: null,
  tags: ['print'],
  times_practiced: 0,
  avg_success_rate: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockProgress = {
  id: 'progress-1',
  user_id: 'user-123',
  exercise_id: 'ex-1',
  ease_factor: 2.5,
  interval: 1,
  repetitions: 1,
  next_review: '2026-01-01T00:00:00Z', // Due
  last_reviewed: '2025-12-31T00:00:00Z',
  times_seen: 1,
  times_correct: 1,
  created_at: '2025-12-31T00:00:00Z',
  updated_at: '2025-12-31T00:00:00Z',
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>
    <ToastProvider>{children}</ToastProvider>
  </AuthProvider>
);

describe('Practice Session Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });
  });

  describe('useSession with real data flow', () => {
    it('builds session cards from exercises and progress', async () => {
      const { useSession } = await import('@/lib/hooks/useSession');
      const { renderHook } = await import('@testing-library/react');

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'exercises') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [mockExercise],
              error: null,
            }),
          } as any;
        }
        if (table === 'user_progress') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [mockProgress],
                error: null,
              }),
            }),
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: {}, error: null }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have the due card
      expect(result.current.cards.length).toBeGreaterThan(0);
      expect(result.current.currentCard?.exercise.id).toBe('ex-1');
    });

    it('completes session flow from start to summary', async () => {
      const { useSession } = await import('@/lib/hooks/useSession');
      const { renderHook } = await import('@testing-library/react');

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'exercises') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [mockExercise],
              error: null,
            }),
          } as any;
        }
        if (table === 'user_progress') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [mockProgress],
                error: null,
              }),
            }),
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: {}, error: null }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isComplete).toBe(false);

      // Answer the card
      await act(async () => {
        await result.current.recordResult(4);
      });

      expect(result.current.isComplete).toBe(true);
      expect(result.current.stats.completed).toBe(1);
      expect(result.current.stats.correct).toBe(1);
    });
  });
});
```

### Step 2: Run integration tests

Run: `pnpm vitest tests/integration/session/ --run`
Expected: PASS

### Step 3: Commit

```bash
git add tests/integration/session/
git commit -m "test(integration): add practice session flow tests"
```

---

## Task 15: Final Verification

**Files:** None (verification only)

### Step 1: Run all tests

Run: `pnpm vitest --run`
Expected: All tests PASS

### Step 2: Run TypeScript check

Run: `pnpm tsc --noEmit`
Expected: No errors

### Step 3: Run linting

Run: `pnpm lint`
Expected: No errors

### Step 4: Run build

Run: `pnpm build`
Expected: Build successful

### Step 5: Final commit

```bash
git add -A
git commit -m "feat: complete Milestone 5 Practice Session implementation"
```

---

## Summary

**Total Tasks:** 15
**Estimated Tests:** ~35 new tests
**Files Created:** 14
**Files Modified:** 4

### Created Files:
1. `src/lib/session/types.ts`
2. `src/lib/session/interleave.ts`
3. `src/lib/session/index.ts`
4. `src/lib/hooks/useSession.ts`
5. `src/components/session/SessionProgress.tsx`
6. `src/components/session/SessionSummary.tsx`
7. `src/components/session/index.ts`
8. `src/components/dashboard/DueCardsBanner.tsx`
9. `src/components/dashboard/EmptyState.tsx`
10. `src/components/dashboard/index.ts`
11. `src/app/practice/page.tsx`
12. `src/app/dashboard/page.tsx`
13. `tests/unit/session/types.test.ts`
14. `tests/unit/session/interleave.test.ts`

### Modified Files:
1. `src/lib/hooks/index.ts` - Export useSession
2. `src/components/index.ts` - Export session + dashboard components
3. `tests/unit/hooks/useSession.test.tsx` - Created with all hook tests
4. `tests/integration/session/practice-flow.test.tsx` - Integration tests

### Key Architecture Decisions:
- **SessionCard type** joins Exercise content with CardState at session init
- **interleaveCards utility** keeps new cards spread out (1 per 3 due cards)
- **useSession hook** manages all session state with optimistic updates
- **Fire-and-forget saves** prevent network issues from blocking UX
- **Reuses existing infrastructure**: `recordAnswer` from useSRS, `ExerciseCard`, `ProtectedRoute`
