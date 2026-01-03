'use client';

import type { SessionStats } from '@/lib/session';

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

export function SessionSummary({ stats, onDashboard }: SessionSummaryProps) {
  const accuracy =
    stats.completed > 0
      ? Math.round((stats.correct / stats.completed) * 100)
      : 0;

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        Session Complete!
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {stats.correct}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">
            Correct
          </div>
        </div>

        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
            {stats.incorrect}
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">
            Incorrect
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Accuracy</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {accuracy}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Time</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatDuration(stats.startTime, stats.endTime)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Cards</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {stats.completed} / {stats.total}
          </span>
        </div>
      </div>

      <button
        onClick={onDashboard}
        className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
