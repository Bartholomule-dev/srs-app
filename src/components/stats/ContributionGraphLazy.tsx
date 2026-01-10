'use client';

import dynamic from 'next/dynamic';
import { ContributionGraphSkeleton } from '@/components/ui/Skeleton';

export const ContributionGraphLazy = dynamic(
  () => import('./ContributionGraph').then((mod) => ({ default: mod.ContributionGraph })),
  {
    loading: () => <ContributionGraphSkeleton />,
    ssr: false,
  }
);
