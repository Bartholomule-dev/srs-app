'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse rounded-md',
          'bg-[var(--bg-surface-3)]',
          className
        )}
        {...props}
      />
    );
  }
);

export function SkillTreeSkeleton() {
  return (
    <div data-testid="skill-tree-skeleton" className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}

export function ContributionGraphSkeleton() {
  return (
    <div data-testid="contribution-graph-skeleton">
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export function AchievementsSkeleton() {
  return (
    <div data-testid="achievements-skeleton" className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
