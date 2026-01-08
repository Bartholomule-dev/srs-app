'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
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

  // Use ResizeObserver for reliable position updates on resize/layout changes
  useEffect(() => {
    if (!data || !containerRef.current) return;

    // Initial position calculation after a frame to ensure paint
    const initialTimer = requestAnimationFrame(() => {
      requestAnimationFrame(updatePositions);
    });

    // Debounced resize handler to avoid excessive recalculations
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    const debouncedUpdate = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updatePositions, 100);
    };

    // Watch for container resize
    const resizeObserver = new ResizeObserver(debouncedUpdate);

    resizeObserver.observe(containerRef.current);

    // Also handle window resize for edge cases
    window.addEventListener('resize', debouncedUpdate);

    return () => {
      cancelAnimationFrame(initialTimer);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      window.removeEventListener('resize', debouncedUpdate);
    };
  }, [data, updatePositions]);

  // Register node ref callback
  const registerNode = useCallback((slug: string, element: HTMLElement | null) => {
    if (element) {
      nodeRefs.current.set(slug, element);
    } else {
      nodeRefs.current.delete(slug);
    }
  }, []);

  // Build global prereqNames map from ALL clusters for cross-concept tooltips
  // Must be called before any early returns to follow React hooks rules
  const globalPrereqNames = useMemo(() => {
    if (!data) return {};
    const map: Record<string, string> = {};
    for (const cluster of data.clusters) {
      for (const subconcept of cluster.subconcepts) {
        map[subconcept.slug] = subconcept.name;
      }
    }
    return map;
  }, [data]);

  if (loading) {
    return (
      <div
        data-testid="skill-tree-loading"
        className={cn(
          'rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)]/50 p-6',
          className
        )}
      >
        <div className="animate-pulse flex flex-col gap-8 max-w-4xl mx-auto">
          {[1, 2, 3].map((tier) => (
            <div key={tier} className="flex flex-wrap justify-center gap-6">
              {[1, 2].map((cluster) => (
                <div key={cluster} className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[var(--bg-surface-2)]/30">
                  <div className="h-4 w-24 bg-[var(--bg-surface-3)] rounded" />
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((node) => (
                      <div
                        key={node}
                        className="w-10 h-10 rounded-full bg-[var(--bg-surface-3)]"
                      />
                    ))}
                  </div>
                </div>
              ))}
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
          'rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center',
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
        'rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)]',
        className
      )}
    >
      <div data-testid="skill-tree-scroll" className="overflow-visible">
        <div
          ref={containerRef}
          className="relative p-6"
          style={{ minHeight: '350px' }}
        >
          {/* Central spine - only visible on md+ screens */}
          <div
            className="absolute left-1/2 top-12 bottom-12 w-px bg-gradient-to-b from-transparent via-[var(--border)] to-transparent -translate-x-1/2 hidden md:block"
            aria-hidden="true"
          />

          {/* Dependency lines SVG overlay */}
          <DependencyLines
            clusters={data.clusters}
            nodePositions={nodePositions}
          />

          {/* Concept clusters in vertical tier rows */}
          <div className="flex flex-col gap-8 max-w-4xl mx-auto">
            {Array.from(tierGroups.entries())
              .sort(([a], [b]) => a - b)
              .map(([tier, slugs]) => (
                <div key={tier} className="flex flex-wrap justify-center gap-6">
                  {slugs.map((slug) => {
                    const cluster = data.clusters.find((c) => c.slug === slug);
                    if (!cluster) return null;

                    return (
                      <ClusterWithNodeRefs
                        key={slug}
                        cluster={cluster}
                        registerNode={registerNode}
                        prereqNames={globalPrereqNames}
                      />
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
  prereqNames: Record<string, string>;
}

function ClusterWithNodeRefs({
  cluster,
  registerNode,
  prereqNames,
}: ClusterWithNodeRefsProps) {
  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[var(--bg-surface-1)]/30 border border-[var(--border)]/50">
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
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 justify-items-center">
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
