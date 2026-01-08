'use client';

import { StatsCard } from './StatsCard';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import type { UserStats } from '@/lib/stats';

export interface StatsGridProps {
  stats: UserStats | null;
  loading?: boolean;
}

function HeroSkeleton() {
  return (
    <Card elevation={2} data-testid="stats-skeleton-hero">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-10 w-20" />
      </CardContent>
    </Card>
  );
}

function SupportingSkeleton() {
  return (
    <Card elevation={2} data-testid="stats-skeleton-supporting">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-14" />
        </div>
        <Skeleton className="h-8 w-14" />
      </CardContent>
    </Card>
  );
}

export function StatsGrid({ stats, loading = false }: StatsGridProps) {
  if (loading || !stats) {
    return (
      <div className="space-y-4">
        {/* Hero skeleton */}
        <HeroSkeleton />
        {/* Supporting row skeleton */}
        <div className="grid grid-cols-3 gap-4">
          <SupportingSkeleton />
          <SupportingSkeleton />
          <SupportingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hero stat: Current Streak */}
      <StatsCard
        label="Streak"
        value={stats.currentStreak}
        icon="fire"
        variant="hero"
        delay={0}
      />

      {/* Supporting stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          label="Today"
          value={stats.cardsReviewedToday}
          icon="check"
          variant="supporting"
          delay={0.05}
        />
        <StatsCard
          label="Accuracy"
          value={stats.accuracyPercent}
          suffix="%"
          icon="target"
          variant="supporting"
          delay={0.1}
        />
        <StatsCard
          label="Total"
          value={stats.totalExercisesCompleted}
          icon="chart"
          variant="supporting"
          delay={0.15}
        />
      </div>
    </div>
  );
}
