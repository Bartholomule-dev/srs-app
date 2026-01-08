import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Greeting } from '@/components/dashboard/Greeting';
import type { Profile } from '@/lib/types';

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
  experienceLevel: 'refresher',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};
let mockProfileLoading = false;

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
      experienceLevel: 'refresher',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    mockProfileLoading = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Time-based greeting tests
  describe('time-based greeting', () => {
    it('shows "Good morning" between 5am and noon', () => {
      vi.setSystemTime(new Date('2024-01-15T09:00:00'));
      render(<Greeting />);
      expect(screen.getByText(/Good morning/)).toBeInTheDocument();
    });

    it('shows "Good afternoon" between noon and 5pm', () => {
      vi.setSystemTime(new Date('2024-01-15T14:00:00'));
      render(<Greeting />);
      expect(screen.getByText(/Good afternoon/)).toBeInTheDocument();
    });

    it('shows "Good evening" between 5pm and 9pm', () => {
      vi.setSystemTime(new Date('2024-01-15T19:00:00'));
      render(<Greeting />);
      expect(screen.getByText(/Good evening/)).toBeInTheDocument();
    });

    it('shows "Good night" between 9pm and 5am', () => {
      vi.setSystemTime(new Date('2024-01-15T23:00:00'));
      render(<Greeting />);
      expect(screen.getByText(/Good night/)).toBeInTheDocument();
    });

    it('shows "Good night" at 4am (early morning)', () => {
      vi.setSystemTime(new Date('2024-01-15T04:00:00'));
      render(<Greeting />);
      expect(screen.getByText(/Good night/)).toBeInTheDocument();
    });

    it('shows "Good morning" at exactly 5am', () => {
      vi.setSystemTime(new Date('2024-01-15T05:00:00'));
      render(<Greeting />);
      expect(screen.getByText(/Good morning/)).toBeInTheDocument();
    });

    it('shows "Good afternoon" at exactly noon', () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00'));
      render(<Greeting />);
      expect(screen.getByText(/Good afternoon/)).toBeInTheDocument();
    });

    it('shows "Good evening" at exactly 5pm', () => {
      vi.setSystemTime(new Date('2024-01-15T17:00:00'));
      render(<Greeting />);
      expect(screen.getByText(/Good evening/)).toBeInTheDocument();
    });

    it('shows "Good night" at exactly 9pm', () => {
      vi.setSystemTime(new Date('2024-01-15T21:00:00'));
      render(<Greeting />);
      expect(screen.getByText(/Good night/)).toBeInTheDocument();
    });
  });

  // Username tests
  describe('username display', () => {
    it('renders greeting with username from profile', () => {
      render(<Greeting />);
      expect(screen.getByText('TestUser')).toBeInTheDocument();
    });

    it('shows "there" when profile is null', () => {
      mockProfile = null;
      render(<Greeting />);
      expect(screen.getByText('there')).toBeInTheDocument();
    });

    it('shows "..." when loading', () => {
      mockProfileLoading = true;
      render(<Greeting />);
      expect(screen.getByText('...')).toBeInTheDocument();
    });

    it('shows "..." when isLoading prop is true', () => {
      render(<Greeting isLoading={true} />);
      expect(screen.getByText('...')).toBeInTheDocument();
    });
  });
});
