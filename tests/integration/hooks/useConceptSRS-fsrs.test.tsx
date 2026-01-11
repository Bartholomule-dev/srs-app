// tests/integration/hooks/useConceptSRS-fsrs.test.tsx
// Integration tests for useConceptSRS hook with FSRS algorithm
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useConceptSRS } from '@/lib/hooks/useConceptSRS';
import { STATE_MAP } from '@/lib/srs/fsrs/types';

// Mock user
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
};

// Mock useAuth BEFORE any imports that might use it
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    signOut: vi.fn(),
  }),
}));

// Mock Supabase responses
let mockSubconceptProgress: Array<{
  id: string;
  user_id: string;
  language: string;
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
}> = [];

let mockExerciseAttempts: Array<{
  id: string;
  user_id: string;
  language: string;
  exercise_slug: string;
  times_seen: number;
  times_correct: number;
  last_seen_at: string | null;
  created_at: string;
}> = [];

// Track upsert calls for verification
let lastUpsertData: Record<string, unknown> | null = null;

// Mock Supabase client
// The chain supports: .eq('user_id', x).eq('language', y).lte('next_review', z)
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'subconcept_progress') {
        return {
          select: () => {
            // Track filter conditions through the chain
            let userId: string | null = null;
            let language: string | null = null;
            let subconceptSlug: string | null = null;

            const createChain = () => ({
              eq: (col: string, val: string) => {
                if (col === 'user_id') userId = val;
                if (col === 'language') language = val;
                if (col === 'subconcept_slug') subconceptSlug = val;
                return createChain();
              },
              lte: () =>
                Promise.resolve({
                  data: mockSubconceptProgress.filter(
                    (p) =>
                      (userId === null || p.user_id === userId) &&
                      (language === null || p.language === language) &&
                      new Date(p.next_review) <= new Date()
                  ),
                  error: null,
                }),
              single: () => {
                const found = mockSubconceptProgress.find(
                  (p) =>
                    (userId === null || p.user_id === userId) &&
                    (language === null || p.language === language) &&
                    (subconceptSlug === null || p.subconcept_slug === subconceptSlug)
                );
                return Promise.resolve({
                  data: found ?? null,
                  error: found ? null : { code: 'PGRST116' },
                });
              },
            });

            return createChain();
          },
          upsert: (data: Record<string, unknown>) => {
            lastUpsertData = data;
            // Simulate upsert with language support
            const existing = mockSubconceptProgress.findIndex(
              (p) =>
                p.user_id === data.user_id &&
                p.language === data.language &&
                p.subconcept_slug === data.subconcept_slug
            );
            if (existing >= 0) {
              mockSubconceptProgress[existing] = {
                ...mockSubconceptProgress[existing],
                ...data,
                updated_at: new Date().toISOString(),
              } as typeof mockSubconceptProgress[0];
            } else {
              mockSubconceptProgress.push({
                id: `sp-${Date.now()}`,
                language: 'python', // default
                ...data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as typeof mockSubconceptProgress[0]);
            }
            return {
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: mockSubconceptProgress.find(
                      (p) =>
                        p.user_id === data.user_id &&
                        p.language === data.language &&
                        p.subconcept_slug === data.subconcept_slug
                    ),
                    error: null,
                  }),
              }),
            };
          },
        };
      }
      if (table === 'exercise_attempts') {
        return {
          select: () => {
            // Track filter conditions through the chain
            let userId: string | null = null;
            let language: string | null = null;

            const createChain = () => ({
              eq: (col: string, val: string) => {
                if (col === 'user_id') userId = val;
                if (col === 'language') language = val;
                return createChain();
              },
              lte: () =>
                Promise.resolve({
                  data: mockExerciseAttempts.filter(
                    (a) =>
                      (userId === null || a.user_id === userId) &&
                      (language === null || a.language === language)
                  ),
                  error: null,
                }),
            });

            // Return result immediately if no chain continues
            return {
              ...createChain(),
              then: (resolve: (arg: { data: typeof mockExerciseAttempts; error: null }) => void) =>
                resolve({
                  data: mockExerciseAttempts.filter(
                    (a) =>
                      (userId === null || a.user_id === userId) &&
                      (language === null || a.language === language)
                  ),
                  error: null,
                }),
            };
          },
          upsert: (data: Record<string, unknown>) => {
            const existing = mockExerciseAttempts.findIndex(
              (a) =>
                a.user_id === data.user_id &&
                a.language === data.language &&
                a.exercise_slug === data.exercise_slug
            );
            if (existing >= 0) {
              mockExerciseAttempts[existing] = {
                ...mockExerciseAttempts[existing],
                ...data,
              } as typeof mockExerciseAttempts[0];
            } else {
              mockExerciseAttempts.push({
                id: `ea-${Date.now()}`,
                language: 'python', // default
                ...data,
                created_at: new Date().toISOString(),
              } as typeof mockExerciseAttempts[0]);
            }
            return {
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: mockExerciseAttempts.find(
                      (a) =>
                        a.user_id === data.user_id &&
                        a.language === data.language &&
                        a.exercise_slug === data.exercise_slug
                    ),
                    error: null,
                  }),
              }),
            };
          },
        };
      }
      return {
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
      };
    },
  },
}));


describe('useConceptSRS FSRS Integration', () => {
  beforeEach(() => {
    mockSubconceptProgress = [];
    mockExerciseAttempts = [];
    lastUpsertData = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty due list when no progress exists', async () => {
    const { result } = renderHook(() => useConceptSRS());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.dueSubconcepts).toHaveLength(0);
    expect(result.current.currentSubconcept).toBeNull();
  });

  it('returns due subconcepts sorted by next_review', async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    mockSubconceptProgress = [
      {
        id: 'sp-1',
        user_id: mockUser.id,
        language: 'python',
        subconcept_slug: 'for',
        concept_slug: 'loops',
        stability: 5,
        difficulty: 0.3,
        fsrs_state: 2, // Review
        reps: 3,
        lapses: 0,
        elapsed_days: 1,
        scheduled_days: 1,
        next_review: yesterday.toISOString(), // Due 1 day ago
        last_reviewed: twoDaysAgo.toISOString(),
        created_at: twoDaysAgo.toISOString(),
        updated_at: yesterday.toISOString(),
      },
      {
        id: 'sp-2',
        user_id: mockUser.id,
        language: 'python',
        subconcept_slug: 'while',
        concept_slug: 'loops',
        stability: 3,
        difficulty: 0.4,
        fsrs_state: 2,
        reps: 2,
        lapses: 0,
        elapsed_days: 1,
        scheduled_days: 1,
        next_review: twoDaysAgo.toISOString(), // Due 2 days ago (more overdue)
        last_reviewed: twoDaysAgo.toISOString(),
        created_at: twoDaysAgo.toISOString(),
        updated_at: twoDaysAgo.toISOString(),
      },
    ];

    const { result } = renderHook(() => useConceptSRS());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.dueSubconcepts).toHaveLength(2);
    // Most overdue first
    expect(result.current.dueSubconcepts[0].subconceptSlug).toBe('while');
    expect(result.current.currentSubconcept?.subconceptSlug).toBe('while');
  });

  it('records review result with FSRS fields', async () => {
    const now = new Date();

    mockSubconceptProgress = [
      {
        id: 'sp-1',
        user_id: mockUser.id,
        language: 'python',
        subconcept_slug: 'for',
        concept_slug: 'loops',
        stability: 0,
        difficulty: 0,
        fsrs_state: 0, // New
        reps: 0,
        lapses: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        next_review: now.toISOString(),
        last_reviewed: null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
    ];

    const { result } = renderHook(() => useConceptSRS());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Record a Good review (quality 4)
    await act(async () => {
      await result.current.recordSubconceptResult(
        'for',
        'loops',
        4, // Good quality
        'for-loop-basic',
        true
      );
    });

    // Verify FSRS fields were upserted
    expect(lastUpsertData).not.toBeNull();
    expect(lastUpsertData!.subconcept_slug).toBe('for');
    expect(lastUpsertData!.stability).toBeGreaterThan(0);
    expect(lastUpsertData!.fsrs_state).toBe(STATE_MAP['Learning']);
    expect(lastUpsertData!.reps).toBeGreaterThan(0);
  });

  it('calculates correct next_review based on rating', async () => {
    const now = new Date();

    mockSubconceptProgress = [
      {
        id: 'sp-1',
        user_id: mockUser.id,
        language: 'python',
        subconcept_slug: 'for',
        concept_slug: 'loops',
        stability: 5,
        difficulty: 0.3,
        fsrs_state: 2, // Review state
        reps: 5,
        lapses: 0,
        elapsed_days: 3,
        scheduled_days: 3,
        next_review: now.toISOString(),
        last_reviewed: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
    ];

    const { result } = renderHook(() => useConceptSRS());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Record an Easy review (quality 5)
    await act(async () => {
      await result.current.recordSubconceptResult(
        'for',
        'loops',
        5, // Easy quality
        'for-loop-basic',
        true
      );
    });

    // Next review should be in the future
    const nextReviewDate = new Date(lastUpsertData!.next_review as string);
    expect(nextReviewDate.getTime()).toBeGreaterThan(now.getTime());
  });

  it('increments lapses on failed review from Review state', async () => {
    const now = new Date();

    mockSubconceptProgress = [
      {
        id: 'sp-1',
        user_id: mockUser.id,
        language: 'python',
        subconcept_slug: 'for',
        concept_slug: 'loops',
        stability: 10,
        difficulty: 0.3,
        fsrs_state: 2, // Review state
        reps: 5,
        lapses: 0, // No lapses yet
        elapsed_days: 5,
        scheduled_days: 5,
        next_review: now.toISOString(),
        last_reviewed: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
    ];

    const { result } = renderHook(() => useConceptSRS());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Record a failed review (quality 1 = Again)
    await act(async () => {
      await result.current.recordSubconceptResult(
        'for',
        'loops',
        1, // Failed
        'for-loop-basic',
        false
      );
    });

    // Lapses should increment and state should be Relearning
    expect(lastUpsertData!.lapses).toBe(1);
    expect(lastUpsertData!.fsrs_state).toBe(STATE_MAP['Relearning']);
  });

  it('removes reviewed subconcept from due list (optimistic update)', async () => {
    const now = new Date();

    mockSubconceptProgress = [
      {
        id: 'sp-1',
        user_id: mockUser.id,
        language: 'python',
        subconcept_slug: 'for',
        concept_slug: 'loops',
        stability: 0,
        difficulty: 0,
        fsrs_state: 0,
        reps: 0,
        lapses: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        next_review: now.toISOString(),
        last_reviewed: null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      {
        id: 'sp-2',
        user_id: mockUser.id,
        language: 'python',
        subconcept_slug: 'while',
        concept_slug: 'loops',
        stability: 0,
        difficulty: 0,
        fsrs_state: 0,
        reps: 0,
        lapses: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        next_review: now.toISOString(),
        last_reviewed: null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
    ];

    const { result } = renderHook(() => useConceptSRS());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.dueSubconcepts).toHaveLength(2);

    // Record review for first subconcept
    await act(async () => {
      await result.current.recordSubconceptResult(
        'for',
        'loops',
        4,
        'for-loop-basic',
        true
      );
    });

    // Should be removed from due list
    expect(result.current.dueSubconcepts).toHaveLength(1);
    expect(result.current.dueSubconcepts[0].subconceptSlug).toBe('while');
  });
});
