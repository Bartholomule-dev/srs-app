// src/lib/generators/index.ts
// Generator registry and public API

import type { Generator, GeneratorParams, TargetConstruct, RenderedExerciseMetadata, VariantOverrides, VariantMap } from './types';
import { sliceBoundsGenerator } from './definitions/slice-bounds';
import { variableNamesGenerator } from './definitions/variable-names';
import { listValuesGenerator } from './definitions/list-values';
import { indexValuesGenerator } from './definitions/index-values';
import { arithmeticValuesGenerator } from './definitions/arithmetic-values';
import { loopSimulationGenerator } from './definitions/loop-simulation';
import { comparisonLogicGenerator } from './definitions/comparison-logic';
import { stringOpsGenerator } from './definitions/string-ops';
import { dictValuesGenerator } from './definitions/dict-values';

// Re-export types
export type { Generator, GeneratorParams, TargetConstruct, RenderedExerciseMetadata, VariantOverrides, VariantMap };

// Re-export utilities
export { createSeed, hashString } from './seed';
export { seededRandom, type SeededRandom } from './utils';

/**
 * Registry of all available generators.
 * Generators are registered by name for YAML reference.
 */
const generators: Map<string, Generator> = new Map();

/**
 * Register a generator in the registry.
 */
export function registerGenerator(generator: Generator): void {
  generators.set(generator.name, generator);
}

/**
 * Get a generator by name.
 */
export function getGenerator(name: string): Generator | undefined {
  return generators.get(name);
}

/**
 * Check if a generator exists.
 */
export function hasGenerator(name: string): boolean {
  return generators.has(name);
}

/**
 * Get all registered generator names.
 */
export function getGeneratorNames(): string[] {
  return Array.from(generators.keys());
}

// Register built-in generators
registerGenerator(sliceBoundsGenerator);
registerGenerator(variableNamesGenerator);
registerGenerator(listValuesGenerator);
registerGenerator(indexValuesGenerator);
registerGenerator(arithmeticValuesGenerator);
registerGenerator(loopSimulationGenerator);
registerGenerator(comparisonLogicGenerator);
registerGenerator(stringOpsGenerator);
registerGenerator(dictValuesGenerator);
