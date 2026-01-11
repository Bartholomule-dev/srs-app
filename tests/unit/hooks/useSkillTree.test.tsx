// tests/unit/hooks/useSkillTree.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSkillTree } from '@/lib/hooks/useSkillTree';
import { AuthProvider } from '@/lib/context/AuthContext';
import type { ReactNode } from 'react';

// Helper to create chainable mock for Supabase queries
function createQueryMock(resolvedValue: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eqMock: any = vi.fn(() => Promise.resolve(resolvedValue));
  // Allow chaining multiple .eq() calls
  eqMock.mockImplementation(() => ({
    eq: eqMock,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    then: (resolve: any) => Promise.resolve(resolvedValue).then(resolve),
  }));
  return {
    select: vi.fn(() => ({
      eq: eqMock,
    })),
    _eqMock: eqMock,
  };
}

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
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
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

    const queryMock = createQueryMock({ data: [], error: null });
    vi.mocked(supabase.from).mockReturnValue(queryMock as never);

    const { result } = renderHook(() => useSkillTree(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.clusters).toHaveLength(11);
    expect(result.current.data?.totalSubconcepts).toBe(65);
  });

  it('computes states from fetched progress (fast-track mastery)', async () => {
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
        stability: 21, // Fast-track mastery threshold (>= MASTERY_STABILITY_FAST)
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

    const queryMock = createQueryMock({ data: mockProgress, error: null });
    vi.mocked(supabase.from).mockReturnValue(queryMock as never);

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

  it('computes proficient state for intermediate progress', async () => {
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
        stability: 10, // Proficient threshold (>= PROFICIENT_STABILITY)
        difficulty: 5,
        fsrs_state: 2,
        reps: 2, // Meets PROFICIENT_REPS but not MASTERY_REPS
        lapses: 0,
        elapsed_days: 1,
        scheduled_days: 7,
        next_review: new Date().toISOString(),
        last_reviewed: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const queryMock = createQueryMock({ data: mockProgress, error: null });
    vi.mocked(supabase.from).mockReturnValue(queryMock as never);

    const { result } = renderHook(() => useSkillTree(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should not count as mastered
    expect(result.current.data?.totalMastered).toBe(0);

    const foundations = result.current.data?.clusters.find(
      (c) => c.slug === 'foundations'
    );
    const variables = foundations?.subconcepts.find((s) => s.slug === 'variables');
    expect(variables?.state).toBe('proficient');
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

    const queryMock = createQueryMock({ data: null, error: { message: 'Database error' } });
    vi.mocked(supabase.from).mockReturnValue(queryMock as never);

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

    const queryMock = createQueryMock({ data: [], error: null });
    vi.mocked(supabase.from).mockReturnValue(queryMock as never);

    const { result } = renderHook(() => useSkillTree(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // getState should return the state for any subconcept
    expect(result.current.getState('variables')).toBe('available');
    expect(result.current.getState('operators')).toBe('locked'); // prereq not met
  });

  describe('language parameter', () => {
    it('loads curriculum for specified language (python)', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as never);

      const queryMock = createQueryMock({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(queryMock as never);

      const { result } = renderHook(() => useSkillTree('python'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Python curriculum has 11 clusters (concepts)
      expect(result.current.data?.clusters).toHaveLength(11);
      expect(result.current.data?.totalSubconcepts).toBe(65);
    });

    it('loads curriculum for javascript language', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as never);

      const queryMock = createQueryMock({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(queryMock as never);

      const { result } = renderHook(() => useSkillTree('javascript'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // JavaScript curriculum has 3 clusters (concepts)
      expect(result.current.data?.clusters).toHaveLength(3);
      // JavaScript has fewer subconcepts (9 total in the current curriculum)
      expect(result.current.data?.totalSubconcepts).toBe(9);
    });

    it('filters progress by language in query', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as never);

      const queryMock = createQueryMock({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(queryMock as never);

      renderHook(() => useSkillTree('javascript'), { wrapper });

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('subconcept_progress');
      });

      // Verify that .eq was called (for user_id and language)
      expect(queryMock._eqMock).toHaveBeenCalled();
    });

    it('defaults to python when no language specified', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as never);

      const queryMock = createQueryMock({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(queryMock as never);

      const { result } = renderHook(() => useSkillTree(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should load Python curriculum by default
      expect(result.current.data?.clusters).toHaveLength(11);
    });

    it('refetches when language changes', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as never);

      const queryMock = createQueryMock({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(queryMock as never);

      const { result, rerender } = renderHook(
        ({ lang }) => useSkillTree(lang),
        { wrapper, initialProps: { lang: 'python' } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.clusters).toHaveLength(11);

      // Change to JavaScript
      rerender({ lang: 'javascript' });

      await waitFor(() => {
        expect(result.current.data?.clusters).toHaveLength(3);
      });
    });
  });
});
