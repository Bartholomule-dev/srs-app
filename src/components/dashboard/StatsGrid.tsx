'use client';

import { StatsCard } from './StatsCard';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import type { UserStats } from '@/lib/stats';

export interface StatsGridProps {
  stats: UserStats | null;
  loading?: boolean;
}

function StatsSkeleton() {
  return (
    <Card elevation={2} data-testid="stats-skeleton">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-9 w-16" />
      </CardContent>
    </Card>
  );
}

export function StatsGrid({ stats, loading = false }: StatsGridProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <StatsSkeleton />
        <StatsSkeleton />
        <StatsSkeleton />
        <StatsSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Row 1 */}
      <StatsCard
        label="Streak"
        value={stats.currentStreak}
        icon="fire"
      />
      <StatsCard
        label="Accuracy"
        value={stats.accuracyPercent}
        suffix="%"
        showRing
      />

      {/* Row 2 */}
      <StatsCard
        label="Total"
        value={stats.totalExercisesCompleted}
        icon="chart"
      />
      <StatsCard
        label="Today"
        value={stats.cardsReviewedToday}
        icon="check"
      />
    </div>
  );
}
