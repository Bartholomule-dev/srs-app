import type { SubconceptTeaching, SubconceptDefinition } from './types';
import curriculumData from './python.json';

// Type for the extended curriculum with subconcepts
interface CurriculumWithSubconcepts {
  language: string;
  version: string;
  concepts: Array<{
    slug: string;
    name: string;
    description: string;
    prereqs: string[];
    subconcepts: string[];
  }>;
  subconcepts?: Record<string, SubconceptDefinition>;
}

const curriculum = curriculumData as CurriculumWithSubconcepts;

/**
 * Get teaching content for a subconcept
 * @returns Teaching content or null if subconcept not found
 */
export function getSubconceptTeaching(subconceptSlug: string): SubconceptTeaching | null {
  const definition = curriculum.subconcepts?.[subconceptSlug];
  return definition?.teaching ?? null;
}

/**
 * Get full subconcept definition
 * @returns SubconceptDefinition or null if not found
 */
export function getSubconceptDefinition(subconceptSlug: string): SubconceptDefinition | null {
  return curriculum.subconcepts?.[subconceptSlug] ?? null;
}

/**
 * Get all subconcept slugs from the curriculum
 */
export function getAllSubconcepts(): string[] {
  // Collect from concepts array (current structure)
  const fromConcepts = curriculum.concepts.flatMap(c => c.subconcepts);

  // Also include any defined in subconcepts object
  const fromDefinitions = Object.keys(curriculum.subconcepts ?? {});

  // Combine and dedupe
  return [...new Set([...fromConcepts, ...fromDefinitions])];
}
