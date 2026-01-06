'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useStats } from '@/lib/hooks/useStats';
import { FlameIcon } from '@/components/ui';

export function Header() {
  const { user, signOut } = useAuth();
  const { stats } = useStats();

  const streak = stats?.currentStreak ?? 0;
  const todayCount = stats?.cardsReviewedToday ?? 0;

  return (
    <header className="border-b border-[var(--border)] bg-[var(--bg-surface-1)]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo with gradient */}
        <Link
          href="/dashboard"
          className="text-xl font-bold font-display"
        >
          <span className="bg-gradient-to-r from-[var(--accent-primary)] to-orange-500 bg-clip-text text-transparent">
            Syntax
          </span>
          <span className="text-[var(--text-primary)]">SRS</span>
        </Link>

        {/* Stats */}
        <div className="flex items-center gap-6">
          {/* Streak */}
          <div className="flex items-center gap-1.5 text-sm">
            {streak > 0 ? (
              <>
                <FlameIcon size={18} animate={streak >= 3} />
                <span className="font-medium text-[var(--text-primary)]">
                  {streak}
                </span>
                <span className="text-[var(--text-secondary)]">
                  day streak
                </span>
              </>
            ) : (
              <span className="text-[var(--text-secondary)]">
                Start your streak!
              </span>
            )}
          </div>

          {/* Today count */}
          <div className="flex items-center gap-1 text-sm">
            <span className="font-medium text-[var(--text-primary)]">
              {todayCount}
            </span>
            <span className="text-[var(--text-secondary)]">today</span>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-secondary)]">
              {user?.email}
            </span>
            <button
              onClick={() => signOut()}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
