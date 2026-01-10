'use client';

import dynamic from 'next/dynamic';
import { SkillTreeSkeleton } from '@/components/ui/Skeleton';

export const SkillTreeLazy = dynamic(
  () => import('./SkillTree').then((mod) => ({ default: mod.SkillTree })),
  {
    loading: () => <SkillTreeSkeleton />,
    ssr: false,
  }
);
