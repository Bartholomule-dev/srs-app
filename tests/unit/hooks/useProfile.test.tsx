import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useProfile } from '@/lib/hooks/useProfile';
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
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
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

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading true while fetching', async () => {
    // Use a deferred promise to control when getUser resolves
    // This keeps AuthProvider in loading state, which means useProfile stays loading too
    let resolveGetUser: (value: any) => void;
    const getUserPromise = new Promise((resolve) => {
      resolveGetUser = resolve;
    });
    vi.mocked(supabase.auth.getUser).mockReturnValue(getUserPromise as any);

    const { result } = renderHook(() => useProfile(), { wrapper });

    // Profile hook starts in loading state
    expect(result.current.loading).toBe(true);

    // Resolve the promise to clean up
    await act(async () => {
      resolveGetUser!({ data: { user: null }, error: null });
      await getUserPromise;
    });
  });

  it('returns profile after loading', async () => {
    const mockProfile = {
      id: 'test-user-id',
      username: null,
      display_name: 'Test User',
      avatar_url: null,
      preferred_language: 'python',
      daily_goal: 10,
      notification_time: null,
      current_streak: 5,
      longest_streak: 10,
      total_exercises_completed: 50,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
    };

    // Set up auth mock first
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as any);

    // Set up profile fetch mock
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBeDefined();
    expect(result.current.profile?.displayName).toBe('Test User');
    expect(result.current.profile?.currentStreak).toBe(5);
  });

  it('returns null profile when user is not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBeNull();
  });

  it('sets error when fetch fails', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as any);

    const mockError = { message: 'Database error', code: 'PGRST116' };
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });

  describe('updateProfile', () => {
    const mockProfile = {
      id: 'test-user-id',
      username: null,
      display_name: 'Test User',
      avatar_url: null,
      preferred_language: 'python',
      daily_goal: 10,
      notification_time: null,
      current_streak: 5,
      longest_streak: 10,
      total_exercises_completed: 50,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
    };

    it('calls supabase and updates local state', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const updatedDbProfile = {
        ...mockProfile,
        display_name: 'Updated Name',
        daily_goal: 20,
      };

      const singleMock = vi.fn();
      const selectMock = vi.fn().mockReturnValue({ single: singleMock });
      const eqMock = vi.fn().mockReturnValue({ select: selectMock });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

      const mockFrom = vi.mocked(supabase.from);
      // First call for initial fetch, subsequent calls for update
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
              }),
            }),
            update: updateMock,
          } as any;
        }
        return {} as any;
      });

      // Mock the update to return the updated profile
      singleMock.mockResolvedValue({ data: updatedDbProfile, error: null });

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Call updateProfile
      let updatedProfile: any;
      await act(async () => {
        updatedProfile = await result.current.updateProfile({
          displayName: 'Updated Name',
          dailyGoal: 20,
        });
      });

      // Verify supabase was called with the right table
      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(updateMock).toHaveBeenCalled();

      // Verify the returned profile has updated values
      expect(updatedProfile.displayName).toBe('Updated Name');
      expect(updatedProfile.dailyGoal).toBe(20);

      // Verify local state is updated
      expect(result.current.profile?.displayName).toBe('Updated Name');
      expect(result.current.profile?.dailyGoal).toBe(20);
    });

    it('throws when user is not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Attempt to update profile without being authenticated
      await expect(
        result.current.updateProfile({ displayName: 'New Name' })
      ).rejects.toThrow('Must be authenticated to update profile');
    });

    it('handles errors from database', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      // PostgrestError requires code, details, hint, and message fields
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { 
          message: 'Update failed', 
          code: 'PGRST116',
          details: null,
          hint: null,
        },
      });
      const selectMock = vi.fn().mockReturnValue({ single: singleMock });
      const eqMock = vi.fn().mockReturnValue({ select: selectMock });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
              }),
            }),
            update: updateMock,
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // PGRST116 is mapped to "Resource not found" by handleSupabaseError
      await expect(
        result.current.updateProfile({ displayName: 'New Name' })
      ).rejects.toThrow('Resource not found');
    });
  });

  describe('updateExperienceLevel', () => {
    const mockProfile = {
      id: 'test-user-id',
      username: null,
      display_name: 'Test User',
      avatar_url: null,
      preferred_language: 'python',
      daily_goal: 10,
      notification_time: null,
      current_streak: 5,
      longest_streak: 10,
      total_exercises_completed: 50,
      experience_level: 'refresher',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
    };

    it('updates experience level in database and local state', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
              }),
            }),
            update: updateMock,
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useProfile(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.profile).not.toBeNull();
      });

      // Verify initial experience level
      expect(result.current.profile?.experienceLevel).toBe('refresher');

      // Update experience level
      await act(async () => {
        await result.current.updateExperienceLevel('beginner');
      });

      // Verify supabase was called correctly
      expect(updateMock).toHaveBeenCalledWith({ experience_level: 'beginner' });
      expect(eqMock).toHaveBeenCalledWith('id', 'test-user-id');

      // Verify local state is updated
      expect(result.current.profile?.experienceLevel).toBe('beginner');
    });

    it('does nothing when profile is null', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const mockFrom = vi.mocked(supabase.from);
      const updateMock = vi.fn();
      mockFrom.mockReturnValue({
        update: updateMock,
      } as any);

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Profile should be null
      expect(result.current.profile).toBeNull();

      // Try to update experience level
      await act(async () => {
        await result.current.updateExperienceLevel('beginner');
      });

      // Update should not have been called
      expect(updateMock).not.toHaveBeenCalled();
    });

    it('logs error but does not throw when update fails', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const updateError = { message: 'Update failed', code: 'PGRST116' };
      const eqMock = vi.fn().mockResolvedValue({ error: updateError });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
              }),
            }),
            update: updateMock,
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.profile).not.toBeNull();
      });

      // Try to update experience level
      await act(async () => {
        await result.current.updateExperienceLevel('learning');
      });

      // Should log error
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to update experience level:',
        updateError
      );

      // State should not be updated
      expect(result.current.profile?.experienceLevel).toBe('refresher');

      consoleSpy.mockRestore();
    });
  });

  describe('refetch', () => {
    it('triggers a new fetch of the profile', async () => {
      const initialProfile = {
        id: 'test-user-id',
        username: null,
        display_name: 'Initial Name',
        avatar_url: null,
        preferred_language: 'python',
        daily_goal: 10,
        notification_time: null,
        current_streak: 5,
        longest_streak: 10,
        total_exercises_completed: 50,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      };

      const updatedProfile = {
        ...initialProfile,
        display_name: 'Updated Name',
        current_streak: 6,
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      let fetchCount = 0;
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(() => {
              fetchCount++;
              // Return different profile on second fetch
              const profile = fetchCount === 1 ? initialProfile : updatedProfile;
              return Promise.resolve({ data: profile, error: null });
            }),
          }),
        }),
      } as any));

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify initial profile
      expect(result.current.profile?.displayName).toBe('Initial Name');
      expect(fetchCount).toBe(1);

      // Call refetch
      await act(async () => {
        result.current.refetch();
      });

      // Wait for the refetch to complete
      await waitFor(() => {
        expect(result.current.profile?.displayName).toBe('Updated Name');
      });

      // Verify fetch was called again
      expect(fetchCount).toBe(2);
      expect(result.current.profile?.currentStreak).toBe(6);
    });
  });
});
