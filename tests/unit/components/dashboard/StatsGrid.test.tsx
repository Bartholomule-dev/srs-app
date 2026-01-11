// tests/unit/components/dashboard/StatsGrid.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import type { UserStats } from '@/lib/stats';

// Mock the hooks
vi.mock('@/lib/hooks', () => ({
  useActiveLanguage: vi.fn(() => ({
    language: 'python',
    setLanguage: vi.fn(),
    isLoading: false,
    error: null,
  })),
  useStats: vi.fn(() => ({
    stats: {
      currentStreak: 7,
      longestStreak: 14,
      totalExercisesCompleted: 150,
      cardsReviewedToday: 15,
      accuracyPercent: 87,
    } as UserStats,
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useLanguageStats: vi.fn(() => ({
    accuracy: 85,
    totalExercises: 100,
    exercisesToday: 12,
    isLoading: false,
    error: null,
  })),
}));

import { useActiveLanguage, useStats, useLanguageStats } from '@/lib/hooks';

describe('StatsGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mocks
    vi.mocked(useActiveLanguage).mockReturnValue({
      language: 'python',
      setLanguage: vi.fn(),
      isLoading: false,
      error: null,
    });
    vi.mocked(useStats).mockReturnValue({
      stats: {
        currentStreak: 7,
        longestStreak: 14,
        totalExercisesCompleted: 150,
        cardsReviewedToday: 15,
        accuracyPercent: 87,
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    vi.mocked(useLanguageStats).mockReturnValue({
      accuracy: 85,
      totalExercises: 100,
      exercisesToday: 12,
      isLoading: false,
      error: null,
    });
  });

  it('renders all stat cards with hero + supporting layout', () => {
    render(<StatsGrid />);

    // Labels should be visible
    expect(screen.getByText('Streak')).toBeInTheDocument();
    expect(screen.getByText('Python Accuracy')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Python Today')).toBeInTheDocument();

    // Values should be visible
    expect(screen.getByText('7')).toBeInTheDocument(); // streak
    expect(screen.getByText('85')).toBeInTheDocument(); // accuracy
    expect(screen.getByText('%')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument(); // total
    expect(screen.getByText('12')).toBeInTheDocument(); // today
  });

  it('renders loading skeleton when global stats are loading', () => {
    vi.mocked(useStats).mockReturnValue({
      stats: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<StatsGrid />);

    // Should have 1 hero skeleton + 3 supporting skeletons
    const heroSkeleton = screen.getByTestId('stats-skeleton-hero');
    expect(heroSkeleton).toBeInTheDocument();

    const supportingSkeletons = screen.getAllByTestId('stats-skeleton-supporting');
    expect(supportingSkeletons).toHaveLength(3);
  });

  it('renders loading skeleton when language stats are loading', () => {
    vi.mocked(useLanguageStats).mockReturnValue({
      accuracy: 0,
      totalExercises: 0,
      exercisesToday: 0,
      isLoading: true,
      error: null,
    });

    render(<StatsGrid />);

    const heroSkeleton = screen.getByTestId('stats-skeleton-hero');
    expect(heroSkeleton).toBeInTheDocument();
  });

  it('renders zero values correctly', () => {
    vi.mocked(useStats).mockReturnValue({
      stats: {
        currentStreak: 0,
        longestStreak: 0,
        totalExercisesCompleted: 0,
        cardsReviewedToday: 0,
        accuracyPercent: 0,
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    vi.mocked(useLanguageStats).mockReturnValue({
      accuracy: 0,
      totalExercises: 0,
      exercisesToday: 0,
      isLoading: false,
      error: null,
    });

    render(<StatsGrid />);

    // Should show "0" values, not be empty
    const zeros = screen.getAllByText('0');
    // At least Streak, Accuracy (without %), Total, and Today
    expect(zeros.length).toBeGreaterThanOrEqual(4);
  });

  it('renders skeleton when stats is null', () => {
    vi.mocked(useStats).mockReturnValue({
      stats: null,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<StatsGrid />);

    const heroSkeleton = screen.getByTestId('stats-skeleton-hero');
    expect(heroSkeleton).toBeInTheDocument();

    const supportingSkeletons = screen.getAllByTestId('stats-skeleton-supporting');
    expect(supportingSkeletons).toHaveLength(3);
  });

  it('has hero + 3-column supporting layout', () => {
    const { container } = render(<StatsGrid />);

    // Supporting row should have 3-column grid
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-3');
  });

  it('renders SVG icons for all cards', () => {
    const { container } = render(<StatsGrid />);

    // Should have 4 SVG icons (fire for Streak, check for Today, target for Accuracy, chart for Total)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(4);
  });

  it('renders streak as hero card with fire icon', () => {
    const { container } = render(<StatsGrid />);

    // Hero card should have min-h-[140px] class
    const heroCard = container.querySelector('[class*="min-h-[140px]"]');
    expect(heroCard).toBeInTheDocument();

    // Streak label should be present
    expect(screen.getByText('Streak')).toBeInTheDocument();
  });

  it('renders supporting cards with smaller styling', () => {
    const { container } = render(<StatsGrid />);

    // Should have 3 supporting cards with min-h-[100px] class
    const supportingCards = container.querySelectorAll('[class*="min-h-[100px]"]');
    expect(supportingCards.length).toBe(3);
  });

  // New tests for multi-language support

  it('displays JavaScript label when language is javascript', () => {
    vi.mocked(useActiveLanguage).mockReturnValue({
      language: 'javascript',
      setLanguage: vi.fn(),
      isLoading: false,
      error: null,
    });

    render(<StatsGrid />);

    expect(screen.getByText('JS Today')).toBeInTheDocument();
    expect(screen.getByText('JS Accuracy')).toBeInTheDocument();
  });

  it('calls useLanguageStats with current language', () => {
    vi.mocked(useActiveLanguage).mockReturnValue({
      language: 'javascript',
      setLanguage: vi.fn(),
      isLoading: false,
      error: null,
    });

    render(<StatsGrid />);

    expect(useLanguageStats).toHaveBeenCalledWith('javascript');
  });

  it('uses global streak from useStats regardless of language', () => {
    vi.mocked(useActiveLanguage).mockReturnValue({
      language: 'javascript',
      setLanguage: vi.fn(),
      isLoading: false,
      error: null,
    });
    vi.mocked(useStats).mockReturnValue({
      stats: {
        currentStreak: 42,
        longestStreak: 50,
        totalExercisesCompleted: 200,
        cardsReviewedToday: 10,
        accuracyPercent: 90,
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<StatsGrid />);

    // Streak should show global value
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Streak')).toBeInTheDocument();
  });

  it('uses language-specific accuracy from useLanguageStats', () => {
    vi.mocked(useLanguageStats).mockReturnValue({
      accuracy: 92,
      totalExercises: 50,
      exercisesToday: 5,
      isLoading: false,
      error: null,
    });

    render(<StatsGrid />);

    // Accuracy should show per-language value
    expect(screen.getByText('92')).toBeInTheDocument();
    expect(screen.getByText('Python Accuracy')).toBeInTheDocument();
  });

  it('uses language-specific exercises today from useLanguageStats', () => {
    vi.mocked(useLanguageStats).mockReturnValue({
      accuracy: 80,
      totalExercises: 100,
      exercisesToday: 8,
      isLoading: false,
      error: null,
    });

    render(<StatsGrid />);

    // Today's exercises should show per-language value
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Python Today')).toBeInTheDocument();
  });

  it('capitalizes unknown language names properly', () => {
    vi.mocked(useActiveLanguage).mockReturnValue({
      language: 'rust',
      setLanguage: vi.fn(),
      isLoading: false,
      error: null,
    });

    render(<StatsGrid />);

    expect(screen.getByText('Rust Today')).toBeInTheDocument();
    expect(screen.getByText('Rust Accuracy')).toBeInTheDocument();
  });
});
