// src/app/practice/page.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ProtectedRoute, ExerciseCard, SessionProgress, SessionSummary } from '@/components';
import { useConceptSession } from '@/lib/hooks';
import { ErrorBoundary } from '@/components';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { hasExercise, getCardKey, isTeachingCard } from '@/lib/session';

// Aurora gradient background for immersive practice mode
function PracticeBackground() {
  return (
    <>
      {/* Deep gradient base */}
      <div className="fixed inset-0 bg-gradient-to-br from-[var(--bg-base)] via-[#14120a] to-[var(--bg-base)] -z-10" />
      {/* Subtle gold spotlight from top */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] -z-10
                     bg-[radial-gradient(ellipse,rgba(245,158,11,0.08)_0%,transparent_70%)]" />
      {/* Accent glow from bottom corners */}
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] -z-10
                     bg-[radial-gradient(circle,rgba(249,115,22,0.06)_0%,transparent_70%)]" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] -z-10
                     bg-[radial-gradient(circle,rgba(34,197,94,0.04)_0%,transparent_70%)]" />
    </>
  );
}

// Loading spinner with pulse animation
function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <PracticeBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        {/* Animated spinner */}
        <div className="relative w-12 h-12">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[var(--accent-primary)]/20"
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--accent-primary)]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <p className="text-[var(--text-secondary)] text-sm">Loading session...</p>
      </motion.div>
    </div>
  );
}

// Error state with retry option
function ErrorState({ message, onRetry, onDashboard }: { message: string; onRetry: () => void; onDashboard: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <PracticeBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            {/* Error icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, ease: [0.2, 0, 0, 1], delay: 0.1 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent-error)]/10
                        flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-[var(--accent-error)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </motion.div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              Failed to Load Session
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              {message}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="primary" onClick={onRetry}>
                Try Again
              </Button>
              <Button variant="secondary" onClick={onDashboard}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Empty state when no cards to practice
function EmptyState({ onDashboard }: { onDashboard: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <PracticeBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            {/* Success/check icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, ease: [0.2, 0, 0, 1], delay: 0.1 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent-success)]/10
                        flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-[var(--accent-success)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </motion.div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              All Caught Up!
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              You&apos;ve reviewed all your due cards. Great work!
            </p>
            <Button variant="primary" onClick={onDashboard} glow>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

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
  } = useConceptSession();

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={retry} onDashboard={handleDashboard} />;
  }

  if (stats.total === 0) {
    return <EmptyState onDashboard={handleDashboard} />;
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <PracticeBackground />
        <SessionSummary stats={stats} onDashboard={handleDashboard} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PracticeBackground />

      {/* Immersive progress bar header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-[var(--bg-base)]/80 backdrop-blur-md
                  border-b border-[var(--border)]"
      >
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
              className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]
                        transition-colors"
            >
              End Session
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Centered exercise card with generous whitespace */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <motion.div
          key={currentCard ? getCardKey(currentCard) : 'empty'}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl"
        >
          {currentCard && isTeachingCard(currentCard) && (
            // TODO: Replace with TeachingCard component in Task 5.3
            <Card className="p-6">
              <CardContent>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                  Learning: {currentCard.subconcept}
                </h3>
                <p className="text-[var(--text-secondary)] mb-4">
                  {currentCard.teaching.explanation}
                </p>
                <div className="bg-[var(--bg-surface-2)] rounded-lg p-4 mb-4">
                  <p className="text-sm text-[var(--text-tertiary)] mb-2">Example:</p>
                  <pre className="font-mono text-sm text-[var(--text-primary)]">
                    {currentCard.exampleExercise.prompt}
                  </pre>
                </div>
                <Button
                  variant="primary"
                  onClick={() => recordResult(5)}
                  className="w-full"
                >
                  Continue
                </Button>
              </CardContent>
            </Card>
          )}
          {currentCard && hasExercise(currentCard) && (
            <ExerciseCard
              exercise={currentCard.exercise}
              onComplete={(exerciseId, quality) => recordResult(quality)}
            />
          )}
        </motion.div>
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
