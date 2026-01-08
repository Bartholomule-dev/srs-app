# Skill Tree Progress Visualization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a visual skill tree on the dashboard showing all 54 subconcepts as connected nodes, letting users see their progress through the curriculum.

**Architecture:** Pure client-side React with data from Supabase. State computation happens client-side using curriculum graph (static) + subconcept_progress (fetched). SVG overlay for dependency lines. Framer Motion for animations.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Framer Motion, Supabase

---

## Task 1: Create SubconceptState Types

**Files:**
- Create: `src/lib/skill-tree/types.ts`
- Test: `tests/unit/skill-tree/types.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/skill-tree/types.test.ts
import { describe, it, expect } from 'vitest';
import {
  SubconceptState,
  SUBCONCEPT_STATES,
  isValidSubconceptState,
} from '@/lib/skill-tree/types';

describe('SubconceptState types', () => {
  it('defines all four states', () => {
    expect(SUBCONCEPT_STATES).toEqual(['locked', 'available', 'in-progress', 'mastered']);
  });

  it('validates valid states', () => {
    expect(isValidSubconceptState('locked')).toBe(true);
    expect(isValidSubconceptState('available')).toBe(true);
    expect(isValidSubconceptState('in-progress')).toBe(true);
    expect(isValidSubconceptState('mastered')).toBe(true);
  });

  it('rejects invalid states', () => {
    expect(isValidSubconceptState('unknown')).toBe(false);
    expect(isValidSubconceptState('')).toBe(false);
    expect(isValidSubconceptState(null)).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/skill-tree/types.test.ts --run`
Expected: FAIL with "Cannot find module '@/lib/skill-tree/types'"

**Step 3: Write minimal implementation**

```typescript
// src/lib/skill-tree/types.ts

/**
 * Visual states for subconcept nodes in the skill tree
 */
export const SUBCONCEPT_STATES = ['locked', 'available', 'in-progress', 'mastered'] as const;
export type SubconceptState = (typeof SUBCONCEPT_STATES)[number];

/**
 * Type guard for SubconceptState
 */
export function isValidSubconceptState(value: unknown): value is SubconceptState {
  return typeof value === 'string' && SUBCONCEPT_STATES.includes(value as SubconceptState);
}

/**
 * Mastery threshold - stability in days required for "mastered" state
 * FSRS stability >= 7 means the algorithm predicts retention for at least a week
 */
export const MASTERY_THRESHOLD_DAYS = 7;

/**
 * Computed skill tree data for a single subconcept
 */
export interface SkillTreeNode {
  slug: string;
  name: string;
  concept: string;
  state: SubconceptState;
  stability: number | null; // FSRS stability in days
  prereqs: string[];
}

/**
 * Computed skill tree data for a concept cluster
 */
export interface SkillTreeCluster {
  slug: string;
  name: string;
  description: string;
  tier: number; // 1-7 based on curriculum DAG
  subconcepts: SkillTreeNode[];
  masteredCount: number;
  totalCount: number;
}

/**
 * Full skill tree data structure
 */
export interface SkillTreeData {
  clusters: SkillTreeCluster[];
  totalMastered: number;
  totalSubconcepts: number;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/unit/skill-tree/types.test.ts --run`
Expected: PASS

**Step 5: Create barrel export**

```typescript
// src/lib/skill-tree/index.ts
export * from './types';
```

**Step 6: Commit**

```bash
git add src/lib/skill-tree/ tests/unit/skill-tree/
git commit -m "feat(skill-tree): add SubconceptState types and interfaces"
```

---

## Task 2: Create getSubconceptState Function

**Files:**
- Modify: `src/lib/skill-tree/types.ts` (add function)
- Create: `tests/unit/skill-tree/get-state.test.ts`

**Step 1: Write the failing tests**

```typescript
// tests/unit/skill-tree/get-state.test.ts
import { describe, it, expect } from 'vitest';
import { getSubconceptState, MASTERY_THRESHOLD_DAYS } from '@/lib/skill-tree';
import type { SubconceptProgress } from '@/lib/curriculum/types';

describe('getSubconceptState', () => {
  // Helper to create minimal progress record
  const makeProgress = (stability: number): SubconceptProgress => ({
    id: 'test-id',
    userId: 'user-1',
    subconceptSlug: 'test-subconcept',
    conceptSlug: 'test-concept',
    stability,
    difficulty: 5,
    fsrsState: 2,
    reps: 1,
    lapses: 0,
    elapsedDays: 0,
    scheduledDays: 1,
    nextReview: new Date().toISOString(),
    lastReviewed: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  describe('locked state', () => {
    it('returns locked when prerequisites are not mastered', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(1)); // Not mastered (stability < 7)

      const result = getSubconceptState(
        'operators', // requires 'variables'
        progressMap,
        ['variables'] // prereqs
      );

      expect(result).toBe('locked');
    });

    it('returns locked when some prerequisites are missing', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('prereq1', makeProgress(10)); // Mastered
      // prereq2 is missing entirely

      const result = getSubconceptState(
        'test-subconcept',
        progressMap,
        ['prereq1', 'prereq2']
      );

      expect(result).toBe('locked');
    });
  });

  describe('available state', () => {
    it('returns available when no prereqs and no progress', () => {
      const progressMap = new Map<string, SubconceptProgress>();

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('available');
    });

    it('returns available when all prereqs mastered but no own progress', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(10)); // Mastered

      const result = getSubconceptState(
        'operators',
        progressMap,
        ['variables']
      );

      expect(result).toBe('available');
    });
  });

  describe('in-progress state', () => {
    it('returns in-progress when has progress but stability < threshold', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(3)); // Started but not mastered

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('in-progress');
    });

    it('returns in-progress at stability boundary minus 1', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(MASTERY_THRESHOLD_DAYS - 0.1));

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('in-progress');
    });
  });

  describe('mastered state', () => {
    it('returns mastered when stability >= threshold', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(MASTERY_THRESHOLD_DAYS));

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('mastered');
    });

    it('returns mastered when stability > threshold', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(30));

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('mastered');
    });
  });

  describe('edge cases', () => {
    it('handles stability of 0', () => {
      const progressMap = new Map<string, SubconceptProgress>();
      progressMap.set('variables', makeProgress(0));

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('in-progress');
    });

    it('handles empty prereqs array', () => {
      const progressMap = new Map<string, SubconceptProgress>();

      const result = getSubconceptState('variables', progressMap, []);

      expect(result).toBe('available');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/skill-tree/get-state.test.ts --run`
Expected: FAIL with "getSubconceptState is not exported"

**Step 3: Write minimal implementation**

Add to `src/lib/skill-tree/types.ts`:

```typescript
import type { SubconceptProgress } from '@/lib/curriculum/types';

/**
 * Determine the visual state of a subconcept node
 *
 * @param slug - The subconcept slug
 * @param progressMap - Map of slug -> SubconceptProgress
 * @param prereqs - Array of prerequisite subconcept slugs
 * @returns The computed SubconceptState
 */
export function getSubconceptState(
  slug: string,
  progressMap: Map<string, SubconceptProgress>,
  prereqs: string[]
): SubconceptState {
  // Check if all prerequisites are mastered
  const prereqsMastered = prereqs.every((prereqSlug) => {
    const prereqProgress = progressMap.get(prereqSlug);
    return prereqProgress && prereqProgress.stability >= MASTERY_THRESHOLD_DAYS;
  });

  if (!prereqsMastered) {
    return 'locked';
  }

  const myProgress = progressMap.get(slug);

  if (!myProgress) {
    return 'available';
  }

  if (myProgress.stability >= MASTERY_THRESHOLD_DAYS) {
    return 'mastered';
  }

  return 'in-progress';
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/unit/skill-tree/get-state.test.ts --run`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/skill-tree/types.ts tests/unit/skill-tree/get-state.test.ts
git commit -m "feat(skill-tree): add getSubconceptState function"
```

---

## Task 3: Create buildSkillTreeData Function

**Files:**
- Create: `src/lib/skill-tree/build-tree.ts`
- Test: `tests/unit/skill-tree/build-tree.test.ts`

**Step 1: Write the failing tests**

```typescript
// tests/unit/skill-tree/build-tree.test.ts
import { describe, it, expect } from 'vitest';
import { buildSkillTreeData } from '@/lib/skill-tree/build-tree';
import type { SubconceptProgress } from '@/lib/curriculum/types';

describe('buildSkillTreeData', () => {
  const makeProgress = (
    slug: string,
    concept: string,
    stability: number
  ): SubconceptProgress => ({
    id: `id-${slug}`,
    userId: 'user-1',
    subconceptSlug: slug,
    conceptSlug: concept,
    stability,
    difficulty: 5,
    fsrsState: 2,
    reps: 1,
    lapses: 0,
    elapsedDays: 0,
    scheduledDays: 1,
    nextReview: new Date().toISOString(),
    lastReviewed: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  it('builds tree with all 10 concept clusters', () => {
    const result = buildSkillTreeData([]);

    expect(result.clusters).toHaveLength(10);
    expect(result.clusters.map((c) => c.slug)).toEqual([
      'foundations',
      'strings',
      'numbers-booleans',
      'collections',
      'control-flow',
      'functions',
      'comprehensions',
      'error-handling',
      'oop',
      'modules-files',
    ]);
  });

  it('assigns correct tiers based on curriculum DAG', () => {
    const result = buildSkillTreeData([]);

    const tierMap = new Map(result.clusters.map((c) => [c.slug, c.tier]));
    expect(tierMap.get('foundations')).toBe(1);
    expect(tierMap.get('strings')).toBe(2);
    expect(tierMap.get('numbers-booleans')).toBe(2);
    expect(tierMap.get('collections')).toBe(3);
    expect(tierMap.get('control-flow')).toBe(4);
    expect(tierMap.get('functions')).toBe(4);
    expect(tierMap.get('comprehensions')).toBe(5);
    expect(tierMap.get('error-handling')).toBe(6);
    expect(tierMap.get('oop')).toBe(6);
    expect(tierMap.get('modules-files')).toBe(7);
  });

  it('counts total subconcepts correctly', () => {
    const result = buildSkillTreeData([]);

    expect(result.totalSubconcepts).toBe(54);
  });

  it('computes mastered count from progress', () => {
    const progress = [
      makeProgress('variables', 'foundations', 10), // mastered
      makeProgress('operators', 'foundations', 10), // mastered
      makeProgress('expressions', 'foundations', 3), // in-progress
    ];

    const result = buildSkillTreeData(progress);

    expect(result.totalMastered).toBe(2);
  });

  it('computes cluster mastered counts', () => {
    const progress = [
      makeProgress('variables', 'foundations', 10),
      makeProgress('operators', 'foundations', 10),
    ];

    const result = buildSkillTreeData(progress);
    const foundations = result.clusters.find((c) => c.slug === 'foundations');

    expect(foundations?.masteredCount).toBe(2);
    expect(foundations?.totalCount).toBe(4); // foundations has 4 subconcepts
  });

  it('sets correct states for subconcepts', () => {
    const progress = [
      makeProgress('variables', 'foundations', 10), // mastered
    ];

    const result = buildSkillTreeData(progress);
    const foundations = result.clusters.find((c) => c.slug === 'foundations');
    const variables = foundations?.subconcepts.find((s) => s.slug === 'variables');
    const operators = foundations?.subconcepts.find((s) => s.slug === 'operators');

    expect(variables?.state).toBe('mastered');
    expect(operators?.state).toBe('available'); // prereq (variables) is mastered
  });

  it('marks subconcepts as locked when prereqs not met', () => {
    const result = buildSkillTreeData([]); // No progress at all

    const foundations = result.clusters.find((c) => c.slug === 'foundations');
    const variables = foundations?.subconcepts.find((s) => s.slug === 'variables');
    const operators = foundations?.subconcepts.find((s) => s.slug === 'operators');

    expect(variables?.state).toBe('available'); // No prereqs
    expect(operators?.state).toBe('locked'); // Prereq (variables) not mastered
  });

  it('includes stability in node data', () => {
    const progress = [makeProgress('variables', 'foundations', 15.5)];

    const result = buildSkillTreeData(progress);
    const foundations = result.clusters.find((c) => c.slug === 'foundations');
    const variables = foundations?.subconcepts.find((s) => s.slug === 'variables');

    expect(variables?.stability).toBe(15.5);
  });

  it('sets stability to null for subconcepts without progress', () => {
    const result = buildSkillTreeData([]);

    const foundations = result.clusters.find((c) => c.slug === 'foundations');
    const variables = foundations?.subconcepts.find((s) => s.slug === 'variables');

    expect(variables?.stability).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/skill-tree/build-tree.test.ts --run`
Expected: FAIL with "Cannot find module '@/lib/skill-tree/build-tree'"

**Step 3: Write minimal implementation**

```typescript
// src/lib/skill-tree/build-tree.ts
import curriculum from '@/lib/curriculum/python.json';
import type { SubconceptProgress } from '@/lib/curriculum/types';
import { getSubconceptState, type SkillTreeData, type SkillTreeCluster, type SkillTreeNode, MASTERY_THRESHOLD_DAYS } from './types';

/**
 * Tier assignments based on curriculum DAG
 * Computed from concept prerequisites
 */
const CONCEPT_TIERS: Record<string, number> = {
  'foundations': 1,
  'strings': 2,
  'numbers-booleans': 2,
  'collections': 3,
  'control-flow': 4,
  'functions': 4,
  'comprehensions': 5,
  'error-handling': 6,
  'oop': 6,
  'modules-files': 7,
};

/**
 * Build the complete skill tree data structure from curriculum and progress
 *
 * @param progress - Array of user's subconcept progress records
 * @returns Complete skill tree data for rendering
 */
export function buildSkillTreeData(progress: SubconceptProgress[]): SkillTreeData {
  // Build progress map for O(1) lookups
  const progressMap = new Map<string, SubconceptProgress>();
  for (const p of progress) {
    progressMap.set(p.subconceptSlug, p);
  }

  // Get subconcept definitions from curriculum
  const subconceptDefs = curriculum.subconcepts as Record<
    string,
    { name: string; concept: string; prereqs: string[] }
  >;

  let totalMastered = 0;
  let totalSubconcepts = 0;

  // Build clusters from concepts
  const clusters: SkillTreeCluster[] = curriculum.concepts.map((concept) => {
    const subconcepts: SkillTreeNode[] = concept.subconcepts.map((slug) => {
      const def = subconceptDefs[slug];
      const prog = progressMap.get(slug);
      const state = getSubconceptState(slug, progressMap, def?.prereqs ?? []);

      totalSubconcepts++;
      if (state === 'mastered') {
        totalMastered++;
      }

      return {
        slug,
        name: def?.name ?? slug,
        concept: concept.slug,
        state,
        stability: prog?.stability ?? null,
        prereqs: def?.prereqs ?? [],
      };
    });

    const masteredCount = subconcepts.filter((s) => s.state === 'mastered').length;

    return {
      slug: concept.slug,
      name: concept.name,
      description: concept.description,
      tier: CONCEPT_TIERS[concept.slug] ?? 1,
      subconcepts,
      masteredCount,
      totalCount: subconcepts.length,
    };
  });

  return {
    clusters,
    totalMastered,
    totalSubconcepts,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/unit/skill-tree/build-tree.test.ts --run`
Expected: PASS

**Step 5: Update barrel export**

```typescript
// src/lib/skill-tree/index.ts
export * from './types';
export * from './build-tree';
```

**Step 6: Commit**

```bash
git add src/lib/skill-tree/ tests/unit/skill-tree/build-tree.test.ts
git commit -m "feat(skill-tree): add buildSkillTreeData function"
```

---

## Task 4: Create useSkillTree Hook

**Files:**
- Create: `src/lib/hooks/useSkillTree.ts`
- Test: `tests/unit/hooks/useSkillTree.test.tsx`

**Step 1: Write the failing tests**

```typescript
// tests/unit/hooks/useSkillTree.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSkillTree } from '@/lib/hooks/useSkillTree';
import { AuthProvider } from '@/lib/context/AuthContext';
import type { ReactNode } from 'react';

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
    })),
  },
}));

import { supabase } from '@/lib/supabase/client';

const mockUser = { id: 'test-user-id', email: 'test@example.com' };

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useSkillTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially', async () => {
    let resolveGetUser: (value: unknown) => void;
    const getUserPromise = new Promise((resolve) => {
      resolveGetUser = resolve;
    });
    vi.mocked(supabase.auth.getUser).mockReturnValue(getUserPromise as never);

    const { result } = renderHook(() => useSkillTree(), { wrapper });

    expect(result.current.loading).toBe(true);

    // Cleanup
    resolveGetUser!({ data: { user: null }, error: null });
  });

  it('returns tree data when authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    } as never);

    const { result } = renderHook(() => useSkillTree(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.clusters).toHaveLength(10);
    expect(result.current.data?.totalSubconcepts).toBe(54);
  });

  it('computes states from fetched progress', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    const mockProgress = [
      {
        id: '1',
        user_id: 'test-user-id',
        subconcept_slug: 'variables',
        concept_slug: 'foundations',
        stability: 10,
        difficulty: 5,
        fsrs_state: 2,
        reps: 5,
        lapses: 0,
        elapsed_days: 1,
        scheduled_days: 7,
        next_review: new Date().toISOString(),
        last_reviewed: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: mockProgress, error: null })),
      })),
    } as never);

    const { result } = renderHook(() => useSkillTree(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.totalMastered).toBe(1);

    const foundations = result.current.data?.clusters.find(
      (c) => c.slug === 'foundations'
    );
    const variables = foundations?.subconcepts.find((s) => s.slug === 'variables');
    expect(variables?.state).toBe('mastered');
  });

  it('returns null data when not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    const { result } = renderHook(() => useSkillTree(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
  });

  it('handles fetch errors gracefully', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: null,
          error: { message: 'Database error' }
        })),
      })),
    } as never);

    const { result } = renderHook(() => useSkillTree(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Database error');
    expect(result.current.data).toBeNull();
  });

  it('provides getState helper function', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    } as never);

    const { result } = renderHook(() => useSkillTree(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // getState should return the state for any subconcept
    expect(result.current.getState('variables')).toBe('available');
    expect(result.current.getState('operators')).toBe('locked'); // prereq not met
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/hooks/useSkillTree.test.tsx --run`
Expected: FAIL with "Cannot find module '@/lib/hooks/useSkillTree'"

**Step 3: Write minimal implementation**

```typescript
// src/lib/hooks/useSkillTree.ts
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase/client';
import { buildSkillTreeData } from '@/lib/skill-tree/build-tree';
import type { SkillTreeData, SubconceptState } from '@/lib/skill-tree/types';
import type { SubconceptProgress } from '@/lib/curriculum/types';

interface DbSubconceptProgress {
  id: string;
  user_id: string;
  subconcept_slug: string;
  concept_slug: string;
  stability: number;
  difficulty: number;
  fsrs_state: number;
  reps: number;
  lapses: number;
  elapsed_days: number;
  scheduled_days: number;
  next_review: string;
  last_reviewed: string | null;
  created_at: string;
  updated_at: string;
}

function mapDbToProgress(db: DbSubconceptProgress): SubconceptProgress {
  return {
    id: db.id,
    userId: db.user_id,
    subconceptSlug: db.subconcept_slug,
    conceptSlug: db.concept_slug,
    stability: db.stability,
    difficulty: db.difficulty,
    fsrsState: db.fsrs_state,
    reps: db.reps,
    lapses: db.lapses,
    elapsedDays: db.elapsed_days,
    scheduledDays: db.scheduled_days,
    nextReview: db.next_review,
    lastReviewed: db.last_reviewed ?? '',
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export interface UseSkillTreeReturn {
  data: SkillTreeData | null;
  loading: boolean;
  error: string | null;
  getState: (slug: string) => SubconceptState;
  refetch: () => Promise<void>;
}

export function useSkillTree(): UseSkillTreeReturn {
  const { user } = useAuth();
  const [data, setData] = useState<SkillTreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: progressData, error: fetchError } = await supabase
        .from('subconcept_progress')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const progress = (progressData ?? []).map(mapDbToProgress);
      const treeData = buildSkillTreeData(progress);
      setData(treeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skill tree');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoize state lookup map for getState
  const stateMap = useMemo(() => {
    if (!data) return new Map<string, SubconceptState>();

    const map = new Map<string, SubconceptState>();
    for (const cluster of data.clusters) {
      for (const subconcept of cluster.subconcepts) {
        map.set(subconcept.slug, subconcept.state);
      }
    }
    return map;
  }, [data]);

  const getState = useCallback(
    (slug: string): SubconceptState => {
      return stateMap.get(slug) ?? 'locked';
    },
    [stateMap]
  );

  return {
    data,
    loading,
    error,
    getState,
    refetch: fetchData,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/unit/hooks/useSkillTree.test.tsx --run`
Expected: PASS

**Step 5: Update hooks barrel export**

Add to `src/lib/hooks/index.ts`:

```typescript
export { useSkillTree, type UseSkillTreeReturn } from './useSkillTree';
```

**Step 6: Commit**

```bash
git add src/lib/hooks/useSkillTree.ts src/lib/hooks/index.ts tests/unit/hooks/useSkillTree.test.tsx
git commit -m "feat(skill-tree): add useSkillTree hook"
```

---

## Task 5: Create SubconceptNode Component

**Files:**
- Create: `src/components/skill-tree/SubconceptNode.tsx`
- Test: `tests/unit/components/skill-tree/SubconceptNode.test.tsx`

**Step 1: Write the failing tests**

```typescript
// tests/unit/components/skill-tree/SubconceptNode.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubconceptNode } from '@/components/skill-tree/SubconceptNode';
import type { SkillTreeNode } from '@/lib/skill-tree/types';

const makeNode = (overrides: Partial<SkillTreeNode> = {}): SkillTreeNode => ({
  slug: 'variables',
  name: 'Variables',
  concept: 'foundations',
  state: 'available',
  stability: null,
  prereqs: [],
  ...overrides,
});

describe('SubconceptNode', () => {
  it('renders as a 48px circle', () => {
    const { container } = render(<SubconceptNode node={makeNode()} />);

    const node = container.firstChild as HTMLElement;
    expect(node).toHaveClass('w-12', 'h-12'); // 48px = w-12 in Tailwind
    expect(node).toHaveClass('rounded-full');
  });

  describe('visual states', () => {
    it('renders locked state with muted styling', () => {
      const { container } = render(
        <SubconceptNode node={makeNode({ state: 'locked' })} />
      );

      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('opacity-30');
    });

    it('renders available state with amber outline', () => {
      const { container } = render(
        <SubconceptNode node={makeNode({ state: 'available' })} />
      );

      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('border-[var(--accent-primary)]');
      expect(node).toHaveClass('bg-transparent');
    });

    it('renders in-progress state with partial fill', () => {
      const { container } = render(
        <SubconceptNode node={makeNode({ state: 'in-progress', stability: 3 })} />
      );

      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('bg-[var(--accent-primary)]/50');
    });

    it('renders mastered state with solid fill and glow', () => {
      const { container } = render(
        <SubconceptNode node={makeNode({ state: 'mastered', stability: 10 })} />
      );

      const node = container.firstChild as HTMLElement;
      expect(node).toHaveClass('bg-[var(--accent-primary)]');
    });
  });

  describe('tooltip', () => {
    it('shows tooltip on hover', async () => {
      const user = userEvent.setup();
      render(<SubconceptNode node={makeNode({ name: 'Variables' })} />);

      const node = screen.getByRole('button');
      await user.hover(node);

      expect(await screen.findByText('Variables')).toBeInTheDocument();
    });

    it('shows "Ready to learn" for available state', async () => {
      const user = userEvent.setup();
      render(<SubconceptNode node={makeNode({ state: 'available' })} />);

      const node = screen.getByRole('button');
      await user.hover(node);

      expect(await screen.findByText('Ready to learn')).toBeInTheDocument();
    });

    it('shows prereqs for locked state', async () => {
      const user = userEvent.setup();
      render(
        <SubconceptNode
          node={makeNode({
            state: 'locked',
            prereqs: ['basics', 'operators'],
          })}
          prereqNames={{ basics: 'String Basics', operators: 'Operators' }}
        />
      );

      const node = screen.getByRole('button');
      await user.hover(node);

      expect(await screen.findByText(/Requires:/)).toBeInTheDocument();
    });

    it('shows stability for in-progress state', async () => {
      const user = userEvent.setup();
      render(
        <SubconceptNode node={makeNode({ state: 'in-progress', stability: 3.5 })} />
      );

      const node = screen.getByRole('button');
      await user.hover(node);

      expect(await screen.findByText(/3.5 days/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has button role', () => {
      render(<SubconceptNode node={makeNode()} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has accessible name', () => {
      render(<SubconceptNode node={makeNode({ name: 'Variables' })} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName('Variables');
    });

    it('is focusable', () => {
      render(<SubconceptNode node={makeNode()} />);

      const node = screen.getByRole('button');
      node.focus();
      expect(node).toHaveFocus();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/components/skill-tree/SubconceptNode.test.tsx --run`
Expected: FAIL with "Cannot find module '@/components/skill-tree/SubconceptNode'"

**Step 3: Write minimal implementation**

```typescript
// src/components/skill-tree/SubconceptNode.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { SkillTreeNode, SubconceptState } from '@/lib/skill-tree/types';
import { MASTERY_THRESHOLD_DAYS } from '@/lib/skill-tree/types';

interface SubconceptNodeProps {
  node: SkillTreeNode;
  prereqNames?: Record<string, string>;
  className?: string;
}

const stateStyles: Record<SubconceptState, string> = {
  locked: 'opacity-30 border-[var(--text-tertiary)] bg-transparent cursor-not-allowed',
  available: 'border-[var(--accent-primary)] bg-transparent hover:scale-110',
  'in-progress': 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/50 hover:scale-110',
  mastered: 'border-[var(--accent-primary)] bg-[var(--accent-primary)] shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-110',
};

function getTooltipContent(
  node: SkillTreeNode,
  prereqNames?: Record<string, string>
): { title: string; subtitle: string } {
  const title = node.name;

  switch (node.state) {
    case 'locked': {
      const names = node.prereqs
        .map((slug) => prereqNames?.[slug] ?? slug)
        .join(', ');
      return { title, subtitle: `Requires: ${names}` };
    }
    case 'available':
      return { title, subtitle: 'Ready to learn' };
    case 'in-progress': {
      const stability = node.stability?.toFixed(1) ?? '0';
      return {
        title,
        subtitle: `Stability: ${stability} days (${MASTERY_THRESHOLD_DAYS} days to master)`,
      };
    }
    case 'mastered': {
      return { title, subtitle: 'Mastered!' };
    }
  }
}

export function SubconceptNode({
  node,
  prereqNames,
  className,
}: SubconceptNodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const nodeRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = useCallback(() => setShowTooltip(true), []);
  const handleMouseLeave = useCallback(() => setShowTooltip(false), []);
  const handleFocus = useCallback(() => setShowTooltip(true), []);
  const handleBlur = useCallback(() => setShowTooltip(false), []);

  const { title, subtitle } = getTooltipContent(node, prereqNames);

  return (
    <div className="relative">
      <motion.button
        ref={nodeRef}
        className={cn(
          'w-12 h-12 rounded-full border-2 transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-surface-1)]',
          stateStyles[node.state],
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label={node.name}
        tabIndex={0}
        whileHover={node.state !== 'locked' ? { scale: 1.1 } : undefined}
        whileTap={node.state !== 'locked' ? { scale: 0.95 } : undefined}
      />

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2',
              'px-3 py-2 rounded-lg',
              'bg-[var(--bg-surface-3)] border border-[var(--border)]',
              'shadow-lg backdrop-blur-sm',
              'whitespace-nowrap pointer-events-none'
            )}
          >
            <div className="font-medium text-sm text-[var(--text-primary)]">
              {title}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">{subtitle}</div>
            {/* Tooltip arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[var(--bg-surface-3)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/unit/components/skill-tree/SubconceptNode.test.tsx --run`
Expected: PASS

**Step 5: Create barrel export**

```typescript
// src/components/skill-tree/index.ts
export { SubconceptNode } from './SubconceptNode';
```

**Step 6: Commit**

```bash
git add src/components/skill-tree/ tests/unit/components/skill-tree/
git commit -m "feat(skill-tree): add SubconceptNode component"
```

---

## Task 6: Create ConceptCluster Component

**Files:**
- Create: `src/components/skill-tree/ConceptCluster.tsx`
- Test: `tests/unit/components/skill-tree/ConceptCluster.test.tsx`

**Step 1: Write the failing tests**

```typescript
// tests/unit/components/skill-tree/ConceptCluster.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConceptCluster } from '@/components/skill-tree/ConceptCluster';
import type { SkillTreeCluster } from '@/lib/skill-tree/types';

const makeCluster = (overrides: Partial<SkillTreeCluster> = {}): SkillTreeCluster => ({
  slug: 'foundations',
  name: 'Foundations',
  description: 'Variables, operators, expressions',
  tier: 1,
  subconcepts: [
    { slug: 'variables', name: 'Variables', concept: 'foundations', state: 'mastered', stability: 10, prereqs: [] },
    { slug: 'operators', name: 'Operators', concept: 'foundations', state: 'available', stability: null, prereqs: ['variables'] },
  ],
  masteredCount: 1,
  totalCount: 2,
  ...overrides,
});

describe('ConceptCluster', () => {
  it('renders concept name as label', () => {
    render(<ConceptCluster cluster={makeCluster()} />);

    expect(screen.getByText('Foundations')).toBeInTheDocument();
  });

  it('renders progress badge with mastered/total', () => {
    render(<ConceptCluster cluster={makeCluster({ masteredCount: 3, totalCount: 5 })} />);

    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  it('renders all subconcept nodes', () => {
    render(<ConceptCluster cluster={makeCluster()} />);

    // Should render 2 nodes (from makeCluster)
    const nodes = screen.getAllByRole('button');
    expect(nodes).toHaveLength(2);
  });

  it('passes prereqNames to nodes', () => {
    // This is tested via tooltip content in SubconceptNode
    const { container } = render(<ConceptCluster cluster={makeCluster()} />);

    // Just verify it renders without error
    expect(container.firstChild).toBeInTheDocument();
  });

  it('uses Space Grotesk font for label', () => {
    render(<ConceptCluster cluster={makeCluster()} />);

    const label = screen.getByText('Foundations');
    expect(label).toHaveClass('font-display');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ConceptCluster cluster={makeCluster()} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/components/skill-tree/ConceptCluster.test.tsx --run`
Expected: FAIL with "Cannot find module '@/components/skill-tree/ConceptCluster'"

**Step 3: Write minimal implementation**

```typescript
// src/components/skill-tree/ConceptCluster.tsx
'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SubconceptNode } from './SubconceptNode';
import type { SkillTreeCluster } from '@/lib/skill-tree/types';

interface ConceptClusterProps {
  cluster: SkillTreeCluster;
  className?: string;
}

export function ConceptCluster({ cluster, className }: ConceptClusterProps) {
  // Build prereqNames map for tooltips
  const prereqNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const subconcept of cluster.subconcepts) {
      map[subconcept.slug] = subconcept.name;
    }
    return map;
  }, [cluster.subconcepts]);

  return (
    <motion.div
      className={cn('flex flex-col items-center gap-2', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Label and progress badge */}
      <div className="flex items-center gap-2 mb-1">
        <span className="font-display text-sm font-semibold text-[var(--text-primary)]">
          {cluster.name}
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-surface-2)] text-[var(--text-secondary)]">
          {cluster.masteredCount}/{cluster.totalCount}
        </span>
      </div>

      {/* Subconcept nodes */}
      <div className="flex flex-col gap-2">
        {cluster.subconcepts.map((subconcept) => (
          <SubconceptNode
            key={subconcept.slug}
            node={subconcept}
            prereqNames={prereqNames}
          />
        ))}
      </div>
    </motion.div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/unit/components/skill-tree/ConceptCluster.test.tsx --run`
Expected: PASS

**Step 5: Update barrel export**

```typescript
// src/components/skill-tree/index.ts
export { SubconceptNode } from './SubconceptNode';
export { ConceptCluster } from './ConceptCluster';
```

**Step 6: Commit**

```bash
git add src/components/skill-tree/ tests/unit/components/skill-tree/ConceptCluster.test.tsx
git commit -m "feat(skill-tree): add ConceptCluster component"
```

---

## Task 7: Create DependencyLines Component

**Files:**
- Create: `src/components/skill-tree/DependencyLines.tsx`
- Test: `tests/unit/components/skill-tree/DependencyLines.test.tsx`

**Step 1: Write the failing tests**

```typescript
// tests/unit/components/skill-tree/DependencyLines.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DependencyLines } from '@/components/skill-tree/DependencyLines';
import type { SkillTreeCluster } from '@/lib/skill-tree/types';

const makeClusters = (): SkillTreeCluster[] => [
  {
    slug: 'foundations',
    name: 'Foundations',
    description: 'Basic concepts',
    tier: 1,
    subconcepts: [
      { slug: 'variables', name: 'Variables', concept: 'foundations', state: 'mastered', stability: 10, prereqs: [] },
      { slug: 'operators', name: 'Operators', concept: 'foundations', state: 'available', stability: null, prereqs: ['variables'] },
    ],
    masteredCount: 1,
    totalCount: 2,
  },
];

describe('DependencyLines', () => {
  it('renders SVG overlay', () => {
    const { container } = render(
      <DependencyLines clusters={makeClusters()} nodePositions={{}} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('has pointer-events-none for click passthrough', () => {
    const { container } = render(
      <DependencyLines clusters={makeClusters()} nodePositions={{}} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('pointer-events-none');
  });

  it('renders path elements for dependencies', () => {
    const nodePositions = {
      variables: { x: 50, y: 50 },
      operators: { x: 50, y: 120 },
    };

    const { container } = render(
      <DependencyLines clusters={makeClusters()} nodePositions={nodePositions} />
    );

    // operators depends on variables, so there should be a path
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });

  it('does not render paths when positions are missing', () => {
    const { container } = render(
      <DependencyLines clusters={makeClusters()} nodePositions={{}} />
    );

    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(0);
  });

  it('uses amber color for unlocked paths', () => {
    const nodePositions = {
      variables: { x: 50, y: 50 },
      operators: { x: 50, y: 120 },
    };

    const { container } = render(
      <DependencyLines clusters={makeClusters()} nodePositions={nodePositions} />
    );

    const path = container.querySelector('path');
    // Path should reference the amber color variable
    expect(path).toHaveAttribute('stroke', 'var(--accent-primary)');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/components/skill-tree/DependencyLines.test.tsx --run`
Expected: FAIL with "Cannot find module '@/components/skill-tree/DependencyLines'"

**Step 3: Write minimal implementation**

```typescript
// src/components/skill-tree/DependencyLines.tsx
'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { SkillTreeCluster } from '@/lib/skill-tree/types';

interface Position {
  x: number;
  y: number;
}

interface DependencyLinesProps {
  clusters: SkillTreeCluster[];
  nodePositions: Record<string, Position>;
  className?: string;
}

interface Line {
  from: string;
  to: string;
  fromPos: Position;
  toPos: Position;
  isUnlocked: boolean;
}

function bezierPath(from: Position, to: Position): string {
  const midY = (from.y + to.y) / 2;
  return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
}

export function DependencyLines({
  clusters,
  nodePositions,
  className,
}: DependencyLinesProps) {
  // Build state map for determining line colors
  const stateMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cluster of clusters) {
      for (const subconcept of cluster.subconcepts) {
        map.set(subconcept.slug, subconcept.state);
      }
    }
    return map;
  }, [clusters]);

  // Calculate lines
  const lines = useMemo(() => {
    const result: Line[] = [];

    for (const cluster of clusters) {
      for (const subconcept of cluster.subconcepts) {
        for (const prereqSlug of subconcept.prereqs) {
          const fromPos = nodePositions[prereqSlug];
          const toPos = nodePositions[subconcept.slug];

          if (fromPos && toPos) {
            // Line is unlocked if the prerequisite is mastered
            const isUnlocked = stateMap.get(prereqSlug) === 'mastered';

            result.push({
              from: prereqSlug,
              to: subconcept.slug,
              fromPos,
              toPos,
              isUnlocked,
            });
          }
        }
      }
    }

    return result;
  }, [clusters, nodePositions, stateMap]);

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className ?? ''}`}
      aria-hidden="true"
    >
      {lines.map((line) => (
        <motion.path
          key={`${line.from}-${line.to}`}
          d={bezierPath(line.fromPos, line.toPos)}
          fill="none"
          stroke={line.isUnlocked ? 'var(--accent-primary)' : 'var(--text-tertiary)'}
          strokeWidth={2}
          strokeOpacity={line.isUnlocked ? 0.6 : 0.2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      ))}
    </svg>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/unit/components/skill-tree/DependencyLines.test.tsx --run`
Expected: PASS

**Step 5: Update barrel export**

```typescript
// src/components/skill-tree/index.ts
export { SubconceptNode } from './SubconceptNode';
export { ConceptCluster } from './ConceptCluster';
export { DependencyLines } from './DependencyLines';
```

**Step 6: Commit**

```bash
git add src/components/skill-tree/ tests/unit/components/skill-tree/DependencyLines.test.tsx
git commit -m "feat(skill-tree): add DependencyLines SVG component"
```

---

## Task 8: Create SkillTree Main Component

**Files:**
- Create: `src/components/skill-tree/SkillTree.tsx`
- Test: `tests/unit/components/skill-tree/SkillTree.test.tsx`

**Step 1: Write the failing tests**

```typescript
// tests/unit/components/skill-tree/SkillTree.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkillTree } from '@/components/skill-tree/SkillTree';
import { AuthProvider } from '@/lib/context/AuthContext';
import type { ReactNode } from 'react';

// Mock useSkillTree hook
vi.mock('@/lib/hooks/useSkillTree', () => ({
  useSkillTree: vi.fn(),
}));

import { useSkillTree } from '@/lib/hooks/useSkillTree';

// Mock Supabase for AuthProvider
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('SkillTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.mocked(useSkillTree).mockReturnValue({
      data: null,
      loading: true,
      error: null,
      getState: () => 'locked',
      refetch: vi.fn(),
    });

    render(<SkillTree />, { wrapper });

    expect(screen.getByTestId('skill-tree-loading')).toBeInTheDocument();
  });

  it('renders error state', () => {
    vi.mocked(useSkillTree).mockReturnValue({
      data: null,
      loading: false,
      error: 'Failed to load',
      getState: () => 'locked',
      refetch: vi.fn(),
    });

    render(<SkillTree />, { wrapper });

    expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
  });

  it('renders skill tree when data loaded', () => {
    vi.mocked(useSkillTree).mockReturnValue({
      data: {
        clusters: [
          {
            slug: 'foundations',
            name: 'Foundations',
            description: 'Basic concepts',
            tier: 1,
            subconcepts: [
              { slug: 'variables', name: 'Variables', concept: 'foundations', state: 'available', stability: null, prereqs: [] },
            ],
            masteredCount: 0,
            totalCount: 1,
          },
        ],
        totalMastered: 0,
        totalSubconcepts: 1,
      },
      loading: false,
      error: null,
      getState: () => 'available',
      refetch: vi.fn(),
    });

    render(<SkillTree />, { wrapper });

    expect(screen.getByText('Foundations')).toBeInTheDocument();
    expect(screen.getByText('0/1')).toBeInTheDocument();
  });

  it('renders all concept clusters', () => {
    vi.mocked(useSkillTree).mockReturnValue({
      data: {
        clusters: [
          { slug: 'foundations', name: 'Foundations', description: '', tier: 1, subconcepts: [], masteredCount: 0, totalCount: 4 },
          { slug: 'strings', name: 'Strings', description: '', tier: 2, subconcepts: [], masteredCount: 0, totalCount: 5 },
        ],
        totalMastered: 0,
        totalSubconcepts: 9,
      },
      loading: false,
      error: null,
      getState: () => 'available',
      refetch: vi.fn(),
    });

    render(<SkillTree />, { wrapper });

    expect(screen.getByText('Foundations')).toBeInTheDocument();
    expect(screen.getByText('Strings')).toBeInTheDocument();
  });

  it('uses dark background', () => {
    vi.mocked(useSkillTree).mockReturnValue({
      data: {
        clusters: [],
        totalMastered: 0,
        totalSubconcepts: 0,
      },
      loading: false,
      error: null,
      getState: () => 'available',
      refetch: vi.fn(),
    });

    const { container } = render(<SkillTree />, { wrapper });

    const treeContainer = container.querySelector('[data-testid="skill-tree-container"]');
    expect(treeContainer).toHaveClass('bg-[var(--bg-surface-1)]');
  });

  it('is horizontally scrollable', () => {
    vi.mocked(useSkillTree).mockReturnValue({
      data: {
        clusters: [],
        totalMastered: 0,
        totalSubconcepts: 0,
      },
      loading: false,
      error: null,
      getState: () => 'available',
      refetch: vi.fn(),
    });

    const { container } = render(<SkillTree />, { wrapper });

    const scrollContainer = container.querySelector('[data-testid="skill-tree-scroll"]');
    expect(scrollContainer).toHaveClass('overflow-x-auto');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/unit/components/skill-tree/SkillTree.test.tsx --run`
Expected: FAIL with "Cannot find module '@/components/skill-tree/SkillTree'"

**Step 3: Write minimal implementation**

```typescript
// src/components/skill-tree/SkillTree.tsx
'use client';

import { useRef, useState, useLayoutEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSkillTree } from '@/lib/hooks/useSkillTree';
import { ConceptCluster } from './ConceptCluster';
import { DependencyLines } from './DependencyLines';

interface SkillTreeProps {
  className?: string;
}

interface Position {
  x: number;
  y: number;
}

// Group clusters by tier for layout
function groupByTier(
  clusters: { slug: string; tier: number }[]
): Map<number, string[]> {
  const groups = new Map<number, string[]>();
  for (const cluster of clusters) {
    const existing = groups.get(cluster.tier) ?? [];
    existing.push(cluster.slug);
    groups.set(cluster.tier, existing);
  }
  return groups;
}

export function SkillTree({ className }: SkillTreeProps) {
  const { data, loading, error } = useSkillTree();
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [nodePositions, setNodePositions] = useState<Record<string, Position>>(
    {}
  );

  // Measure node positions after render
  const updatePositions = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const positions: Record<string, Position> = {};

    nodeRefs.current.forEach((element, slug) => {
      const rect = element.getBoundingClientRect();
      positions[slug] = {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2,
      };
    });

    setNodePositions(positions);
  }, []);

  useLayoutEffect(() => {
    if (data) {
      // Delay to ensure DOM is fully painted
      const timer = setTimeout(updatePositions, 100);
      return () => clearTimeout(timer);
    }
  }, [data, updatePositions]);

  // Register node ref callback
  const registerNode = useCallback((slug: string, element: HTMLElement | null) => {
    if (element) {
      nodeRefs.current.set(slug, element);
    } else {
      nodeRefs.current.delete(slug);
    }
  }, []);

  if (loading) {
    return (
      <div
        data-testid="skill-tree-loading"
        className={cn(
          'rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)]/50 backdrop-blur-sm p-6',
          className
        )}
      >
        <div className="animate-pulse flex gap-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-4 w-20 bg-[var(--bg-surface-3)] rounded" />
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="w-12 h-12 rounded-full bg-[var(--bg-surface-3)]"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'rounded-xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm p-6 text-center',
          className
        )}
      >
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const tierGroups = groupByTier(data.clusters);

  return (
    <div
      data-testid="skill-tree-container"
      className={cn(
        'rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] backdrop-blur-sm',
        className
      )}
    >
      <div
        data-testid="skill-tree-scroll"
        className="overflow-x-auto overflow-y-hidden"
      >
        <div
          ref={containerRef}
          className="relative min-w-max p-6"
          style={{ minHeight: '350px' }}
        >
          {/* Dependency lines SVG overlay */}
          <DependencyLines
            clusters={data.clusters}
            nodePositions={nodePositions}
          />

          {/* Concept clusters in grid */}
          <div className="flex gap-8">
            {Array.from(tierGroups.entries())
              .sort(([a], [b]) => a - b)
              .map(([tier, slugs]) => (
                <div key={tier} className="flex flex-col gap-6">
                  {slugs.map((slug) => {
                    const cluster = data.clusters.find((c) => c.slug === slug);
                    if (!cluster) return null;

                    return (
                      <motion.div
                        key={slug}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: tier * 0.1 }}
                      >
                        <ConceptClusterWithRefs
                          cluster={cluster}
                          registerNode={registerNode}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper to pass ref registration to cluster subconcepts
interface ConceptClusterWithRefsProps {
  cluster: NonNullable<ReturnType<typeof useSkillTree>['data']>['clusters'][0];
  registerNode: (slug: string, element: HTMLElement | null) => void;
}

function ConceptClusterWithRefs({
  cluster,
  registerNode,
}: ConceptClusterWithRefsProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Label and progress badge */}
      <div className="flex items-center gap-2 mb-1">
        <span className="font-display text-sm font-semibold text-[var(--text-primary)]">
          {cluster.name}
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-surface-2)] text-[var(--text-secondary)]">
          {cluster.masteredCount}/{cluster.totalCount}
        </span>
      </div>

      {/* Subconcept nodes with refs */}
      <div className="flex flex-col gap-2">
        {cluster.subconcepts.map((subconcept) => (
          <div
            key={subconcept.slug}
            ref={(el) => registerNode(subconcept.slug, el)}
          >
            <ConceptCluster
              cluster={{
                ...cluster,
                subconcepts: [subconcept],
                masteredCount: subconcept.state === 'mastered' ? 1 : 0,
                totalCount: 1,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

Wait, there's a bug in the implementation - I'm wrapping each subconcept in a ConceptCluster which duplicates labels. Let me fix this:

```typescript
// src/components/skill-tree/SkillTree.tsx
'use client';

import { useRef, useState, useLayoutEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSkillTree } from '@/lib/hooks/useSkillTree';
import { ConceptCluster } from './ConceptCluster';
import { DependencyLines } from './DependencyLines';
import { SubconceptNode } from './SubconceptNode';
import type { SkillTreeCluster } from '@/lib/skill-tree/types';

interface SkillTreeProps {
  className?: string;
}

interface Position {
  x: number;
  y: number;
}

// Group clusters by tier for layout
function groupByTier(
  clusters: { slug: string; tier: number }[]
): Map<number, string[]> {
  const groups = new Map<number, string[]>();
  for (const cluster of clusters) {
    const existing = groups.get(cluster.tier) ?? [];
    existing.push(cluster.slug);
    groups.set(cluster.tier, existing);
  }
  return groups;
}

export function SkillTree({ className }: SkillTreeProps) {
  const { data, loading, error } = useSkillTree();
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [nodePositions, setNodePositions] = useState<Record<string, Position>>(
    {}
  );

  // Measure node positions after render
  const updatePositions = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const positions: Record<string, Position> = {};

    nodeRefs.current.forEach((element, slug) => {
      const rect = element.getBoundingClientRect();
      positions[slug] = {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2,
      };
    });

    setNodePositions(positions);
  }, []);

  useLayoutEffect(() => {
    if (data) {
      // Delay to ensure DOM is fully painted
      const timer = setTimeout(updatePositions, 100);
      return () => clearTimeout(timer);
    }
  }, [data, updatePositions]);

  // Register node ref callback
  const registerNode = useCallback((slug: string, element: HTMLElement | null) => {
    if (element) {
      nodeRefs.current.set(slug, element);
    } else {
      nodeRefs.current.delete(slug);
    }
  }, []);

  if (loading) {
    return (
      <div
        data-testid="skill-tree-loading"
        className={cn(
          'rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)]/50 backdrop-blur-sm p-6',
          className
        )}
      >
        <div className="animate-pulse flex gap-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-4 w-20 bg-[var(--bg-surface-3)] rounded" />
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="w-12 h-12 rounded-full bg-[var(--bg-surface-3)]"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'rounded-xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm p-6 text-center',
          className
        )}
      >
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const tierGroups = groupByTier(data.clusters);

  return (
    <div
      data-testid="skill-tree-container"
      className={cn(
        'rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] backdrop-blur-sm',
        className
      )}
    >
      <div
        data-testid="skill-tree-scroll"
        className="overflow-x-auto overflow-y-hidden"
      >
        <div
          ref={containerRef}
          className="relative min-w-max p-6"
          style={{ minHeight: '350px' }}
        >
          {/* Dependency lines SVG overlay */}
          <DependencyLines
            clusters={data.clusters}
            nodePositions={nodePositions}
          />

          {/* Concept clusters in grid */}
          <div className="flex gap-8">
            {Array.from(tierGroups.entries())
              .sort(([a], [b]) => a - b)
              .map(([tier, slugs]) => (
                <div key={tier} className="flex flex-col gap-6">
                  {slugs.map((slug) => {
                    const cluster = data.clusters.find((c) => c.slug === slug);
                    if (!cluster) return null;

                    return (
                      <motion.div
                        key={slug}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: tier * 0.1 }}
                      >
                        <ClusterWithNodeRefs
                          cluster={cluster}
                          registerNode={registerNode}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper to inject ref registration for dependency line positioning
interface ClusterWithNodeRefsProps {
  cluster: SkillTreeCluster;
  registerNode: (slug: string, element: HTMLElement | null) => void;
}

function ClusterWithNodeRefs({
  cluster,
  registerNode,
}: ClusterWithNodeRefsProps) {
  // Build prereqNames map for tooltips
  const prereqNames: Record<string, string> = {};
  for (const subconcept of cluster.subconcepts) {
    prereqNames[subconcept.slug] = subconcept.name;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Label and progress badge */}
      <div className="flex items-center gap-2 mb-1">
        <span className="font-display text-sm font-semibold text-[var(--text-primary)]">
          {cluster.name}
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-surface-2)] text-[var(--text-secondary)]">
          {cluster.masteredCount}/{cluster.totalCount}
        </span>
      </div>

      {/* Subconcept nodes with refs for line positioning */}
      <div className="flex flex-col gap-2">
        {cluster.subconcepts.map((subconcept) => (
          <div
            key={subconcept.slug}
            ref={(el) => registerNode(subconcept.slug, el)}
          >
            <SubconceptNode node={subconcept} prereqNames={prereqNames} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/unit/components/skill-tree/SkillTree.test.tsx --run`
Expected: PASS

**Step 5: Update barrel exports**

```typescript
// src/components/skill-tree/index.ts
export { SubconceptNode } from './SubconceptNode';
export { ConceptCluster } from './ConceptCluster';
export { DependencyLines } from './DependencyLines';
export { SkillTree } from './SkillTree';
```

Also update main components barrel:

```typescript
// Add to src/components/index.ts
export { SkillTree } from './skill-tree';
```

**Step 6: Commit**

```bash
git add src/components/skill-tree/ src/components/index.ts tests/unit/components/skill-tree/SkillTree.test.tsx
git commit -m "feat(skill-tree): add SkillTree main component"
```

---

## Task 9: Integrate SkillTree into Dashboard

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Test: `tests/e2e/skill-tree.spec.ts` (create new E2E test)

**Step 1: Write the failing E2E test**

```typescript
// tests/e2e/skill-tree.spec.ts
import { test, expect } from '@playwright/test';
import { authenticateUser, createTestUser, deleteTestUser } from './utils/auth';

test.describe('Skill Tree on Dashboard', () => {
  let testUser: { email: string; password: string };

  test.beforeAll(async () => {
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    await deleteTestUser(testUser.email);
  });

  test('displays skill tree section on dashboard', async ({ page }) => {
    await authenticateUser(page, testUser);
    await page.goto('/dashboard');

    // Wait for dashboard to load
    await expect(page.getByText('Your Progress')).toBeVisible();

    // Should see skill tree section
    await expect(page.getByText('Your Learning Path')).toBeVisible();
  });

  test('shows all 10 concept clusters', async ({ page }) => {
    await authenticateUser(page, testUser);
    await page.goto('/dashboard');

    // Wait for skill tree to load
    await expect(
      page.getByTestId('skill-tree-container')
    ).toBeVisible({ timeout: 10000 });

    // Check for concept names
    const conceptNames = [
      'Foundations',
      'Strings',
      'Numbers & Booleans',
      'Collections',
      'Control Flow',
      'Functions',
      'Comprehensions',
      'Error Handling',
      'OOP',
      'Modules & Files',
    ];

    for (const name of conceptNames) {
      await expect(page.getByText(name)).toBeVisible();
    }
  });

  test('shows tooltips on hover', async ({ page }) => {
    await authenticateUser(page, testUser);
    await page.goto('/dashboard');

    // Wait for skill tree to load
    await expect(
      page.getByTestId('skill-tree-container')
    ).toBeVisible({ timeout: 10000 });

    // Find a subconcept node and hover
    const node = page.getByRole('button', { name: 'Variables' });
    await node.hover();

    // Should see tooltip content
    await expect(page.getByText('Ready to learn')).toBeVisible();
  });

  test('shows progress badges', async ({ page }) => {
    await authenticateUser(page, testUser);
    await page.goto('/dashboard');

    // Wait for skill tree to load
    await expect(
      page.getByTestId('skill-tree-container')
    ).toBeVisible({ timeout: 10000 });

    // Should see progress badges (e.g., "0/4" for Foundations)
    await expect(page.getByText('0/4')).toBeVisible();
  });

  test('is horizontally scrollable on small screens', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    await authenticateUser(page, testUser);
    await page.goto('/dashboard');

    // Wait for skill tree to load
    await expect(
      page.getByTestId('skill-tree-container')
    ).toBeVisible({ timeout: 10000 });

    // The scroll container should exist
    const scrollContainer = page.getByTestId('skill-tree-scroll');
    await expect(scrollContainer).toBeVisible();

    // Content should be wider than container (scrollable)
    const scrollWidth = await scrollContainer.evaluate(
      (el) => el.scrollWidth
    );
    const clientWidth = await scrollContainer.evaluate(
      (el) => el.clientWidth
    );
    expect(scrollWidth).toBeGreaterThan(clientWidth);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test:e2e tests/e2e/skill-tree.spec.ts`
Expected: FAIL with "Your Learning Path" not found

**Step 3: Modify dashboard page**

Add to `src/app/dashboard/page.tsx`, after the Quick Actions section (around line 236):

```typescript
// Import at top of file
import { SkillTree } from '@/components';

// Add after Quick Actions motion.div (around line 236)
          {/* Skill Tree Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
              Your Learning Path
            </h2>
            <SkillTree />
          </motion.div>
```

**Step 4: Run test to verify it passes**

Run: `pnpm test:e2e tests/e2e/skill-tree.spec.ts`
Expected: PASS

**Step 5: Run full test suite**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: All pass

**Step 6: Commit**

```bash
git add src/app/dashboard/page.tsx tests/e2e/skill-tree.spec.ts
git commit -m "feat(dashboard): integrate SkillTree visualization"
```

---

## Task 10: Update Documentation

**Files:**
- Modify: `CLAUDE.md` (add milestone)
- Modify: Obsidian vault docs (if applicable)

**Step 1: Update CLAUDE.md**

Add to the "Completed Milestones" section:

```markdown
25. ✅ Skill Tree Progress Visualization - Visual skill tree on dashboard showing all 54 subconcepts as connected nodes. Four node states (locked, available, in-progress, mastered) based on FSRS stability. useSkillTree hook for data fetching and state computation. Components: SkillTree, ConceptCluster, SubconceptNode, DependencyLines. SVG bezier curves for dependency lines. Framer Motion animations. Horizontal scroll for mobile. Design doc: `docs/plans/2026-01-07-skill-tree-progress-design.md`.
```

Update "Current Status" at top:

```markdown
**Current Status:** Skill Tree Visualization Complete - Dashboard now shows visual skill tree with 54 subconcept nodes across 10 concepts. FSRS-based mastery tracking (stability ≥ 7 days = mastered). Interactive tooltips, dependency lines, staggered animations.
```

**Step 2: Run final verification**

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Expected: All pass

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add skill tree to completed milestones"
```

---

## Task 11: Run All Tests and Create Summary

**Step 1: Run complete test suite**

```bash
pnpm test --run
pnpm typecheck
pnpm lint
pnpm test:e2e
```

**Step 2: Generate test count summary**

The new tests added:
- `tests/unit/skill-tree/types.test.ts` (~5 tests)
- `tests/unit/skill-tree/get-state.test.ts` (~10 tests)
- `tests/unit/skill-tree/build-tree.test.ts` (~10 tests)
- `tests/unit/hooks/useSkillTree.test.tsx` (~6 tests)
- `tests/unit/components/skill-tree/SubconceptNode.test.tsx` (~10 tests)
- `tests/unit/components/skill-tree/ConceptCluster.test.tsx` (~6 tests)
- `tests/unit/components/skill-tree/DependencyLines.test.tsx` (~5 tests)
- `tests/unit/components/skill-tree/SkillTree.test.tsx` (~6 tests)
- `tests/e2e/skill-tree.spec.ts` (~5 tests)

**Total new tests: ~63**

**Step 3: Final commit (if not already done)**

```bash
git status
# If there are uncommitted changes
git add .
git commit -m "test: complete skill tree test coverage"
```

---

## Summary

### Files Created (12)
- `src/lib/skill-tree/types.ts`
- `src/lib/skill-tree/build-tree.ts`
- `src/lib/skill-tree/index.ts`
- `src/lib/hooks/useSkillTree.ts`
- `src/components/skill-tree/SubconceptNode.tsx`
- `src/components/skill-tree/ConceptCluster.tsx`
- `src/components/skill-tree/DependencyLines.tsx`
- `src/components/skill-tree/SkillTree.tsx`
- `src/components/skill-tree/index.ts`
- `tests/unit/skill-tree/*.test.ts` (3 files)
- `tests/unit/hooks/useSkillTree.test.tsx`
- `tests/unit/components/skill-tree/*.test.tsx` (4 files)
- `tests/e2e/skill-tree.spec.ts`

### Files Modified (3)
- `src/lib/hooks/index.ts` (add useSkillTree export)
- `src/components/index.ts` (add SkillTree export)
- `src/app/dashboard/page.tsx` (integrate SkillTree)
- `CLAUDE.md` (update milestones)

### Commits (11)
1. `feat(skill-tree): add SubconceptState types and interfaces`
2. `feat(skill-tree): add getSubconceptState function`
3. `feat(skill-tree): add buildSkillTreeData function`
4. `feat(skill-tree): add useSkillTree hook`
5. `feat(skill-tree): add SubconceptNode component`
6. `feat(skill-tree): add ConceptCluster component`
7. `feat(skill-tree): add DependencyLines SVG component`
8. `feat(skill-tree): add SkillTree main component`
9. `feat(dashboard): integrate SkillTree visualization`
10. `docs: add skill tree to completed milestones`
11. `test: complete skill tree test coverage`

### Extension Points

The implementation is designed for easy extension:

1. **New states**: Add to `SUBCONCEPT_STATES` array and `stateStyles` map
2. **Different mastery thresholds**: Change `MASTERY_THRESHOLD_DAYS` constant
3. **Click-to-practice**: Add `onClick` prop to SubconceptNode
4. **New languages**: The hook and components work with any curriculum JSON
5. **Custom animations**: Framer Motion variants can be easily customized
6. **Additional node data**: Extend `SkillTreeNode` interface
