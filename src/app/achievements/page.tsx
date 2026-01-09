'use client';

import { motion } from 'framer-motion';
import { ProtectedRoute, ErrorBoundary, Header } from '@/components';
import { AchievementCard } from '@/components/achievements/AchievementCard';
import { useAchievements } from '@/lib/hooks/useAchievements';
import {
  ACHIEVEMENTS,
  getAchievementsByCategory,
  type AchievementCategory,
} from '@/lib/gamification/achievements';
import { ANIMATION_BUDGET } from '@/lib/motion';

// Category metadata
const CATEGORY_INFO: Record<
  AchievementCategory,
  { title: string; description: string; color: string }
> = {
  habit: {
    title: 'Habit',
    description: 'Build consistency with daily practice',
    color: 'var(--accent-warning)',
  },
  mastery: {
    title: 'Mastery',
    description: 'Demonstrate deep understanding of concepts',
    color: 'var(--accent-primary)',
  },
  completionist: {
    title: 'Completionist',
    description: 'Complete milestones and explore all content',
    color: 'var(--accent-success)',
  },
};

const CATEGORIES: AchievementCategory[] = ['habit', 'mastery', 'completionist'];

function LoadingSkeleton() {
  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[var(--bg-base)]">
        <div className="space-y-8">
          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-8 w-48 bg-[var(--bg-surface-2)] rounded animate-pulse" />
            <div className="h-5 w-32 bg-[var(--bg-surface-2)] rounded animate-pulse" />
          </div>

          {/* Category sections skeleton */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <div className="h-6 w-24 bg-[var(--bg-surface-2)] rounded animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="h-28 bg-[var(--bg-surface-1)] rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="sr-only">Loading achievements...</p>
      </main>
    </>
  );
}

function CategorySection({
  category,
  isUnlocked,
  getUnlockedAt,
  staggerIndex,
}: {
  category: AchievementCategory;
  isUnlocked: (slug: string) => boolean;
  getUnlockedAt: (slug: string) => string | null;
  staggerIndex: number;
}) {
  const info = CATEGORY_INFO[category];
  const achievements = getAchievementsByCategory(category);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...ANIMATION_BUDGET.stateChange, delay: staggerIndex * 0.1 }}
      className="space-y-4"
    >
      {/* Category header */}
      <div className="flex items-center gap-3">
        <h2
          className="text-lg font-semibold font-display text-[var(--text-primary)]"
          style={{ color: info.color }}
        >
          {info.title}
        </h2>
        <span className="text-sm text-[var(--text-tertiary)]">{info.description}</span>
      </div>

      {/* Achievement cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement, index) => (
          <AchievementCard
            key={achievement.slug}
            achievement={achievement}
            unlocked={isUnlocked(achievement.slug)}
            unlockedAt={getUnlockedAt(achievement.slug) ?? undefined}
            delay={staggerIndex * 0.1 + index * 0.05}
          />
        ))}
      </div>
    </motion.section>
  );
}

function AchievementsContent() {
  const { unlockedCount, loading, isUnlocked, getUnlockedAt } = useAchievements();

  if (loading) {
    return <LoadingSkeleton />;
  }

  const totalAchievements = Object.keys(ACHIEVEMENTS).length;

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[var(--bg-base)]">
        <div className="space-y-8">
          {/* Page header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-display text-[var(--text-primary)]">
              Achievements
            </h1>
            <p className="text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--accent-primary)]">
                {unlockedCount}
              </span>
              <span className="text-[var(--text-tertiary)]"> / </span>
              <span>{totalAchievements}</span>
              <span className="text-[var(--text-tertiary)]"> unlocked</span>
            </p>
          </div>

          {/* Category sections */}
          {CATEGORIES.map((category, index) => (
            <CategorySection
              key={category}
              category={category}
              isUnlocked={isUnlocked}
              getUnlockedAt={getUnlockedAt}
              staggerIndex={index}
            />
          ))}
        </div>
      </main>
    </>
  );
}

export default function AchievementsPage() {
  return (
    <ProtectedRoute redirectTo="/">
      <ErrorBoundary
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
            <p className="text-[var(--text-secondary)]">
              Something went wrong. Please refresh.
            </p>
          </div>
        }
      >
        <AchievementsContent />
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
