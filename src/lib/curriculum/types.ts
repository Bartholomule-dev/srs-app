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
  | 'aggregation'
  | 'arithmetic'
  | 'assignment'
  | 'attribute'
  | 'comparison'
  | 'conditional'
  | 'construction'
  | 'context'
  | 'conversion'
  | 'declaration'
  | 'definition'
  | 'file'
  | 'filtering'
  | 'function'
  | 'handling'
  | 'import'
  | 'indexing'
  | 'input'
  | 'invocation'
  | 'io'
  | 'iteration'
  | 'logic'
  | 'logical'
  | 'lookup'
  | 'mapping'
  | 'mutation'
  | 'output'
  | 'query'
  | 'swap'
  | 'transformation';

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
  id: string;
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

/** Teaching content for introducing a subconcept */
export interface SubconceptTeaching {
  /** 2-3 sentence explanation of the concept (max 200 chars) */
  explanation: string;
  /** Slug of an intro-level exercise to show as example */
  exampleSlug: string;
}

/** Subconcept definition in curriculum graph */
export interface SubconceptDefinition {
  /** Display name of the subconcept */
  name: string;
  /** Parent concept slug */
  concept: string;
  /** Required subconcepts to unlock */
  prereqs: string[];
  /** Teaching content for first encounter */
  teaching: SubconceptTeaching;
}

/** Extended curriculum graph with subconcept definitions */
export interface ExtendedCurriculumGraph extends CurriculumGraph {
  /** Subconcept definitions with teaching content */
  subconcepts: Record<string, SubconceptDefinition>;
}
