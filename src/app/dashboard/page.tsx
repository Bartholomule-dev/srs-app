// src/app/dashboard/page.tsx
'use client';

import {
  ProtectedRoute,
  ErrorBoundary,
  Header,
  DueNowBand,
  StatsGrid,
} from '@/components';
import { SkillTreeLazy } from '@/components/skill-tree';
import { ContributionGraphLazy } from '@/components/stats';
import { RecentAchievementsLazy } from '@/components/dashboard';
import { useAuth, useStats, useContributionGraph, useDueCount } from '@/lib/hooks';

function LoadingSkeleton() {
  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[var(--bg-base)]">
        <div className="space-y-6">
          {/* DueNowBand skeleton */}
          <div className="border-l-4 border-[var(--border)] bg-[var(--bg-surface-1)] rounded-r-lg p-4">
            <div className="animate-pulse flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-8 w-20 bg-[var(--bg-surface-3)] rounded" />
                <div className="h-4 w-32 bg-[var(--bg-surface-3)] rounded" />
              </div>
              <div className="h-10 w-28 bg-[var(--bg-surface-3)] rounded-lg" />
            </div>
          </div>

          {/* Stats skeleton - hero + row */}
          <div className="space-y-4">
            <div className="h-24 bg-[var(--bg-surface-1)] rounded-lg animate-pulse" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-[var(--bg-surface-1)] rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { stats } = useStats();
  const { days: contributionDays, loading: contributionLoading } = useContributionGraph();
  const { dueCount, isLoading: dueLoading, error } = useDueCount(user?.id);

  if (dueLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[var(--bg-base)]">
          <div className="text-center py-12 rounded-lg border border-red-500/20 bg-red-500/5">
            <p className="text-red-400 mb-4">{error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-150"
            >
              Retry
            </button>
          </div>
        </main>
      </>
    );
  }

  const streak = stats?.currentStreak ?? 0;

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[var(--bg-base)]">
        <div className="space-y-6">
          {/* Due Now Band - Primary focal point */}
          <DueNowBand dueCount={dueCount} streak={streak} />

          {/* Stats Section */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Your Progress
            </h2>
            <StatsGrid />
          </section>

          {/* Recent Achievements Section */}
          <RecentAchievementsLazy />

          {/* Contribution History Section */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Activity History
            </h2>
            <ContributionGraphLazy
              days={contributionDays}
              loading={contributionLoading}
              collapsedMobile={true}
            />
          </section>

          {/* Skill Tree Section */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Learning Path
            </h2>
            <SkillTreeLazy />
          </section>
        </div>
      </main>
    </>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute redirectTo="/">
      <ErrorBoundary
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
            <p className="text-[var(--text-secondary)]">Something went wrong. Please refresh.</p>
          </div>
        }
      >
        <DashboardContent />
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
