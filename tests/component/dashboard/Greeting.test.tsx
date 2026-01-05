import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Greeting } from '@/components/dashboard/Greeting';
import type { Profile } from '@/lib/types';
import type { UserStats } from '@/lib/stats';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Default mock values
let mockProfile: Profile | null = {
  id: 'test-id',
  username: 'TestUser',
  displayName: null,
  avatarUrl: null,
  preferredLanguage: 'python',
  dailyGoal: 10,
  notificationTime: null,
  currentStreak: 5,
  longestStreak: 10,
  totalExercisesCompleted: 50,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};
let mockProfileLoading = false;

let mockStats: UserStats | null = {
  currentStreak: 5,
  cardsReviewedToday: 12,
  accuracyPercent: 85,
  longestStreak: 10,
  totalExercisesCompleted: 50,
};
let mockStatsLoading = false;

// Mock useProfile hook
vi.mock('@/lib/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: mockProfile,
    loading: mockProfileLoading,
    error: null,
    updateProfile: vi.fn(),
    refetch: vi.fn(),
  }),
}));

// Mock useStats hook
vi.mock('@/lib/hooks/useStats', () => ({
  useStats: () => ({
    stats: mockStats,
    loading: mockStatsLoading,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe('Greeting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    // Reset mock values
    mockProfile = {
      id: 'test-id',
      username: 'TestUser',
      displayName: null,
      avatarUrl: null,
      preferredLanguage: 'python',
      dailyGoal: 10,
      notificationTime: null,
      currentStreak: 5,
      longestStreak: 10,
      totalExercisesCompleted: 50,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    mockProfileLoading = false;
    mockStats = {
      currentStreak: 5,
      cardsReviewedToday: 12,
      accuracyPercent: 85,
      longestStreak: 10,
      totalExercisesCompleted: 50,
    };
    mockStatsLoading = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Time-based greeting tests
  describe('time-based greeting', () => {
    it('shows "Good morning" between 5am and noon', () => {
      vi.setSystemTime(new Date('2024-01-15T09:00:00'));
      render(<Greeting dueCount={5} />);
      expect(screen.getByText(/Good morning/)).toBeInTheDocument();
    });

    it('shows "Good afternoon" between noon and 5pm', () => {
      vi.setSystemTime(new Date('2024-01-15T14:00:00'));
      render(<Greeting dueCount={5} />);
      expect(screen.getByText(/Good afternoon/)).toBeInTheDocument();
    });

    it('shows "Good evening" between 5pm and 9pm', () => {
      vi.setSystemTime(new Date('2024-01-15T19:00:00'));
      render(<Greeting dueCount={5} />);
      expect(screen.getByText(/Good evening/)).toBeInTheDocument();
    });

    it('shows "Good night" between 9pm and 5am', () => {
      vi.setSystemTime(new Date('2024-01-15T23:00:00'));
      render(<Greeting dueCount={5} />);
      expect(screen.getByText(/Good night/)).toBeInTheDocument();
    });

    it('shows "Good night" at 4am (early morning)', () => {
      vi.setSystemTime(new Date('2024-01-15T04:00:00'));
      render(<Greeting dueCount={5} />);
      expect(screen.getByText(/Good night/)).toBeInTheDocument();
    });

    it('shows "Good morning" at exactly 5am', () => {
      vi.setSystemTime(new Date('2024-01-15T05:00:00'));
      render(<Greeting dueCount={5} />);
      expect(screen.getByText(/Good morning/)).toBeInTheDocument();
    });

    it('shows "Good afternoon" at exactly noon', () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00'));
      render(<Greeting dueCount={5} />);
      expect(screen.getByText(/Good afternoon/)).toBeInTheDocument();
    });

    it('shows "Good evening" at exactly 5pm', () => {
      vi.setSystemTime(new Date('2024-01-15T17:00:00'));
      render(<Greeting dueCount={5} />);
      expect(screen.getByText(/Good evening/)).toBeInTheDocument();
    });

    it('shows "Good night" at exactly 9pm', () => {
      vi.setSystemTime(new Date('2024-01-15T21:00:00'));
      render(<Greeting dueCount={5} />);
      expect(screen.getByText(/Good night/)).toBeInTheDocument();
    });
  });

  // Username tests
  describe('username display', () => {
    it('renders greeting with username from profile', () => {
      render(<Greeting dueCount={5} />);
      expect(screen.getByText('TestUser')).toBeInTheDocument();
    });

    it('shows "there" when profile is null', () => {
      mockProfile = null;
      render(<Greeting dueCount={5} />);
      expect(screen.getByText('there')).toBeInTheDocument();
    });
  });

  // Context message tests
  describe('context messages', () => {
    it('shows due cards message when cards are waiting and no streak', () => {
      // When streak is 0 but cards due, show due cards message
      mockStats = { ...mockStats!, currentStreak: 0 };
      render(<Greeting dueCount={12} />);
      expect(screen.getByText('You have 12 cards waiting')).toBeInTheDocument();
    });

    it('shows singular "card" when only 1 due and no streak', () => {
      mockStats = { ...mockStats!, currentStreak: 0 };
      render(<Greeting dueCount={1} />);
      expect(screen.getByText('You have 1 card waiting')).toBeInTheDocument();
    });

    it('shows streak warning when streak > 0 and cards due', () => {
      // Streak warning takes priority over due cards message
      render(<Greeting dueCount={5} />);
      expect(screen.getByText('Practice today to keep your 5-day streak!')).toBeInTheDocument();
    });

    it('shows caught up message when no cards due', () => {
      mockStats = { ...mockStats!, currentStreak: 0 };
      render(<Greeting dueCount={0} />);
      expect(screen.getByText('All caught up! Learn something new?')).toBeInTheDocument();
    });

    it('shows caught up message even with streak when no cards due', () => {
      // If all caught up, show caught up message even if they have a streak
      render(<Greeting dueCount={0} />);
      expect(screen.getByText('All caught up! Learn something new?')).toBeInTheDocument();
    });

    it('shows loading message when isLoading prop is true', () => {
      render(<Greeting dueCount={5} isLoading={true} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  // Button tests
  describe('CTA buttons', () => {
    it('renders Start Practice button when cards are due', () => {
      render(<Greeting dueCount={5} />);
      expect(screen.getByRole('button', { name: /start practice/i })).toBeInTheDocument();
    });

    it('renders Learn New Cards button when no cards are due', () => {
      render(<Greeting dueCount={0} />);
      expect(screen.getByRole('button', { name: /learn new cards/i })).toBeInTheDocument();
    });

    it('Start Practice navigates to /practice when clicked', () => {
      render(<Greeting dueCount={5} />);
      const button = screen.getByRole('button', { name: /start practice/i });
      fireEvent.click(button);
      expect(mockPush).toHaveBeenCalledWith('/practice');
    });

    it('Learn New Cards navigates to /practice when clicked', () => {
      render(<Greeting dueCount={0} />);
      const button = screen.getByRole('button', { name: /learn new cards/i });
      fireEvent.click(button);
      expect(mockPush).toHaveBeenCalledWith('/practice');
    });

    it('button is disabled when loading', () => {
      render(<Greeting dueCount={5} isLoading={true} />);
      const button = screen.getByRole('button', { name: /start practice/i });
      expect(button).toBeDisabled();
    });

    it('button is enabled when not loading (with due cards)', () => {
      render(<Greeting dueCount={5} />);
      const button = screen.getByRole('button', { name: /start practice/i });
      expect(button).not.toBeDisabled();
    });

    it('button is enabled when not loading (no due cards)', () => {
      render(<Greeting dueCount={0} />);
      const button = screen.getByRole('button', { name: /learn new cards/i });
      expect(button).not.toBeDisabled();
    });
  });
});
