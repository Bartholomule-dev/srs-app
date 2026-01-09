# Phase 3.1: Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement points calculation, streak freezes, and core gamification infrastructure

**Architecture:** Server-side RPC functions for points/streaks. New columns on `profiles` and `exercise_attempts`. Hooks for client-side fetching.

**Tech Stack:** TypeScript, PostgreSQL (Supabase RPC), Vitest, React Testing Library

---

## Task 1: Create Gamification Types

**Files:**
- Create: `src/lib/gamification/types.ts`
- Test: `tests/unit/gamification/types.test.ts`

**Step 1.1: Write the failing test**

```typescript
// tests/unit/gamification/types.test.ts
import { describe, it, expect } from 'vitest';
import type {
  PointsBreakdown,
  StreakInfo,
  PointsSummary,
} from '@/lib/gamification/types';

describe('Gamification types', () => {
  it('PointsBreakdown has required fields', () => {
    const breakdown: PointsBreakdown = {
      base: 10,
      qualityBonus: 3,
      noHintBonus: 3,
      firstAttemptBonus: 2,
      speedBonus: 0,
      subtotal: 18,
      streakMultiplier: 1.1,
      total: 20,
    };
    expect(breakdown.total).toBe(20);
  });

  it('StreakInfo has required fields', () => {
    const streak: StreakInfo = {
      currentStreak: 7,
      longestStreak: 14,
      freezesAvailable: 2,
      lastActivityDate: '2026-01-08',
      lastFreezeEarnedAt: null,
    };
    expect(streak.freezesAvailable).toBeLessThanOrEqual(2);
  });

  it('PointsSummary has required fields', () => {
    const summary: PointsSummary = {
      today: 150,
      thisWeek: 850,
      dailyCap: 500,
      dailyCapReached: false,
    };
    expect(summary.dailyCap).toBe(500);
  });
});
```

**Step 1.2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/gamification/types.test.ts`
Expected: FAIL with "Cannot find module '@/lib/gamification/types'"

**Step 1.3: Write minimal implementation**

```typescript
// src/lib/gamification/types.ts
/**
 * Gamification type definitions
 */

/**
 * Breakdown of points earned for a single answer
 */
export interface PointsBreakdown {
  /** Base points for correct answer (10) */
  base: number;
  /** Bonus based on FSRS rating (0-5) */
  qualityBonus: number;
  /** Bonus for not using hints (+3) */
  noHintBonus: number;
  /** Bonus for first attempt (+2) */
  firstAttemptBonus: number;
  /** Speed bonus for mastered subconcepts (0-5) */
  speedBonus: number;
  /** Sum before multiplier */
  subtotal: number;
  /** Streak multiplier (1.0, 1.1, 1.15, or 1.2) */
  streakMultiplier: number;
  /** Final points after multiplier */
  total: number;
}

/**
 * Current streak information for a user
 */
export interface StreakInfo {
  /** Current consecutive days practiced */
  currentStreak: number;
  /** Longest streak ever achieved */
  longestStreak: number;
  /** Streak freezes available (0-2) */
  freezesAvailable: number;
  /** Last activity date (YYYY-MM-DD in user's timezone) */
  lastActivityDate: string | null;
  /** When last freeze was earned */
  lastFreezeEarnedAt: string | null;
}

/**
 * Points summary for display
 */
export interface PointsSummary {
  /** Points earned today */
  today: number;
  /** Points earned this week (Mon-Sun) */
  thisWeek: number;
  /** Daily cap (500) */
  dailyCap: number;
  /** Whether daily cap has been reached */
  dailyCapReached: boolean;
}

/**
 * Quality bonus mapping (FSRS Rating → bonus points)
 * Rating 4 (Easy) = +5, Rating 3 (Good) = +3, Rating 2 (Hard) = +1, Rating 1 (Again) = 0
 */
export const QUALITY_BONUS: Record<1 | 2 | 3 | 4, number> = {
  4: 5, // Easy
  3: 3, // Good
  2: 1, // Hard
  1: 0, // Again
};

/**
 * Streak multiplier thresholds
 */
export const STREAK_MULTIPLIERS: { minDays: number; multiplier: number }[] = [
  { minDays: 30, multiplier: 1.2 },
  { minDays: 14, multiplier: 1.15 },
  { minDays: 7, multiplier: 1.1 },
];

/**
 * Points constants
 */
export const POINTS = {
  BASE: 10,
  NO_HINT_BONUS: 3,
  FIRST_ATTEMPT_BONUS: 2,
  SPEED_BONUS_MAX: 5,
  DAILY_CAP: 500,
  /** Stability threshold for speed bonus (30 days) */
  SPEED_BONUS_STABILITY_THRESHOLD: 30,
  /** Response time thresholds for speed bonus (ms) */
  SPEED_BONUS_THRESHOLDS: [3000, 5000, 8000, 12000, 20000] as const,
} as const;

/**
 * Streak freeze constants
 */
export const STREAK_FREEZE = {
  /** Days between freeze earning milestones */
  EARN_INTERVAL: 7,
  /** Maximum freezes a user can hold */
  MAX_FREEZES: 2,
} as const;
```

**Step 1.4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/gamification/types.test.ts`
Expected: PASS (3 tests)

**Step 1.5: Commit**

```bash
git add src/lib/gamification/types.ts tests/unit/gamification/types.test.ts
git commit -m "$(cat <<'EOF'
feat(gamification): add core type definitions

Add PointsBreakdown, StreakInfo, PointsSummary types and constants
for the gamification system. All values match the approved design doc.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Create Gamification Barrel Export

**Files:**
- Create: `src/lib/gamification/index.ts`

**Step 2.1: Write the failing test**

```typescript
// tests/unit/gamification/index.test.ts
import { describe, it, expect } from 'vitest';
import * as gamification from '@/lib/gamification';

describe('Gamification barrel export', () => {
  it('exports type-related constants', () => {
    expect(gamification.QUALITY_BONUS).toBeDefined();
    expect(gamification.STREAK_MULTIPLIERS).toBeDefined();
    expect(gamification.POINTS).toBeDefined();
    expect(gamification.STREAK_FREEZE).toBeDefined();
  });
});
```

**Step 2.2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/gamification/index.test.ts`
Expected: FAIL with "Cannot find module '@/lib/gamification'"

**Step 2.3: Write minimal implementation**

```typescript
// src/lib/gamification/index.ts
/**
 * Gamification module barrel export
 */

// Types
export type {
  PointsBreakdown,
  StreakInfo,
  PointsSummary,
} from './types';

// Constants
export {
  QUALITY_BONUS,
  STREAK_MULTIPLIERS,
  POINTS,
  STREAK_FREEZE,
} from './types';
```

**Step 2.4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/gamification/index.test.ts`
Expected: PASS

**Step 2.5: Commit**

```bash
git add src/lib/gamification/index.ts tests/unit/gamification/index.test.ts
git commit -m "$(cat <<'EOF'
feat(gamification): add barrel export

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Create Database Migration - New Columns

**Files:**
- Create: `supabase/migrations/20260108100001_gamification_columns.sql`
- Test: `tests/integration/migrations/gamification-columns.test.ts`

**Step 3.1: Write the failing test**

```typescript
// tests/integration/migrations/gamification-columns.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Gamification columns migration', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
    const { data: authData } = await supabase.auth.admin.createUser({
      email: `test-gamification-${Date.now()}@example.com`,
      password: 'test123456',
      email_confirm: true,
    });
    testUserId = authData.user!.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  describe('profiles table', () => {
    it('has streak_freezes column with default 0', async () => {
      const { data } = await supabase
        .from('profiles')
        .select('streak_freezes')
        .eq('id', testUserId)
        .single();

      expect(data?.streak_freezes).toBe(0);
    });

    it('has last_freeze_earned_at column (nullable)', async () => {
      const { data } = await supabase
        .from('profiles')
        .select('last_freeze_earned_at')
        .eq('id', testUserId)
        .single();

      expect(data?.last_freeze_earned_at).toBeNull();
    });

    it('has last_activity_date column (nullable)', async () => {
      const { data } = await supabase
        .from('profiles')
        .select('last_activity_date')
        .eq('id', testUserId)
        .single();

      expect(data?.last_activity_date).toBeNull();
    });

    it('enforces streak_freezes CHECK constraint (0-2)', async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ streak_freezes: 3 })
        .eq('id', testUserId);

      expect(error).not.toBeNull();
      expect(error?.message).toContain('violates check constraint');
    });
  });

  describe('exercise_attempts table', () => {
    it('has points_earned column with default 0', async () => {
      // Insert a test attempt
      const { data, error } = await supabase
        .from('exercise_attempts')
        .insert({
          user_id: testUserId,
          exercise_slug: 'test-exercise',
        })
        .select('points_earned')
        .single();

      expect(error).toBeNull();
      expect(data?.points_earned).toBe(0);

      // Cleanup
      await supabase
        .from('exercise_attempts')
        .delete()
        .eq('user_id', testUserId);
    });

    it('has timezone_offset_minutes column (nullable)', async () => {
      const { data } = await supabase
        .from('exercise_attempts')
        .insert({
          user_id: testUserId,
          exercise_slug: 'test-exercise',
          timezone_offset_minutes: -300, // EST
        })
        .select('timezone_offset_minutes')
        .single();

      expect(data?.timezone_offset_minutes).toBe(-300);

      // Cleanup
      await supabase
        .from('exercise_attempts')
        .delete()
        .eq('user_id', testUserId);
    });

    it('has is_correct column (nullable)', async () => {
      const { data } = await supabase
        .from('exercise_attempts')
        .insert({
          user_id: testUserId,
          exercise_slug: 'test-exercise',
          is_correct: true,
        })
        .select('is_correct')
        .single();

      expect(data?.is_correct).toBe(true);

      // Cleanup
      await supabase
        .from('exercise_attempts')
        .delete()
        .eq('user_id', testUserId);
    });

    it('has rating column (nullable, 1-4)', async () => {
      const { data } = await supabase
        .from('exercise_attempts')
        .insert({
          user_id: testUserId,
          exercise_slug: 'test-exercise',
          rating: 3,
        })
        .select('rating')
        .single();

      expect(data?.rating).toBe(3);

      // Cleanup
      await supabase
        .from('exercise_attempts')
        .delete()
        .eq('user_id', testUserId);
    });

    it('has is_first_attempt column (default true)', async () => {
      const { data } = await supabase
        .from('exercise_attempts')
        .insert({
          user_id: testUserId,
          exercise_slug: 'test-exercise',
        })
        .select('is_first_attempt')
        .single();

      expect(data?.is_first_attempt).toBe(true);

      // Cleanup
      await supabase
        .from('exercise_attempts')
        .delete()
        .eq('user_id', testUserId);
    });
  });
});
```

**Step 3.2: Run test to verify it fails**

Run: `pnpm vitest run tests/integration/migrations/gamification-columns.test.ts`
Expected: FAIL with column not found errors

**Step 3.3: Write minimal implementation**

```sql
-- supabase/migrations/20260108100001_gamification_columns.sql
-- Add gamification columns to profiles and exercise_attempts

-- === PROFILES TABLE ===

-- Streak freezes (earned protection tokens)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_freezes INTEGER DEFAULT 0
  CHECK (streak_freezes >= 0 AND streak_freezes <= 2);

-- When the last freeze was earned (prevents farming)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_freeze_earned_at TIMESTAMPTZ;

-- Last activity date in user's timezone (for streak calculation)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- Comments for documentation
COMMENT ON COLUMN profiles.streak_freezes IS
  'Number of streak freeze tokens available (0-2)';
COMMENT ON COLUMN profiles.last_freeze_earned_at IS
  'Timestamp when last streak freeze was earned';
COMMENT ON COLUMN profiles.last_activity_date IS
  'Last practice date in user timezone (for streak tracking)';

-- === EXERCISE_ATTEMPTS TABLE ===

-- Points earned for this attempt (computed server-side)
ALTER TABLE exercise_attempts ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0
  CHECK (points_earned >= 0);

-- Timezone offset for date calculations
ALTER TABLE exercise_attempts ADD COLUMN IF NOT EXISTS timezone_offset_minutes INTEGER;

-- Whether the answer was correct
ALTER TABLE exercise_attempts ADD COLUMN IF NOT EXISTS is_correct BOOLEAN;

-- FSRS rating (1-4)
ALTER TABLE exercise_attempts ADD COLUMN IF NOT EXISTS rating SMALLINT
  CHECK (rating >= 1 AND rating <= 4);

-- Whether this was a first attempt (not a retry)
ALTER TABLE exercise_attempts ADD COLUMN IF NOT EXISTS is_first_attempt BOOLEAN DEFAULT TRUE;

-- Comments for documentation
COMMENT ON COLUMN exercise_attempts.points_earned IS
  'Points earned for this attempt (computed by RPC)';
COMMENT ON COLUMN exercise_attempts.timezone_offset_minutes IS
  'User timezone offset in minutes from UTC (e.g., -300 for EST)';
COMMENT ON COLUMN exercise_attempts.is_correct IS
  'Whether the answer was correct';
COMMENT ON COLUMN exercise_attempts.rating IS
  'FSRS rating (1=Again, 2=Hard, 3=Good, 4=Easy)';
COMMENT ON COLUMN exercise_attempts.is_first_attempt IS
  'TRUE if this was the first attempt at this exercise in the session';

-- Index for points queries
CREATE INDEX IF NOT EXISTS idx_attempts_points ON exercise_attempts(user_id, points_earned);
CREATE INDEX IF NOT EXISTS idx_attempts_is_correct ON exercise_attempts(user_id, is_correct);
```

**Step 3.4: Apply migration and run tests**

Run: `pnpm db:reset && pnpm vitest run tests/integration/migrations/gamification-columns.test.ts`
Expected: PASS

**Step 3.5: Commit**

```bash
git add supabase/migrations/20260108100001_gamification_columns.sql tests/integration/migrations/gamification-columns.test.ts
git commit -m "$(cat <<'EOF'
feat(db): add gamification columns to profiles and exercise_attempts

- profiles: streak_freezes, last_freeze_earned_at, last_activity_date
- exercise_attempts: points_earned, timezone_offset_minutes, is_correct, rating, is_first_attempt
- CHECK constraints enforce streak_freezes 0-2 and points_earned >= 0

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Create Points Calculation Utility (Client-Side Display Helper)

**Files:**
- Create: `src/lib/gamification/points.ts`
- Test: `tests/unit/gamification/points.test.ts`

**Step 4.1: Write the failing tests**

```typescript
// tests/unit/gamification/points.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateQualityBonus,
  calculateSpeedBonus,
  calculateStreakMultiplier,
  calculatePointsBreakdown,
  formatPoints,
} from '@/lib/gamification/points';

describe('calculateQualityBonus', () => {
  it('returns 5 for Easy (rating 4)', () => {
    expect(calculateQualityBonus(4)).toBe(5);
  });

  it('returns 3 for Good (rating 3)', () => {
    expect(calculateQualityBonus(3)).toBe(3);
  });

  it('returns 1 for Hard (rating 2)', () => {
    expect(calculateQualityBonus(2)).toBe(1);
  });

  it('returns 0 for Again (rating 1)', () => {
    expect(calculateQualityBonus(1)).toBe(0);
  });
});

describe('calculateSpeedBonus', () => {
  it('returns 0 if stability below threshold', () => {
    expect(calculateSpeedBonus(3000, 29)).toBe(0); // 29 days, not mastered
  });

  it('returns 5 for fast response on mastered subconcept', () => {
    expect(calculateSpeedBonus(2000, 30)).toBe(5); // < 3000ms
  });

  it('returns 4 for 3-5 seconds', () => {
    expect(calculateSpeedBonus(4000, 30)).toBe(4);
  });

  it('returns 3 for 5-8 seconds', () => {
    expect(calculateSpeedBonus(7000, 30)).toBe(3);
  });

  it('returns 2 for 8-12 seconds', () => {
    expect(calculateSpeedBonus(10000, 30)).toBe(2);
  });

  it('returns 1 for 12-20 seconds', () => {
    expect(calculateSpeedBonus(15000, 30)).toBe(1);
  });

  it('returns 0 for > 20 seconds', () => {
    expect(calculateSpeedBonus(25000, 30)).toBe(0);
  });
});

describe('calculateStreakMultiplier', () => {
  it('returns 1.0 for streak < 7', () => {
    expect(calculateStreakMultiplier(6)).toBe(1.0);
  });

  it('returns 1.1 for streak 7-13', () => {
    expect(calculateStreakMultiplier(7)).toBe(1.1);
    expect(calculateStreakMultiplier(13)).toBe(1.1);
  });

  it('returns 1.15 for streak 14-29', () => {
    expect(calculateStreakMultiplier(14)).toBe(1.15);
    expect(calculateStreakMultiplier(29)).toBe(1.15);
  });

  it('returns 1.2 for streak >= 30', () => {
    expect(calculateStreakMultiplier(30)).toBe(1.2);
    expect(calculateStreakMultiplier(100)).toBe(1.2);
  });
});

describe('calculatePointsBreakdown', () => {
  it('calculates full breakdown for correct answer with bonuses', () => {
    const result = calculatePointsBreakdown({
      isCorrect: true,
      rating: 3, // Good
      hintUsed: false,
      isFirstAttempt: true,
      responseTimeMs: 4000, // 4 seconds
      subconceptStability: 30, // Mastered
      currentStreak: 7,
    });

    expect(result.base).toBe(10);
    expect(result.qualityBonus).toBe(3); // Good
    expect(result.noHintBonus).toBe(3);
    expect(result.firstAttemptBonus).toBe(2);
    expect(result.speedBonus).toBe(4); // 3-5 seconds
    expect(result.subtotal).toBe(22);
    expect(result.streakMultiplier).toBe(1.1);
    expect(result.total).toBe(24); // floor(22 * 1.1)
  });

  it('returns 0 for incorrect answer', () => {
    const result = calculatePointsBreakdown({
      isCorrect: false,
      rating: 1,
      hintUsed: false,
      isFirstAttempt: true,
      responseTimeMs: 5000,
      subconceptStability: 30,
      currentStreak: 7,
    });

    expect(result.total).toBe(0);
  });

  it('omits no-hint bonus when hint used', () => {
    const result = calculatePointsBreakdown({
      isCorrect: true,
      rating: 3,
      hintUsed: true,
      isFirstAttempt: true,
      responseTimeMs: 5000,
      subconceptStability: 0,
      currentStreak: 0,
    });

    expect(result.noHintBonus).toBe(0);
  });

  it('omits first-attempt bonus on retry', () => {
    const result = calculatePointsBreakdown({
      isCorrect: true,
      rating: 3,
      hintUsed: false,
      isFirstAttempt: false,
      responseTimeMs: 5000,
      subconceptStability: 0,
      currentStreak: 0,
    });

    expect(result.firstAttemptBonus).toBe(0);
  });
});

describe('formatPoints', () => {
  it('formats positive points with +', () => {
    expect(formatPoints(15)).toBe('+15');
  });

  it('formats 0 without sign', () => {
    expect(formatPoints(0)).toBe('0');
  });

  it('formats large numbers with commas', () => {
    expect(formatPoints(1500)).toBe('+1,500');
  });
});
```

**Step 4.2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/gamification/points.test.ts`
Expected: FAIL with "Cannot find module"

**Step 4.3: Write minimal implementation**

```typescript
// src/lib/gamification/points.ts
/**
 * Points calculation utilities
 * Note: Actual points are computed server-side via RPC.
 * These client-side functions are for display and preview only.
 */

import {
  QUALITY_BONUS,
  STREAK_MULTIPLIERS,
  POINTS,
  type PointsBreakdown,
} from './types';

/**
 * Calculate quality bonus based on FSRS rating
 */
export function calculateQualityBonus(rating: 1 | 2 | 3 | 4): number {
  return QUALITY_BONUS[rating];
}

/**
 * Calculate speed bonus for mastered subconcepts
 * Only awards bonus if stability >= 30 days (truly mastered)
 */
export function calculateSpeedBonus(
  responseTimeMs: number,
  subconceptStability: number
): number {
  if (subconceptStability < POINTS.SPEED_BONUS_STABILITY_THRESHOLD) {
    return 0;
  }

  const thresholds = POINTS.SPEED_BONUS_THRESHOLDS;
  if (responseTimeMs < thresholds[0]) return 5;
  if (responseTimeMs < thresholds[1]) return 4;
  if (responseTimeMs < thresholds[2]) return 3;
  if (responseTimeMs < thresholds[3]) return 2;
  if (responseTimeMs < thresholds[4]) return 1;
  return 0;
}

/**
 * Calculate streak multiplier based on current streak
 */
export function calculateStreakMultiplier(currentStreak: number): number {
  for (const { minDays, multiplier } of STREAK_MULTIPLIERS) {
    if (currentStreak >= minDays) {
      return multiplier;
    }
  }
  return 1.0;
}

/**
 * Calculate full points breakdown for an answer
 */
export interface PointsCalculationInput {
  isCorrect: boolean;
  rating: 1 | 2 | 3 | 4;
  hintUsed: boolean;
  isFirstAttempt: boolean;
  responseTimeMs: number;
  subconceptStability: number;
  currentStreak: number;
}

export function calculatePointsBreakdown(
  input: PointsCalculationInput
): PointsBreakdown {
  // Incorrect answers earn 0 points
  if (!input.isCorrect) {
    return {
      base: 0,
      qualityBonus: 0,
      noHintBonus: 0,
      firstAttemptBonus: 0,
      speedBonus: 0,
      subtotal: 0,
      streakMultiplier: 1.0,
      total: 0,
    };
  }

  const base = POINTS.BASE;
  const qualityBonus = calculateQualityBonus(input.rating);
  const noHintBonus = input.hintUsed ? 0 : POINTS.NO_HINT_BONUS;
  const firstAttemptBonus = input.isFirstAttempt ? POINTS.FIRST_ATTEMPT_BONUS : 0;
  const speedBonus = calculateSpeedBonus(
    input.responseTimeMs,
    input.subconceptStability
  );

  const subtotal = base + qualityBonus + noHintBonus + firstAttemptBonus + speedBonus;
  const streakMultiplier = calculateStreakMultiplier(input.currentStreak);
  const total = Math.floor(subtotal * streakMultiplier);

  return {
    base,
    qualityBonus,
    noHintBonus,
    firstAttemptBonus,
    speedBonus,
    subtotal,
    streakMultiplier,
    total,
  };
}

/**
 * Format points for display (e.g., "+15", "+1,500")
 */
export function formatPoints(points: number): string {
  if (points === 0) return '0';
  const formatted = points.toLocaleString('en-US');
  return `+${formatted}`;
}
```

**Step 4.4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/gamification/points.test.ts`
Expected: PASS (all tests)

**Step 4.5: Add to barrel export**

Update `src/lib/gamification/index.ts`:
```typescript
// Add at the end:
export {
  calculateQualityBonus,
  calculateSpeedBonus,
  calculateStreakMultiplier,
  calculatePointsBreakdown,
  formatPoints,
  type PointsCalculationInput,
} from './points';
```

**Step 4.6: Commit**

```bash
git add src/lib/gamification/points.ts src/lib/gamification/index.ts tests/unit/gamification/points.test.ts
git commit -m "$(cat <<'EOF'
feat(gamification): add points calculation utilities

Client-side helpers for points display. Actual calculation happens
server-side via RPC to prevent gaming.

- calculateQualityBonus: rating -> bonus points
- calculateSpeedBonus: response time -> speed bonus (mastered only)
- calculateStreakMultiplier: streak days -> multiplier
- calculatePointsBreakdown: full breakdown for display
- formatPoints: "+15" style formatting

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Create calculate_attempt_points RPC Function

**Files:**
- Create: `supabase/migrations/20260108100002_calculate_attempt_points.sql`
- Test: `tests/integration/gamification/calculate-points.test.ts`

**Step 5.1: Write the failing tests**

```typescript
// tests/integration/gamification/calculate-points.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('calculate_attempt_points RPC', () => {
  let testUserId: string;

  beforeAll(async () => {
    const { data: authData } = await supabase.auth.admin.createUser({
      email: `test-points-${Date.now()}@example.com`,
      password: 'test123456',
      email_confirm: true,
    });
    testUserId = authData.user!.id;

    // Set up initial streak for testing multiplier
    await supabase
      .from('profiles')
      .update({ current_streak: 7 })
      .eq('id', testUserId);
  });

  afterAll(async () => {
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  it('returns 0 for incorrect answer', async () => {
    const { data, error } = await supabase.rpc('calculate_attempt_points', {
      p_user_id: testUserId,
      p_is_correct: false,
      p_rating: 1,
      p_used_hint: false,
      p_is_first_attempt: true,
      p_response_time_ms: 5000,
      p_subconcept_stability: 30,
    });

    expect(error).toBeNull();
    expect(data).toBe(0);
  });

  it('calculates base points for correct answer', async () => {
    const { data, error } = await supabase.rpc('calculate_attempt_points', {
      p_user_id: testUserId,
      p_is_correct: true,
      p_rating: 3, // Good
      p_used_hint: true, // No hint bonus
      p_is_first_attempt: false, // No first attempt bonus
      p_response_time_ms: 25000, // No speed bonus
      p_subconcept_stability: 0, // Not mastered
    });

    expect(error).toBeNull();
    // Base(10) + Quality(3) = 13, multiplied by 1.1 (7-day streak) = 14
    expect(data).toBe(14);
  });

  it('adds no-hint bonus when hint not used', async () => {
    const { data } = await supabase.rpc('calculate_attempt_points', {
      p_user_id: testUserId,
      p_is_correct: true,
      p_rating: 3,
      p_used_hint: false,
      p_is_first_attempt: false,
      p_response_time_ms: 25000,
      p_subconcept_stability: 0,
    });

    // Base(10) + Quality(3) + NoHint(3) = 16, * 1.1 = 17
    expect(data).toBe(17);
  });

  it('adds first-attempt bonus', async () => {
    const { data } = await supabase.rpc('calculate_attempt_points', {
      p_user_id: testUserId,
      p_is_correct: true,
      p_rating: 3,
      p_used_hint: false,
      p_is_first_attempt: true,
      p_response_time_ms: 25000,
      p_subconcept_stability: 0,
    });

    // Base(10) + Quality(3) + NoHint(3) + FirstAttempt(2) = 18, * 1.1 = 19
    expect(data).toBe(19);
  });

  it('adds speed bonus for mastered subconcept', async () => {
    const { data } = await supabase.rpc('calculate_attempt_points', {
      p_user_id: testUserId,
      p_is_correct: true,
      p_rating: 3,
      p_used_hint: false,
      p_is_first_attempt: true,
      p_response_time_ms: 4000, // 4 seconds = +4 speed bonus
      p_subconcept_stability: 30, // Mastered
    });

    // Base(10) + Quality(3) + NoHint(3) + FirstAttempt(2) + Speed(4) = 22, * 1.1 = 24
    expect(data).toBe(24);
  });

  it('does not add speed bonus below stability threshold', async () => {
    const { data } = await supabase.rpc('calculate_attempt_points', {
      p_user_id: testUserId,
      p_is_correct: true,
      p_rating: 3,
      p_used_hint: false,
      p_is_first_attempt: true,
      p_response_time_ms: 2000, // Fast but not mastered
      p_subconcept_stability: 29, // Just under threshold
    });

    // Base(10) + Quality(3) + NoHint(3) + FirstAttempt(2) = 18, * 1.1 = 19
    expect(data).toBe(19);
  });

  it('applies 1.2x multiplier for 30+ day streak', async () => {
    // Update streak to 30
    await supabase
      .from('profiles')
      .update({ current_streak: 30 })
      .eq('id', testUserId);

    const { data } = await supabase.rpc('calculate_attempt_points', {
      p_user_id: testUserId,
      p_is_correct: true,
      p_rating: 3,
      p_used_hint: true,
      p_is_first_attempt: false,
      p_response_time_ms: 25000,
      p_subconcept_stability: 0,
    });

    // Base(10) + Quality(3) = 13, * 1.2 = 15
    expect(data).toBe(15);

    // Reset streak
    await supabase
      .from('profiles')
      .update({ current_streak: 7 })
      .eq('id', testUserId);
  });

  it('uses Easy rating bonus', async () => {
    const { data } = await supabase.rpc('calculate_attempt_points', {
      p_user_id: testUserId,
      p_is_correct: true,
      p_rating: 4, // Easy = +5
      p_used_hint: true,
      p_is_first_attempt: false,
      p_response_time_ms: 25000,
      p_subconcept_stability: 0,
    });

    // Base(10) + Quality(5) = 15, * 1.1 = 16
    expect(data).toBe(16);
  });
});
```

**Step 5.2: Run test to verify it fails**

Run: `pnpm vitest run tests/integration/gamification/calculate-points.test.ts`
Expected: FAIL with "function calculate_attempt_points does not exist"

**Step 5.3: Write minimal implementation**

```sql
-- supabase/migrations/20260108100002_calculate_attempt_points.sql
-- RPC function to calculate points for an exercise attempt
-- Points are computed server-side to prevent gaming

CREATE OR REPLACE FUNCTION calculate_attempt_points(
  p_user_id UUID,
  p_is_correct BOOLEAN,
  p_rating INTEGER,
  p_used_hint BOOLEAN,
  p_is_first_attempt BOOLEAN,
  p_response_time_ms INTEGER,
  p_subconcept_stability FLOAT
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base INTEGER := 10;
  v_quality_bonus INTEGER := 0;
  v_no_hint_bonus INTEGER := 0;
  v_first_attempt_bonus INTEGER := 0;
  v_speed_bonus INTEGER := 0;
  v_subtotal INTEGER := 0;
  v_streak_multiplier NUMERIC := 1.0;
  v_current_streak INTEGER := 0;
  v_total INTEGER := 0;
BEGIN
  -- Incorrect answers earn 0 points
  IF NOT p_is_correct THEN
    RETURN 0;
  END IF;

  -- Quality bonus based on rating
  v_quality_bonus := CASE p_rating
    WHEN 4 THEN 5  -- Easy
    WHEN 3 THEN 3  -- Good
    WHEN 2 THEN 1  -- Hard
    ELSE 0         -- Again
  END;

  -- No-hint bonus
  IF NOT p_used_hint THEN
    v_no_hint_bonus := 3;
  END IF;

  -- First attempt bonus
  IF p_is_first_attempt THEN
    v_first_attempt_bonus := 2;
  END IF;

  -- Speed bonus (only for mastered subconcepts, stability >= 30 days)
  IF p_subconcept_stability >= 30 THEN
    v_speed_bonus := CASE
      WHEN p_response_time_ms < 3000 THEN 5
      WHEN p_response_time_ms < 5000 THEN 4
      WHEN p_response_time_ms < 8000 THEN 3
      WHEN p_response_time_ms < 12000 THEN 2
      WHEN p_response_time_ms < 20000 THEN 1
      ELSE 0
    END;
  END IF;

  -- Calculate subtotal
  v_subtotal := v_base + v_quality_bonus + v_no_hint_bonus + v_first_attempt_bonus + v_speed_bonus;

  -- Get current streak for multiplier
  SELECT COALESCE(current_streak, 0) INTO v_current_streak
  FROM profiles
  WHERE id = p_user_id;

  -- Streak multiplier
  v_streak_multiplier := CASE
    WHEN v_current_streak >= 30 THEN 1.2
    WHEN v_current_streak >= 14 THEN 1.15
    WHEN v_current_streak >= 7 THEN 1.1
    ELSE 1.0
  END;

  -- Calculate total (floor)
  v_total := FLOOR(v_subtotal * v_streak_multiplier);

  RETURN v_total;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION calculate_attempt_points TO authenticated;

COMMENT ON FUNCTION calculate_attempt_points IS
  'Calculate points earned for an exercise attempt. Returns integer points.';
```

**Step 5.4: Apply migration and run tests**

Run: `pnpm db:reset && pnpm vitest run tests/integration/gamification/calculate-points.test.ts`
Expected: PASS

**Step 5.5: Commit**

```bash
git add supabase/migrations/20260108100002_calculate_attempt_points.sql tests/integration/gamification/calculate-points.test.ts
git commit -m "$(cat <<'EOF'
feat(db): add calculate_attempt_points RPC function

Server-side points calculation:
- Base points (10) + quality bonus (0-5) + no-hint bonus (3)
- First attempt bonus (2) + speed bonus (0-5 for mastered)
- Streak multiplier (1.0-1.2) applied to subtotal
- Returns 0 for incorrect answers

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Create update_streak RPC Function

**Files:**
- Create: `supabase/migrations/20260108100003_update_streak.sql`
- Test: `tests/integration/gamification/update-streak.test.ts`

**Step 6.1: Write the failing tests**

```typescript
// tests/integration/gamification/update-streak.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('update_streak RPC', () => {
  let testUserId: string;

  beforeAll(async () => {
    const { data: authData } = await supabase.auth.admin.createUser({
      email: `test-streak-${Date.now()}@example.com`,
      password: 'test123456',
      email_confirm: true,
    });
    testUserId = authData.user!.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  beforeEach(async () => {
    // Reset profile to clean state
    await supabase
      .from('profiles')
      .update({
        current_streak: 0,
        longest_streak: 0,
        streak_freezes: 0,
        last_activity_date: null,
        last_freeze_earned_at: null,
      })
      .eq('id', testUserId);
  });

  it('starts streak at 1 for first activity', async () => {
    const { data, error } = await supabase.rpc('update_streak', {
      p_user_id: testUserId,
      p_activity_date: '2026-01-08',
    });

    expect(error).toBeNull();
    expect(data.current_streak).toBe(1);
    expect(data.freezes_used).toBe(0);
    expect(data.freeze_earned).toBe(false);

    // Verify in database
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, last_activity_date')
      .eq('id', testUserId)
      .single();

    expect(profile?.current_streak).toBe(1);
    expect(profile?.last_activity_date).toBe('2026-01-08');
  });

  it('increments streak for consecutive day', async () => {
    // Day 1
    await supabase.rpc('update_streak', {
      p_user_id: testUserId,
      p_activity_date: '2026-01-07',
    });

    // Day 2 (consecutive)
    const { data } = await supabase.rpc('update_streak', {
      p_user_id: testUserId,
      p_activity_date: '2026-01-08',
    });

    expect(data.current_streak).toBe(2);
  });

  it('does not increment for same-day activity', async () => {
    // First activity
    await supabase.rpc('update_streak', {
      p_user_id: testUserId,
      p_activity_date: '2026-01-08',
    });

    // Second activity same day
    const { data } = await supabase.rpc('update_streak', {
      p_user_id: testUserId,
      p_activity_date: '2026-01-08',
    });

    expect(data.current_streak).toBe(1); // Still 1
  });

  it('resets streak after missing day with no freezes', async () => {
    // Build up streak
    await supabase.rpc('update_streak', {
      p_user_id: testUserId,
      p_activity_date: '2026-01-05',
    });
    await supabase.rpc('update_streak', {
      p_user_id: testUserId,
      p_activity_date: '2026-01-06',
    });

    // Miss day 7, return on day 8
    const { data } = await supabase.rpc('update_streak', {
      p_user_id: testUserId,
      p_activity_date: '2026-01-08',
    });

    expect(data.current_streak).toBe(1); // Reset
    expect(data.freezes_used).toBe(0);
  });

  it('uses freeze to protect streak', async () => {
    // Build 7-day streak and earn freeze
    for (let i = 1; i <= 7; i++) {
      await supabase.rpc('update_streak', {
        p_user_id: testUserId,
        p_activity_date: `2026-01-0${i}`,
      });
    }

    // Verify freeze was earned
    const { data: profileBefore } = await supabase
      .from('profiles')
      .select('streak_freezes, current_streak')
      .eq('id', testUserId)
      .single();

    expect(profileBefore?.streak_freezes).toBe(1);
    expect(profileBefore?.current_streak).toBe(7);

    // Miss day 8, return on day 9
    const { data } = await supabase.rpc('update_streak', {
      p_user_id: testUserId,
      p_activity_date: '2026-01-09',
    });

    expect(data.current_streak).toBe(8); // Protected by freeze
    expect(data.freezes_used).toBe(1);

    // Verify freeze was consumed
    const { data: profileAfter } = await supabase
      .from('profiles')
      .select('streak_freezes')
      .eq('id', testUserId)
      .single();

    expect(profileAfter?.streak_freezes).toBe(0);
  });

  it('earns freeze at 7-day milestone', async () => {
    for (let i = 1; i <= 7; i++) {
      const { data } = await supabase.rpc('update_streak', {
        p_user_id: testUserId,
        p_activity_date: `2026-01-0${i}`,
      });

      if (i === 7) {
        expect(data.freeze_earned).toBe(true);
      } else {
        expect(data.freeze_earned).toBe(false);
      }
    }
  });

  it('caps freezes at 2', async () => {
    // Manually set up a 13-day streak with 1 freeze
    await supabase
      .from('profiles')
      .update({
        current_streak: 13,
        streak_freezes: 1,
        last_activity_date: '2026-01-13',
      })
      .eq('id', testUserId);

    // Day 14 earns second freeze
    const { data: day14 } = await supabase.rpc('update_streak', {
      p_user_id: testUserId,
      p_activity_date: '2026-01-14',
    });

    expect(day14.freeze_earned).toBe(true);

    // Verify at cap
    const { data: profile14 } = await supabase
      .from('profiles')
      .select('streak_freezes')
      .eq('id', testUserId)
      .single();

    expect(profile14?.streak_freezes).toBe(2);

    // Day 21 does NOT earn another freeze (at cap)
    await supabase
      .from('profiles')
      .update({
        current_streak: 20,
        last_activity_date: '2026-01-20',
      })
      .eq('id', testUserId);

    const { data: day21 } = await supabase.rpc('update_streak', {
      p_user_id: testUserId,
      p_activity_date: '2026-01-21',
    });

    expect(day21.freeze_earned).toBe(false);

    const { data: profile21 } = await supabase
      .from('profiles')
      .select('streak_freezes')
      .eq('id', testUserId)
      .single();

    expect(profile21?.streak_freezes).toBe(2); // Still capped at 2
  });

  it('uses multiple freezes for multi-day gap', async () => {
    // Set up 7-day streak with 2 freezes
    await supabase
      .from('profiles')
      .update({
        current_streak: 7,
        streak_freezes: 2,
        last_activity_date: '2026-01-07',
      })
      .eq('id', testUserId);

    // Miss 2 days (8, 9), return on day 10
    const { data } = await supabase.rpc('update_streak', {
      p_user_id: testUserId,
      p_activity_date: '2026-01-10',
    });

    expect(data.current_streak).toBe(8); // Protected by 2 freezes
    expect(data.freezes_used).toBe(2);

    // Verify freezes consumed
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_freezes')
      .eq('id', testUserId)
      .single();

    expect(profile?.streak_freezes).toBe(0);
  });

  it('resets streak but keeps freezes when gap > available freezes', async () => {
    // Set up with 2 freezes
    await supabase
      .from('profiles')
      .update({
        current_streak: 7,
        streak_freezes: 2,
        last_activity_date: '2026-01-07',
      })
      .eq('id', testUserId);

    // Miss 3 days (8, 9, 10), return on day 11 - can't cover with 2 freezes
    const { data } = await supabase.rpc('update_streak', {
      p_user_id: testUserId,
      p_activity_date: '2026-01-11',
    });

    expect(data.current_streak).toBe(1); // Reset
    expect(data.freezes_used).toBe(0); // Freezes preserved

    // Verify freezes preserved
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_freezes')
      .eq('id', testUserId)
      .single();

    expect(profile?.streak_freezes).toBe(2); // Preserved for future
  });

  it('updates longest_streak when current exceeds it', async () => {
    for (let i = 1; i <= 5; i++) {
      await supabase.rpc('update_streak', {
        p_user_id: testUserId,
        p_activity_date: `2026-01-0${i}`,
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('longest_streak')
      .eq('id', testUserId)
      .single();

    expect(profile?.longest_streak).toBe(5);
  });
});
```

**Step 6.2: Run test to verify it fails**

Run: `pnpm vitest run tests/integration/gamification/update-streak.test.ts`
Expected: FAIL with "function update_streak does not exist"

**Step 6.3: Write minimal implementation**

```sql
-- supabase/migrations/20260108100003_update_streak.sql
-- RPC function to update user streak with freeze logic

CREATE OR REPLACE FUNCTION update_streak(
  p_user_id UUID,
  p_activity_date DATE
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_activity_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_streak_freezes INTEGER;
  v_last_freeze_earned_at TIMESTAMPTZ;
  v_days_missed INTEGER;
  v_freezes_used INTEGER := 0;
  v_freeze_earned BOOLEAN := FALSE;
  v_new_streak INTEGER;
BEGIN
  -- Get current profile data
  SELECT
    last_activity_date,
    current_streak,
    longest_streak,
    streak_freezes,
    last_freeze_earned_at
  INTO
    v_last_activity_date,
    v_current_streak,
    v_longest_streak,
    v_streak_freezes,
    v_last_freeze_earned_at
  FROM profiles
  WHERE id = p_user_id;

  -- Default values if null
  v_current_streak := COALESCE(v_current_streak, 0);
  v_longest_streak := COALESCE(v_longest_streak, 0);
  v_streak_freezes := COALESCE(v_streak_freezes, 0);

  -- Calculate days missed
  IF v_last_activity_date IS NULL THEN
    -- First activity ever
    v_days_missed := 0;
    v_new_streak := 1;
  ELSIF p_activity_date = v_last_activity_date THEN
    -- Same day activity - no change
    RETURN json_build_object(
      'current_streak', v_current_streak,
      'longest_streak', v_longest_streak,
      'freezes_used', 0,
      'freeze_earned', false
    );
  ELSIF p_activity_date = v_last_activity_date + 1 THEN
    -- Consecutive day - increment streak
    v_days_missed := 0;
    v_new_streak := v_current_streak + 1;
  ELSE
    -- Gap in days
    v_days_missed := p_activity_date - v_last_activity_date - 1;

    IF v_days_missed <= v_streak_freezes THEN
      -- Can cover gap with freezes
      v_freezes_used := v_days_missed;
      v_streak_freezes := v_streak_freezes - v_days_missed;
      v_new_streak := v_current_streak + 1;
    ELSE
      -- Can't cover gap - reset streak, KEEP freezes for future
      v_new_streak := 1;
      -- Don't consume freezes when resetting
    END IF;
  END IF;

  -- Update longest streak if needed
  IF v_new_streak > v_longest_streak THEN
    v_longest_streak := v_new_streak;
  END IF;

  -- Check if freeze should be earned (every 7 days)
  -- Only earn if not at cap (2) and streak is at a multiple of 7
  IF v_new_streak > 0 AND v_new_streak % 7 = 0 AND v_streak_freezes < 2 THEN
    -- Check if we already earned a freeze at this streak level
    -- (This prevents earning multiple freezes at same level after reset)
    IF v_last_freeze_earned_at IS NULL OR
       v_new_streak > v_current_streak OR
       v_current_streak < 7 THEN
      v_freeze_earned := TRUE;
      v_streak_freezes := v_streak_freezes + 1;
      v_last_freeze_earned_at := NOW();
    END IF;
  END IF;

  -- Update profile
  UPDATE profiles SET
    current_streak = v_new_streak,
    longest_streak = v_longest_streak,
    streak_freezes = v_streak_freezes,
    last_activity_date = p_activity_date,
    last_freeze_earned_at = COALESCE(
      CASE WHEN v_freeze_earned THEN NOW() ELSE NULL END,
      last_freeze_earned_at
    ),
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'current_streak', v_new_streak,
    'longest_streak', v_longest_streak,
    'freezes_used', v_freezes_used,
    'freeze_earned', v_freeze_earned
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION update_streak TO authenticated;

COMMENT ON FUNCTION update_streak IS
  'Update user streak for activity date. Handles freeze logic and milestone earning.';
```

**Step 6.4: Apply migration and run tests**

Run: `pnpm db:reset && pnpm vitest run tests/integration/gamification/update-streak.test.ts`
Expected: PASS

**Step 6.5: Commit**

```bash
git add supabase/migrations/20260108100003_update_streak.sql tests/integration/gamification/update-streak.test.ts
git commit -m "$(cat <<'EOF'
feat(db): add update_streak RPC function

Handles streak updates with freeze logic:
- Consecutive days increment streak
- Same-day activity returns unchanged
- Missed days can be covered by freezes
- Multi-day gaps > available freezes reset streak but preserve freezes
- Freeze earned every 7 days (cap at 2)
- Updates longest_streak when exceeded

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Create get_points_summary RPC Function

**Files:**
- Create: `supabase/migrations/20260108100004_get_points_summary.sql`
- Test: `tests/integration/gamification/get-points-summary.test.ts`

**Step 7.1: Write the failing tests**

```typescript
// tests/integration/gamification/get-points-summary.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('get_points_summary RPC', () => {
  let testUserId: string;

  beforeAll(async () => {
    const { data: authData } = await supabase.auth.admin.createUser({
      email: `test-points-summary-${Date.now()}@example.com`,
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

  it('returns zeros when no attempts', async () => {
    const { data, error } = await supabase.rpc('get_points_summary', {
      p_user_id: testUserId,
      p_start_date: '2026-01-01',
      p_end_date: '2026-01-08',
    });

    expect(error).toBeNull();
    expect(data.today).toBe(0);
    expect(data.this_week).toBe(0);
    expect(data.daily_cap).toBe(500);
    expect(data.daily_cap_reached).toBe(false);
  });

  it('calculates today points', async () => {
    const today = new Date().toISOString().split('T')[0];

    await supabase.from('exercise_attempts').insert([
      { user_id: testUserId, exercise_slug: 'test-1', points_earned: 15, attempted_at: `${today}T10:00:00Z` },
      { user_id: testUserId, exercise_slug: 'test-2', points_earned: 20, attempted_at: `${today}T11:00:00Z` },
    ]);

    const { data } = await supabase.rpc('get_points_summary', {
      p_user_id: testUserId,
      p_start_date: today,
      p_end_date: today,
    });

    expect(data.today).toBe(35);
  });

  it('calculates weekly points across date range', async () => {
    await supabase.from('exercise_attempts').insert([
      { user_id: testUserId, exercise_slug: 'test-1', points_earned: 100, attempted_at: '2026-01-06T10:00:00Z' },
      { user_id: testUserId, exercise_slug: 'test-2', points_earned: 150, attempted_at: '2026-01-07T10:00:00Z' },
      { user_id: testUserId, exercise_slug: 'test-3', points_earned: 200, attempted_at: '2026-01-08T10:00:00Z' },
    ]);

    const { data } = await supabase.rpc('get_points_summary', {
      p_user_id: testUserId,
      p_start_date: '2026-01-06',
      p_end_date: '2026-01-08',
    });

    expect(data.this_week).toBe(450);
  });

  it('detects daily cap reached', async () => {
    const today = new Date().toISOString().split('T')[0];

    await supabase.from('exercise_attempts').insert([
      { user_id: testUserId, exercise_slug: 'test-1', points_earned: 300, attempted_at: `${today}T10:00:00Z` },
      { user_id: testUserId, exercise_slug: 'test-2', points_earned: 250, attempted_at: `${today}T11:00:00Z` },
    ]);

    const { data } = await supabase.rpc('get_points_summary', {
      p_user_id: testUserId,
      p_start_date: today,
      p_end_date: today,
    });

    expect(data.today).toBe(550);
    expect(data.daily_cap_reached).toBe(true);
  });
});
```

**Step 7.2: Run test to verify it fails**

Run: `pnpm vitest run tests/integration/gamification/get-points-summary.test.ts`
Expected: FAIL with "function get_points_summary does not exist"

**Step 7.3: Write minimal implementation**

```sql
-- supabase/migrations/20260108100004_get_points_summary.sql
-- RPC function to get points summary for a date range

CREATE OR REPLACE FUNCTION get_points_summary(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today_points INTEGER := 0;
  v_week_points INTEGER := 0;
  v_daily_cap INTEGER := 500;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get today's points
  SELECT COALESCE(SUM(points_earned), 0) INTO v_today_points
  FROM exercise_attempts
  WHERE user_id = p_user_id
    AND DATE(attempted_at) = v_today;

  -- Get week's points (within date range)
  SELECT COALESCE(SUM(points_earned), 0) INTO v_week_points
  FROM exercise_attempts
  WHERE user_id = p_user_id
    AND DATE(attempted_at) BETWEEN p_start_date AND p_end_date;

  RETURN json_build_object(
    'today', v_today_points,
    'this_week', v_week_points,
    'daily_cap', v_daily_cap,
    'daily_cap_reached', v_today_points >= v_daily_cap
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_points_summary TO authenticated;

COMMENT ON FUNCTION get_points_summary IS
  'Get points summary for a user within a date range.';
```

**Step 7.4: Apply migration and run tests**

Run: `pnpm db:reset && pnpm vitest run tests/integration/gamification/get-points-summary.test.ts`
Expected: PASS

**Step 7.5: Commit**

```bash
git add supabase/migrations/20260108100004_get_points_summary.sql tests/integration/gamification/get-points-summary.test.ts
git commit -m "$(cat <<'EOF'
feat(db): add get_points_summary RPC function

Returns today's points, weekly points, daily cap, and cap status.
Used for dashboard display.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Create usePoints Hook

**Files:**
- Create: `src/lib/hooks/usePoints.ts`
- Test: `tests/unit/hooks/usePoints.test.ts`

**Step 8.1: Write the failing tests**

```typescript
// tests/unit/hooks/usePoints.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock Supabase before importing hook
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

import { usePoints } from '@/lib/hooks/usePoints';
import { supabase } from '@/lib/supabase/client';

// Mock useAuth
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    loading: false,
  }),
}));

describe('usePoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches points summary on mount', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: {
        today: 150,
        this_week: 850,
        daily_cap: 500,
        daily_cap_reached: false,
      },
      error: null,
    });

    const { result } = renderHook(() => usePoints());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.summary?.today).toBe(150);
    expect(result.current.summary?.thisWeek).toBe(850);
    expect(result.current.summary?.dailyCap).toBe(500);
    expect(result.current.summary?.dailyCapReached).toBe(false);
  });

  it('handles RPC error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'RPC failed', code: '500' },
    });

    const { result } = renderHook(() => usePoints());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.summary).toBeNull();
  });

  it('refetches when refetch called', async () => {
    vi.mocked(supabase.rpc)
      .mockResolvedValueOnce({
        data: { today: 100, this_week: 200, daily_cap: 500, daily_cap_reached: false },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { today: 150, this_week: 250, daily_cap: 500, daily_cap_reached: false },
        error: null,
      });

    const { result } = renderHook(() => usePoints());

    await waitFor(() => {
      expect(result.current.summary?.today).toBe(100);
    });

    result.current.refetch();

    await waitFor(() => {
      expect(result.current.summary?.today).toBe(150);
    });
  });
});
```

**Step 8.2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/hooks/usePoints.test.ts`
Expected: FAIL with "Cannot find module '@/lib/hooks/usePoints'"

**Step 8.3: Write minimal implementation**

```typescript
// src/lib/hooks/usePoints.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { handleSupabaseError } from '@/lib/errors';
import type { PointsSummary } from '@/lib/gamification/types';
import type { AppError } from '@/lib/errors';

interface UsePointsReturn {
  summary: PointsSummary | null;
  loading: boolean;
  error: AppError | null;
  refetch: () => void;
}

/**
 * Get current week's Monday (for weekly points calculation)
 */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

/**
 * Get current week's Sunday (for weekly points calculation)
 */
function getWeekEnd(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() + (day === 0 ? 0 : 7 - day); // Sunday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export function usePoints(): UsePointsReturn {
  const { user, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<PointsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setSummary(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchPoints() {
      setLoading(true);
      setError(null);

      try {
        const now = new Date();
        const startDate = getWeekStart(now);
        const endDate = getWeekEnd(now);

        const { data, error: rpcError } = await supabase.rpc('get_points_summary', {
          p_user_id: user.id,
          p_start_date: startDate,
          p_end_date: endDate,
        });

        if (cancelled) return;

        if (rpcError) {
          throw handleSupabaseError(rpcError);
        }

        setSummary({
          today: data.today,
          thisWeek: data.this_week,
          dailyCap: data.daily_cap,
          dailyCapReached: data.daily_cap_reached,
        });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof Error && 'code' in err) {
          setError(err as AppError);
        } else {
          setError(handleSupabaseError(err as Error));
        }
        setSummary(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPoints();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, fetchKey]);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  return { summary, loading: authLoading || loading, error, refetch };
}
```

**Step 8.4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/hooks/usePoints.test.ts`
Expected: PASS

**Step 8.5: Add to hooks barrel export**

Update `src/lib/hooks/index.ts`:
```typescript
// Add:
export { usePoints } from './usePoints';
```

**Step 8.6: Commit**

```bash
git add src/lib/hooks/usePoints.ts src/lib/hooks/index.ts tests/unit/hooks/usePoints.test.ts
git commit -m "$(cat <<'EOF'
feat(hooks): add usePoints hook

Fetches points summary via get_points_summary RPC.
Returns today's points, weekly points, daily cap status.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Create PointsAnimation Component

**Files:**
- Create: `src/components/gamification/PointsAnimation.tsx`
- Test: `tests/unit/components/gamification/PointsAnimation.test.tsx`

**Step 9.1: Write the failing tests**

```typescript
// tests/unit/components/gamification/PointsAnimation.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PointsAnimation } from '@/components/gamification/PointsAnimation';

describe('PointsAnimation', () => {
  it('renders points with + prefix', () => {
    render(<PointsAnimation points={15} />);
    expect(screen.getByText('+15')).toBeInTheDocument();
  });

  it('renders 0 points without +', () => {
    render(<PointsAnimation points={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('applies success variant styling', () => {
    const { container } = render(<PointsAnimation points={15} variant="success" />);
    const el = container.querySelector('[class*="text-accent-success"]');
    expect(el).toBeInTheDocument();
  });

  it('applies neutral variant styling', () => {
    const { container } = render(<PointsAnimation points={0} variant="neutral" />);
    const el = container.querySelector('[class*="text-text-secondary"]');
    expect(el).toBeInTheDocument();
  });

  it('calls onComplete after animation', async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();

    render(<PointsAnimation points={15} onComplete={onComplete} />);

    // Animation duration is 1000ms
    vi.advanceTimersByTime(1100);

    expect(onComplete).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('does not render when show is false', () => {
    render(<PointsAnimation points={15} show={false} />);
    expect(screen.queryByText('+15')).not.toBeInTheDocument();
  });
});
```

**Step 9.2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/components/gamification/PointsAnimation.test.tsx`
Expected: FAIL with "Cannot find module"

**Step 9.3: Write minimal implementation**

```typescript
// src/components/gamification/PointsAnimation.tsx
'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatPoints } from '@/lib/gamification/points';

interface PointsAnimationProps {
  /** Points to display */
  points: number;
  /** Whether to show the animation */
  show?: boolean;
  /** Visual variant */
  variant?: 'success' | 'neutral';
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Additional classes */
  className?: string;
}

export function PointsAnimation({
  points,
  show = true,
  variant = 'success',
  onComplete,
  className,
}: PointsAnimationProps) {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'font-mono font-bold text-lg',
            variant === 'success' && 'text-accent-success',
            variant === 'neutral' && 'text-text-secondary',
            className
          )}
        >
          {formatPoints(points)}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Step 9.4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/components/gamification/PointsAnimation.test.tsx`
Expected: PASS

**Step 9.5: Create barrel export for gamification components**

```typescript
// src/components/gamification/index.ts
export { PointsAnimation } from './PointsAnimation';
```

**Step 9.6: Commit**

```bash
git add src/components/gamification/PointsAnimation.tsx src/components/gamification/index.ts tests/unit/components/gamification/PointsAnimation.test.tsx
git commit -m "$(cat <<'EOF'
feat(components): add PointsAnimation component

Animated "+15" display with Framer Motion for session feedback.
Supports success/neutral variants and onComplete callback.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Update ExerciseCard to Show Points

**Files:**
- Modify: `src/components/exercise/ExerciseCard.tsx`
- Test: `tests/unit/components/exercise/ExerciseCard-points.test.tsx`

**Step 10.1: Write the failing tests**

```typescript
// tests/unit/components/exercise/ExerciseCard-points.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExerciseCard } from '@/components/exercise/ExerciseCard';

// Mock dependencies
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

vi.mock('@/lib/exercise/grading', () => ({
  gradeAnswer: vi.fn(() => ({
    isCorrect: true,
    usedTargetConstruct: null,
    coachingFeedback: null,
    gradingMethod: 'string',
    normalizedUserAnswer: 'print("hello")',
    normalizedExpectedAnswer: 'print("hello")',
    matchedAlternative: null,
  })),
}));

vi.mock('@/lib/gamification/points', () => ({
  calculatePointsBreakdown: vi.fn(() => ({
    base: 10,
    qualityBonus: 3,
    noHintBonus: 3,
    firstAttemptBonus: 2,
    speedBonus: 0,
    subtotal: 18,
    streakMultiplier: 1.0,
    total: 18,
  })),
  formatPoints: vi.fn((pts) => pts > 0 ? `+${pts}` : '0'),
}));

const mockExercise = {
  id: 'test-id',
  slug: 'test-exercise',
  language: 'python',
  category: 'basics',
  difficulty: 1,
  title: 'Test',
  prompt: 'Print hello',
  expectedAnswer: 'print("hello")',
  acceptedSolutions: [],
  hints: [],
  explanation: null,
  tags: [],
  timesPracticed: 0,
  avgSuccessRate: null,
  createdAt: '',
  updatedAt: '',
  concept: 'foundations' as const,
  subconcept: 'variables',
  level: 'intro' as const,
  prereqs: [],
  exerciseType: 'write' as const,
  pattern: 'basic' as const,
  objective: 'Print a greeting',
  targets: null,
  template: null,
  blankPosition: null,
};

describe('ExerciseCard points display', () => {
  it('shows points animation after correct answer', async () => {
    const onResult = vi.fn();
    render(
      <ExerciseCard
        exercise={mockExercise}
        onResult={onResult}
        currentStreak={0}
        subconceptStability={0}
      />
    );

    // Submit correct answer
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'print("hello")' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('+18')).toBeInTheDocument();
    });
  });

  it('does not show points for incorrect answer', async () => {
    vi.mocked(await import('@/lib/exercise/grading')).gradeAnswer.mockReturnValue({
      isCorrect: false,
      usedTargetConstruct: null,
      coachingFeedback: null,
      gradingMethod: 'string',
      normalizedUserAnswer: 'wrong',
      normalizedExpectedAnswer: 'print("hello")',
      matchedAlternative: null,
    });

    const onResult = vi.fn();
    render(
      <ExerciseCard
        exercise={mockExercise}
        onResult={onResult}
        currentStreak={0}
        subconceptStability={0}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'wrong' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.queryByText(/\+\d+/)).not.toBeInTheDocument();
    });
  });
});
```

**Step 10.2-10.6: Implementation steps**

This task requires modifying the existing ExerciseCard component. The implementation involves:

1. Add `currentStreak` and `subconceptStability` props
2. Import `calculatePointsBreakdown` from gamification
3. On correct answer, calculate and display points
4. Show PointsAnimation component in feedback section

Since this modifies existing code, the full implementation depends on the current state of ExerciseCard. The pattern is:
- Add new props to interface
- Calculate points breakdown after grading
- Render PointsAnimation in the feedback section

---

## Tasks 11-35: Remaining Foundation Tasks

The remaining tasks follow the same TDD pattern:

### Task 11: Update Session Summary to Show Total Points
- Add `sessionPoints` to SessionStats
- Show points earned in SessionSummary component
- Test points aggregation across session

### Task 12: Add Points Card to Dashboard
- Create `TodayPointsCard` component in stats grid
- Show today's points with daily cap progress
- Weekly points in secondary display

### Task 13: Create StreakDisplay Component
- Enhanced streak display with freeze indicator
- Flame animation for milestones
- Show "(2 freezes available)" text

### Task 14: Update Header to Show Streak
- Replace current streak in Header with StreakDisplay
- Show freeze count if available

### Task 15-18: Database Types Update
- Regenerate `database.generated.ts`
- Update `app.types.ts` with new Profile fields
- Update mappers for new columns
- Update useProfile to include new fields

### Task 19-22: Integration with useConceptSession
- Add points calculation on answer submit
- Call calculate_attempt_points RPC
- Store points in exercise_attempts
- Call update_streak RPC at session end

### Task 23-28: Enhanced Streak Tests
- Edge case: timezone crossing
- Edge case: DST transitions
- Edge case: rapid freeze earning
- Edge case: session spanning midnight
- Integration: full session with points
- E2E: streak persistence

### Task 29-32: Points Flow Tests
- Integration: points accumulation
- Integration: daily cap enforcement
- Integration: streak multiplier application
- E2E: complete points flow

### Task 33-35: Documentation
- Update CLAUDE.md with Phase 3.1 milestone
- Update Obsidian docs
- Record decision in Daem0nMCP

---

## Phase 3.1 Completion Checklist

Before moving to Phase 3.2:

- [ ] All 35 tasks completed
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
- [Phase 3 Design](./2026-01-08-phase3-gamification-design.md)
- [Phase 3.2: Visualization](./2026-01-08-phase32-visualization.md)
