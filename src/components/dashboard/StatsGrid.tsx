'use client';

import { StatsCard } from './StatsCard';
import type { UserStats } from '@/lib/stats';

export interface StatsGridProps {
  stats: UserStats | null;
  loading?: boolean;
}

function StatsSkeleton() {
  return (
    <div
      data-testid="stats-skeleton"
      className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse"
    >
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12" />
    </div>
  );
}

export function StatsGrid({ stats, loading = false }: StatsGridProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsSkeleton />
        <StatsSkeleton />
        <StatsSkeleton />
        <StatsSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatsCard
        label="Today"
        value={stats.cardsReviewedToday}
        icon="check"
      />
      <StatsCard
        label="Accuracy"
        value={stats.accuracyPercent}
        suffix="%"
        icon="target"
      />
      <StatsCard
        label="Streak"
        value={stats.currentStreak}
        icon="fire"
      />
      <StatsCard
        label="Total"
        value={stats.totalExercisesCompleted}
        icon="trophy"
      />
    </div>
  );
}
