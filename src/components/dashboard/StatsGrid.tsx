'use client';

import { StatsCard } from './StatsCard';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useStats, useLanguageStats, useActiveLanguage } from '@/lib/hooks';

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

/**
 * StatsGrid displays hybrid stats:
 * - Global stats (streak) from useStats - not filtered by language
 * - Per-language stats (accuracy, exercises today) from useLanguageStats
 *
 * Stats automatically update when user switches language via LanguageSwitcher.
 */
export function StatsGrid() {
  const { language } = useActiveLanguage();
  const { stats: globalStats, loading: globalLoading } = useStats();
  const {
    accuracy,
    exercisesToday,
    isLoading: languageLoading,
  } = useLanguageStats(language);

  const loading = globalLoading || languageLoading;

  if (loading || !globalStats) {
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

  // Format language name for display
  const languageLabel =
    language === 'python'
      ? 'Python'
      : language === 'javascript'
        ? 'JS'
        : language.charAt(0).toUpperCase() + language.slice(1);

  return (
    <div className="space-y-4">
      {/* Hero stat: Current Streak (global, not filtered by language) */}
      <StatsCard
        label="Streak"
        value={globalStats.currentStreak}
        icon="fire"
        variant="hero"
        delay={0}
      />

      {/* Supporting stats row (per-language) */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          label={`${languageLabel} Today`}
          value={exercisesToday}
          icon="check"
          variant="supporting"
          delay={0.05}
        />
        <StatsCard
          label={`${languageLabel} Accuracy`}
          value={accuracy}
          suffix="%"
          icon="target"
          variant="supporting"
          delay={0.1}
        />
        <StatsCard
          label="Total"
          value={globalStats.totalExercisesCompleted}
          icon="chart"
          variant="supporting"
          delay={0.15}
        />
      </div>
    </div>
  );
}
