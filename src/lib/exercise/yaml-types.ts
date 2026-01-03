// src/lib/exercise/yaml-types.ts
// Types for YAML exercise file format

/**
 * Single exercise definition in YAML
 */
export interface YamlExercise {
  slug: string;
  title: string;
  difficulty: 1 | 2 | 3;
  prompt: string;
  expected_answer: string;
  hints: string[];
  tags?: string[];
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
