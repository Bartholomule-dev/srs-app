'use client';

import dynamic from 'next/dynamic';
import { SkillTreeSkeleton } from '@/components/ui/Skeleton';
import { FeatureErrorBoundary } from '@/components/ui/FeatureErrorBoundary';

const SkillTreeDynamic = dynamic(
  () => import('./SkillTree').then((mod) => ({ default: mod.SkillTree })),
  {
    loading: () => <SkillTreeSkeleton />,
    ssr: false,
  }
);

export function SkillTreeLazy(props: React.ComponentProps<typeof SkillTreeDynamic>) {
  return (
    <FeatureErrorBoundary featureName="Skill Tree">
      <SkillTreeDynamic {...props} />
    </FeatureErrorBoundary>
  );
}
