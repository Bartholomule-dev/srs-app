'use client';

import { cn } from '@/lib/utils';

interface StreakFlameProps {
  streak: number;
  showCount?: boolean;
  className?: string;
}

export function StreakFlame({ streak, showCount = false, className }: StreakFlameProps) {
  // Determine animation intensity based on streak length
  const isHighStreak = streak >= 30;
  const isMediumStreak = streak >= 7;

  const animationClass = isMediumStreak ? 'animate-bounce' : 'animate-pulse';
  const glowClass = isHighStreak ? 'drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]' : '';

  return (
    <div
      data-testid="streak-flame"
      data-flame
      className={cn('relative inline-flex items-center', className)}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          'w-6 h-6 text-orange-400',
          animationClass,
          glowClass
        )}
      >
        <path
          d="M12 2C12 2 7 7 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 7 12 2 12 2Z"
          fill="currentColor"
        />
        <path
          d="M12 17C10.34 17 9 15.66 9 14C9 12.34 12 9 12 9C12 9 15 12.34 15 14C15 15.66 13.66 17 12 17Z"
          fill="#FCD34D"
        />
      </svg>

      {showCount && (
        <span className="ml-1 text-sm font-bold text-orange-400">
          {streak}
        </span>
      )}
    </div>
  );
}
