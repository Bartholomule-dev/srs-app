// tests/unit/components/session/AchievementUnlockHandler.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AchievementUnlockHandler } from '@/components/session/AchievementUnlockHandler';
import { supabase } from '@/lib/supabase/client';
import { ACHIEVEMENTS } from '@/lib/gamification/achievements';

// Mock supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

// Mock useAchievements hook
const mockRefetch = vi.fn();
vi.mock('@/lib/hooks/useAchievements', () => ({
  useAchievements: () => ({
    refetch: mockRefetch,
  }),
}));

// Mock confetti
vi.mock('@/lib/confetti', () => ({
  fireConfetti: vi.fn(),
}));

// Helper to create a valid Postgrest response
function mockRpcSuccess(data: { newly_unlocked: string[]; all_unlocked: string[] }) {
  return {
    data,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK',
  };
}

function mockRpcError(message: string) {
  // Type assertion needed since Supabase types don't properly support error case
  return {
    data: null,
    error: { message, code: '500', details: '', hint: '' },
    count: null,
    status: 500,
    statusText: 'Internal Server Error',
  } as unknown as ReturnType<typeof mockRpcSuccess>;
}

describe('AchievementUnlockHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RPC calls', () => {
    it('calls check_achievements RPC on mount', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue(
        mockRpcSuccess({ newly_unlocked: [], all_unlocked: [] })
      );

      render(<AchievementUnlockHandler userId="user-1" />);

      await waitFor(() => {
        expect(supabase.rpc).toHaveBeenCalledWith('check_achievements', {
          p_user_id: 'user-1',
        });
      });
    });

    it('calls refetch on useAchievements after unlocks', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue(
        mockRpcSuccess({ newly_unlocked: ['first-steps'], all_unlocked: ['first-steps'] })
      );

      render(<AchievementUnlockHandler userId="user-1" />);

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });

    it('handles RPC error gracefully', async () => {
      const onComplete = vi.fn();
      vi.mocked(supabase.rpc).mockResolvedValue(mockRpcError('Database error'));

      render(<AchievementUnlockHandler userId="user-1" onComplete={onComplete} />);

      // Should still call onComplete even on error
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });

  describe('toast display', () => {
    it('shows toast for newly unlocked achievement', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue(
        mockRpcSuccess({ newly_unlocked: ['first-steps'], all_unlocked: ['first-steps'] })
      );

      render(<AchievementUnlockHandler userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText('Achievement Unlocked!')).toBeInTheDocument();
      });
      expect(screen.getByText('First Steps')).toBeInTheDocument();
    });

    it('shows achievement description in toast', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue(
        mockRpcSuccess({ newly_unlocked: ['first-steps'], all_unlocked: ['first-steps'] })
      );

      render(<AchievementUnlockHandler userId="user-1" />);

      await waitFor(() => {
        expect(
          screen.getByText(ACHIEVEMENTS['first-steps'].description)
        ).toBeInTheDocument();
      });
    });

    it('does not show toast for already unlocked achievements', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue(
        mockRpcSuccess({ newly_unlocked: [], all_unlocked: ['first-steps'] })
      );

      render(<AchievementUnlockHandler userId="user-1" />);

      // Wait for RPC to complete
      await waitFor(() => {
        expect(supabase.rpc).toHaveBeenCalled();
      });

      // Short wait to allow any potential renders
      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      // No toast should be shown
      expect(screen.queryByText('Achievement Unlocked!')).not.toBeInTheDocument();
    });

    it('renders null when not showing any toast', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue(
        mockRpcSuccess({ newly_unlocked: [], all_unlocked: [] })
      );

      const { container } = render(<AchievementUnlockHandler userId="user-1" />);

      await waitFor(() => {
        expect(supabase.rpc).toHaveBeenCalled();
      });

      // Short wait to allow any potential renders
      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      // Container should be empty (no toast to show)
      expect(container.firstChild).toBeNull();
    });

    it('handles unknown achievement slug gracefully', async () => {
      const onComplete = vi.fn();
      vi.mocked(supabase.rpc).mockResolvedValue(
        mockRpcSuccess({
          newly_unlocked: ['unknown-achievement-slug'],
          all_unlocked: ['unknown-achievement-slug'],
        })
      );

      render(<AchievementUnlockHandler userId="user-1" onComplete={onComplete} />);

      // Should not crash and should call onComplete
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });

  describe('onComplete callback', () => {
    it('calls onComplete after toasts shown when no achievements', async () => {
      const onComplete = vi.fn();
      vi.mocked(supabase.rpc).mockResolvedValue(
        mockRpcSuccess({ newly_unlocked: [], all_unlocked: [] })
      );

      render(<AchievementUnlockHandler userId="user-1" onComplete={onComplete} />);

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });

  describe('confetti effects', () => {
    it('fires confetti for gold tier achievement', async () => {
      const { fireConfetti } = await import('@/lib/confetti');
      vi.mocked(supabase.rpc).mockResolvedValue(
        mockRpcSuccess({ newly_unlocked: ['gold-standard'], all_unlocked: ['gold-standard'] })
      );

      render(<AchievementUnlockHandler userId="user-1" />);

      await waitFor(() => {
        expect(fireConfetti).toHaveBeenCalled();
      });
    });

    it('fires confetti for platinum tier achievement', async () => {
      const { fireConfetti } = await import('@/lib/confetti');
      vi.mocked(supabase.rpc).mockResolvedValue(
        mockRpcSuccess({ newly_unlocked: ['platinum-club'], all_unlocked: ['platinum-club'] })
      );

      render(<AchievementUnlockHandler userId="user-1" />);

      await waitFor(() => {
        expect(fireConfetti).toHaveBeenCalled();
      });
    });

    it('does not fire confetti for regular achievements', async () => {
      const { fireConfetti } = await import('@/lib/confetti');
      vi.mocked(supabase.rpc).mockResolvedValue(
        mockRpcSuccess({ newly_unlocked: ['first-steps'], all_unlocked: ['first-steps'] })
      );

      render(<AchievementUnlockHandler userId="user-1" />);

      // Wait for toast to appear (proving the handler ran)
      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument();
      });

      // Confetti should NOT have been called for first-steps
      expect(fireConfetti).not.toHaveBeenCalled();
    });
  });

  describe('toast timing with fake timers', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('staggers multiple toasts', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue(
        mockRpcSuccess({
          newly_unlocked: ['first-steps', 'week-warrior'],
          all_unlocked: ['first-steps', 'week-warrior'],
        })
      );

      render(<AchievementUnlockHandler userId="user-1" />);

      // First toast should appear
      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument();
      });

      // Initially only first toast visible
      expect(screen.queryByText('Week Warrior')).not.toBeInTheDocument();

      // Advance timers to trigger toast dismissal (auto-dismiss after 5000ms)
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // After dismissal + stagger delay (500ms), second toast should appear
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      // Second toast should now be visible
      await waitFor(() => {
        expect(screen.getByText('Week Warrior')).toBeInTheDocument();
      });
    });

    it('calls onComplete after all toasts are dismissed', async () => {
      const onComplete = vi.fn();
      vi.mocked(supabase.rpc).mockResolvedValue(
        mockRpcSuccess({ newly_unlocked: ['first-steps'], all_unlocked: ['first-steps'] })
      );

      render(<AchievementUnlockHandler userId="user-1" onComplete={onComplete} />);

      // Wait for toast to appear
      await waitFor(() => {
        expect(screen.getByText('First Steps')).toBeInTheDocument();
      });

      // onComplete should not be called yet (toast still showing)
      expect(onComplete).not.toHaveBeenCalled();

      // Advance past toast duration to trigger auto-dismiss
      await act(async () => {
        vi.advanceTimersByTime(5100);
      });

      // Now onComplete should be called
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });
});
