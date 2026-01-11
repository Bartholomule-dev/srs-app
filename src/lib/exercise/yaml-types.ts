// src/lib/exercise/yaml-types.ts
// Types for YAML exercise file format

import type {
  ConceptSlug,
  ExerciseLevel,
  ExerciseType,
  ExercisePattern,
} from '../curriculum/types';
import type { VariantMap } from '../generators/types';

/**
 * Single exercise definition in YAML
 */
export interface YamlExercise {
  slug: string;
  title: string;
  difficulty?: 1 | 2 | 3;
  prompt: string;
  expected_answer: string;
  hints: string[];
  tags?: string[];
  accepted_solutions?: string[]; // Alternative valid answers

  // New taxonomy fields
  concept: ConceptSlug;
  subconcept: string;
  level: ExerciseLevel;
  prereqs: string[];
  type: ExerciseType;
  pattern: ExercisePattern;

  // Learning objective
  objective: string;

  // Multi-subconcept targeting (optional, for exercises testing multiple skills)
  targets?: string[];

  // Fill-in specific
  template?: string;
  blank_position?: number;

  // Predict-output specific
  code?: string; // Read-only code snippet for predict-output exercises

  // Dynamic exercise generation (optional)
  generator?: string;

  // Target construct for two-pass grading (optional)
  target_construct?: {
    type: string;
    feedback?: string;
  };

  // Execution verification flag (optional, for write exercises)
  verify_by_execution?: boolean;

  // Grading strategy override (optional)
  grading_strategy?: 'exact' | 'token' | 'ast' | 'execution';

  // Verification script for execution strategy (optional)
  verification_script?: string;

  // Variant overrides for dynamic exercises with multiple prompt/answer structures
  variants?: VariantMap;
}

/**
 * YAML file structure
 */
export interface YamlExerciseFile {
  language: string;
  category: string;
  exercises: YamlExercise[];
}

/**
 * Validation error for a single exercise
 */
export interface YamlValidationError {
  file: string;
  slug?: string;
  field: string;
  message: string;
}

/**
 * Result of validating all YAML files
 */
export interface YamlValidationResult {
  valid: boolean;
  errors: YamlValidationError[];
  exerciseCount: number;
}
