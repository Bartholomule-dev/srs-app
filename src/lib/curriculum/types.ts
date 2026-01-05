// src/lib/curriculum/types.ts
// Types for curriculum taxonomy and learning progression

/** Concept (milestone) in the curriculum DAG */
export type ConceptSlug =
  | 'foundations'
  | 'strings'
  | 'numbers-booleans'
  | 'collections'
  | 'control-flow'
  | 'functions'
  | 'comprehensions'
  | 'error-handling'
  | 'oop'
  | 'modules-files';

/** Exercise difficulty level within a subconcept */
export type ExerciseLevel = 'intro' | 'practice' | 'edge' | 'integrated';

/** Exercise format/type */
export type ExerciseType = 'write' | 'fill-in' | 'predict' | 'debug';

/** Programming pattern being practiced */
export type ExercisePattern =
  | 'accumulator'
  | 'filtering'
  | 'indexing'
  | 'mapping'
  | 'lookup'
  | 'iteration'
  | 'mutation'
  | 'construction'
  | 'comparison'
  | 'conversion'
  | 'io'
  | 'definition'
  | 'invocation'
  | 'handling';

/** SRS learning phase for a subconcept */
export type LearningPhase = 'learning' | 'review';

/** Concept definition in curriculum graph */
export interface Concept {
  slug: ConceptSlug;
  name: string;
  description: string;
  prereqs: ConceptSlug[];
  subconcepts: string[];
}

/** Subconcept progress (SRS state) */
export interface SubconceptProgress {
  userId: string;
  subconceptSlug: string;
  conceptSlug: ConceptSlug;
  phase: LearningPhase;
  easeFactor: number;
  interval: number;
  nextReview: Date;
  lastReviewed: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Exercise attempt tracking */
export interface ExerciseAttempt {
  id: string;
  userId: string;
  exerciseSlug: string;
  timesSeen: number;
  timesCorrect: number;
  lastSeenAt: Date;
}

/** Curriculum graph for a language */
export interface CurriculumGraph {
  language: string;
  concepts: Concept[];
}
