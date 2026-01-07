// src/lib/generators/types.ts
// Type definitions for the dynamic exercise generator system

/**
 * Parameter values that generators can produce.
 * Used for template interpolation via Mustache.
 */
export interface GeneratorParams {
  [key: string]: string | number | boolean | (string | number)[];
}

/**
 * Generator interface - produces deterministic parameter values from a seed.
 * Each generator is registered by name and referenced from YAML exercises.
 */
export interface Generator {
  /** Unique name matching the YAML `generator` field */
  name: string;

  /** Produce parameters from a deterministic seed */
  generate(seed: string): GeneratorParams;

  /** Validate that params satisfy generator constraints */
  validate(params: GeneratorParams): boolean;
}

/**
 * Construct types for two-pass grading.
 * Pass 1 checks correctness; Pass 2 checks if target construct was used.
 */
export type ConstructType =
  | 'slice'
  | 'comprehension'
  | 'f-string'
  | 'ternary'
  | 'enumerate'
  | 'zip'
  | 'lambda'
  | 'generator-expr';

/**
 * Target construct definition for two-pass grading.
 * If defined on an exercise, Pass 2 checks if the user's answer used this construct.
 */
export interface TargetConstruct {
  /** The construct type to check for */
  type: ConstructType;
  /** Coaching feedback if user got correct answer but didn't use target construct */
  feedback?: string;
}

/**
 * Fields that can be overridden per variant.
 * When a generator returns a `variant` param, these fields from the
 * matching variant replace the base exercise fields before rendering.
 */
export interface VariantOverrides {
  prompt?: string;
  expectedAnswer?: string;
  acceptedSolutions?: string[];
  hints?: string[];
  code?: string;
  template?: string;
}

/**
 * Map of variant name to its field overrides.
 * Used in YAML exercises to define multiple prompt/answer structures
 * for a single exercise slug.
 */
export type VariantMap = Record<string, VariantOverrides>;

/**
 * Rendered exercise with generated parameters attached.
 * Extends the base Exercise type with generator metadata.
 */
export interface RenderedExerciseMetadata {
  /** Parameters that were generated (for logging/debugging) */
  _generatedParams?: GeneratorParams;
  /** Seed used for generation (for reproducibility) */
  _seed?: string;
}
