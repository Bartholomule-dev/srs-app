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
    <Card data-testid="stats-skeleton">
      <CardContent className="p-4">
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-8 w-12" />
      </CardContent>
    </Card>
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
