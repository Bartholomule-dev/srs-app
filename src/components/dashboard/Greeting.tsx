'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui';
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
    <Card
      elevation={2}
      className="mb-8 bg-gradient-to-br from-[var(--bg-surface-1)] to-[var(--bg-surface-2)]"
    >
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Text content */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {greeting},{' '}
              <span className="text-[var(--accent-primary)]">{username}</span>
            </h1>
            <p className="text-[var(--text-secondary)] text-lg">
              {isLoading ? 'Loading...' : getContextMessage(dueCount, streak)}
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              glow
              size="lg"
              onClick={() => router.push('/practice')}
              disabled={isLoading || dueCount === 0}
            >
              Start Practice
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => router.push('/exercises')}
            >
              Browse exercises
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
