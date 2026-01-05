'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
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

// Animated stat card
function StatCard({
  value,
  label,
  color,
  delay,
}: {
  value: string | number;
  label: string;
  color: 'blue' | 'green' | 'purple';
  delay: number;
}) {
  const colorClasses = {
    blue: 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]',
    green: 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]',
    purple: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      className={`text-center p-4 rounded-xl ${colorClasses[color]}`}
    >
      <div className="text-2xl font-bold font-display">{value}</div>
      <div className="text-xs opacity-80 mt-1">{label}</div>
    </motion.div>
  );
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
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="max-w-md mx-auto overflow-hidden">
        {/* Decorative gradient header */}
        <div className="h-2 bg-gradient-to-r from-[var(--accent-primary)] via-purple-500 to-[var(--accent-success)]" />

        <CardContent className="p-6">
          {/* Celebration Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-6"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2, stiffness: 300 }}
              className="text-5xl mb-3 block"
              role="img"
              aria-label="celebration"
            >
              {isPerfectScore ? '🎉' : '✨'}
            </motion.span>
            <h2 className="text-2xl font-bold font-display text-[var(--text-primary)]">
              Session Complete!
            </h2>
            {isPerfectScore && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-amber-400 font-medium mt-2"
              >
                ⭐ Perfect Score! ⭐
              </motion.p>
            )}
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard
              value={stats.completed}
              label="Reviewed"
              color="blue"
              delay={0.3}
            />
            <StatCard
              value={`${accuracy}%`}
              label="Accuracy"
              color="green"
              delay={0.4}
            />
            <StatCard
              value={formatDuration(stats.startTime, stats.endTime)}
              label="Time"
              color="purple"
              delay={0.5}
            />
          </div>

          {/* Correct/Incorrect Breakdown */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center gap-6 mb-6 text-sm"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-success)]" />
              <span className="text-[var(--accent-success)]">
                {stats.correct} correct
              </span>
            </span>
            <span className="text-[var(--text-tertiary)]">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-error)]" />
              <span className="text-[var(--accent-error)]">
                {stats.incorrect} to review
              </span>
            </span>
          </motion.div>

          {/* Back to Dashboard Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              onClick={onDashboard}
              variant="primary"
              className="w-full mb-4"
              glow
            >
              Back to Dashboard
            </Button>
          </motion.div>

          {/* Encouraging Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-sm text-[var(--text-tertiary)]"
          >
            {getEncouragingMessage(accuracy)}
          </motion.p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
