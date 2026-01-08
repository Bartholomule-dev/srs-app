// src/lib/curriculum/types.ts
// Types for curriculum taxonomy and learning progression

/** Concept (milestone) in the curriculum DAG */
export type ConceptSlug =
  | 'foundations'
  | 'strings'
  | 'numbers-booleans'
  | 'conditionals'
  | 'collections'
  | 'loops'
  | 'functions'
  | 'comprehensions'
  | 'error-handling'
  | 'oop'
  | 'modules-files';

/** Exercise difficulty level within a subconcept */
export type ExerciseLevel = 'intro' | 'practice' | 'edge' | 'integrated';

/** Exercise format/type */
export type ExerciseType = 'write' | 'fill-in' | 'predict';

/** Programming pattern being practiced */
export type ExercisePattern =
  | 'accumulator'
  | 'aggregation'
  | 'arithmetic'
  | 'assignment'
  | 'attribute'
  | 'branching'
  | 'comparison'
  | 'conditional'
  | 'construction'
  | 'context'
  | 'control'
  | 'conversion'
  | 'declaration'
  | 'definition'
  | 'error-first'
  | 'expression'
  | 'file'
  | 'filtering'
  | 'function'
  | 'gotcha'
  | 'handling'
  | 'idiomatic'
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
  | 'scope'
  | 'search'
  | 'slicing'
  | 'structural'
  | 'swap'
  | 'transformation';

/** Concept definition in curriculum graph */
export interface Concept {
  slug: ConceptSlug;
  name: string;
  description: string;
  prereqs: ConceptSlug[];
  subconcepts: string[];
}

/** Subconcept progress (SRS state using FSRS algorithm) */
export interface SubconceptProgress {
  id: string;
  userId: string;
  subconceptSlug: string;
  conceptSlug: ConceptSlug;

  // FSRS fields
  stability: number;
  difficulty: number;
  fsrsState: 0 | 1 | 2 | 3; // 0=New, 1=Learning, 2=Review, 3=Relearning
  reps: number;
  lapses: number;
  elapsedDays: number;
  scheduledDays: number;

  // Timestamps
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

/** Common pitfall for a subconcept */
export interface SubconceptPitfall {
  /** The mistake developers commonly make */
  mistake: string;
  /** Why this is problematic */
  why: string;
  /** The correct approach */
  fix: string;
  /** Real-world production impact - "when this bites you" */
  productionImpact?: string;
}

/** Teaching content for introducing a subconcept */
export interface SubconceptTeaching {
  /** 2-3 sentence explanation of the concept (max 200 chars) */
  explanation: string;
  /** Dedicated code example to show (preferred) */
  exampleCode?: string;
  /** @deprecated Slug of exercise to use as example - use exampleCode instead */
  exampleSlug?: string;
  /** Common pitfall to avoid (shown after intro exercises) */
  pitfall?: SubconceptPitfall;
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
