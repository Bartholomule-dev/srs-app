import type { SubconceptTeaching, SubconceptDefinition, Concept } from './types';
import pythonCurriculumData from './python.json';
import javascriptCurriculumData from './javascript.json';

// Type for the extended curriculum with subconcepts
export interface CurriculumWithSubconcepts {
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

// Map of all available curriculums
const curriculums: Record<string, CurriculumWithSubconcepts> = {
  python: pythonCurriculumData as CurriculumWithSubconcepts,
  javascript: javascriptCurriculumData as CurriculumWithSubconcepts,
};

/**
 * Load curriculum for a given language
 * @param language - Language identifier (default: 'python')
 * @returns CurriculumWithSubconcepts for the specified language
 * @throws Error if language is not supported
 */
export function loadCurriculum(language: string = 'python'): CurriculumWithSubconcepts {
  const curriculum = curriculums[language];
  if (!curriculum) {
    throw new Error(`Unknown language: ${language}`);
  }
  return curriculum;
}

/**
 * Get teaching content for a subconcept
 * @param subconceptSlug - The subconcept identifier
 * @param language - Language identifier (default: 'python')
 * @returns Teaching content or null if subconcept not found
 */
export function getSubconceptTeaching(
  subconceptSlug: string,
  language: string = 'python'
): SubconceptTeaching | null {
  const curriculum = loadCurriculum(language);
  const definition = curriculum.subconcepts?.[subconceptSlug];
  return definition?.teaching ?? null;
}

/**
 * Get full subconcept definition
 * @param subconceptSlug - The subconcept identifier
 * @param language - Language identifier (default: 'python')
 * @returns SubconceptDefinition or null if not found
 */
export function getSubconceptDefinition(
  subconceptSlug: string,
  language: string = 'python'
): SubconceptDefinition | null {
  const curriculum = loadCurriculum(language);
  return curriculum.subconcepts?.[subconceptSlug] ?? null;
}

/**
 * Get all subconcept slugs from the curriculum
 * @param language - Language identifier (default: 'python')
 * @returns Array of subconcept slugs
 */
export function getAllSubconcepts(language: string = 'python'): string[] {
  const curriculum = loadCurriculum(language);

  // Collect from concepts array (current structure)
  const fromConcepts = curriculum.concepts.flatMap((c) => c.subconcepts);

  // Also include any defined in subconcepts object
  const fromDefinitions = Object.keys(curriculum.subconcepts ?? {});

  // Combine and dedupe
  return [...new Set([...fromConcepts, ...fromDefinitions])];
}

/**
 * Get all concepts from the curriculum as typed array.
 * Used by progression functions that need the full concept graph.
 * @param language - Language identifier (default: 'python')
 * @returns Array of Concept objects
 */
export function getCurriculumConcepts(language: string = 'python'): Concept[] {
  const curriculum = loadCurriculum(language);
  return curriculum.concepts as Concept[];
}

/**
 * Get list of supported languages
 * @returns Array of supported language identifiers
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(curriculums);
}
