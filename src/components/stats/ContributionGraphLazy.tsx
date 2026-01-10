'use client';

import dynamic from 'next/dynamic';
import { ContributionGraphSkeleton } from '@/components/ui/Skeleton';
import { FeatureErrorBoundary } from '@/components/ui/FeatureErrorBoundary';

const ContributionGraphDynamic = dynamic(
  () => import('./ContributionGraph').then((mod) => ({ default: mod.ContributionGraph })),
  {
    loading: () => <ContributionGraphSkeleton />,
    ssr: false,
  }
);

export function ContributionGraphLazy(props: React.ComponentProps<typeof ContributionGraphDynamic>) {
  return (
    <FeatureErrorBoundary featureName="Contribution Graph">
      <ContributionGraphDynamic {...props} />
    </FeatureErrorBoundary>
  );
}
