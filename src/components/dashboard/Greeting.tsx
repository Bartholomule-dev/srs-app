'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { useProfile } from '@/lib/hooks/useProfile';
import { useStats } from '@/lib/hooks/useStats';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

function getContextMessage(dueCount: number, streak: number): string {
  // Streak at risk - needs to practice today
  if (streak > 0 && dueCount > 0) {
    return `Practice today to keep your ${streak}-day streak!`;
  }
  // Has cards due
  if (dueCount > 0) {
    return `You have ${dueCount} card${dueCount === 1 ? '' : 's'} waiting`;
  }
  // All caught up
  return 'All caught up! Learn something new?';
}

interface GreetingProps {
  /** Number of due cards (passed from dashboard to avoid duplicate queries) */
  dueCount?: number;
  /** Whether data is loading */
  isLoading?: boolean;
}

export function Greeting({ dueCount: propDueCount, isLoading: propLoading }: GreetingProps = {}) {
  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();
  const { stats, loading: statsLoading } = useStats();

  const greeting = getGreeting();
  const username = profile?.username || 'there';
  // Use prop if provided, otherwise we'd need to fetch (but we default to 0 for now)
  const dueCount = propDueCount ?? 0;
  const streak = stats?.currentStreak ?? 0;

  const isLoading = propLoading ?? (profileLoading || statsLoading);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-[var(--border)]
                 bg-[var(--bg-surface-1)]/50 backdrop-blur-sm"
    >
      {/* Decorative gradient accent */}
      <div
        className="absolute top-0 right-0 w-[300px] h-[300px]
                      bg-[radial-gradient(circle,rgba(245,158,11,0.15)_0%,transparent_70%)]"
      />

      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Text content */}
          <div>
            <motion.h1
              className="text-2xl md:text-3xl lg:text-4xl font-display font-bold tracking-[-0.02em] mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {greeting},{' '}
              <span
                className="bg-gradient-to-r from-[var(--accent-primary)] to-orange-500
                              bg-clip-text text-transparent"
              >
                {username}
              </span>
            </motion.h1>
            <motion.p
              className="text-[var(--text-secondary)] text-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {isLoading ? 'Loading...' : getContextMessage(dueCount, streak)}
            </motion.p>

            {/* Streak indicator */}
            {streak > 0 && !isLoading && (
              <motion.div
                className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                           bg-orange-500/10 border border-orange-500/20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <span className="text-orange-500 text-lg">🔥</span>
                <span className="text-orange-400 font-medium">{streak} day streak</span>
              </motion.div>
            )}
          </div>

          {/* CTA button */}
          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Button
              glow
              size="lg"
              onClick={() => router.push('/practice')}
              disabled={isLoading}
            >
              {dueCount > 0 ? 'Start Practice' : 'Learn New Cards'}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
