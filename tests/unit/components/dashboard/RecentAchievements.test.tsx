import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentAchievements } from '@/components/dashboard/RecentAchievements';

vi.mock('@/lib/hooks/useAchievements', () => ({
  useAchievements: vi.fn(),
}));

import { useAchievements } from '@/lib/hooks/useAchievements';
import { ACHIEVEMENTS } from '@/lib/gamification/achievements';

describe('RecentAchievements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders section header', () => {
    (useAchievements as ReturnType<typeof vi.fn>).mockReturnValue({
      achievements: [],
      unlockedCount: 0,
      loading: false,
    });

    render(<RecentAchievements />);
    expect(screen.getByText('Recent Achievements')).toBeInTheDocument();
  });

  it('shows up to 3 recent achievements', () => {
    const mockAchievements = [
      { ...ACHIEVEMENTS['first-steps'], unlocked: true, unlockedAt: '2026-01-08T12:00:00Z' },
      { ...ACHIEVEMENTS['week-warrior'], unlocked: true, unlockedAt: '2026-01-07T12:00:00Z' },
      { ...ACHIEVEMENTS['century'], unlocked: true, unlockedAt: '2026-01-06T12:00:00Z' },
      { ...ACHIEVEMENTS['bronze-age'], unlocked: true, unlockedAt: '2026-01-05T12:00:00Z' },
    ];

    (useAchievements as ReturnType<typeof vi.fn>).mockReturnValue({
      achievements: mockAchievements,
      unlockedCount: 4,
      loading: false,
    });

    render(<RecentAchievements />);
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getByText('Week Warrior')).toBeInTheDocument();
    expect(screen.getByText('Century')).toBeInTheDocument();
    expect(screen.queryByText('Bronze Age')).not.toBeInTheDocument();
  });

  it('orders by most recently unlocked', () => {
    // Provide achievements in wrong order - component should sort them
    const mockAchievements = [
      { ...ACHIEVEMENTS['century'], unlocked: true, unlockedAt: '2026-01-06T12:00:00Z' },
      { ...ACHIEVEMENTS['first-steps'], unlocked: true, unlockedAt: '2026-01-08T12:00:00Z' },
      { ...ACHIEVEMENTS['week-warrior'], unlocked: true, unlockedAt: '2026-01-07T12:00:00Z' },
    ];

    (useAchievements as ReturnType<typeof vi.fn>).mockReturnValue({
      achievements: mockAchievements,
      unlockedCount: 3,
      loading: false,
    });

    render(<RecentAchievements />);

    // All three should be present
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getByText('Week Warrior')).toBeInTheDocument();
    expect(screen.getByText('Century')).toBeInTheDocument();

    // Check order via getAllByRole - First Steps should be first (most recent)
    const achievementNames = screen.getAllByRole('heading', { level: 3 });
    expect(achievementNames[0]).toHaveTextContent('First Steps');
    expect(achievementNames[1]).toHaveTextContent('Week Warrior');
    expect(achievementNames[2]).toHaveTextContent('Century');
  });

  it('shows empty state when none unlocked', () => {
    (useAchievements as ReturnType<typeof vi.fn>).mockReturnValue({
      achievements: [
        { ...ACHIEVEMENTS['first-steps'], unlocked: false, unlockedAt: null },
      ],
      unlockedCount: 0,
      loading: false,
    });

    render(<RecentAchievements />);
    expect(screen.getByText(/no achievements/i)).toBeInTheDocument();
  });

  it('has link to achievements page', () => {
    (useAchievements as ReturnType<typeof vi.fn>).mockReturnValue({
      achievements: [
        { ...ACHIEVEMENTS['first-steps'], unlocked: true, unlockedAt: '2026-01-08T12:00:00Z' },
      ],
      unlockedCount: 1,
      loading: false,
    });

    render(<RecentAchievements />);
    const link = screen.getByRole('link', { name: /view all/i });
    expect(link).toHaveAttribute('href', '/achievements');
  });

  it('shows loading skeleton when loading', () => {
    (useAchievements as ReturnType<typeof vi.fn>).mockReturnValue({
      achievements: [],
      unlockedCount: 0,
      loading: true,
    });

    render(<RecentAchievements />);
    expect(screen.getByTestId('recent-achievements-skeleton')).toBeInTheDocument();
  });

  it('shows CTA to practice in empty state', () => {
    (useAchievements as ReturnType<typeof vi.fn>).mockReturnValue({
      achievements: [],
      unlockedCount: 0,
      loading: false,
    });

    render(<RecentAchievements />);
    expect(screen.getByRole('link', { name: /start practicing/i })).toHaveAttribute('href', '/practice');
  });
});
