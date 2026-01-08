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
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // For vertical flow (lines going down), use vertical control points
  // For horizontal flow (lines within a tier), use horizontal control points
  if (Math.abs(dy) > Math.abs(dx)) {
    // Vertical dominant - curve with horizontal variation
    const midY = (from.y + to.y) / 2;
    return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
  } else {
    // Horizontal dominant - curve with vertical variation
    const midX = (from.x + to.x) / 2;
    return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
  }
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
      <defs>
        <linearGradient id="line-gradient-unlocked" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.4" />
          <stop offset="50%" stopColor="var(--accent-primary)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--accent-secondary)" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {lines.map((line) => (
        <motion.path
          key={`${line.from}-${line.to}`}
          d={bezierPath(line.fromPos, line.toPos)}
          fill="none"
          stroke={line.isUnlocked ? 'url(#line-gradient-unlocked)' : 'var(--text-tertiary)'}
          strokeWidth={line.isUnlocked ? 2.5 : 1.5}
          strokeOpacity={line.isUnlocked ? 1 : 0.15}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      ))}
    </svg>
  );
}
