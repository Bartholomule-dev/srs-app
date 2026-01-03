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

  it('renders all four stat cards', () => {
    render(<StatsGrid stats={mockStats} />);

    // Cards reviewed today
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    // Accuracy
    expect(screen.getByText('Accuracy')).toBeInTheDocument();
    expect(screen.getByText('87%')).toBeInTheDocument();

    // Streak
    expect(screen.getByText('Streak')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();

    // Total
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
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
    expect(zeros.length).toBeGreaterThanOrEqual(2); // At least Today and Streak
  });
});
