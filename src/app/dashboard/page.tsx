// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  ProtectedRoute,
  ErrorBoundary,
  Header,
  DueNowBand,
  StatsGrid,
  SkillTree,
} from '@/components';
import { useAuth, useStats } from '@/lib/hooks';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/types';

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
  const { stats, loading: statsLoading } = useStats();
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchDueCount() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('subconcept_progress')
          .select('*')
          .eq('user_id', user!.id);

        if (queryError) throw queryError;

        type SubconceptProgressRow = Database['public']['Tables']['subconcept_progress']['Row'];
        const now = new Date();
        const due = (data ?? []).filter((p: SubconceptProgressRow) => {
          if (!p.next_review) return false;
          return new Date(p.next_review) <= now;
        }).length;

        setDueCount(due);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchDueCount();
  }, [user]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[var(--bg-base)]">
          <div className="text-center py-12 rounded-lg border border-red-500/20 bg-red-500/5">
            <p className="text-red-400 mb-4">{error}</p>
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
            <StatsGrid stats={stats} loading={statsLoading} />
          </section>

          {/* Skill Tree Section */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Learning Path
            </h2>
            <SkillTree />
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
