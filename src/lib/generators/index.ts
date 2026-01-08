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
import { compMappingGenerator } from './definitions/comp-mapping';
import { compFilterGenerator } from './definitions/comp-filter';
import { tryExceptFlowGenerator } from './definitions/try-except-flow';
import { oopInstanceGenerator } from './definitions/oop-instance';
import { functionCallGenerator } from './definitions/function-call';
import { stringFormatGenerator } from './definitions/string-format';
import { pathOpsGenerator } from './definitions/path-ops';
import { lambdaExprGenerator } from './definitions/lambda-expr';
import { dictCompGenerator } from './definitions/dict-comp';
import { classMethodGenerator } from './definitions/class-method';
import { exceptionScenarioGenerator } from './definitions/exception-scenario';
import { boolLogicGenerator } from './definitions/bool-logic';
import { listMethodGenerator } from './definitions/list-method';
import { nestedAccessGenerator } from './definitions/nested-access';
import { stringSliceGenerator } from './definitions/string-slice';
import { conditionalChainGenerator } from './definitions/conditional-chain';
import { listTransformGenerator } from './definitions/list-transform';
import { fileIOGenerator } from './definitions/file-io';
import { inheritanceMethodGenerator } from './definitions/inheritance-method';
import { operatorChainGenerator } from './definitions/operator-chain';
import { defaultArgsGenerator } from './definitions/default-args';
import { finallyFlowGenerator } from './definitions/finally-flow';
import { tupleAccessGenerator } from './definitions/tuple-access';
import { anyAllGenerator } from './definitions/any-all';
import { setOpsGenerator } from './definitions/set-ops';
import { sortedListGenerator } from './definitions/sorted-list';
import { zipListsGenerator } from './definitions/zip-lists';

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
registerGenerator(compMappingGenerator);
registerGenerator(compFilterGenerator);
registerGenerator(tryExceptFlowGenerator);
registerGenerator(oopInstanceGenerator);
registerGenerator(functionCallGenerator);
registerGenerator(stringFormatGenerator);
registerGenerator(pathOpsGenerator);
registerGenerator(lambdaExprGenerator);
registerGenerator(dictCompGenerator);
registerGenerator(classMethodGenerator);
registerGenerator(exceptionScenarioGenerator);
registerGenerator(boolLogicGenerator);
registerGenerator(listMethodGenerator);
registerGenerator(nestedAccessGenerator);
registerGenerator(stringSliceGenerator);
registerGenerator(conditionalChainGenerator);
registerGenerator(listTransformGenerator);
registerGenerator(fileIOGenerator);
registerGenerator(inheritanceMethodGenerator);
registerGenerator(operatorChainGenerator);
registerGenerator(defaultArgsGenerator);
registerGenerator(finallyFlowGenerator);
registerGenerator(tupleAccessGenerator);
registerGenerator(anyAllGenerator);
registerGenerator(setOpsGenerator);
registerGenerator(sortedListGenerator);
registerGenerator(zipListsGenerator);
