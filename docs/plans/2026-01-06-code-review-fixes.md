# Code Review Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all bugs and refactoring opportunities identified in code review

**Architecture:** Targeted fixes to React hooks, Supabase queries, and component state management. Critical race condition fix requires new Supabase RPC function.

**Tech Stack:** TypeScript, React 19, Supabase PostgreSQL, Vitest

---

## Task 1: Fix Stale Closure in useConceptSession (Critical #1)

**Files:**
- Modify: `src/lib/hooks/useConceptSession.ts:377`
- Test: Existing tests cover this behavior

**Step 1: Add missing dependency to recordResult**

The `recordResult` callback uses `stats.total` on line 333 but the dependency array on line 377 only includes `stats.completed`. Add `stats.total` to the dependency array.

```typescript
// Line 377: Change from:
[cards, currentIndex, stats.completed, cardProgressMap, recordSubconceptResult, showToast]

// To:
[cards, currentIndex, stats.completed, stats.total, cardProgressMap, recordSubconceptResult, showToast]
```

**Step 2: Run existing tests**

Run: `pnpm test -- --run`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/lib/hooks/useConceptSession.ts
git commit -m "fix(hooks): add stats.total to recordResult dependencies

The recordResult callback uses stats.total for willComplete check but
it was missing from the dependency array, causing stale closure issues."
```

---

## Task 2: Fix Race Condition in Profile Stats Update (Critical #2)

**Files:**
- Create: `supabase/migrations/20260106000001_atomic_stats_update.sql`
- Modify: `src/lib/stats/updateProfile.ts:19-65`
- Test: `tests/unit/stats/updateProfile.test.ts`

**Step 1: Write the migration for atomic increment RPC**

Create migration file with PostgreSQL function for atomic stats update:

```sql
-- supabase/migrations/20260106000001_atomic_stats_update.sql

-- Atomic profile stats update to prevent race conditions
CREATE OR REPLACE FUNCTION update_profile_stats_atomic(
  p_user_id UUID,
  p_exercises_completed INT,
  p_current_streak INT,
  p_longest_streak INT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET
    total_exercises_completed = COALESCE(total_exercises_completed, 0) + p_exercises_completed,
    current_streak = p_current_streak,
    longest_streak = p_longest_streak,
    updated_at = NOW()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_profile_stats_atomic(UUID, INT, INT, INT) TO authenticated;
```

**Step 2: Apply migration locally**

Run: `pnpm db:reset` (or `supabase db reset`)
Expected: Migration applies successfully

**Step 3: Write failing test for atomic update**

Add test to `tests/unit/stats/updateProfile.test.ts`:

```typescript
describe('updateProfileStats atomic update', () => {
  it('should use RPC for atomic increment', async () => {
    // This test verifies the RPC is called instead of read-then-write
    const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
    vi.mocked(supabase.rpc).mockImplementation(mockRpc);

    await updateProfileStats({
      userId: 'test-user-id',
      exercisesCompleted: 5,
      lastPracticed: new Date('2026-01-05'),
      now: new Date('2026-01-06'),
    });

    expect(mockRpc).toHaveBeenCalledWith('update_profile_stats_atomic', {
      p_user_id: 'test-user-id',
      p_exercises_completed: 5,
      p_current_streak: expect.any(Number),
      p_longest_streak: expect.any(Number),
    });
  });
});
```

**Step 4: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/stats/updateProfile.test.ts`
Expected: FAIL - rpc not called

**Step 5: Update updateProfileStats to use atomic RPC**

Replace `src/lib/stats/updateProfile.ts`:

```typescript
import { supabase } from '@/lib/supabase';
import { handleSupabaseError } from '@/lib/errors';
import { calculateUpdatedStreak } from './streak';
import type { DbProfile } from '@/lib/supabase/types';

export interface UpdateProfileStatsInput {
  userId: string;
  exercisesCompleted: number;
  lastPracticed: Date | null;
  now?: Date;
}

export async function updateProfileStats(
  input: UpdateProfileStatsInput
): Promise<void> {
  const { userId, exercisesCompleted, lastPracticed, now = new Date() } = input;

  // First, fetch current profile to get streak data for calculation
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('current_streak, longest_streak')
    .eq('id', userId)
    .single();

  if (fetchError) {
    throw handleSupabaseError(fetchError);
  }

  const currentProfile = profile as Pick<
    DbProfile,
    'current_streak' | 'longest_streak'
  >;

  // Calculate updated streak
  const streakUpdate = calculateUpdatedStreak({
    currentStreak: currentProfile.current_streak ?? 0,
    longestStreak: currentProfile.longest_streak ?? 0,
    lastPracticed,
    now,
  });

  // Use atomic RPC to prevent race conditions
  const { error: rpcError } = await supabase.rpc('update_profile_stats_atomic', {
    p_user_id: userId,
    p_exercises_completed: exercisesCompleted,
    p_current_streak: streakUpdate.currentStreak,
    p_longest_streak: streakUpdate.longestStreak,
  });

  if (rpcError) {
    throw handleSupabaseError(rpcError);
  }
}
```

**Step 6: Run tests**

Run: `pnpm test -- --run tests/unit/stats/updateProfile.test.ts`
Expected: PASS

**Step 7: Commit**

```bash
git add supabase/migrations/20260106000001_atomic_stats_update.sql src/lib/stats/updateProfile.ts tests/unit/stats/updateProfile.test.ts
git commit -m "fix(stats): use atomic RPC for profile stats update

Prevents race condition when user has multiple tabs open.
The total_exercises_completed is now atomically incremented
via PostgreSQL function instead of read-then-write pattern."
```

---

## Task 3: Standardize Supabase Client Usage (Important #3)

**Files:**
- Modify: `src/lib/hooks/useConceptSession.ts:7,87`

**Step 1: Replace createClient with singleton import**

Change line 7 from:
```typescript
import { createClient } from '@/lib/supabase/client';
```
To:
```typescript
import { supabase } from '@/lib/supabase/client';
```

Delete line 87:
```typescript
const supabase = useMemo(() => createClient(), []);
```

Then update all `supabase` references in the file to use the imported singleton (no changes needed as variable name stays the same).

**Step 2: Run typecheck and tests**

Run: `pnpm typecheck && pnpm test -- --run`
Expected: All pass

**Step 3: Commit**

```bash
git add src/lib/hooks/useConceptSession.ts
git commit -m "refactor(hooks): use Supabase singleton in useConceptSession

Standardizes on the singleton pattern for browser client.
Removes unnecessary useMemo that created separate client instance."
```

---

## Task 4: Fix Dashboard Due Count to Use subconcept_progress (Important #4)

**Files:**
- Modify: `src/app/dashboard/page.tsx:17-20,100-129`
- Test: `tests/unit/dashboard/dashboard.test.tsx` (if exists)

**Step 1: Update dashboard imports**

Replace lines 17-20. Remove `user_progress` imports, add subconcept-based query:

```typescript
// Remove these:
import { mapUserProgress, getDueCards } from '@/lib/supabase/helpers';
import type { UserProgress } from '@/lib/srs/types';

// Add:
import type { DbSubconceptProgress } from '@/lib/supabase/types';
```

**Step 2: Update fetchStats function**

Replace lines 107-120 with subconcept-based due count:

```typescript
try {
  // Fetch subconcept progress (same source as practice)
  const { data: progressData, error: progressError } = await supabase
    .from('subconcept_progress')
    .select('*')
    .eq('user_id', user!.id);

  if (progressError) throw progressError;

  // Count due subconcepts (next_review_date <= now)
  const now = new Date();
  const dueCount = (progressData ?? []).filter((p: DbSubconceptProgress) => {
    if (!p.next_review_date) return false;
    return new Date(p.next_review_date) <= now;
  }).length;

  setDueCount(dueCount);
} catch (err) {
  setError(err instanceof Error ? err.message : 'Failed to load dashboard');
} finally {
  setLoading(false);
}
```

**Step 3: Run tests and typecheck**

Run: `pnpm typecheck && pnpm test -- --run`
Expected: All pass

**Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "fix(dashboard): use subconcept_progress for due count

Dashboard now queries same table as practice session,
ensuring due count displayed matches actual practice content."
```

---

## Task 5: Add Answer Reset to FillInExercise (Important #5)

**Files:**
- Modify: `src/components/exercise/FillInExercise.tsx:88-89`
- Test: `tests/unit/components/FillInExercise.test.tsx`

**Step 1: Write failing test**

Add test to verify answer resets when template changes:

```typescript
describe('FillInExercise state reset', () => {
  it('should reset answer when template prop changes', () => {
    const onSubmit = vi.fn();

    const { rerender, getByRole } = render(
      <FillInExercise
        template="x = ___"
        blankPosition={0}
        onSubmit={onSubmit}
      />
    );

    const input = getByRole('textbox');
    fireEvent.change(input, { target: { value: 'old answer' } });
    expect(input).toHaveValue('old answer');

    // Rerender with new template
    rerender(
      <FillInExercise
        template="y = ___"
        blankPosition={0}
        onSubmit={onSubmit}
      />
    );

    // Answer should be reset
    expect(getByRole('textbox')).toHaveValue('');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/components/FillInExercise.test.tsx`
Expected: FAIL - answer not reset

**Step 3: Add state reset pattern**

Add after line 88 (`const [answer, setAnswer] = useState('');`):

```typescript
const [answer, setAnswer] = useState('');
const [prevTemplate, setPrevTemplate] = useState(template);

// Reset answer when template changes (adjusting state based on props pattern)
if (template !== prevTemplate) {
  setPrevTemplate(template);
  setAnswer('');
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/components/FillInExercise.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/exercise/FillInExercise.tsx tests/unit/components/FillInExercise.test.tsx
git commit -m "fix(FillInExercise): reset answer when template changes

Uses React's 'adjusting state based on props' pattern to clear
the input when a new exercise template is provided, matching
the pattern already used in ExerciseCard."
```

---

## Task 6: Add Error Handler to AuthProvider (Important #6)

**Files:**
- Modify: `src/lib/context/AuthContext.tsx:19-27`

**Step 1: Add catch handler to getUser promise**

Replace lines 19-27:

```typescript
useEffect(() => {
  supabase.auth.getUser()
    .then(({ data, error }) => {
      setState({
        user: data.user,
        loading: false,
        error: error,
      });
    })
    .catch((error) => {
      setState({
        user: null,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch user'),
      });
    });

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
```

**Step 2: Run tests**

Run: `pnpm test -- --run`
Expected: All pass

**Step 3: Commit**

```bash
git add src/lib/context/AuthContext.tsx
git commit -m "fix(auth): add catch handler for getUser promise

Handles network errors when Supabase is unavailable,
preventing unhandled promise rejections."
```

---

## Task 7: Fix useImperativeHandle Non-null Assertion (Important #7)

**Files:**
- Modify: `src/components/ui/CodeEditor.tsx:59`

**Step 1: Return null-safe ref**

Replace line 59:

```typescript
// From:
useImperativeHandle(ref, () => internalRef.current!, []);

// To:
useImperativeHandle(ref, () => internalRef.current as HTMLTextAreaElement, []);
```

Note: The `as` cast is safe here because:
1. The ref is attached to a textarea that always exists in the DOM
2. Consumers accessing before mount is an edge case that would fail anyway
3. This removes the runtime assertion while maintaining type safety

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/ui/CodeEditor.tsx
git commit -m "fix(CodeEditor): remove non-null assertion in useImperativeHandle

Uses type assertion instead of runtime assertion for ref forwarding."
```

---

## Task 8: Extract toUTCDateString Utility (Minor #8)

**Files:**
- Create: `src/lib/utils/date.ts`
- Modify: `src/lib/stats/streak.ts:4-6`
- Modify: `src/lib/stats/queries.ts:7-9`

**Step 1: Create shared date utility**

```typescript
// src/lib/utils/date.ts

/**
 * Converts a Date to UTC date string in YYYY-MM-DD format.
 * Used for streak calculations and date comparisons.
 */
export function toUTCDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}
```

**Step 2: Update streak.ts**

Replace lines 4-6:

```typescript
// From:
function toUTCDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// To:
import { toUTCDateString } from '@/lib/utils/date';
```

**Step 3: Update queries.ts**

Replace lines 7-9:

```typescript
// From:
function toUTCDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// To:
import { toUTCDateString } from '@/lib/utils/date';
```

**Step 4: Run tests**

Run: `pnpm test -- --run`
Expected: All pass

**Step 5: Commit**

```bash
git add src/lib/utils/date.ts src/lib/stats/streak.ts src/lib/stats/queries.ts
git commit -m "refactor(utils): extract toUTCDateString to shared module

Removes duplicate function definition in streak.ts and queries.ts."
```

---

## Task 9: Add QUALITY_PASSING_THRESHOLD Constant (Minor #9)

**Files:**
- Modify: `src/lib/srs/types.ts`
- Modify: `src/lib/hooks/useConceptSession.ts:338`
- Modify: `src/lib/srs/algorithm.ts:33`
- Modify: `src/lib/srs/concept-algorithm.ts:202`

**Step 1: Add constant to types**

Add to `src/lib/srs/types.ts`:

```typescript
/** Quality threshold for considering an answer "correct" (passing) */
export const QUALITY_PASSING_THRESHOLD = 3;
```

**Step 2: Update useConceptSession.ts**

Line 338, change:
```typescript
// From:
const isCorrect = quality >= 3;

// To:
const isCorrect = quality >= QUALITY_PASSING_THRESHOLD;
```

Add import at top of file:
```typescript
import { QUALITY_PASSING_THRESHOLD } from '@/lib/srs/types';
```

**Step 3: Update algorithm.ts**

Line 33, change:
```typescript
// From:
const wasCorrect = quality >= 3;

// To:
const wasCorrect = quality >= QUALITY_PASSING_THRESHOLD;
```

Add import at top of file:
```typescript
import { QUALITY_PASSING_THRESHOLD } from './types';
```

**Step 4: Update concept-algorithm.ts**

Line 202, change:
```typescript
// From:
const wasCorrect = quality >= 3;

// To:
const wasCorrect = quality >= QUALITY_PASSING_THRESHOLD;
```

Add import at top of file (if not already there):
```typescript
import { QUALITY_PASSING_THRESHOLD } from './types';
```

**Step 5: Run tests**

Run: `pnpm test -- --run`
Expected: All pass

**Step 6: Commit**

```bash
git add src/lib/srs/types.ts src/lib/hooks/useConceptSession.ts src/lib/srs/algorithm.ts src/lib/srs/concept-algorithm.ts
git commit -m "refactor(srs): add QUALITY_PASSING_THRESHOLD constant

Replaces magic number 3 with named constant for clarity.
Documents that quality >= 3 means 'correct' per SM-2 algorithm."
```

---

## Task 10: Simplify onComplete Callback Signature (Minor #10)

**Files:**
- Modify: `src/components/exercise/ExerciseCard.tsx:16,125`
- Modify: `src/app/practice/page.tsx:233`

**Step 1: Update ExerciseCard interface**

Line 16, change:
```typescript
// From:
onComplete: (exerciseId: string, quality: Quality) => void;

// To:
onComplete: (quality: Quality) => void;
```

**Step 2: Update ExerciseCard handleContinue**

Line 125, change:
```typescript
// From:
onComplete(exercise.id, quality);

// To:
onComplete(quality);
```

**Step 3: Update practice page**

Line 233, change:
```typescript
// From:
onComplete={(exerciseId, quality) => recordResult(quality)}

// To:
onComplete={(quality) => recordResult(quality)}
```

Or simpler:
```typescript
onComplete={recordResult}
```

**Step 4: Run typecheck and tests**

Run: `pnpm typecheck && pnpm test -- --run`
Expected: All pass

**Step 5: Commit**

```bash
git add src/components/exercise/ExerciseCard.tsx src/app/practice/page.tsx
git commit -m "refactor(ExerciseCard): remove unused exerciseId from onComplete

Simplifies callback signature since exerciseId was never used."
```

---

## Task 11: Make Exercise Count Dynamic (Minor #11)

**Files:**
- Modify: `src/app/dashboard/page.tsx:219`

**Step 1: Import exercise count from curriculum**

Add import at top:
```typescript
import { getPythonCurriculum } from '@/lib/curriculum';
```

**Step 2: Get count in component**

Add inside the component, before the return:
```typescript
const exerciseCount = useMemo(() => {
  const curriculum = getPythonCurriculum();
  return Object.values(curriculum.subconcepts).reduce(
    (sum, sc) => sum + sc.exercises.length,
    0
  );
}, []);
```

**Step 3: Update description**

Line 219, change:
```typescript
// From:
description="218 Python exercises"

// To:
description={`${exerciseCount} Python exercises`}
```

**Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "fix(dashboard): dynamically calculate exercise count

Prevents hardcoded count from becoming stale as exercises are added."
```

---

## Task 12: Scope TeachingCard Enter Key Listener (Minor #12)

**Files:**
- Modify: `src/components/exercise/TeachingCard.tsx:20-32`

**Step 1: Update handleKeyDown to check active element**

Replace lines 20-32:

```typescript
// Handle Enter key to advance (only when not focused on other inputs)
const handleKeyDown = useCallback(
  (e: KeyboardEvent) => {
    // Don't intercept if user is typing in an input field
    const activeElement = document.activeElement;
    const isTypingInInput =
      activeElement?.tagName === 'INPUT' ||
      activeElement?.tagName === 'TEXTAREA';

    if (e.key === 'Enter' && !isTypingInInput) {
      onContinue();
    }
  },
  [onContinue]
);

useEffect(() => {
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [handleKeyDown]);
```

**Step 2: Run tests**

Run: `pnpm test -- --run`
Expected: All pass

**Step 3: Commit**

```bash
git add src/components/exercise/TeachingCard.tsx
git commit -m "fix(TeachingCard): scope Enter key listener to avoid input conflicts

Enter key now only triggers continue when user is not focused on
an input field, preventing accidental navigation."
```

---

## Summary

| Task | Severity | Description |
|------|----------|-------------|
| 1 | Critical | Fix stale closure in useConceptSession |
| 2 | Critical | Fix race condition with atomic RPC |
| 3 | Important | Standardize Supabase client usage |
| 4 | Important | Fix dashboard due count table mismatch |
| 5 | Important | Add answer reset to FillInExercise |
| 6 | Important | Add error handler to AuthProvider |
| 7 | Important | Fix useImperativeHandle assertion |
| 8 | Minor | Extract toUTCDateString utility |
| 9 | Minor | Add QUALITY_PASSING_THRESHOLD constant |
| 10 | Minor | Simplify onComplete signature |
| 11 | Minor | Make exercise count dynamic |
| 12 | Minor | Scope TeachingCard Enter listener |

**Estimated total:** 12 tasks, ~1 hour of focused work

---

## Verification

After all tasks complete:

```bash
pnpm typecheck
pnpm lint
pnpm test -- --run
pnpm build
```

All should pass before considering this plan complete.
