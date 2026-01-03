// src/app/practice/page.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute, ExerciseCard, SessionProgress, SessionSummary } from '@/components';
import { useSession } from '@/lib/hooks';
import { ErrorBoundary } from '@/components';

function PracticeSessionContent() {
  const router = useRouter();
  const {
    currentCard,
    isComplete,
    stats,
    loading,
    error,
    recordResult,
    endSession,
    retry,
  } = useSession();

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse text-gray-600 dark:text-gray-400">
          Loading session...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
            Failed to Load Session
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={retry}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              Retry
            </button>
            <button
              onClick={handleDashboard}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stats.total === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            No Cards to Practice
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There are no cards due for review right now.
          </p>
          <button
            onClick={handleDashboard}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <SessionSummary stats={stats} onDashboard={handleDashboard} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Immersive progress bar header */}
      <div className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <SessionProgress
              current={stats.completed}
              total={stats.total}
              className="flex-1"
            />
            <Link
              href="/dashboard"
              onClick={endSession}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              End Session
            </Link>
          </div>
        </div>
      </div>

      {/* Centered exercise card with generous whitespace */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl">
          {currentCard && (
            <ExerciseCard
              exercise={currentCard.exercise}
              onComplete={(exerciseId, quality) => recordResult(quality)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <ProtectedRoute redirectTo="/">
      <ErrorBoundary
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <p>Something went wrong. Please refresh the page.</p>
          </div>
        }
      >
        <PracticeSessionContent />
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
