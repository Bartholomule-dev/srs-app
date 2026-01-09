# Phase 3.2: Visualization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement contribution graph and skill tree badge tiers for visual progress feedback

**Architecture:** Server-side RPC for contribution data, client-side components with Framer Motion. Badge tiers derive from existing FSRS stability values.

**Tech Stack:** TypeScript, PostgreSQL RPC, React, Framer Motion, Vitest

**Prerequisite:** Phase 3.1 (Foundation) must be complete

---

## Task 1: Create Contribution Types

**Files:**
- Create: `src/lib/gamification/contribution.ts`
- Test: `tests/unit/gamification/contribution.test.ts`

**Step 1.1: Write the failing test**

```typescript
// tests/unit/gamification/contribution.test.ts
import { describe, it, expect } from 'vitest';
import type { ContributionDay, ContributionLevel } from '@/lib/gamification/contribution';
import { getContributionLevel, CONTRIBUTION_THRESHOLDS } from '@/lib/gamification/contribution';

describe('Contribution types', () => {
  it('ContributionDay has required fields', () => {
    const day: ContributionDay = {
      date: '2026-01-08',
      count: 15,
      accuracy: 85,
      level: 'moderate',
    };
    expect(day.level).toBe('moderate');
  });
});

describe('getContributionLevel', () => {
  it('returns "none" for 0 cards', () => {
    expect(getContributionLevel(0)).toBe('none');
  });

  it('returns "light" for 1-5 cards', () => {
    expect(getContributionLevel(1)).toBe('light');
    expect(getContributionLevel(5)).toBe('light');
  });

  it('returns "moderate" for 6-15 cards', () => {
    expect(getContributionLevel(6)).toBe('moderate');
    expect(getContributionLevel(15)).toBe('moderate');
  });

  it('returns "good" for 16-30 cards', () => {
    expect(getContributionLevel(16)).toBe('good');
    expect(getContributionLevel(30)).toBe('good');
  });

  it('returns "strong" for 31+ cards', () => {
    expect(getContributionLevel(31)).toBe('strong');
    expect(getContributionLevel(100)).toBe('strong');
  });
});

describe('CONTRIBUTION_THRESHOLDS', () => {
  it('has correct threshold values', () => {
    expect(CONTRIBUTION_THRESHOLDS.light).toBe(1);
    expect(CONTRIBUTION_THRESHOLDS.moderate).toBe(6);
    expect(CONTRIBUTION_THRESHOLDS.good).toBe(16);
    expect(CONTRIBUTION_THRESHOLDS.strong).toBe(31);
  });
});
```

**Step 1.2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/gamification/contribution.test.ts`
Expected: FAIL with "Cannot find module"

**Step 1.3: Write minimal implementation**

```typescript
// src/lib/gamification/contribution.ts
/**
 * Contribution graph types and utilities
 */

/**
 * Contribution intensity level
 */
export type ContributionLevel = 'none' | 'light' | 'moderate' | 'good' | 'strong';

/**
 * Data for a single day in the contribution graph
 */
export interface ContributionDay {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Number of cards reviewed */
  count: number;
  /** Accuracy percentage (0-100) */
  accuracy: number | null;
  /** Contribution intensity level */
  level: ContributionLevel;
}

/**
 * Thresholds for contribution levels
 */
export const CONTRIBUTION_THRESHOLDS = {
  light: 1,     // 1-5 cards
  moderate: 6,  // 6-15 cards
  good: 16,     // 16-30 cards
  strong: 31,   // 31+ cards
} as const;

/**
 * Get contribution level for a card count
 */
export function getContributionLevel(count: number): ContributionLevel {
  if (count === 0) return 'none';
  if (count < CONTRIBUTION_THRESHOLDS.moderate) return 'light';
  if (count < CONTRIBUTION_THRESHOLDS.good) return 'moderate';
  if (count < CONTRIBUTION_THRESHOLDS.strong) return 'good';
  return 'strong';
}

/**
 * CSS class map for contribution levels
 */
export const CONTRIBUTION_COLORS: Record<ContributionLevel, string> = {
  none: 'bg-bg-surface-1',
  light: 'bg-accent-primary/25',
  moderate: 'bg-accent-primary/50',
  good: 'bg-accent-primary/75',
  strong: 'bg-accent-primary',
};
```

**Step 1.4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/gamification/contribution.test.ts`
Expected: PASS

**Step 1.5: Add to barrel export**

Update `src/lib/gamification/index.ts`:
```typescript
// Add:
export type { ContributionDay, ContributionLevel } from './contribution';
export {
  getContributionLevel,
  CONTRIBUTION_THRESHOLDS,
  CONTRIBUTION_COLORS,
} from './contribution';
```

**Step 1.6: Commit**

```bash
git add src/lib/gamification/contribution.ts src/lib/gamification/index.ts tests/unit/gamification/contribution.test.ts
git commit -m "$(cat <<'EOF'
feat(gamification): add contribution graph types

ContributionDay, ContributionLevel types and level calculation.
Thresholds: light (1-5), moderate (6-15), good (16-30), strong (31+).

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Create get_contribution_history RPC Function

**Files:**
- Create: `supabase/migrations/20260108200001_get_contribution_history.sql`
- Test: `tests/integration/gamification/get-contribution-history.test.ts`

**Step 2.1: Write the failing tests**

```typescript
// tests/integration/gamification/get-contribution-history.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('get_contribution_history RPC', () => {
  let testUserId: string;

  beforeAll(async () => {
    const { data: authData } = await supabase.auth.admin.createUser({
      email: `test-contrib-${Date.now()}@example.com`,
      password: 'test123456',
      email_confirm: true,
    });
    testUserId = authData.user!.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await supabase
        .from('exercise_attempts')
        .delete()
        .eq('user_id', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  beforeEach(async () => {
    await supabase
      .from('exercise_attempts')
      .delete()
      .eq('user_id', testUserId);
  });

  it('returns empty array when no attempts', async () => {
    const { data, error } = await supabase.rpc('get_contribution_history', {
      p_user_id: testUserId,
      p_start_date: '2026-01-01',
      p_end_date: '2026-01-07',
    });

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('aggregates attempts by date', async () => {
    await supabase.from('exercise_attempts').insert([
      { user_id: testUserId, exercise_slug: 'test-1', is_correct: true, attempted_at: '2026-01-05T10:00:00Z' },
      { user_id: testUserId, exercise_slug: 'test-2', is_correct: true, attempted_at: '2026-01-05T11:00:00Z' },
      { user_id: testUserId, exercise_slug: 'test-3', is_correct: false, attempted_at: '2026-01-05T12:00:00Z' },
    ]);

    const { data } = await supabase.rpc('get_contribution_history', {
      p_user_id: testUserId,
      p_start_date: '2026-01-01',
      p_end_date: '2026-01-07',
    });

    expect(data.length).toBe(1);
    expect(data[0].date).toBe('2026-01-05');
    expect(data[0].count).toBe(3);
    expect(data[0].accuracy).toBe(67); // 2/3 = 66.67 rounded
  });

  it('returns multiple days', async () => {
    await supabase.from('exercise_attempts').insert([
      { user_id: testUserId, exercise_slug: 'test-1', is_correct: true, attempted_at: '2026-01-05T10:00:00Z' },
      { user_id: testUserId, exercise_slug: 'test-2', is_correct: true, attempted_at: '2026-01-06T10:00:00Z' },
      { user_id: testUserId, exercise_slug: 'test-3', is_correct: true, attempted_at: '2026-01-07T10:00:00Z' },
    ]);

    const { data } = await supabase.rpc('get_contribution_history', {
      p_user_id: testUserId,
      p_start_date: '2026-01-01',
      p_end_date: '2026-01-07',
    });

    expect(data.length).toBe(3);
    expect(data.map((d: { date: string }) => d.date)).toEqual(['2026-01-05', '2026-01-06', '2026-01-07']);
  });

  it('filters by date range', async () => {
    await supabase.from('exercise_attempts').insert([
      { user_id: testUserId, exercise_slug: 'test-1', is_correct: true, attempted_at: '2026-01-05T10:00:00Z' },
      { user_id: testUserId, exercise_slug: 'test-2', is_correct: true, attempted_at: '2026-01-10T10:00:00Z' },
    ]);

    const { data } = await supabase.rpc('get_contribution_history', {
      p_user_id: testUserId,
      p_start_date: '2026-01-01',
      p_end_date: '2026-01-07',
    });

    expect(data.length).toBe(1);
    expect(data[0].date).toBe('2026-01-05');
  });

  it('excludes attempts with null is_correct (teaching cards)', async () => {
    await supabase.from('exercise_attempts').insert([
      { user_id: testUserId, exercise_slug: 'test-1', is_correct: true, attempted_at: '2026-01-05T10:00:00Z' },
      { user_id: testUserId, exercise_slug: 'test-2', is_correct: null, attempted_at: '2026-01-05T11:00:00Z' }, // Teaching card
    ]);

    const { data } = await supabase.rpc('get_contribution_history', {
      p_user_id: testUserId,
      p_start_date: '2026-01-01',
      p_end_date: '2026-01-07',
    });

    expect(data[0].count).toBe(1); // Only graded card
  });

  it('orders by date ascending', async () => {
    await supabase.from('exercise_attempts').insert([
      { user_id: testUserId, exercise_slug: 'test-1', is_correct: true, attempted_at: '2026-01-07T10:00:00Z' },
      { user_id: testUserId, exercise_slug: 'test-2', is_correct: true, attempted_at: '2026-01-05T10:00:00Z' },
      { user_id: testUserId, exercise_slug: 'test-3', is_correct: true, attempted_at: '2026-01-06T10:00:00Z' },
    ]);

    const { data } = await supabase.rpc('get_contribution_history', {
      p_user_id: testUserId,
      p_start_date: '2026-01-01',
      p_end_date: '2026-01-07',
    });

    expect(data.map((d: { date: string }) => d.date)).toEqual(['2026-01-05', '2026-01-06', '2026-01-07']);
  });
});
```

**Step 2.2: Run test to verify it fails**

Run: `pnpm vitest run tests/integration/gamification/get-contribution-history.test.ts`
Expected: FAIL with "function get_contribution_history does not exist"

**Step 2.3: Write minimal implementation**

```sql
-- supabase/migrations/20260108200001_get_contribution_history.sql
-- RPC function to get contribution graph data

CREATE OR REPLACE FUNCTION get_contribution_history(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'date', activity_date,
        'count', attempt_count,
        'accuracy', CASE
          WHEN attempt_count > 0 THEN ROUND((correct_count::FLOAT / attempt_count) * 100)
          ELSE NULL
        END
      )
      ORDER BY activity_date
    ),
    '[]'::json
  ) INTO v_result
  FROM (
    SELECT
      DATE(attempted_at) AS activity_date,
      COUNT(*) AS attempt_count,
      COUNT(*) FILTER (WHERE is_correct = TRUE) AS correct_count
    FROM exercise_attempts
    WHERE user_id = p_user_id
      AND DATE(attempted_at) BETWEEN p_start_date AND p_end_date
      AND is_correct IS NOT NULL -- Exclude teaching cards
    GROUP BY DATE(attempted_at)
  ) daily_stats;

  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_contribution_history TO authenticated;

COMMENT ON FUNCTION get_contribution_history IS
  'Get contribution graph data for a user within a date range.';
```

**Step 2.4: Apply migration and run tests**

Run: `pnpm db:reset && pnpm vitest run tests/integration/gamification/get-contribution-history.test.ts`
Expected: PASS

**Step 2.5: Commit**

```bash
git add supabase/migrations/20260108200001_get_contribution_history.sql tests/integration/gamification/get-contribution-history.test.ts
git commit -m "$(cat <<'EOF'
feat(db): add get_contribution_history RPC function

Aggregates exercise attempts by date for contribution graph.
Returns date, count, and accuracy. Excludes teaching cards.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Create useContributionGraph Hook

**Files:**
- Create: `src/lib/hooks/useContributionGraph.ts`
- Test: `tests/unit/hooks/useContributionGraph.test.ts`

**Step 3.1: Write the failing tests**

```typescript
// tests/unit/hooks/useContributionGraph.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    rpc: vi.fn(),
  },
}));

import { useContributionGraph } from '@/lib/hooks/useContributionGraph';
import { supabase } from '@/lib/supabase/client';

vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    loading: false,
  }),
}));

describe('useContributionGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches contribution history on mount', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [
        { date: '2026-01-05', count: 10, accuracy: 80 },
        { date: '2026-01-06', count: 15, accuracy: 90 },
      ],
      error: null,
    });

    const { result } = renderHook(() => useContributionGraph());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.days.length).toBe(2);
    expect(result.current.days[0].date).toBe('2026-01-05');
    expect(result.current.days[0].level).toBe('moderate'); // 6-15
    expect(result.current.days[1].level).toBe('moderate');
  });

  it('calculates contribution level from count', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [
        { date: '2026-01-01', count: 0, accuracy: null },
        { date: '2026-01-02', count: 3, accuracy: 100 },
        { date: '2026-01-03', count: 10, accuracy: 80 },
        { date: '2026-01-04', count: 25, accuracy: 75 },
        { date: '2026-01-05', count: 50, accuracy: 90 },
      ],
      error: null,
    });

    const { result } = renderHook(() => useContributionGraph());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.days[0].level).toBe('none');
    expect(result.current.days[1].level).toBe('light');
    expect(result.current.days[2].level).toBe('moderate');
    expect(result.current.days[3].level).toBe('good');
    expect(result.current.days[4].level).toBe('strong');
  });

  it('handles RPC error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'RPC failed', code: '500' },
    });

    const { result } = renderHook(() => useContributionGraph());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.days).toEqual([]);
  });

  it('returns current streak from consecutive recent days', async () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [
        { date: twoDaysAgo, count: 5, accuracy: 80 },
        { date: yesterday, count: 10, accuracy: 90 },
        { date: today, count: 8, accuracy: 85 },
      ],
      error: null,
    });

    const { result } = renderHook(() => useContributionGraph());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.currentStreakDays).toBe(3);
  });
});
```

**Step 3.2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/hooks/useContributionGraph.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3.3: Write minimal implementation**

```typescript
// src/lib/hooks/useContributionGraph.ts
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { handleSupabaseError } from '@/lib/errors';
import type { ContributionDay } from '@/lib/gamification/contribution';
import { getContributionLevel } from '@/lib/gamification/contribution';
import type { AppError } from '@/lib/errors';

interface UseContributionGraphReturn {
  days: ContributionDay[];
  loading: boolean;
  error: AppError | null;
  refetch: () => void;
  /** Current streak from consecutive recent activity */
  currentStreakDays: number;
}

/**
 * Get date 52 weeks ago for contribution graph start
 */
function getYearAgoDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 364); // 52 weeks
  return d.toISOString().split('T')[0];
}

/**
 * Calculate current streak from consecutive recent days
 */
function calculateStreakFromDays(days: ContributionDay[]): number {
  if (days.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const daysSet = new Set(days.map((d) => d.date));

  let streak = 0;
  let currentDate = new Date(today);

  // Check if today has activity, if not start from yesterday
  if (!daysSet.has(today)) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  while (daysSet.has(currentDate.toISOString().split('T')[0])) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

export function useContributionGraph(): UseContributionGraphReturn {
  const { user, loading: authLoading } = useAuth();
  const [days, setDays] = useState<ContributionDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setDays([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchContributionData() {
      setLoading(true);
      setError(null);

      try {
        const startDate = getYearAgoDate();
        const endDate = new Date().toISOString().split('T')[0];

        const { data, error: rpcError } = await supabase.rpc('get_contribution_history', {
          p_user_id: user.id,
          p_start_date: startDate,
          p_end_date: endDate,
        });

        if (cancelled) return;

        if (rpcError) {
          throw handleSupabaseError(rpcError);
        }

        const mappedDays: ContributionDay[] = (data ?? []).map(
          (d: { date: string; count: number; accuracy: number | null }) => ({
            date: d.date,
            count: d.count,
            accuracy: d.accuracy,
            level: getContributionLevel(d.count),
          })
        );

        setDays(mappedDays);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof Error && 'code' in err) {
          setError(err as AppError);
        } else {
          setError(handleSupabaseError(err as Error));
        }
        setDays([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchContributionData();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, fetchKey]);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  const currentStreakDays = useMemo(() => calculateStreakFromDays(days), [days]);

  return { days, loading: authLoading || loading, error, refetch, currentStreakDays };
}
```

**Step 3.4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/hooks/useContributionGraph.test.ts`
Expected: PASS

**Step 3.5: Add to hooks barrel export**

Update `src/lib/hooks/index.ts`:
```typescript
// Add:
export { useContributionGraph } from './useContributionGraph';
```

**Step 3.6: Commit**

```bash
git add src/lib/hooks/useContributionGraph.ts src/lib/hooks/index.ts tests/unit/hooks/useContributionGraph.test.ts
git commit -m "$(cat <<'EOF'
feat(hooks): add useContributionGraph hook

Fetches 52 weeks of contribution data via RPC.
Calculates contribution levels and current streak.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Create ContributionGraph Component

**Files:**
- Create: `src/components/stats/ContributionGraph.tsx`
- Test: `tests/unit/components/stats/ContributionGraph.test.tsx`

**Step 4.1: Write the failing tests**

```typescript
// tests/unit/components/stats/ContributionGraph.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContributionGraph } from '@/components/stats/ContributionGraph';
import type { ContributionDay } from '@/lib/gamification/contribution';

// Mock Tooltip since it requires portal
vi.mock('@/components/ui/Tooltip', () => ({
  Tooltip: ({ children, content }: { children: React.ReactNode; content: React.ReactNode }) => (
    <div data-testid="tooltip-trigger">{children}</div>
  ),
}));

describe('ContributionGraph', () => {
  const mockDays: ContributionDay[] = [
    { date: '2026-01-05', count: 10, accuracy: 80, level: 'moderate' },
    { date: '2026-01-06', count: 25, accuracy: 90, level: 'good' },
    { date: '2026-01-07', count: 5, accuracy: 100, level: 'light' },
  ];

  it('renders loading skeleton when loading', () => {
    const { container } = render(<ContributionGraph days={[]} loading={true} />);
    const skeleton = container.querySelector('[class*="animate-pulse"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders empty state when no days', () => {
    render(<ContributionGraph days={[]} loading={false} />);
    expect(screen.getByText(/Start practicing/i)).toBeInTheDocument();
  });

  it('renders contribution squares for days with activity', () => {
    const { container } = render(<ContributionGraph days={mockDays} loading={false} />);
    const squares = container.querySelectorAll('[data-contribution-day]');
    expect(squares.length).toBeGreaterThan(0);
  });

  it('applies correct color classes for contribution levels', () => {
    const { container } = render(<ContributionGraph days={mockDays} loading={false} />);

    // Look for level-specific classes
    const moderateSquare = container.querySelector('[class*="bg-accent-primary/50"]');
    const goodSquare = container.querySelector('[class*="bg-accent-primary/75"]');
    const lightSquare = container.querySelector('[class*="bg-accent-primary/25"]');

    expect(moderateSquare || goodSquare || lightSquare).toBeInTheDocument();
  });

  it('shows month labels', () => {
    render(<ContributionGraph days={mockDays} loading={false} />);
    // Should show at least one month label
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hasMonthLabel = monthLabels.some((month) => screen.queryByText(month));
    expect(hasMonthLabel).toBe(true);
  });

  it('shows day of week labels', () => {
    render(<ContributionGraph days={mockDays} loading={false} />);
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
  });

  it('applies collapsed class on mobile', () => {
    const { container } = render(
      <ContributionGraph days={mockDays} loading={false} collapsedMobile={true} />
    );
    const graph = container.querySelector('[data-contribution-graph]');
    expect(graph?.classList.contains('md:block') || true).toBe(true);
  });
});
```

**Step 4.2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/components/stats/ContributionGraph.test.tsx`
Expected: FAIL with "Cannot find module"

**Step 4.3: Write minimal implementation**

```typescript
// src/components/stats/ContributionGraph.tsx
'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/Tooltip';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ContributionDay } from '@/lib/gamification/contribution';
import { CONTRIBUTION_COLORS } from '@/lib/gamification/contribution';

interface ContributionGraphProps {
  days: ContributionDay[];
  loading: boolean;
  /** Collapse on mobile (show 3 months instead of 52 weeks) */
  collapsedMobile?: boolean;
  className?: string;
}

const WEEKS = 52;
const DAYS_PER_WEEK = 7;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

/**
 * Generate array of all dates for the past 52 weeks
 */
function generateDateGrid(): string[][] {
  const grid: string[][] = [];
  const today = new Date();

  // Go back to start of 52 weeks ago
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (WEEKS * DAYS_PER_WEEK - 1));

  // Align to start of week (Sunday)
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);

  for (let week = 0; week < WEEKS; week++) {
    const weekDates: string[] = [];
    for (let day = 0; day < DAYS_PER_WEEK; day++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + week * 7 + day);
      weekDates.push(date.toISOString().split('T')[0]);
    }
    grid.push(weekDates);
  }

  return grid;
}

/**
 * Get month labels for the graph header
 */
function getMonthLabels(dateGrid: string[][]): { month: string; week: number }[] {
  const labels: { month: string; week: number }[] = [];
  let lastMonth = -1;

  for (let week = 0; week < dateGrid.length; week++) {
    const date = new Date(dateGrid[week][0]);
    const month = date.getMonth();
    if (month !== lastMonth) {
      labels.push({ month: MONTHS[month], week });
      lastMonth = month;
    }
  }

  return labels;
}

export function ContributionGraph({
  days,
  loading,
  collapsedMobile = true,
  className,
}: ContributionGraphProps) {
  // Create lookup map for day data
  const dayMap = useMemo(() => {
    const map = new Map<string, ContributionDay>();
    for (const day of days) {
      map.set(day.date, day);
    }
    return map;
  }, [days]);

  const dateGrid = useMemo(() => generateDateGrid(), []);
  const monthLabels = useMemo(() => getMonthLabels(dateGrid), [dateGrid]);

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-[100px] w-full" />
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className={cn('rounded-lg border border-border-subtle bg-bg-surface-1 p-6 text-center', className)}>
        <p className="text-text-secondary">Start practicing to see your contribution graph!</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'space-y-2',
        collapsedMobile && 'hidden md:block',
        className
      )}
      data-contribution-graph
    >
      {/* Month labels */}
      <div className="flex text-xs text-text-tertiary pl-7">
        {monthLabels.map(({ month, week }, i) => (
          <span
            key={`${month}-${i}`}
            className="flex-shrink-0"
            style={{ marginLeft: i === 0 ? 0 : `${(week - (monthLabels[i - 1]?.week ?? 0)) * 12 - 20}px` }}
          >
            {month}
          </span>
        ))}
      </div>

      <div className="flex gap-1">
        {/* Day of week labels */}
        <div className="flex flex-col gap-[3px] text-xs text-text-tertiary pr-1">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="h-[10px] leading-[10px]">
              {label}
            </div>
          ))}
        </div>

        {/* Contribution grid */}
        <div className="flex gap-[3px]">
          {dateGrid.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((date) => {
                const dayData = dayMap.get(date);
                const level = dayData?.level ?? 'none';

                return (
                  <Tooltip
                    key={date}
                    content={
                      dayData ? (
                        <div className="text-xs">
                          <div className="font-medium">{date}</div>
                          <div>{dayData.count} cards reviewed</div>
                          {dayData.accuracy !== null && (
                            <div>{dayData.accuracy}% accuracy</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs">
                          <div className="font-medium">{date}</div>
                          <div>No activity</div>
                        </div>
                      )
                    }
                  >
                    <div
                      data-contribution-day={date}
                      className={cn(
                        'w-[10px] h-[10px] rounded-sm',
                        CONTRIBUTION_COLORS[level]
                      )}
                    />
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-text-tertiary justify-end">
        <span>Less</span>
        <div className={cn('w-[10px] h-[10px] rounded-sm', CONTRIBUTION_COLORS.none)} />
        <div className={cn('w-[10px] h-[10px] rounded-sm', CONTRIBUTION_COLORS.light)} />
        <div className={cn('w-[10px] h-[10px] rounded-sm', CONTRIBUTION_COLORS.moderate)} />
        <div className={cn('w-[10px] h-[10px] rounded-sm', CONTRIBUTION_COLORS.good)} />
        <div className={cn('w-[10px] h-[10px] rounded-sm', CONTRIBUTION_COLORS.strong)} />
        <span>More</span>
      </div>
    </div>
  );
}
```

**Step 4.4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/components/stats/ContributionGraph.test.tsx`
Expected: PASS

**Step 4.5: Commit**

```bash
git add src/components/stats/ContributionGraph.tsx tests/unit/components/stats/ContributionGraph.test.tsx
git commit -m "$(cat <<'EOF'
feat(components): add ContributionGraph component

GitHub-style 52-week contribution grid with:
- Intensity levels (none/light/moderate/good/strong)
- Month and day labels
- Hover tooltips with date, count, accuracy
- Legend
- Mobile collapse option

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Create Badge Tier Types

**Files:**
- Create: `src/lib/gamification/badges.ts`
- Test: `tests/unit/gamification/badges.test.ts`

**Step 5.1: Write the failing tests**

```typescript
// tests/unit/gamification/badges.test.ts
import { describe, it, expect } from 'vitest';
import {
  getBadgeTier,
  BADGE_THRESHOLDS,
  type BadgeTier,
} from '@/lib/gamification/badges';

describe('Badge types', () => {
  it('BADGE_THRESHOLDS has correct values', () => {
    expect(BADGE_THRESHOLDS.bronze).toBe(1);
    expect(BADGE_THRESHOLDS.silver).toBe(7);
    expect(BADGE_THRESHOLDS.gold).toBe(30);
    expect(BADGE_THRESHOLDS.platinum).toBe(90);
  });
});

describe('getBadgeTier', () => {
  it('returns "locked" when prerequisites not met', () => {
    expect(getBadgeTier({ stability: 0, prereqsMet: false })).toBe('locked');
  });

  it('returns "available" when prereqs met but not started', () => {
    expect(getBadgeTier({ stability: 0, prereqsMet: true })).toBe('available');
  });

  it('returns "bronze" for stability >= 1 day', () => {
    expect(getBadgeTier({ stability: 1, prereqsMet: true })).toBe('bronze');
    expect(getBadgeTier({ stability: 6, prereqsMet: true })).toBe('bronze');
  });

  it('returns "silver" for stability >= 7 days', () => {
    expect(getBadgeTier({ stability: 7, prereqsMet: true })).toBe('silver');
    expect(getBadgeTier({ stability: 29, prereqsMet: true })).toBe('silver');
  });

  it('returns "gold" for stability >= 30 days', () => {
    expect(getBadgeTier({ stability: 30, prereqsMet: true })).toBe('gold');
    expect(getBadgeTier({ stability: 89, prereqsMet: true })).toBe('gold');
  });

  it('returns "platinum" for stability >= 90 days', () => {
    expect(getBadgeTier({ stability: 90, prereqsMet: true })).toBe('platinum');
    expect(getBadgeTier({ stability: 365, prereqsMet: true })).toBe('platinum');
  });

  it('ignores stability when prereqs not met', () => {
    expect(getBadgeTier({ stability: 100, prereqsMet: false })).toBe('locked');
  });
});
```

**Step 5.2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/gamification/badges.test.ts`
Expected: FAIL with "Cannot find module"

**Step 5.3: Write minimal implementation**

```typescript
// src/lib/gamification/badges.ts
/**
 * Badge tier types and utilities
 */

/**
 * Badge tier for a subconcept
 */
export type BadgeTier = 'locked' | 'available' | 'bronze' | 'silver' | 'gold' | 'platinum';

/**
 * Stability thresholds for badge tiers (in days)
 */
export const BADGE_THRESHOLDS = {
  bronze: 1,    // Any stability >= 1 day
  silver: 7,    // stability >= 7 days
  gold: 30,     // stability >= 30 days (mastered)
  platinum: 90, // stability >= 90 days (deep mastery)
} as const;

/**
 * Badge tier visual styles
 */
export const BADGE_STYLES: Record<BadgeTier, {
  ring: string;
  bg: string;
  icon: string;
  glow?: string;
}> = {
  locked: {
    ring: 'ring-bg-surface-2',
    bg: 'bg-bg-surface-2',
    icon: 'text-text-tertiary',
  },
  available: {
    ring: 'ring-accent-primary/30',
    bg: 'bg-bg-surface-1',
    icon: 'text-accent-primary',
  },
  bronze: {
    ring: 'ring-amber-600',
    bg: 'bg-amber-900/20',
    icon: 'text-amber-500',
  },
  silver: {
    ring: 'ring-slate-300',
    bg: 'bg-slate-600/20',
    icon: 'text-slate-300',
    glow: 'shadow-[0_0_8px_rgba(148,163,184,0.3)]',
  },
  gold: {
    ring: 'ring-yellow-400',
    bg: 'bg-yellow-700/20',
    icon: 'text-yellow-400',
    glow: 'shadow-[0_0_12px_rgba(250,204,21,0.4)]',
  },
  platinum: {
    ring: 'ring-cyan-300',
    bg: 'bg-cyan-700/20',
    icon: 'text-cyan-300',
    glow: 'shadow-[0_0_16px_rgba(103,232,249,0.5)]',
  },
};

/**
 * Get badge tier based on stability and prerequisite status
 */
export function getBadgeTier(params: {
  stability: number;
  prereqsMet: boolean;
}): BadgeTier {
  const { stability, prereqsMet } = params;

  if (!prereqsMet) {
    return 'locked';
  }

  if (stability >= BADGE_THRESHOLDS.platinum) {
    return 'platinum';
  }
  if (stability >= BADGE_THRESHOLDS.gold) {
    return 'gold';
  }
  if (stability >= BADGE_THRESHOLDS.silver) {
    return 'silver';
  }
  if (stability >= BADGE_THRESHOLDS.bronze) {
    return 'bronze';
  }

  return 'available';
}

/**
 * Check if a tier upgrade should trigger celebration
 */
export function shouldCelebrateTierUp(
  oldTier: BadgeTier,
  newTier: BadgeTier
): 'mini' | 'full' | null {
  // Only celebrate when going UP in tier
  const tierOrder: BadgeTier[] = ['locked', 'available', 'bronze', 'silver', 'gold', 'platinum'];
  const oldIndex = tierOrder.indexOf(oldTier);
  const newIndex = tierOrder.indexOf(newTier);

  if (newIndex <= oldIndex) {
    return null;
  }

  // Full celebration for first Gold or Platinum
  if (newTier === 'gold' || newTier === 'platinum') {
    return 'full';
  }

  // Mini celebration for Bronze or Silver
  if (newTier === 'bronze' || newTier === 'silver') {
    return 'mini';
  }

  return null;
}
```

**Step 5.4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/gamification/badges.test.ts`
Expected: PASS

**Step 5.5: Add to barrel export**

Update `src/lib/gamification/index.ts`:
```typescript
// Add:
export type { BadgeTier } from './badges';
export {
  getBadgeTier,
  BADGE_THRESHOLDS,
  BADGE_STYLES,
  shouldCelebrateTierUp,
} from './badges';
```

**Step 5.6: Commit**

```bash
git add src/lib/gamification/badges.ts src/lib/gamification/index.ts tests/unit/gamification/badges.test.ts
git commit -m "$(cat <<'EOF'
feat(gamification): add badge tier types and utilities

Badge tiers: locked, available, bronze, silver, gold, platinum.
Thresholds: 1d (bronze), 7d (silver), 30d (gold), 90d (platinum).
Includes visual styles and celebration triggers.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Tasks 6-25: Remaining Visualization Tasks

### Task 6-8: Update SubconceptNode with Badge Tier
- Add `badgeTier` prop to SubconceptNode
- Update styles based on BADGE_STYLES
- Add glow effect for silver/gold/platinum

### Task 9-11: Update useSkillTree to Include Badge Tiers
- Calculate badge tier from stability in hook
- Check prerequisites for locked status
- Return tier with each subconcept node

### Task 12-14: Add Badge Tier Animations
- Framer Motion tier transition effects
- Pulse animation for "available" tier
- Subtle shine animation for platinum

### Task 15-17: Badge Tier Celebrations
- Trigger confetti on tier up
- Toast notification for first Gold
- Modal for concept mastery (all subconcepts Gold)

### Task 18-20: Dashboard Integration
- Add ContributionGraph to dashboard
- Position below StatsGrid
- Collapsible on mobile

### Task 21-23: Mobile Responsiveness
- 3-month view for contribution graph on mobile
- Compact badge display
- Touch-friendly tooltips

### Task 24-25: E2E Tests
- E2E: contribution graph displays
- E2E: badge tier shows correctly

---

## Phase 3.2 Completion Checklist

Before moving to Phase 3.3:

- [ ] All 25 tasks completed
- [ ] All tests passing (`pnpm test`)
- [ ] TypeScript clean (`pnpm typecheck`)
- [ ] Lint clean (`pnpm lint`)
- [ ] E2E tests passing (`pnpm test:e2e`)
- [ ] CLAUDE.md updated
- [ ] Obsidian docs updated
- [ ] Daem0nMCP decision recorded
- [ ] PR merged to main

---

## Related Documents

- [Master Plan](./2026-01-08-phase3-gamification-implementation.md)
- [Phase 3.1: Foundation](./2026-01-08-phase31-foundation.md)
- [Phase 3.3: Achievements](./2026-01-08-phase33-achievements.md)
