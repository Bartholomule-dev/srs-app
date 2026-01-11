// src/lib/skill-tree/build-tree.ts
import { loadCurriculum } from '@/lib/curriculum/loader';
import type { SubconceptProgress } from '@/lib/curriculum/types';
import { getBadgeTier } from '@/lib/gamification/badges';
import {
  getSubconceptState,
  type SkillTreeData,
  type SkillTreeCluster,
  type SkillTreeNode,
} from './types';

/**
 * Tier assignments based on curriculum DAG
 * Computed from concept prerequisites
 * Each language can have its own tier mappings
 */
const CONCEPT_TIERS: Record<string, Record<string, number>> = {
  python: {
    foundations: 1,
    strings: 2,
    'numbers-booleans': 2,
    conditionals: 3,
    collections: 3,
    loops: 4,
    functions: 5,
    comprehensions: 5,
    'error-handling': 6,
    oop: 6,
    'modules-files': 7,
  },
  javascript: {
    foundations: 1,
    functions: 2,
    async: 3,
  },
};

/**
 * Get tier for a concept, defaulting to 1 if not defined
 */
function getConceptTier(conceptSlug: string, language: string): number {
  return CONCEPT_TIERS[language]?.[conceptSlug] ?? 1;
}

/**
 * Build the complete skill tree data structure from curriculum and progress
 *
 * @param progress - Array of user's subconcept progress records
 * @param language - Language identifier (default: 'python')
 * @returns Complete skill tree data for rendering
 */
export function buildSkillTreeData(
  progress: SubconceptProgress[],
  language: string = 'python'
): SkillTreeData {
  const curriculum = loadCurriculum(language);

  // Build progress map for O(1) lookups
  const progressMap = new Map<string, SubconceptProgress>();
  for (const p of progress) {
    progressMap.set(p.subconceptSlug, p);
  }

  // Get subconcept definitions from curriculum
  const subconceptDefs = (curriculum.subconcepts ?? {}) as Record<
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

      // Derive prerequisite status from state (locked means prereqs not met)
      const prereqsMet = state !== 'locked';
      const stability = prog?.stability ?? 0;
      const badgeTier = getBadgeTier({ stability, prereqsMet });

      totalSubconcepts++;
      if (state === 'mastered') {
        totalMastered++;
      }

      return {
        slug,
        name: def?.name ?? slug,
        concept: concept.slug,
        state,
        badgeTier,
        stability: prog?.stability ?? null,
        reps: prog?.reps ?? 0,
        prereqs: def?.prereqs ?? [],
      };
    });

    const masteredCount = subconcepts.filter((s) => s.state === 'mastered').length;

    return {
      slug: concept.slug,
      name: concept.name,
      description: concept.description,
      tier: getConceptTier(concept.slug, language),
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
