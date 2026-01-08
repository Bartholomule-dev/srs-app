'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SubconceptNode } from './SubconceptNode';
import type { SkillTreeCluster } from '@/lib/skill-tree/types';

interface ConceptClusterProps {
  cluster: SkillTreeCluster;
  className?: string;
}

export function ConceptCluster({ cluster, className }: ConceptClusterProps) {
  // Build prereqNames map for tooltips
  const prereqNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const subconcept of cluster.subconcepts) {
      map[subconcept.slug] = subconcept.name;
    }
    return map;
  }, [cluster.subconcepts]);

  return (
    <motion.div
      className={cn('flex flex-col items-center gap-2', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Label and progress badge */}
      <div className="flex items-center gap-2 mb-1">
        <span className="font-display text-sm font-semibold text-[var(--text-primary)]">
          {cluster.name}
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-surface-2)] text-[var(--text-secondary)]">
          {cluster.masteredCount}/{cluster.totalCount}
        </span>
      </div>

      {/* Subconcept nodes */}
      <div className="flex flex-col gap-2">
        {cluster.subconcepts.map((subconcept) => (
          <SubconceptNode
            key={subconcept.slug}
            node={subconcept}
            prereqNames={prereqNames}
          />
        ))}
      </div>
    </motion.div>
  );
}
