'use client';

import { useRef, useState, useLayoutEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSkillTree } from '@/lib/hooks/useSkillTree';
import { SubconceptNode } from './SubconceptNode';
import { DependencyLines } from './DependencyLines';
import type { SkillTreeCluster } from '@/lib/skill-tree/types';

interface SkillTreeProps {
  className?: string;
}

interface Position {
  x: number;
  y: number;
}

// Group clusters by tier for layout
function groupByTier(
  clusters: { slug: string; tier: number }[]
): Map<number, string[]> {
  const groups = new Map<number, string[]>();
  for (const cluster of clusters) {
    const existing = groups.get(cluster.tier) ?? [];
    existing.push(cluster.slug);
    groups.set(cluster.tier, existing);
  }
  return groups;
}

export function SkillTree({ className }: SkillTreeProps) {
  const { data, loading, error } = useSkillTree();
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [nodePositions, setNodePositions] = useState<Record<string, Position>>(
    {}
  );

  // Measure node positions after render
  const updatePositions = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const positions: Record<string, Position> = {};

    nodeRefs.current.forEach((element, slug) => {
      const rect = element.getBoundingClientRect();
      positions[slug] = {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2,
      };
    });

    setNodePositions(positions);
  }, []);

  useLayoutEffect(() => {
    if (data) {
      // Delay to ensure DOM is fully painted
      const timer = setTimeout(updatePositions, 100);
      return () => clearTimeout(timer);
    }
  }, [data, updatePositions]);

  // Register node ref callback
  const registerNode = useCallback((slug: string, element: HTMLElement | null) => {
    if (element) {
      nodeRefs.current.set(slug, element);
    } else {
      nodeRefs.current.delete(slug);
    }
  }, []);

  if (loading) {
    return (
      <div
        data-testid="skill-tree-loading"
        className={cn(
          'rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)]/50 backdrop-blur-sm p-6',
          className
        )}
      >
        <div className="animate-pulse flex gap-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-4 w-20 bg-[var(--bg-surface-3)] rounded" />
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="w-12 h-12 rounded-full bg-[var(--bg-surface-3)]"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'rounded-xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm p-6 text-center',
          className
        )}
      >
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const tierGroups = groupByTier(data.clusters);

  return (
    <div
      data-testid="skill-tree-container"
      className={cn(
        'rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)] backdrop-blur-sm',
        className
      )}
    >
      <div
        data-testid="skill-tree-scroll"
        className="overflow-x-auto overflow-y-hidden"
      >
        <div
          ref={containerRef}
          className="relative min-w-max p-6"
          style={{ minHeight: '350px' }}
        >
          {/* Dependency lines SVG overlay */}
          <DependencyLines
            clusters={data.clusters}
            nodePositions={nodePositions}
          />

          {/* Concept clusters in grid */}
          <div className="flex gap-8">
            {Array.from(tierGroups.entries())
              .sort(([a], [b]) => a - b)
              .map(([tier, slugs]) => (
                <div key={tier} className="flex flex-col gap-6">
                  {slugs.map((slug) => {
                    const cluster = data.clusters.find((c) => c.slug === slug);
                    if (!cluster) return null;

                    return (
                      <motion.div
                        key={slug}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: tier * 0.1 }}
                      >
                        <ClusterWithNodeRefs
                          cluster={cluster}
                          registerNode={registerNode}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper to inject ref registration for dependency line positioning
interface ClusterWithNodeRefsProps {
  cluster: SkillTreeCluster;
  registerNode: (slug: string, element: HTMLElement | null) => void;
}

function ClusterWithNodeRefs({
  cluster,
  registerNode,
}: ClusterWithNodeRefsProps) {
  // Build prereqNames map for tooltips
  const prereqNames: Record<string, string> = {};
  for (const subconcept of cluster.subconcepts) {
    prereqNames[subconcept.slug] = subconcept.name;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Label and progress badge */}
      <div className="flex items-center gap-2 mb-1">
        <span className="font-display text-sm font-semibold text-[var(--text-primary)]">
          {cluster.name}
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-surface-2)] text-[var(--text-secondary)]">
          {cluster.masteredCount}/{cluster.totalCount}
        </span>
      </div>

      {/* Subconcept nodes with refs for line positioning */}
      <div className="flex flex-col gap-2">
        {cluster.subconcepts.map((subconcept) => (
          <div
            key={subconcept.slug}
            ref={(el) => registerNode(subconcept.slug, el)}
          >
            <SubconceptNode node={subconcept} prereqNames={prereqNames} />
          </div>
        ))}
      </div>
    </div>
  );
}
