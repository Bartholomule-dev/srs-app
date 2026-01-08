'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { SkillTreeCluster } from '@/lib/skill-tree/types';

interface Position {
  x: number;
  y: number;
}

interface DependencyLinesProps {
  clusters: SkillTreeCluster[];
  nodePositions: Record<string, Position>;
  className?: string;
}

interface Line {
  from: string;
  to: string;
  fromPos: Position;
  toPos: Position;
  isUnlocked: boolean;
}

function bezierPath(from: Position, to: Position): string {
  const midY = (from.y + to.y) / 2;
  return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
}

export function DependencyLines({
  clusters,
  nodePositions,
  className,
}: DependencyLinesProps) {
  // Build state map for determining line colors
  const stateMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cluster of clusters) {
      for (const subconcept of cluster.subconcepts) {
        map.set(subconcept.slug, subconcept.state);
      }
    }
    return map;
  }, [clusters]);

  // Calculate lines
  const lines = useMemo(() => {
    const result: Line[] = [];

    for (const cluster of clusters) {
      for (const subconcept of cluster.subconcepts) {
        for (const prereqSlug of subconcept.prereqs) {
          const fromPos = nodePositions[prereqSlug];
          const toPos = nodePositions[subconcept.slug];

          if (fromPos && toPos) {
            // Line is unlocked if the prerequisite is mastered
            const isUnlocked = stateMap.get(prereqSlug) === 'mastered';

            result.push({
              from: prereqSlug,
              to: subconcept.slug,
              fromPos,
              toPos,
              isUnlocked,
            });
          }
        }
      }
    }

    return result;
  }, [clusters, nodePositions, stateMap]);

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className ?? ''}`}
      aria-hidden="true"
    >
      {lines.map((line) => (
        <motion.path
          key={`${line.from}-${line.to}`}
          d={bezierPath(line.fromPos, line.toPos)}
          fill="none"
          stroke={line.isUnlocked ? 'var(--accent-primary)' : 'var(--text-tertiary)'}
          strokeWidth={2}
          strokeOpacity={line.isUnlocked ? 0.6 : 0.2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      ))}
    </svg>
  );
}
