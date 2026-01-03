// src/app/dashboard/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProtectedRoute, DueCardsBanner, EmptyState, ErrorBoundary, StatsGrid } from '@/components';
import { useAuth, useStats } from '@/lib/hooks';
import { supabase } from '@/lib/supabase/client';
import { mapExercise, mapUserProgress } from '@/lib/supabase/mappers';
import { getDueCards, getNewCards } from '@/lib/srs';
import type { Exercise, UserProgress } from '@/lib/types';

const NEW_CARDS_LIMIT = 5;

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useStats();
  const [dueCount, setDueCount] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [totalExercises, setTotalExercises] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchStats() {
      setLoading(true);
      setError(null);

      try {
        // Fetch exercises
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('*');

        if (exercisesError) throw exercisesError;

        // Fetch user progress
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user!.id);

        if (progressError) throw progressError;

        const exercises: Exercise[] = (exercisesData ?? []).map(mapExercise);
        const progress: UserProgress[] = (progressData ?? []).map(mapUserProgress);

        const dueCards = getDueCards(progress);
        const newCards = getNewCards(exercises, progress, NEW_CARDS_LIMIT);

        setDueCount(dueCards.length);
        setNewCount(newCards.length);
        setTotalExercises(exercises.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  const handleStartPractice = () => {
    router.push('/practice');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse text-gray-600 dark:text-gray-400">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasReviewedAllExercises = totalExercises > 0 && dueCount === 0 && newCount === 0;
  const hasDueOrNewCards = dueCount > 0 || newCount > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Dashboard
        </h1>

        {/* Stats Grid */}
        <div className="mb-8">
          <StatsGrid stats={stats} loading={statsLoading} />
        </div>

        {/* Practice CTA or Empty State */}
        {hasDueOrNewCards ? (
          <DueCardsBanner
            dueCount={dueCount}
            newCount={newCount}
            onStartPractice={handleStartPractice}
          />
        ) : hasReviewedAllExercises ? (
          <EmptyState variant="mastered-all" />
        ) : dueCount === 0 && totalExercises > 0 ? (
          <EmptyState
            variant="all-caught-up"
            newCardsAvailable={newCount}
            onLearnNew={handleStartPractice}
          />
        ) : (
          <div className="text-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">
              No exercises available yet.
            </p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalExercises}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Exercises
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {dueCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Due for Review
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {newCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              New Cards
            </div>
          </div>
        </div>
      </div>
    </div>
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
