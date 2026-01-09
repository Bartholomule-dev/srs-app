'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAchievements } from '@/lib/hooks/useAchievements';
import { cn } from '@/lib/utils';
import { ANIMATION_BUDGET } from '@/lib/motion';
import type { AchievementWithStatus } from '@/lib/hooks/useAchievements';

interface MiniAchievementCardProps {
  achievement: AchievementWithStatus;
  delay?: number;
}

function MiniAchievementCard({ achievement, delay = 0 }: MiniAchievementCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...ANIMATION_BUDGET.stateChange, delay }}
      className="flex-shrink-0"
    >
      <Card elevation={1} className="w-32 h-full">
        <CardContent className="p-3 flex flex-col items-center text-center gap-2">
          <span className="text-2xl" role="img" aria-label={achievement.name}>
            {achievement.icon}
          </span>
          <h3 className="text-xs font-medium text-[var(--text-primary)] line-clamp-2">
            {achievement.name}
          </h3>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex gap-3" data-testid="recent-achievements-skeleton">
      {[1, 2, 3].map((i) => (
        <Card key={i} elevation={1} className="w-32 flex-shrink-0">
          <CardContent className="p-3 flex flex-col items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-20 h-4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <Card elevation={1}>
      <CardContent className="p-6 text-center">
        <p className="text-[var(--text-secondary)] mb-3">
          No achievements unlocked yet
        </p>
        <Link
          href="/practice"
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)]',
            'text-white font-medium text-sm transition-colors'
          )}
        >
          Start Practicing
        </Link>
      </CardContent>
    </Card>
  );
}

export function RecentAchievements() {
  const { achievements, loading } = useAchievements();

  // Get unlocked achievements sorted by most recent, take first 3
  const recentUnlocked = useMemo(() => {
    return achievements
      .filter((a) => a.unlocked && a.unlockedAt)
      .sort((a, b) => {
        const dateA = new Date(a.unlockedAt!).getTime();
        const dateB = new Date(b.unlockedAt!).getTime();
        return dateB - dateA; // Most recent first
      })
      .slice(0, 3);
  }, [achievements]);

  const hasUnlocked = recentUnlocked.length > 0;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Recent Achievements
        </h2>
        <Link
          href="/achievements"
          className="text-sm text-[var(--accent-primary)] hover:underline"
        >
          View All
        </Link>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : hasUnlocked ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {recentUnlocked.map((achievement, index) => (
            <MiniAchievementCard
              key={achievement.slug}
              achievement={achievement}
              delay={index * 0.05}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </section>
  );
}
