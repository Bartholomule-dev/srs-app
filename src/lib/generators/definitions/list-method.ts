// src/lib/generators/definitions/list-method.ts
// Generator for list method exercises with various operations

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * List method scenarios with computed results
 */
interface ListMethodScenario {
  name: string;
  method: string;
  description: string;
  compute: (nums: number[], arg?: number) => number | number[] | string;
  needsArg: boolean;
  returnType: 'value' | 'list' | 'none';
}

const SCENARIOS: ListMethodScenario[] = [
  {
    name: 'count',
    method: 'count',
    description: 'counts occurrences of a value',
    compute: (nums, arg) => nums.filter((n) => n === arg).length,
    needsArg: true,
    returnType: 'value',
  },
  {
    name: 'index',
    method: 'index',
    description: 'finds the index of a value',
    compute: (nums, arg) => nums.indexOf(arg!),
    needsArg: true,
    returnType: 'value',
  },
  {
    name: 'sum',
    method: 'sum',
    description: 'calculates the sum',
    compute: (nums) => nums.reduce((a, b) => a + b, 0),
    needsArg: false,
    returnType: 'value',
  },
  {
    name: 'max',
    method: 'max',
    description: 'finds the maximum value',
    compute: (nums) => Math.max(...nums),
    needsArg: false,
    returnType: 'value',
  },
  {
    name: 'min',
    method: 'min',
    description: 'finds the minimum value',
    compute: (nums) => Math.min(...nums),
    needsArg: false,
    returnType: 'value',
  },
  {
    name: 'len',
    method: 'len',
    description: 'gets the length',
    compute: (nums) => nums.length,
    needsArg: false,
    returnType: 'value',
  },
  {
    name: 'sorted',
    method: 'sorted',
    description: 'returns a sorted copy',
    compute: (nums) => [...nums].sort((a, b) => a - b),
    needsArg: false,
    returnType: 'list',
  },
  {
    name: 'reversed',
    method: 'reversed',
    description: 'returns reversed list',
    compute: (nums) => [...nums].reverse(),
    needsArg: false,
    returnType: 'list',
  },
];

/**
 * list-method generator
 *
 * Generates list method exercises with computed results.
 *
 * Output params:
 * - nums: array of numbers
 * - numsStr: string representation of list
 * - method: method name
 * - arg: optional argument
 * - result: computed result
 * - description: what the method does
 * - code: Python code snippet
 */
export const listMethodGenerator: Generator = {
  name: 'list-method',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const scenario = rng.pick(SCENARIOS);

    // Generate a list of 4-6 numbers
    const length = rng.int(4, 6);
    const nums: number[] = [];
    for (let i = 0; i < length; i++) {
      nums.push(rng.int(1, 20));
    }

    // For count/index, pick a value that exists in the list
    let arg: number | undefined;
    if (scenario.needsArg) {
      arg = rng.pick(nums);
    }

    const result = scenario.compute(nums, arg);
    const numsStr = `[${nums.join(', ')}]`;

    // Format result based on return type
    let resultStr: string;
    if (scenario.returnType === 'list') {
      resultStr = `[${(result as number[]).join(', ')}]`;
    } else {
      resultStr = String(result);
    }

    // Generate code based on method type
    let code: string;
    if (scenario.method === 'sum' || scenario.method === 'max' || scenario.method === 'min' || scenario.method === 'len') {
      code = `nums = ${numsStr}\nprint(${scenario.method}(nums))`;
    } else if (scenario.method === 'sorted' || scenario.method === 'reversed') {
      code = `nums = ${numsStr}\nprint(list(${scenario.method}(nums)))`;
    } else {
      code = `nums = ${numsStr}\nprint(nums.${scenario.method}(${arg}))`;
    }

    return {
      nums,
      numsStr,
      method: scenario.method,
      arg: arg ?? 0,
      result: resultStr,
      description: scenario.description,
      code,
      needsArg: scenario.needsArg,
      scenario: scenario.name,
    };
  },

  validate(params: GeneratorParams): boolean {
    const { nums, method, arg, result, scenario: scenarioName } = params;

    if (
      !Array.isArray(nums) ||
      typeof method !== 'string' ||
      typeof result !== 'string' ||
      typeof scenarioName !== 'string'
    ) {
      return false;
    }

    const scenario = SCENARIOS.find((s) => s.name === scenarioName);
    if (!scenario) return false;

    const computed = scenario.compute(nums as number[], arg as number);
    let expectedStr: string;
    if (scenario.returnType === 'list') {
      expectedStr = `[${(computed as number[]).join(', ')}]`;
    } else {
      expectedStr = String(computed);
    }

    return result === expectedStr;
  },
};
