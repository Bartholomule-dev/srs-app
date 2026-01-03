'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useStats } from '@/lib/hooks/useStats';

export function Header() {
  const { user, signOut } = useAuth();
  const { stats } = useStats();

  const streak = stats?.currentStreak ?? 0;
  const todayCount = stats?.cardsReviewedToday ?? 0;

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="text-xl font-bold text-gray-900 dark:text-white"
        >
          SyntaxSRS
        </Link>

        {/* Stats */}
        <div className="flex items-center gap-6">
          {/* Streak */}
          <div className="flex items-center gap-1 text-sm">
            {streak > 0 ? (
              <>
                <span className="text-orange-500">🔥</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {streak}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  day streak
                </span>
              </>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                Start your streak!
              </span>
            )}
          </div>

          {/* Today count */}
          <div className="flex items-center gap-1 text-sm">
            <span className="font-medium text-gray-900 dark:text-white">
              {todayCount}
            </span>
            <span className="text-gray-500 dark:text-gray-400">today</span>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user?.email}
            </span>
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
