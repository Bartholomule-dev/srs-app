'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { ANIMATION_BUDGET } from '@/lib/motion';
import type { Achievement } from '@/lib/gamification/achievements';

export interface AchievementCardProps {
  /** The achievement to display */
  achievement: Achievement;
  /** Whether the user has unlocked this achievement */
  unlocked?: boolean;
  /** ISO date string when the achievement was unlocked */
  unlockedAt?: string;
  /** Animation delay for staggered entrance */
  delay?: number;
  /** Additional CSS classes */
  className?: string;
}

// Category badge colors
const categoryColors: Record<string, string> = {
  habit: 'bg-[var(--accent-warning)]/20 text-[var(--accent-warning)]',
  mastery: 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]',
  completionist: 'bg-[var(--accent-success)]/20 text-[var(--accent-success)]',
};

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function AchievementCard({
  achievement,
  unlocked = false,
  unlockedAt,
  delay = 0,
  className,
}: AchievementCardProps) {
  const { name, description, icon, category } = achievement;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...ANIMATION_BUDGET.stateChange, delay }}
    >
      <Card elevation={2} className={cn('overflow-hidden', className)}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Icon */}
            <div
              className={cn(
                'flex items-center justify-center w-14 h-14 rounded-lg bg-[var(--bg-surface-3)] text-3xl flex-shrink-0',
                !unlocked && 'grayscale opacity-50'
              )}
            >
              {icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header row: Name + Category badge */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3
                  className={cn(
                    'font-semibold font-display truncate',
                    unlocked
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-tertiary)]'
                  )}
                >
                  {name}
                </h3>
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0',
                    categoryColors[category]
                  )}
                >
                  {category}
                </span>
              </div>

              {/* Description */}
              <p
                className={cn(
                  'text-sm line-clamp-2',
                  unlocked
                    ? 'text-[var(--text-secondary)]'
                    : 'text-[var(--text-tertiary)]'
                )}
              >
                {description}
              </p>

              {/* Footer: Locked badge or unlock date */}
              <div className="mt-2">
                {unlocked ? (
                  unlockedAt && (
                    <span className="text-xs text-[var(--text-tertiary)]">
                      Unlocked {formatDate(unlockedAt)}
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-tertiary)] bg-[var(--bg-surface-3)] px-2 py-0.5 rounded">
                    <LockIcon className="w-3 h-3" />
                    Locked
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
