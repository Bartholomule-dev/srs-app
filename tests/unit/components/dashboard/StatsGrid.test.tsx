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

  it('renders all four stat cards in 2x2 bento layout', () => {
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

  it('renders loading skeleton when loading', () => {
    render(<StatsGrid stats={null} loading />);

    const skeletons = screen.getAllByTestId('stats-skeleton');
    expect(skeletons).toHaveLength(4);
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

    const skeletons = screen.getAllByTestId('stats-skeleton');
    expect(skeletons).toHaveLength(4);
  });

  it('has 2x2 grid layout', () => {
    const { container } = render(<StatsGrid stats={mockStats} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-2');
    // Should NOT have 4 columns on medium screens anymore (bento style)
    expect(grid).not.toHaveClass('md:grid-cols-4');
  });

  it('renders accuracy card with progress ring', () => {
    const { container } = render(<StatsGrid stats={mockStats} />);

    // The accuracy card has a progress ring with 2 circles
    const circles = container.querySelectorAll('circle');
    // At least 2 circles for the progress ring, plus additional from check icon
    expect(circles.length).toBeGreaterThanOrEqual(2);
  });

  it('renders SVG icons for non-accuracy cards', () => {
    const { container } = render(<StatsGrid stats={mockStats} />);

    // Should have multiple SVG elements (icons + progress ring)
    const svgs = container.querySelectorAll('svg');
    // 3 icon SVGs (fire, chart, check) + 1 progress ring SVG
    expect(svgs.length).toBeGreaterThanOrEqual(4);
  });
});
