// src/lib/skill-tree/build-tree.ts
import curriculum from '@/lib/curriculum/python.json';
import type { SubconceptProgress } from '@/lib/curriculum/types';
import {
  getSubconceptState,
  type SkillTreeData,
  type SkillTreeCluster,
  type SkillTreeNode,
} from './types';

/**
 * Tier assignments based on curriculum DAG
 * Computed from concept prerequisites
 */
const CONCEPT_TIERS: Record<string, number> = {
  foundations: 1,
  strings: 2,
  'numbers-booleans': 2,
  collections: 3,
  'control-flow': 4,
  functions: 4,
  comprehensions: 5,
  'error-handling': 6,
  oop: 6,
  'modules-files': 7,
};

/**
 * Build the complete skill tree data structure from curriculum and progress
 *
 * @param progress - Array of user's subconcept progress records
 * @returns Complete skill tree data for rendering
 */
export function buildSkillTreeData(progress: SubconceptProgress[]): SkillTreeData {
  // Build progress map for O(1) lookups
  const progressMap = new Map<string, SubconceptProgress>();
  for (const p of progress) {
    progressMap.set(p.subconceptSlug, p);
  }

  // Get subconcept definitions from curriculum
  const subconceptDefs = curriculum.subconcepts as Record<
    string,
    { name: string; concept: string; prereqs: string[] }
  >;

  let totalMastered = 0;
  let totalSubconcepts = 0;

  // Build clusters from concepts
  const clusters: SkillTreeCluster[] = curriculum.concepts.map((concept) => {
    const subconcepts: SkillTreeNode[] = concept.subconcepts.map((slug) => {
      const def = subconceptDefs[slug];
      const prog = progressMap.get(slug);
      const state = getSubconceptState(slug, progressMap, def?.prereqs ?? []);

      totalSubconcepts++;
      if (state === 'mastered') {
        totalMastered++;
      }

      return {
        slug,
        name: def?.name ?? slug,
        concept: concept.slug,
        state,
        stability: prog?.stability ?? null,
        prereqs: def?.prereqs ?? [],
      };
    });

    const masteredCount = subconcepts.filter((s) => s.state === 'mastered').length;

    return {
      slug: concept.slug,
      name: concept.name,
      description: concept.description,
      tier: CONCEPT_TIERS[concept.slug] ?? 1,
      subconcepts,
      masteredCount,
      totalCount: subconcepts.length,
    };
  });

  return {
    clusters,
    totalMastered,
    totalSubconcepts,
  };
}
