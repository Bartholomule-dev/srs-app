// tests/unit/components/dashboard/StatsGrid.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import type { UserStats } from '@/lib/stats';

describe('StatsGrid', () => {
  const mockStats: UserStats = {
    cardsReviewedToday: 15,
    accuracyPercent: 87,
    currentStreak: 7,
    longestStreak: 14,
    totalExercisesCompleted: 150,
  };

  it('renders all four stat cards with hero + supporting layout', () => {
    render(<StatsGrid stats={mockStats} />);

    // Labels should be visible
    expect(screen.getByText('Streak')).toBeInTheDocument();
    expect(screen.getByText('Accuracy')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();

    // Values should be visible
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('87')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('renders loading skeleton with hero + 3 supporting layout', () => {
    render(<StatsGrid stats={null} loading />);

    // Should have 1 hero skeleton + 3 supporting skeletons = 4 total
    const heroSkeleton = screen.getByTestId('stats-skeleton-hero');
    expect(heroSkeleton).toBeInTheDocument();

    const supportingSkeletons = screen.getAllByTestId('stats-skeleton-supporting');
    expect(supportingSkeletons).toHaveLength(3);
  });

  it('renders zero values correctly', () => {
    const zeroStats: UserStats = {
      cardsReviewedToday: 0,
      accuracyPercent: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalExercisesCompleted: 0,
    };

    render(<StatsGrid stats={zeroStats} />);

    // Should show "0" values, not be empty
    const zeros = screen.getAllByText('0');
    // At least Streak, Accuracy (without %), Total, and Today
    expect(zeros.length).toBeGreaterThanOrEqual(4);
  });

  it('renders skeleton when stats is null', () => {
    render(<StatsGrid stats={null} />);

    const heroSkeleton = screen.getByTestId('stats-skeleton-hero');
    expect(heroSkeleton).toBeInTheDocument();

    const supportingSkeletons = screen.getAllByTestId('stats-skeleton-supporting');
    expect(supportingSkeletons).toHaveLength(3);
  });

  it('has hero + 3-column supporting layout', () => {
    const { container } = render(<StatsGrid stats={mockStats} />);

    // Supporting row should have 3-column grid
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-3');
  });

  it('renders SVG icons for all cards', () => {
    const { container } = render(<StatsGrid stats={mockStats} />);

    // Should have 4 SVG icons (fire for Streak, check for Today, target for Accuracy, chart for Total)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(4);
  });

  it('renders streak as hero card with fire icon', () => {
    const { container } = render(<StatsGrid stats={mockStats} />);

    // Hero card should have min-h-[140px] class
    const heroCard = container.querySelector('[class*="min-h-[140px]"]');
    expect(heroCard).toBeInTheDocument();

    // Streak label should be present
    expect(screen.getByText('Streak')).toBeInTheDocument();
  });

  it('renders supporting cards with smaller styling', () => {
    const { container } = render(<StatsGrid stats={mockStats} />);

    // Should have 3 supporting cards with min-h-[100px] class
    const supportingCards = container.querySelectorAll('[class*="min-h-[100px]"]');
    expect(supportingCards.length).toBe(3);
  });
});
