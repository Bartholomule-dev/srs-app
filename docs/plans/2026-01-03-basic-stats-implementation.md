# Basic Stats Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Display user statistics on the dashboard: cards reviewed today, accuracy percentage, current streak, and total exercises completed.

**Architecture:** Pure TypeScript stats layer (`src/lib/stats/`) with query functions, a `useStats` hook, `StatsCard` components, and profile stat updates on session completion. TDD approach following existing patterns.

**Tech Stack:** TypeScript, React hooks, Supabase queries, Vitest for testing.

---

## Overview

The "Basic Stats" feature requires:
1. **Cards reviewed today** - Query `user_progress` where `last_reviewed` is today
2. **Accuracy percentage** - Aggregate `times_correct / times_seen` from `user_progress`
3. **Current streak** - Display from `profiles.current_streak` (+ update logic)
4. **Total exercises completed** - Display from `profiles.total_exercises_completed` (+ update logic)

### Key Files

| Purpose | Path |
|---------|------|
| Stats types | `src/lib/stats/types.ts` |
| Stats queries | `src/lib/stats/queries.ts` |
| Stats utilities | `src/lib/stats/streak.ts` |
| Stats barrel export | `src/lib/stats/index.ts` |
| useStats hook | `src/lib/hooks/useStats.ts` |
| StatsCard component | `src/components/dashboard/StatsCard.tsx` |
| StatsGrid component | `src/components/dashboard/StatsGrid.tsx` |
| Dashboard integration | `src/app/dashboard/page.tsx` |

---

## Phase 1: Stats Library (Pure TypeScript)

### Task 1: Create UserStats type

**Files:**
- Create: `src/lib/stats/types.ts`
- Test: `tests/unit/stats/types.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/stats/types.test.ts
import { describe, it, expect } from 'vitest';
import type { UserStats, DailyStats } from '@/lib/stats/types';

describe('Stats types', () => {
  it('UserStats has required fields', () => {
    const stats: UserStats = {
      cardsReviewedToday: 10,
      accuracyPercent: 85,
      currentStreak: 7,
      longestStreak: 14,
      totalExercisesCompleted: 150,
    };

    expect(stats.cardsReviewedToday).toBe(10);
    expect(stats.accuracyPercent).toBe(85);
    expect(stats.currentStreak).toBe(7);
    expect(stats.longestStreak).toBe(14);
    expect(stats.totalExercisesCompleted).toBe(150);
  });

  it('DailyStats tracks today activity', () => {
    const daily: DailyStats = {
      date: '2026-01-03',
      cardsReviewed: 10,
      correctCount: 8,
      incorrectCount: 2,
    };

    expect(daily.date).toBe('2026-01-03');
    expect(daily.cardsReviewed).toBe(10);
    expect(daily.correctCount).toBe(8);
    expect(daily.incorrectCount).toBe(2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/stats/types.test.ts`
Expected: FAIL - Cannot find module '@/lib/stats/types'

**Step 3: Write minimal implementation**

```typescript
// src/lib/stats/types.ts
/**
 * Aggregated user statistics for dashboard display.
 */
export interface UserStats {
  /** Number of cards reviewed in the current day (UTC) */
  cardsReviewedToday: number;
  /** Overall accuracy as a percentage (0-100) */
  accuracyPercent: number;
  /** Current consecutive days practiced */
  currentStreak: number;
  /** Highest streak ever achieved */
  longestStreak: number;
  /** Total number of exercises with at least one review */
  totalExercisesCompleted: number;
}

/**
 * Statistics for a single day of practice.
 */
export interface DailyStats {
  /** Date in YYYY-MM-DD format (UTC) */
  date: string;
  /** Total cards reviewed on this day */
  cardsReviewed: number;
  /** Number of correct answers */
  correctCount: number;
  /** Number of incorrect answers */
  incorrectCount: number;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/stats/types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/stats/types.ts tests/unit/stats/types.test.ts
git commit -m "feat(stats): add UserStats and DailyStats types"
```

---

### Task 2: Create getCardsReviewedToday query function

**Files:**
- Create: `src/lib/stats/queries.ts`
- Test: `tests/unit/stats/queries.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/stats/queries.test.ts
import { describe, it, expect } from 'vitest';
import { getCardsReviewedToday, getTotalAccuracy } from '@/lib/stats/queries';
import type { UserProgress } from '@/lib/types';

describe('getCardsReviewedToday', () => {
  it('returns 0 for empty progress array', () => {
    const result = getCardsReviewedToday([], new Date('2026-01-03T12:00:00Z'));
    expect(result).toBe(0);
  });

  it('counts cards reviewed today (UTC)', () => {
    const today = new Date('2026-01-03T12:00:00Z');
    const progress: UserProgress[] = [
      createProgress({ lastReviewed: '2026-01-03T08:00:00Z' }), // today
      createProgress({ lastReviewed: '2026-01-03T23:59:59Z' }), // today
      createProgress({ lastReviewed: '2026-01-02T23:59:59Z' }), // yesterday
      createProgress({ lastReviewed: null }), // never reviewed
    ];

    expect(getCardsReviewedToday(progress, today)).toBe(2);
  });

  it('handles timezone edge cases (UTC midnight)', () => {
    const today = new Date('2026-01-03T00:01:00Z');
    const progress: UserProgress[] = [
      createProgress({ lastReviewed: '2026-01-03T00:00:00Z' }), // just after midnight
      createProgress({ lastReviewed: '2026-01-02T23:59:59Z' }), // just before midnight
    ];

    expect(getCardsReviewedToday(progress, today)).toBe(1);
  });
});

describe('getTotalAccuracy', () => {
  it('returns 0 for empty progress array', () => {
    expect(getTotalAccuracy([])).toBe(0);
  });

  it('returns 0 when no cards have been seen', () => {
    const progress: UserProgress[] = [
      createProgress({ timesSeen: 0, timesCorrect: 0 }),
    ];
    expect(getTotalAccuracy(progress)).toBe(0);
  });

  it('calculates accuracy percentage correctly', () => {
    const progress: UserProgress[] = [
      createProgress({ timesSeen: 10, timesCorrect: 8 }),
      createProgress({ timesSeen: 10, timesCorrect: 6 }),
    ];
    // Total: 20 seen, 14 correct = 70%
    expect(getTotalAccuracy(progress)).toBe(70);
  });

  it('rounds to nearest integer', () => {
    const progress: UserProgress[] = [
      createProgress({ timesSeen: 3, timesCorrect: 1 }), // 33.33%
    ];
    expect(getTotalAccuracy(progress)).toBe(33);
  });
});

// Helper to create minimal UserProgress objects
function createProgress(overrides: Partial<UserProgress>): UserProgress {
  return {
    id: 'test-id',
    userId: 'user-1',
    exerciseId: 'exercise-1',
    easeFactor: 2.5,
    interval: 1,
    repetitions: 1,
    nextReview: '2026-01-04T00:00:00Z',
    lastReviewed: null,
    timesSeen: 0,
    timesCorrect: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/stats/queries.test.ts`
Expected: FAIL - Cannot find module '@/lib/stats/queries'

**Step 3: Write minimal implementation**

```typescript
// src/lib/stats/queries.ts
import type { UserProgress } from '@/lib/types';

/**
 * Formats a Date to YYYY-MM-DD string in UTC.
 */
function toUTCDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Counts how many cards were reviewed today (UTC).
 * @param progress - Array of user progress records
 * @param now - Current date/time (for testability)
 */
export function getCardsReviewedToday(
  progress: UserProgress[],
  now: Date = new Date()
): number {
  const todayStr = toUTCDateString(now);

  return progress.filter((p) => {
    if (!p.lastReviewed) return false;
    const reviewDateStr = toUTCDateString(new Date(p.lastReviewed));
    return reviewDateStr === todayStr;
  }).length;
}

/**
 * Calculates overall accuracy percentage across all progress records.
 * @param progress - Array of user progress records
 * @returns Accuracy as integer percentage (0-100)
 */
export function getTotalAccuracy(progress: UserProgress[]): number {
  const totals = progress.reduce(
    (acc, p) => ({
      seen: acc.seen + p.timesSeen,
      correct: acc.correct + p.timesCorrect,
    }),
    { seen: 0, correct: 0 }
  );

  if (totals.seen === 0) return 0;
  return Math.round((totals.correct / totals.seen) * 100);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/stats/queries.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/stats/queries.ts tests/unit/stats/queries.test.ts
git commit -m "feat(stats): add getCardsReviewedToday and getTotalAccuracy"
```

---

### Task 3: Create streak calculation utilities

**Files:**
- Create: `src/lib/stats/streak.ts`
- Test: `tests/unit/stats/streak.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/stats/streak.test.ts
import { describe, it, expect } from 'vitest';
import { shouldIncrementStreak, calculateUpdatedStreak } from '@/lib/stats/streak';

describe('shouldIncrementStreak', () => {
  it('returns true for first practice ever (null lastPracticed)', () => {
    expect(shouldIncrementStreak(null, new Date('2026-01-03T12:00:00Z'))).toBe(true);
  });

  it('returns true when last practice was yesterday (UTC)', () => {
    const lastPracticed = new Date('2026-01-02T18:00:00Z');
    const now = new Date('2026-01-03T10:00:00Z');
    expect(shouldIncrementStreak(lastPracticed, now)).toBe(true);
  });

  it('returns false when already practiced today (UTC)', () => {
    const lastPracticed = new Date('2026-01-03T08:00:00Z');
    const now = new Date('2026-01-03T20:00:00Z');
    expect(shouldIncrementStreak(lastPracticed, now)).toBe(false);
  });

  it('returns false when streak is broken (gap > 1 day)', () => {
    const lastPracticed = new Date('2026-01-01T18:00:00Z');
    const now = new Date('2026-01-03T10:00:00Z');
    expect(shouldIncrementStreak(lastPracticed, now)).toBe(false);
  });
});

describe('calculateUpdatedStreak', () => {
  it('starts streak at 1 for first practice', () => {
    const result = calculateUpdatedStreak({
      currentStreak: 0,
      longestStreak: 0,
      lastPracticed: null,
      now: new Date('2026-01-03T12:00:00Z'),
    });

    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it('increments streak when continuing from yesterday', () => {
    const result = calculateUpdatedStreak({
      currentStreak: 5,
      longestStreak: 10,
      lastPracticed: new Date('2026-01-02T18:00:00Z'),
      now: new Date('2026-01-03T10:00:00Z'),
    });

    expect(result.currentStreak).toBe(6);
    expect(result.longestStreak).toBe(10); // unchanged
  });

  it('updates longest streak when current exceeds it', () => {
    const result = calculateUpdatedStreak({
      currentStreak: 10,
      longestStreak: 10,
      lastPracticed: new Date('2026-01-02T18:00:00Z'),
      now: new Date('2026-01-03T10:00:00Z'),
    });

    expect(result.currentStreak).toBe(11);
    expect(result.longestStreak).toBe(11);
  });

  it('does not change streak when already practiced today', () => {
    const result = calculateUpdatedStreak({
      currentStreak: 5,
      longestStreak: 10,
      lastPracticed: new Date('2026-01-03T08:00:00Z'),
      now: new Date('2026-01-03T20:00:00Z'),
    });

    expect(result.currentStreak).toBe(5);
    expect(result.longestStreak).toBe(10);
  });

  it('resets streak to 1 when broken (gap > 1 day)', () => {
    const result = calculateUpdatedStreak({
      currentStreak: 5,
      longestStreak: 10,
      lastPracticed: new Date('2026-01-01T18:00:00Z'),
      now: new Date('2026-01-03T10:00:00Z'),
    });

    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(10); // preserved
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/stats/streak.test.ts`
Expected: FAIL - Cannot find module '@/lib/stats/streak'

**Step 3: Write minimal implementation**

```typescript
// src/lib/stats/streak.ts

/**
 * Gets the UTC date string (YYYY-MM-DD) from a Date object.
 */
function toUTCDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Gets the number of days between two UTC date strings.
 */
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1 + 'T00:00:00Z');
  const d2 = new Date(date2 + 'T00:00:00Z');
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determines if we should increment the streak.
 * Returns true if:
 * - First practice ever (lastPracticed is null)
 * - Last practice was yesterday (continuing streak)
 * Returns false if:
 * - Already practiced today
 * - Streak is broken (gap > 1 day)
 */
export function shouldIncrementStreak(
  lastPracticed: Date | null,
  now: Date
): boolean {
  if (!lastPracticed) return true;

  const lastDateStr = toUTCDateString(lastPracticed);
  const todayStr = toUTCDateString(now);

  if (lastDateStr === todayStr) return false; // already practiced today

  const daysDiff = daysBetween(lastDateStr, todayStr);
  return daysDiff === 1; // exactly yesterday
}

export interface StreakUpdateInput {
  currentStreak: number;
  longestStreak: number;
  lastPracticed: Date | null;
  now: Date;
}

export interface StreakUpdateResult {
  currentStreak: number;
  longestStreak: number;
}

/**
 * Calculates updated streak values based on practice timing.
 */
export function calculateUpdatedStreak(
  input: StreakUpdateInput
): StreakUpdateResult {
  const { currentStreak, longestStreak, lastPracticed, now } = input;

  // Already practiced today - no change
  if (lastPracticed && toUTCDateString(lastPracticed) === toUTCDateString(now)) {
    return { currentStreak, longestStreak };
  }

  // First practice or continuing from yesterday
  if (shouldIncrementStreak(lastPracticed, now)) {
    const newCurrent = currentStreak + 1;
    const newLongest = Math.max(longestStreak, newCurrent);
    return { currentStreak: newCurrent, longestStreak: newLongest };
  }

  // Streak broken - reset to 1
  return { currentStreak: 1, longestStreak };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/stats/streak.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/stats/streak.ts tests/unit/stats/streak.test.ts
git commit -m "feat(stats): add streak calculation utilities"
```

---

### Task 4: Create stats barrel export

**Files:**
- Create: `src/lib/stats/index.ts`
- Test: `tests/unit/stats/index.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/stats/index.test.ts
import { describe, it, expect } from 'vitest';
import * as stats from '@/lib/stats';

describe('Stats barrel export', () => {
  it('exports types', () => {
    // Type-only exports verified by TypeScript compilation
    const userStats: stats.UserStats = {
      cardsReviewedToday: 0,
      accuracyPercent: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalExercisesCompleted: 0,
    };
    expect(userStats).toBeDefined();
  });

  it('exports query functions', () => {
    expect(typeof stats.getCardsReviewedToday).toBe('function');
    expect(typeof stats.getTotalAccuracy).toBe('function');
  });

  it('exports streak utilities', () => {
    expect(typeof stats.shouldIncrementStreak).toBe('function');
    expect(typeof stats.calculateUpdatedStreak).toBe('function');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/stats/index.test.ts`
Expected: FAIL - Cannot find module '@/lib/stats'

**Step 3: Write minimal implementation**

```typescript
// src/lib/stats/index.ts
export type { UserStats, DailyStats } from './types';
export { getCardsReviewedToday, getTotalAccuracy } from './queries';
export {
  shouldIncrementStreak,
  calculateUpdatedStreak,
  type StreakUpdateInput,
  type StreakUpdateResult,
} from './streak';
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/stats/index.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/stats/index.ts tests/unit/stats/index.test.ts
git commit -m "feat(stats): add barrel export for stats library"
```

---

## Phase 2: useStats Hook

### Task 5: Create useStats hook

**Files:**
- Create: `src/lib/hooks/useStats.ts`
- Test: `tests/unit/hooks/useStats.test.tsx`

**Step 1: Write the failing test**

```typescript
// tests/unit/hooks/useStats.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStats } from '@/lib/hooks/useStats';
import type { UserStats } from '@/lib/stats';

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
  mapUserProgress: vi.fn((p) => ({
    id: p.id,
    userId: p.user_id,
    exerciseId: p.exercise_id,
    easeFactor: p.ease_factor,
    interval: p.interval,
    repetitions: p.repetitions,
    nextReview: p.next_review,
    lastReviewed: p.last_reviewed,
    timesSeen: p.times_seen,
    timesCorrect: p.times_correct,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  })),
  mapProfile: vi.fn((p) => ({
    id: p.id,
    username: p.username,
    displayName: p.display_name,
    avatarUrl: p.avatar_url,
    preferredLanguage: p.preferred_language,
    dailyGoal: p.daily_goal,
    notificationTime: p.notification_time,
    currentStreak: p.current_streak,
    longestStreak: p.longest_streak,
    totalExercisesCompleted: p.total_exercises_completed,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  })),
}));

// Mock useAuth
const mockUser = { id: 'user-1' };
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    loading: false,
  })),
}));

describe('useStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns loading state initially', () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    const { result } = renderHook(() => useStats());
    expect(result.current.loading).toBe(true);
  });

  it('fetches and computes stats', async () => {
    const mockProgress = [
      {
        id: '1',
        user_id: 'user-1',
        exercise_id: 'ex-1',
        ease_factor: 2.5,
        interval: 1,
        repetitions: 1,
        next_review: '2026-01-04T00:00:00Z',
        last_reviewed: new Date().toISOString(), // today
        times_seen: 10,
        times_correct: 8,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];

    const mockProfile = {
      id: 'user-1',
      username: 'testuser',
      display_name: 'Test User',
      avatar_url: null,
      preferred_language: 'python',
      daily_goal: 10,
      notification_time: null,
      current_streak: 5,
      longest_streak: 10,
      total_exercises_completed: 50,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    mockSelect.mockImplementation((selector) => {
      if (selector === '*') {
        return {
          eq: vi.fn().mockResolvedValue({ data: mockProgress, error: null }),
        };
      }
      return {
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      };
    });

    const { result } = renderHook(() => useStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toBeDefined();
    expect(result.current.stats?.cardsReviewedToday).toBe(1);
    expect(result.current.stats?.accuracyPercent).toBe(80);
    expect(result.current.stats?.currentStreak).toBe(5);
    expect(result.current.stats?.longestStreak).toBe(10);
    expect(result.current.stats?.totalExercisesCompleted).toBe(50);
  });

  it('returns null stats when not authenticated', async () => {
    vi.mocked(await import('@/lib/hooks/useAuth')).useAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    const { result } = renderHook(() => useStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toBeNull();
  });

  it('handles errors gracefully', async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    });

    const { result } = renderHook(() => useStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/hooks/useStats.test.tsx`
Expected: FAIL - Cannot find module '@/lib/hooks/useStats'

**Step 3: Write minimal implementation**

```typescript
// src/lib/hooks/useStats.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase, mapUserProgress, mapProfile } from '@/lib/supabase';
import { handleSupabaseError } from '@/lib/errors';
import { getCardsReviewedToday, getTotalAccuracy } from '@/lib/stats';
import type { UserStats } from '@/lib/stats';
import type { AppError } from '@/lib/errors';
import type { UserProgress, Profile } from '@/lib/types';
import type { Database } from '@/lib/types/database.generated';

type DbProfile = Database['public']['Tables']['profiles']['Row'];
type DbUserProgress = Database['public']['Tables']['user_progress']['Row'];

export interface UseStatsReturn {
  stats: UserStats | null;
  loading: boolean;
  error: AppError | null;
  refetch: () => void;
}

export function useStats(): UseStatsReturn {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setStats(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchStats() {
      setLoading(true);
      setError(null);

      try {
        // Fetch user progress
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user!.id);

        if (progressError) {
          throw handleSupabaseError(progressError);
        }

        // Fetch profile for streak data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user!.id)
          .single();

        if (profileError) {
          throw handleSupabaseError(profileError);
        }

        if (cancelled) return;

        const progress: UserProgress[] = (progressData ?? []).map((p) =>
          mapUserProgress(p as DbUserProgress)
        );
        const profile: Profile = mapProfile(profileData as DbProfile);

        const userStats: UserStats = {
          cardsReviewedToday: getCardsReviewedToday(progress),
          accuracyPercent: getTotalAccuracy(progress),
          currentStreak: profile.currentStreak,
          longestStreak: profile.longestStreak,
          totalExercisesCompleted: profile.totalExercisesCompleted,
        };

        setStats(userStats);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof Error && 'code' in err) {
          setError(err as AppError);
        } else {
          setError(handleSupabaseError(err as Error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchStats();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, fetchKey]);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  return { stats, loading, error, refetch };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/hooks/useStats.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/hooks/useStats.ts tests/unit/hooks/useStats.test.tsx
git commit -m "feat(stats): add useStats hook"
```

---

### Task 6: Update hooks barrel export

**Files:**
- Modify: `src/lib/hooks/index.ts`
- Test: `tests/unit/hooks/index.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/hooks/index.test.ts (add to existing file or create)
import { describe, it, expect } from 'vitest';
import * as hooks from '@/lib/hooks';

describe('Hooks barrel export', () => {
  it('exports useStats', () => {
    expect(typeof hooks.useStats).toBe('function');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/hooks/index.test.ts`
Expected: FAIL - hooks.useStats is undefined

**Step 3: Write minimal implementation**

Add to `src/lib/hooks/index.ts`:

```typescript
export { useStats, type UseStatsReturn } from './useStats';
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/hooks/index.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/hooks/index.ts tests/unit/hooks/index.test.ts
git commit -m "feat(stats): export useStats from hooks barrel"
```

---

## Phase 3: Dashboard Components

### Task 7: Create StatsCard component

**Files:**
- Create: `src/components/dashboard/StatsCard.tsx`
- Test: `tests/unit/components/dashboard/StatsCard.test.tsx`

**Step 1: Write the failing test**

```typescript
// tests/unit/components/dashboard/StatsCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsCard } from '@/components/dashboard/StatsCard';

describe('StatsCard', () => {
  it('renders label and value', () => {
    render(<StatsCard label="Streak" value={7} />);

    expect(screen.getByText('Streak')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders with suffix', () => {
    render(<StatsCard label="Accuracy" value={85} suffix="%" />);

    expect(screen.getByText('Accuracy')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<StatsCard label="Streak" value={7} icon="fire" />);

    // Icon should be present (we use emoji for simplicity)
    expect(screen.getByText(/🔥/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatsCard label="Test" value={1} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/components/dashboard/StatsCard.test.tsx`
Expected: FAIL - Cannot find module '@/components/dashboard/StatsCard'

**Step 3: Write minimal implementation**

```typescript
// src/components/dashboard/StatsCard.tsx
'use client';

export interface StatsCardProps {
  /** Label text displayed above the value */
  label: string;
  /** The stat value to display */
  value: number;
  /** Optional suffix (e.g., "%" for percentage) */
  suffix?: string;
  /** Icon identifier: 'fire', 'target', 'trophy', 'check' */
  icon?: 'fire' | 'target' | 'trophy' | 'check';
  /** Additional CSS classes */
  className?: string;
}

const iconMap: Record<string, string> = {
  fire: '🔥',
  target: '🎯',
  trophy: '🏆',
  check: '✓',
};

export function StatsCard({
  label,
  value,
  suffix = '',
  icon,
  className = '',
}: StatsCardProps) {
  return (
    <div
      className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-lg">{iconMap[icon]}</span>}
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
        {suffix}
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/components/dashboard/StatsCard.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/dashboard/StatsCard.tsx tests/unit/components/dashboard/StatsCard.test.tsx
git commit -m "feat(stats): add StatsCard component"
```

---

### Task 8: Create StatsGrid component

**Files:**
- Create: `src/components/dashboard/StatsGrid.tsx`
- Test: `tests/unit/components/dashboard/StatsGrid.test.tsx`

**Step 1: Write the failing test**

```typescript
// tests/unit/components/dashboard/StatsGrid.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import type { UserStats } from '@/lib/stats';

describe('StatsGrid', () => {
  const mockStats: UserStats = {
    cardsReviewedToday: 15,
    accuracyPercent: 87,
    currentStreak: 7,
    longestStreak: 14,
    totalExercisesCompleted: 150,
  };

  it('renders all four stat cards', () => {
    render(<StatsGrid stats={mockStats} />);

    // Cards reviewed today
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    // Accuracy
    expect(screen.getByText('Accuracy')).toBeInTheDocument();
    expect(screen.getByText('87%')).toBeInTheDocument();

    // Streak
    expect(screen.getByText('Streak')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();

    // Total
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('renders loading skeleton when loading', () => {
    render(<StatsGrid stats={null} loading />);

    const skeletons = screen.getAllByTestId('stats-skeleton');
    expect(skeletons).toHaveLength(4);
  });

  it('renders zero values correctly', () => {
    const zeroStats: UserStats = {
      cardsReviewedToday: 0,
      accuracyPercent: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalExercisesCompleted: 0,
    };

    render(<StatsGrid stats={zeroStats} />);

    // Should show "0" values, not be empty
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(2); // At least Today and Streak
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/components/dashboard/StatsGrid.test.tsx`
Expected: FAIL - Cannot find module '@/components/dashboard/StatsGrid'

**Step 3: Write minimal implementation**

```typescript
// src/components/dashboard/StatsGrid.tsx
'use client';

import { StatsCard } from './StatsCard';
import type { UserStats } from '@/lib/stats';

export interface StatsGridProps {
  stats: UserStats | null;
  loading?: boolean;
}

function StatsSkeleton() {
  return (
    <div
      data-testid="stats-skeleton"
      className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse"
    >
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12" />
    </div>
  );
}

export function StatsGrid({ stats, loading = false }: StatsGridProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsSkeleton />
        <StatsSkeleton />
        <StatsSkeleton />
        <StatsSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatsCard
        label="Today"
        value={stats.cardsReviewedToday}
        icon="check"
      />
      <StatsCard
        label="Accuracy"
        value={stats.accuracyPercent}
        suffix="%"
        icon="target"
      />
      <StatsCard
        label="Streak"
        value={stats.currentStreak}
        icon="fire"
      />
      <StatsCard
        label="Total"
        value={stats.totalExercisesCompleted}
        icon="trophy"
      />
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/components/dashboard/StatsGrid.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/dashboard/StatsGrid.tsx tests/unit/components/dashboard/StatsGrid.test.tsx
git commit -m "feat(stats): add StatsGrid component"
```

---

### Task 9: Update dashboard barrel export

**Files:**
- Modify: `src/components/dashboard/index.ts`
- Test: (existing barrel test should auto-cover)

**Step 1: Write the failing test**

```typescript
// tests/unit/components/dashboard/index.test.ts (add to existing or create)
import { describe, it, expect } from 'vitest';
import * as dashboard from '@/components/dashboard';

describe('Dashboard barrel export', () => {
  it('exports StatsCard', () => {
    expect(dashboard.StatsCard).toBeDefined();
  });

  it('exports StatsGrid', () => {
    expect(dashboard.StatsGrid).toBeDefined();
  });

  it('exports DueCardsBanner', () => {
    expect(dashboard.DueCardsBanner).toBeDefined();
  });

  it('exports EmptyState', () => {
    expect(dashboard.EmptyState).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/components/dashboard/index.test.ts`
Expected: FAIL - dashboard.StatsCard is undefined

**Step 3: Write minimal implementation**

Update `src/components/dashboard/index.ts`:

```typescript
export { DueCardsBanner, type DueCardsBannerProps } from './DueCardsBanner';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { StatsCard, type StatsCardProps } from './StatsCard';
export { StatsGrid, type StatsGridProps } from './StatsGrid';
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/components/dashboard/index.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/dashboard/index.ts tests/unit/components/dashboard/index.test.ts
git commit -m "feat(stats): export StatsCard and StatsGrid from dashboard barrel"
```

---

## Phase 4: Dashboard Integration

### Task 10: Integrate StatsGrid into dashboard page

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Test: `tests/unit/app/dashboard.test.tsx`

**Step 1: Write the failing test**

```typescript
// tests/unit/app/dashboard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';

// Mock components and hooks
vi.mock('@/components', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="protected-route">{children}</div>
  ),
}));

vi.mock('@/components/dashboard', () => ({
  DueCardsBanner: ({ dueCount, newCount }: { dueCount: number; newCount: number }) => (
    <div data-testid="due-cards-banner">
      Due: {dueCount}, New: {newCount}
    </div>
  ),
  EmptyState: ({ variant }: { variant: string }) => (
    <div data-testid="empty-state">{variant}</div>
  ),
  StatsGrid: ({ stats, loading }: { stats: unknown; loading: boolean }) => (
    <div data-testid="stats-grid">
      {loading ? 'Loading stats...' : stats ? 'Stats loaded' : 'No stats'}
    </div>
  ),
}));

const mockUseAuth = vi.fn();
const mockUseStats = vi.fn();

vi.mock('@/lib/hooks', () => ({
  useAuth: () => mockUseAuth(),
  useStats: () => mockUseStats(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
  },
  mapExercise: vi.fn((e) => e),
  mapUserProgress: vi.fn((p) => p),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' }, loading: false });
    mockUseStats.mockReturnValue({
      stats: {
        cardsReviewedToday: 10,
        accuracyPercent: 85,
        currentStreak: 7,
        longestStreak: 14,
        totalExercisesCompleted: 150,
      },
      loading: false,
      error: null,
    });
  });

  it('renders StatsGrid component', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('stats-grid')).toBeInTheDocument();
    });
  });

  it('shows loading state for stats', async () => {
    mockUseStats.mockReturnValue({
      stats: null,
      loading: true,
      error: null,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Loading stats...')).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/app/dashboard.test.tsx`
Expected: FAIL - StatsGrid not rendered in dashboard

**Step 3: Write minimal implementation**

Update `src/app/dashboard/page.tsx` to include StatsGrid:

```typescript
// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useStats } from '@/lib/hooks';
import { ProtectedRoute } from '@/components';
import { DueCardsBanner, EmptyState, StatsGrid } from '@/components/dashboard';
import { supabase, mapExercise, mapUserProgress } from '@/lib/supabase';
import { getDueCards, getNewCards } from '@/lib/srs';
import type { Exercise, UserProgress } from '@/lib/types';

const NEW_CARDS_LIMIT = 5;

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useStats();
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
          .eq('user_id', user!.id);

        if (progressError) throw progressError;

        const exercises: Exercise[] = (exercisesData ?? []).map(mapExercise);
        const progress: UserProgress[] = (progressData ?? []).map(mapUserProgress);

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

  const hasDueOrNewCards = dueCount > 0 || newCount > 0;
  const hasReviewedAllExercises = totalExercises > 0 && dueCount === 0 && newCount === 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>

        {/* Stats Grid */}
        <StatsGrid stats={stats} loading={statsLoading} />

        {/* Practice CTA or Empty State */}
        {hasDueOrNewCards && (
          <DueCardsBanner
            dueCount={dueCount}
            newCount={newCount}
            onStartPractice={handleStartPractice}
          />
        )}

        {hasReviewedAllExercises && (
          <EmptyState variant="all-caught-up" />
        )}

        {totalExercises === 0 && (
          <EmptyState variant="no-exercises" />
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/app/dashboard.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx tests/unit/app/dashboard.test.tsx
git commit -m "feat(stats): integrate StatsGrid into dashboard page"
```

---

## Phase 5: Profile Stats Updates

### Task 11: Create updateProfileStats utility

**Files:**
- Create: `src/lib/stats/updateProfile.ts`
- Test: `tests/unit/stats/updateProfile.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/stats/updateProfile.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateProfileStats } from '@/lib/stats/updateProfile';

const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: mockUpdate,
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'user-1',
              current_streak: 5,
              longest_streak: 10,
              total_exercises_completed: 50,
              updated_at: '2026-01-02T00:00:00Z',
            },
            error: null,
          }),
        })),
      })),
    })),
  },
}));

describe('updateProfileStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({
      eq: mockEq.mockReturnValue({
        select: mockSelect.mockReturnValue({
          single: mockSingle.mockResolvedValue({ data: {}, error: null }),
        }),
      }),
    });
  });

  it('increments total_exercises_completed', async () => {
    await updateProfileStats({
      userId: 'user-1',
      exercisesCompleted: 5,
      lastPracticed: null,
      now: new Date('2026-01-03T12:00:00Z'),
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        total_exercises_completed: expect.any(Number),
      })
    );
  });

  it('updates streak when continuing from yesterday', async () => {
    await updateProfileStats({
      userId: 'user-1',
      exercisesCompleted: 1,
      lastPracticed: new Date('2026-01-02T18:00:00Z'),
      now: new Date('2026-01-03T10:00:00Z'),
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        current_streak: expect.any(Number),
      })
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/stats/updateProfile.test.ts`
Expected: FAIL - Cannot find module '@/lib/stats/updateProfile'

**Step 3: Write minimal implementation**

```typescript
// src/lib/stats/updateProfile.ts
import { supabase } from '@/lib/supabase';
import { handleSupabaseError } from '@/lib/errors';
import { calculateUpdatedStreak } from './streak';
import type { Database } from '@/lib/types/database.generated';

type DbProfile = Database['public']['Tables']['profiles']['Row'];

export interface UpdateProfileStatsInput {
  userId: string;
  exercisesCompleted: number;
  lastPracticed: Date | null;
  now?: Date;
}

/**
 * Updates profile statistics after a practice session.
 * - Increments total_exercises_completed
 * - Updates current_streak and longest_streak based on practice timing
 */
export async function updateProfileStats(
  input: UpdateProfileStatsInput
): Promise<void> {
  const { userId, exercisesCompleted, lastPracticed, now = new Date() } = input;

  // First, fetch current profile to get streak data
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('current_streak, longest_streak, total_exercises_completed')
    .eq('id', userId)
    .single();

  if (fetchError) {
    throw handleSupabaseError(fetchError);
  }

  const currentProfile = profile as Pick<
    DbProfile,
    'current_streak' | 'longest_streak' | 'total_exercises_completed'
  >;

  // Calculate updated streak
  const streakUpdate = calculateUpdatedStreak({
    currentStreak: currentProfile.current_streak ?? 0,
    longestStreak: currentProfile.longest_streak ?? 0,
    lastPracticed,
    now,
  });

  // Update profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      current_streak: streakUpdate.currentStreak,
      longest_streak: streakUpdate.longestStreak,
      total_exercises_completed:
        (currentProfile.total_exercises_completed ?? 0) + exercisesCompleted,
      updated_at: now.toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (updateError) {
    throw handleSupabaseError(updateError);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/stats/updateProfile.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/stats/updateProfile.ts tests/unit/stats/updateProfile.test.ts
git commit -m "feat(stats): add updateProfileStats utility"
```

---

### Task 12: Update stats barrel export with updateProfileStats

**Files:**
- Modify: `src/lib/stats/index.ts`
- Test: (update existing barrel test)

**Step 1: Write the failing test**

Update `tests/unit/stats/index.test.ts`:

```typescript
it('exports updateProfileStats', () => {
  expect(typeof stats.updateProfileStats).toBe('function');
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/stats/index.test.ts`
Expected: FAIL - stats.updateProfileStats is undefined

**Step 3: Write minimal implementation**

Add to `src/lib/stats/index.ts`:

```typescript
export { updateProfileStats, type UpdateProfileStatsInput } from './updateProfile';
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/stats/index.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/stats/index.ts tests/unit/stats/index.test.ts
git commit -m "feat(stats): export updateProfileStats from barrel"
```

---

### Task 13: Integrate profile stats update into useSession

**Files:**
- Modify: `src/lib/hooks/useSession.ts`
- Test: `tests/unit/hooks/useSession.test.tsx`

**Step 1: Write the failing test**

Add to `tests/unit/hooks/useSession.test.tsx`:

```typescript
describe('profile stats update', () => {
  it('updates profile stats when session ends with completed cards', async () => {
    // Setup: render hook with cards, complete session
    // Assert: updateProfileStats was called with correct exercisesCompleted count
  });

  it('does not update profile stats when session has no completed cards', async () => {
    // Setup: render hook, end session immediately without answering
    // Assert: updateProfileStats was not called
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/hooks/useSession.test.tsx`
Expected: FAIL - profile stats not updated

**Step 3: Write minimal implementation**

Update `useSession.ts` to call `updateProfileStats` in the `endSession` callback:

```typescript
// In useSession.ts, add import:
import { updateProfileStats } from '@/lib/stats';

// Modify endSession callback:
const endSession = useCallback(async () => {
  setForceComplete(true);
  setStats((prev) => ({
    ...prev,
    endTime: new Date(),
  }));

  // Update profile stats if any cards were completed
  if (stats.completed > 0 && user) {
    try {
      // Get last practiced date from user progress (approximate)
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('last_reviewed')
        .eq('user_id', user.id)
        .order('last_reviewed', { ascending: false })
        .limit(1);

      const lastPracticed = progressData?.[0]?.last_reviewed
        ? new Date(progressData[0].last_reviewed)
        : null;

      await updateProfileStats({
        userId: user.id,
        exercisesCompleted: stats.completed,
        lastPracticed,
      });
    } catch {
      showToast({ type: 'error', message: 'Failed to update stats' });
    }
  }
}, [stats.completed, user, showToast]);
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/hooks/useSession.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/hooks/useSession.ts tests/unit/hooks/useSession.test.tsx
git commit -m "feat(stats): update profile stats when session ends"
```

---

## Phase 6: Integration Tests

### Task 14: Create stats integration test

**Files:**
- Create: `tests/integration/stats/stats-flow.test.ts`

**Step 1: Write the test**

```typescript
// tests/integration/stats/stats-flow.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database.generated';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

describe('Stats Integration', () => {
  const testUserId = 'stats-test-user-' + Date.now();
  const testExerciseId = 'stats-test-exercise-' + Date.now();

  beforeEach(async () => {
    // Create test user profile
    await adminClient.from('profiles').insert({
      id: testUserId,
      current_streak: 0,
      longest_streak: 0,
      total_exercises_completed: 0,
    });

    // Create test exercise
    await adminClient.from('exercises').insert({
      id: testExerciseId,
      language: 'python',
      category: 'basics',
      difficulty: 1,
      title: 'Test Exercise',
      prompt: 'Test prompt',
      expected_answer: 'test',
    });
  });

  afterEach(async () => {
    // Clean up
    await adminClient.from('user_progress').delete().eq('user_id', testUserId);
    await adminClient.from('exercises').delete().eq('id', testExerciseId);
    await adminClient.from('profiles').delete().eq('id', testUserId);
  });

  it('getCardsReviewedToday counts correctly after practice', async () => {
    // Create user_progress with today's last_reviewed
    const now = new Date();
    await adminClient.from('user_progress').insert({
      user_id: testUserId,
      exercise_id: testExerciseId,
      last_reviewed: now.toISOString(),
      times_seen: 1,
      times_correct: 1,
    });

    // Fetch and count
    const { data } = await adminClient
      .from('user_progress')
      .select('*')
      .eq('user_id', testUserId);

    expect(data).toHaveLength(1);
    expect(data![0].last_reviewed).toBeDefined();
  });

  it('profile stats can be updated', async () => {
    // Update profile stats
    const { error } = await adminClient
      .from('profiles')
      .update({
        current_streak: 1,
        longest_streak: 1,
        total_exercises_completed: 5,
      })
      .eq('id', testUserId);

    expect(error).toBeNull();

    // Verify update
    const { data } = await adminClient
      .from('profiles')
      .select('current_streak, longest_streak, total_exercises_completed')
      .eq('id', testUserId)
      .single();

    expect(data?.current_streak).toBe(1);
    expect(data?.longest_streak).toBe(1);
    expect(data?.total_exercises_completed).toBe(5);
  });
});
```

**Step 2: Run test**

Run: `pnpm vitest run tests/integration/stats/stats-flow.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/integration/stats/stats-flow.test.ts
git commit -m "test(stats): add stats integration tests"
```

---

### Task 15: Final verification

**Step 1: Run all tests**

```bash
pnpm vitest run
```

Expected: All tests pass (including ~15 new stats tests)

**Step 2: Run TypeScript check**

```bash
pnpm tsc --noEmit
```

Expected: No errors

**Step 3: Run ESLint**

```bash
pnpm lint
```

Expected: No errors

**Step 4: Run production build**

```bash
pnpm build
```

Expected: Build succeeds

**Step 5: Manual verification**

1. Start dev server: `pnpm dev`
2. Sign in and navigate to dashboard
3. Verify stats grid shows:
   - Today: (number of cards reviewed today)
   - Accuracy: (percentage)
   - Streak: (current streak days)
   - Total: (total exercises completed)
4. Complete a practice session
5. Return to dashboard and verify:
   - "Today" count increased
   - "Total" count increased
   - Streak updated if appropriate

**Step 6: Commit final verification**

```bash
git add -A
git commit -m "feat(stats): complete Basic Stats implementation - 15 tasks done"
```

---

## Summary

| Phase | Tasks | New Tests |
|-------|-------|-----------|
| 1. Stats Library | 4 | ~12 |
| 2. useStats Hook | 2 | ~5 |
| 3. Dashboard Components | 3 | ~8 |
| 4. Dashboard Integration | 1 | ~3 |
| 5. Profile Updates | 3 | ~4 |
| 6. Integration Tests | 2 | ~3 |
| **Total** | **15** | **~35** |

**Commits:** ~15 (one per task)

**Files Created:**
- `src/lib/stats/types.ts`
- `src/lib/stats/queries.ts`
- `src/lib/stats/streak.ts`
- `src/lib/stats/updateProfile.ts`
- `src/lib/stats/index.ts`
- `src/lib/hooks/useStats.ts`
- `src/components/dashboard/StatsCard.tsx`
- `src/components/dashboard/StatsGrid.tsx`
- `tests/unit/stats/*.test.ts`
- `tests/unit/hooks/useStats.test.tsx`
- `tests/unit/components/dashboard/StatsCard.test.tsx`
- `tests/unit/components/dashboard/StatsGrid.test.tsx`
- `tests/integration/stats/stats-flow.test.ts`

**Files Modified:**
- `src/lib/hooks/index.ts`
- `src/lib/hooks/useSession.ts`
- `src/components/dashboard/index.ts`
- `src/app/dashboard/page.tsx`
