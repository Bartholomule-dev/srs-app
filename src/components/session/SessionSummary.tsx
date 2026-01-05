'use client';

import { useEffect } from 'react';
import type { SessionStats } from '@/lib/session';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fireConfetti } from '@/lib/confetti';

interface SessionSummaryProps {
  /** Session statistics */
  stats: SessionStats;
  /** Callback to navigate to dashboard */
  onDashboard: () => void;
}

function formatDuration(startTime: Date, endTime?: Date): string {
  const end = endTime ?? new Date();
  const diffMs = end.getTime() - startTime.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getEncouragingMessage(accuracy: number): string {
  if (accuracy === 100) {
    return "Flawless! You're mastering this material.";
  }
  if (accuracy >= 80) {
    return 'Great work! Keep up the momentum.';
  }
  if (accuracy >= 60) {
    return "Good effort! You're making progress.";
  }
  return "Keep practicing! Every session builds mastery.";
}

export function SessionSummary({ stats, onDashboard }: SessionSummaryProps) {
  const accuracy =
    stats.completed > 0
      ? Math.round((stats.correct / stats.completed) * 100)
      : 0;

  const isPerfectScore = accuracy === 100 && stats.completed > 0;

  // Fire confetti celebration on mount
  useEffect(() => {
    fireConfetti(isPerfectScore);
  }, [isPerfectScore]);

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6">
        {/* Celebration Header */}
        <div className="text-center mb-6">
          <span className="text-4xl mb-2 block" role="img" aria-label="celebration">
            {isPerfectScore ? '🎉' : '✨'}
          </span>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Session Complete!
          </h2>
          {isPerfectScore && (
            <p className="text-amber-600 dark:text-amber-400 font-medium mt-2">
              Perfect Score!
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.completed}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300">
              Reviewed
            </div>
          </div>

          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {accuracy}%
            </div>
            <div className="text-xs text-green-700 dark:text-green-300">
              Accuracy
            </div>
          </div>

          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatDuration(stats.startTime, stats.endTime)}
            </div>
            <div className="text-xs text-purple-700 dark:text-purple-300">
              Time
            </div>
          </div>
        </div>

        {/* Correct/Incorrect Breakdown */}
        <div className="flex justify-center gap-6 mb-6 text-sm">
          <span className="text-green-600 dark:text-green-400">
            +{stats.correct} correct
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-red-600 dark:text-red-400">
            {stats.incorrect} to review
          </span>
        </div>

        {/* Back to Dashboard Button */}
        <Button
          onClick={onDashboard}
          variant="primary"
          className="w-full mb-4"
        >
          Back to Dashboard
        </Button>

        {/* Encouraging Message */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          {getEncouragingMessage(accuracy)}
        </p>
      </CardContent>
    </Card>
  );
}
