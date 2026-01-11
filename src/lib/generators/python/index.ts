// src/lib/generators/python/index.ts
// Python generators module - re-exports all 38 Python generators

import type { Generator } from '../types';

// Import all Python generators
import { sliceBoundsGenerator } from '../definitions/slice-bounds';
import { variableNamesGenerator } from '../definitions/variable-names';
import { listValuesGenerator } from '../definitions/list-values';
import { indexValuesGenerator } from '../definitions/index-values';
import { arithmeticValuesGenerator } from '../definitions/arithmetic-values';
import { loopSimulationGenerator } from '../definitions/loop-simulation';
import { comparisonLogicGenerator } from '../definitions/comparison-logic';
import { stringOpsGenerator } from '../definitions/string-ops';
import { dictValuesGenerator } from '../definitions/dict-values';
import { compMappingGenerator } from '../definitions/comp-mapping';
import { compFilterGenerator } from '../definitions/comp-filter';
import { tryExceptFlowGenerator } from '../definitions/try-except-flow';
import { oopInstanceGenerator } from '../definitions/oop-instance';
import { functionCallGenerator } from '../definitions/function-call';
import { stringFormatGenerator } from '../definitions/string-format';
import { pathOpsGenerator } from '../definitions/path-ops';
import { lambdaExprGenerator } from '../definitions/lambda-expr';
import { dictCompGenerator } from '../definitions/dict-comp';
import { classMethodGenerator } from '../definitions/class-method';
import { exceptionScenarioGenerator } from '../definitions/exception-scenario';
import { boolLogicGenerator } from '../definitions/bool-logic';
import { listMethodGenerator } from '../definitions/list-method';
import { nestedAccessGenerator } from '../definitions/nested-access';
import { stringSliceGenerator } from '../definitions/string-slice';
import { conditionalChainGenerator } from '../definitions/conditional-chain';
import { listTransformGenerator } from '../definitions/list-transform';
import { fileIOGenerator } from '../definitions/file-io';
import { inheritanceMethodGenerator } from '../definitions/inheritance-method';
import { operatorChainGenerator } from '../definitions/operator-chain';
import { defaultArgsGenerator } from '../definitions/default-args';
import { finallyFlowGenerator } from '../definitions/finally-flow';
import { tupleAccessGenerator } from '../definitions/tuple-access';
import { anyAllGenerator } from '../definitions/any-all';
import { setOpsGenerator } from '../definitions/set-ops';
import { sortedListGenerator } from '../definitions/sorted-list';
import { zipListsGenerator } from '../definitions/zip-lists';
import { typeConversionGenerator } from '../definitions/type-conversion';
import { truthinessGenerator } from '../definitions/truthiness';

/**
 * Registry of all Python generators.
 * Maps generator name to Generator instance.
 */
export const generators: Map<string, Generator> = new Map([
  ['slice-bounds', sliceBoundsGenerator],
  ['variable-names', variableNamesGenerator],
  ['list-values', listValuesGenerator],
  ['index-values', indexValuesGenerator],
  ['arithmetic-values', arithmeticValuesGenerator],
  ['loop-simulation', loopSimulationGenerator],
  ['comparison-logic', comparisonLogicGenerator],
  ['string-ops', stringOpsGenerator],
  ['dict-values', dictValuesGenerator],
  ['comp-mapping', compMappingGenerator],
  ['comp-filter', compFilterGenerator],
  ['try-except-flow', tryExceptFlowGenerator],
  ['oop-instance', oopInstanceGenerator],
  ['function-call', functionCallGenerator],
  ['string-format', stringFormatGenerator],
  ['path-ops', pathOpsGenerator],
  ['lambda-expr', lambdaExprGenerator],
  ['dict-comp', dictCompGenerator],
  ['class-method', classMethodGenerator],
  ['exception-scenario', exceptionScenarioGenerator],
  ['bool-logic', boolLogicGenerator],
  ['list-method', listMethodGenerator],
  ['nested-access', nestedAccessGenerator],
  ['string-slice', stringSliceGenerator],
  ['conditional-chain', conditionalChainGenerator],
  ['list-transform', listTransformGenerator],
  ['file-io', fileIOGenerator],
  ['inheritance-method', inheritanceMethodGenerator],
  ['operator-chain', operatorChainGenerator],
  ['default-args', defaultArgsGenerator],
  ['finally-flow', finallyFlowGenerator],
  ['tuple-access', tupleAccessGenerator],
  ['any-all', anyAllGenerator],
  ['set-ops', setOpsGenerator],
  ['sorted-list', sortedListGenerator],
  ['zip-lists', zipListsGenerator],
  ['type-conversion', typeConversionGenerator],
  ['truthiness', truthinessGenerator],
]);

/**
 * Get a Python generator by name.
 */
export function getGenerator(name: string): Generator | undefined {
  return generators.get(name);
}

/**
 * Check if a Python generator exists.
 */
export function hasGenerator(name: string): boolean {
  return generators.has(name);
}

/**
 * Get all registered Python generator names.
 */
export function getGeneratorNames(): string[] {
  return Array.from(generators.keys());
}
