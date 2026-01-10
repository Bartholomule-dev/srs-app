// src/lib/curriculum/index.ts
// Barrel export for curriculum types and loader utilities

export type {
  ConceptSlug,
  ExerciseLevel,
  ExerciseType,
  ExercisePattern,
  Concept,
  SubconceptProgress,
  ExerciseAttempt,
  CurriculumGraph,
  SubconceptTeaching,
  SubconceptDefinition,
  ExtendedCurriculumGraph,
} from './types';

export {
  getSubconceptTeaching,
  getSubconceptDefinition,
  getAllSubconcepts,
  getCurriculumConcepts,
} from './loader';

export {
  getUnlockedConcepts,
  getNextSubconcepts,
  getSkippedConceptsByExperience,
} from './progression';
