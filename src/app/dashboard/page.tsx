// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  ProtectedRoute,
  ErrorBoundary,
  Header,
  Greeting,
  StatsGrid,
} from '@/components';
import { useAuth, useStats } from '@/lib/hooks';
import { supabase } from '@/lib/supabase/client';
import { mapUserProgress } from '@/lib/supabase/mappers';
import { getDueCards } from '@/lib/srs';
import type { UserProgress } from '@/lib/types';

function DashboardContent() {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useStats();
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchStats() {
      setLoading(true);
      setError(null);

      try {
        // Fetch user progress
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user!.id);

        if (progressError) throw progressError;

        const progress: UserProgress[] = (progressData ?? []).map(mapUserProgress);

        const dueCards = getDueCards(progress);

        setDueCount(dueCards.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-8" />
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-8" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Greeting dueCount={dueCount} isLoading={loading} />
        <div className="mt-8">
          <StatsGrid stats={stats} loading={statsLoading} />
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
          <div className="min-h-screen flex items-center justify-center">
            <p>Something went wrong. Please refresh the page.</p>
          </div>
        }
      >
        <DashboardContent />
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
