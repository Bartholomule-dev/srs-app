// src/lib/paths/roles.ts
// Exercise role taxonomy for blueprint beat matching

import type { ExercisePattern } from '@/lib/curriculum/types';

/**
 * Exercise roles define the functional purpose of an exercise
 * within a blueprint's narrative flow.
 */
export type ExerciseRole =
  | 'create' // Initialize data structures
  | 'update' // Modify existing data
  | 'query' // Check/lookup values
  | 'transform' // Filter/map data
  | 'display' // Output/show data
  | 'persist' // Save to file/context
  | 'guard' // Validate/branch logic
  | 'recover'; // Error handling

/**
 * Role definition with pattern mappings and keyword hints
 */
export interface RoleDefinition {
  /** Human-readable description */
  description: string;
  /** ExercisePattern values that map to this role */
  patterns: ExercisePattern[];
  /** Keywords in beat titles that indicate this role */
  beatKeywords: string[];
  /** Keywords in exercise slugs that indicate this role */
  slugKeywords: string[];
}

/**
 * Definitions for all 8 exercise roles
 */
export const ROLE_DEFINITIONS: Record<ExerciseRole, RoleDefinition> = {
  create: {
    description: 'Initialize data structures (lists, dicts, variables)',
    patterns: ['construction', 'declaration', 'definition', 'assignment'],
    beatKeywords: ['create', 'initialize', 'setup', 'start', 'new', 'storage'],
    slugKeywords: ['create', 'init', 'empty', 'new', 'declare'],
  },
  update: {
    description: 'Modify existing data (append, insert, update, remove)',
    patterns: ['mutation', 'swap'],
    beatKeywords: ['add', 'update', 'modify', 'change', 'remove', 'delete', 'insert'],
    slugKeywords: ['append', 'add', 'update', 'modify', 'insert', 'remove', 'delete', 'pop', 'extend'],
  },
  query: {
    description: 'Check or lookup values (membership, indexing, get)',
    patterns: ['query', 'lookup', 'indexing', 'search'],
    beatKeywords: ['check', 'find', 'get', 'lookup', 'search', 'exist', 'contain'],
    slugKeywords: ['-check', '-in-', 'in-check', '-get-', 'lookup', '-find', 'search', '-index', '-access'],
  },
  transform: {
    description: 'Filter or map data (comprehensions, transformations)',
    patterns: ['filtering', 'mapping', 'transformation', 'slicing'],
    beatKeywords: ['filter', 'transform', 'map', 'convert', 'process', 'select'],
    slugKeywords: ['filter', 'map', 'comp', 'transform', 'slice', 'convert'],
  },
  display: {
    description: 'Output or show data (print, format, iterate for display)',
    patterns: ['iteration', 'output', 'io'],
    beatKeywords: ['display', 'show', 'print', 'output', 'list', 'view', 'render'],
    slugKeywords: ['print', 'display', 'show', 'output', 'for-loop', 'format'],
  },
  persist: {
    description: 'Save data to file or use context managers',
    patterns: ['context', 'file'],
    beatKeywords: ['save', 'persist', 'store', 'write', 'file', 'load', 'read'],
    slugKeywords: ['file', 'write', 'save', 'context', 'with', 'open', 'read'],
  },
  guard: {
    description: 'Validate input or branch based on conditions',
    patterns: ['conditional', 'branching', 'comparison', 'logical'],
    beatKeywords: ['validate', 'check', 'guard', 'verify', 'ensure', 'condition'],
    slugKeywords: ['if', 'else', 'elif', 'validate', 'guard', 'condition'],
  },
  recover: {
    description: 'Handle errors and exceptions',
    patterns: ['handling', 'error-first'],
    beatKeywords: ['error', 'handle', 'recover', 'catch', 'except', 'try', 'fail'],
    slugKeywords: ['try', 'except', 'error', 'handle', 'raise', 'recover'],
  },
};

/**
 * Beat information for matching
 */
export interface BeatInfo {
  beat: number;
  title: string;
}

/**
 * Exercise information for role inference
 */
export interface ExerciseInfo {
  slug: string;
  pattern?: ExercisePattern;
}

/**
 * Check if a role matches a beat based on title keywords
 */
export function roleMatchesBeat(role: ExerciseRole, beat: BeatInfo): boolean {
  const definition = ROLE_DEFINITIONS[role];
  const titleLower = beat.title.toLowerCase();

  return definition.beatKeywords.some((keyword) => titleLower.includes(keyword));
}

/**
 * Infer the exercise role from pattern and/or slug
 * Returns undefined if no role can be inferred
 */
export function inferRoleFromExercise(exercise: ExerciseInfo): ExerciseRole | undefined {
  // First try to match by pattern (more reliable)
  if (exercise.pattern) {
    for (const [role, definition] of Object.entries(ROLE_DEFINITIONS)) {
      if (definition.patterns.includes(exercise.pattern)) {
        return role as ExerciseRole;
      }
    }
  }

  // Fall back to slug keyword matching
  const slugLower = exercise.slug.toLowerCase();
  for (const [role, definition] of Object.entries(ROLE_DEFINITIONS)) {
    if (definition.slugKeywords.some((keyword) => slugLower.includes(keyword))) {
      return role as ExerciseRole;
    }
  }

  return undefined;
}

/**
 * Get the best role for a beat, considering typical blueprint patterns
 */
export function suggestRoleForBeat(beat: BeatInfo): ExerciseRole | undefined {
  // Check all roles and return the first match
  for (const role of Object.keys(ROLE_DEFINITIONS) as ExerciseRole[]) {
    if (roleMatchesBeat(role, beat)) {
      return role;
    }
  }
  return undefined;
}

/**
 * Score how well an exercise matches a beat's expected role
 * Returns 0-100 score
 */
export function scoreExerciseForBeat(exercise: ExerciseInfo, beat: BeatInfo): number {
  const exerciseRole = inferRoleFromExercise(exercise);
  if (!exerciseRole) {
    return 25; // Low but non-zero score for unknown exercises
  }

  const suggestedRole = suggestRoleForBeat(beat);
  if (!suggestedRole) {
    return 50; // Medium score if beat has no clear role
  }

  if (exerciseRole === suggestedRole) {
    return 100; // Perfect match
  }

  // Partial matches for related roles
  const relatedRoles: Record<ExerciseRole, ExerciseRole[]> = {
    create: ['update'], // Creating and updating are related
    update: ['create'], // Updating often follows creation
    query: ['guard'], // Queries can be used for guarding
    transform: ['query'], // Transforms often include queries
    display: ['query'], // Displaying often requires querying
    persist: ['create'], // Persisting creates files
    guard: ['query', 'recover'], // Guards check conditions and handle failures
    recover: ['guard'], // Recovery is a form of guarding
  };

  if (relatedRoles[suggestedRole]?.includes(exerciseRole)) {
    return 75; // Good match for related roles
  }

  return 25; // Low score for unrelated roles
}
