// src/lib/curriculum/index.ts
// Barrel export for curriculum types and loader utilities

export type {
  ConceptSlug,
  ExerciseLevel,
  ExerciseType,
  ExercisePattern,
  LearningPhase,
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
} from './loader';
