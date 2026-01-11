// src/components/dashboard/DueNowBand.tsx
'use client';

import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui';
import { respiratoryPulse } from '@/lib/motion';
import { LanguageSwitcher } from './LanguageSwitcher';

interface DueNowBandProps {
  dueCount: number;
  streak: number;
  isLoading?: boolean;
}

export function DueNowBand({ dueCount, streak, isLoading = false }: DueNowBandProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const hasDueCards = dueCount > 0;
  const streakAtRisk = streak > 0 && hasDueCards;

  if (isLoading) {
    return (
      <div className="border-l-4 border-[var(--border)] bg-[var(--bg-surface-1)] rounded-r-lg p-4">
        <div className="animate-pulse flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-20 bg-[var(--bg-surface-3)] rounded" />
            <div className="h-4 w-32 bg-[var(--bg-surface-3)] rounded" />
          </div>
          <div className="h-10 w-28 bg-[var(--bg-surface-3)] rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        border-l-4 rounded-r-lg p-4 transition-colors duration-150
        ${hasDueCards
          ? 'border-[var(--accent-primary)] bg-[var(--bg-surface-1)]'
          : 'border-[var(--accent-success)] bg-[var(--bg-surface-1)]'
        }
      `}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <div className="h-8 w-px bg-[var(--border)]" aria-hidden="true" />
        </div>
        <div className="flex-1">
          {hasDueCards ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-display text-[var(--text-primary)]">
                  {dueCount}
                </span>
                <span className="text-[var(--text-secondary)]">
                  card{dueCount !== 1 ? 's' : ''} due
                </span>
              </div>
              {streakAtRisk && (
                <p className="text-sm text-[var(--accent-warning)] mt-1">
                  Practice to keep your {streak}-day streak!
                </p>
              )}
            </>
          ) : (
            <div>
              <span className="text-lg font-semibold text-[var(--accent-success)]">
                All caught up!
              </span>
              <p className="text-sm text-[var(--text-secondary)]">
                Learn something new?
              </p>
            </div>
          )}
        </div>
        <motion.div
          animate={hasDueCards && !reduceMotion ? respiratoryPulse.animate : undefined}
          transition={hasDueCards && !reduceMotion ? respiratoryPulse.transition : undefined}
        >
          <Button
            size="lg"
            onClick={() => router.push('/practice')}
          >
            {hasDueCards ? 'Start Practice' : 'Learn New'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
