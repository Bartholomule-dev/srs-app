'use client';

import dynamic from 'next/dynamic';
import { AchievementsSkeleton } from '@/components/ui/Skeleton';

export const RecentAchievementsLazy = dynamic(
  () => import('./RecentAchievements').then((mod) => ({ default: mod.RecentAchievements })),
  {
    loading: () => <AchievementsSkeleton />,
    ssr: false,
  }
);
