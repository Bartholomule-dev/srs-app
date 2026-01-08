// src/lib/generators/definitions/list-transform.ts
// Generator for list transformation exercises (map, filter, reduce patterns)

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * List transformation scenarios
 */
interface TransformScenario {
  name: string;
  description: string;
  transformType: 'map' | 'filter' | 'reduce';
  // Generate the transformation
  generate: (rng: ReturnType<typeof seededRandom>) => {
    inputList: number[];
    inputStr: string;
    outputList: number[];
    outputStr: string;
    code: string;
    expression: string;
  };
}

const SCENARIOS: TransformScenario[] = [
  {
    name: 'double_values',
    description: 'double each value',
    transformType: 'map',
    generate: (rng) => {
      const inputList = [rng.int(1, 10), rng.int(1, 10), rng.int(1, 10), rng.int(1, 10)];
      const outputList = inputList.map((x) => x * 2);
      return {
        inputList,
        inputStr: `[${inputList.join(', ')}]`,
        outputList,
        outputStr: `[${outputList.join(', ')}]`,
        code: `nums = [${inputList.join(', ')}]\nresult = [x * 2 for x in nums]\nprint(result)`,
        expression: '[x * 2 for x in nums]',
      };
    },
  },
  {
    name: 'square_values',
    description: 'square each value',
    transformType: 'map',
    generate: (rng) => {
      const inputList = [rng.int(1, 5), rng.int(1, 5), rng.int(1, 5)];
      const outputList = inputList.map((x) => x * x);
      return {
        inputList,
        inputStr: `[${inputList.join(', ')}]`,
        outputList,
        outputStr: `[${outputList.join(', ')}]`,
        code: `nums = [${inputList.join(', ')}]\nresult = [x ** 2 for x in nums]\nprint(result)`,
        expression: '[x ** 2 for x in nums]',
      };
    },
  },
  {
    name: 'add_constant',
    description: 'add a constant to each value',
    transformType: 'map',
    generate: (rng) => {
      const inputList = [rng.int(1, 20), rng.int(1, 20), rng.int(1, 20)];
      const constant = rng.int(5, 15);
      const outputList = inputList.map((x) => x + constant);
      return {
        inputList,
        inputStr: `[${inputList.join(', ')}]`,
        outputList,
        outputStr: `[${outputList.join(', ')}]`,
        code: `nums = [${inputList.join(', ')}]\nresult = [x + ${constant} for x in nums]\nprint(result)`,
        expression: `[x + ${constant} for x in nums]`,
      };
    },
  },
  {
    name: 'filter_evens',
    description: 'keep only even values',
    transformType: 'filter',
    generate: (rng) => {
      const inputList = [rng.int(1, 20), rng.int(1, 20), rng.int(1, 20), rng.int(1, 20), rng.int(1, 20)];
      const outputList = inputList.filter((x) => x % 2 === 0);
      return {
        inputList,
        inputStr: `[${inputList.join(', ')}]`,
        outputList,
        outputStr: `[${outputList.join(', ')}]`,
        code: `nums = [${inputList.join(', ')}]\nresult = [x for x in nums if x % 2 == 0]\nprint(result)`,
        expression: '[x for x in nums if x % 2 == 0]',
      };
    },
  },
  {
    name: 'filter_odds',
    description: 'keep only odd values',
    transformType: 'filter',
    generate: (rng) => {
      const inputList = [rng.int(1, 20), rng.int(1, 20), rng.int(1, 20), rng.int(1, 20), rng.int(1, 20)];
      const outputList = inputList.filter((x) => x % 2 !== 0);
      return {
        inputList,
        inputStr: `[${inputList.join(', ')}]`,
        outputList,
        outputStr: `[${outputList.join(', ')}]`,
        code: `nums = [${inputList.join(', ')}]\nresult = [x for x in nums if x % 2 != 0]\nprint(result)`,
        expression: '[x for x in nums if x % 2 != 0]',
      };
    },
  },
  {
    name: 'filter_greater',
    description: 'keep values greater than threshold',
    transformType: 'filter',
    generate: (rng) => {
      const inputList = [rng.int(1, 20), rng.int(1, 20), rng.int(1, 20), rng.int(1, 20)];
      const threshold = rng.int(8, 12);
      const outputList = inputList.filter((x) => x > threshold);
      return {
        inputList,
        inputStr: `[${inputList.join(', ')}]`,
        outputList,
        outputStr: `[${outputList.join(', ')}]`,
        code: `nums = [${inputList.join(', ')}]\nresult = [x for x in nums if x > ${threshold}]\nprint(result)`,
        expression: `[x for x in nums if x > ${threshold}]`,
      };
    },
  },
  {
    name: 'sum_all',
    description: 'sum all values',
    transformType: 'reduce',
    generate: (rng) => {
      const inputList = [rng.int(1, 20), rng.int(1, 20), rng.int(1, 20), rng.int(1, 20)];
      const total = inputList.reduce((a, b) => a + b, 0);
      return {
        inputList,
        inputStr: `[${inputList.join(', ')}]`,
        outputList: [total],
        outputStr: String(total),
        code: `nums = [${inputList.join(', ')}]\nresult = sum(nums)\nprint(result)`,
        expression: 'sum(nums)',
      };
    },
  },
  {
    name: 'product_all',
    description: 'multiply all values',
    transformType: 'reduce',
    generate: (rng) => {
      const inputList = [rng.int(1, 5), rng.int(1, 5), rng.int(1, 5)];
      const product = inputList.reduce((a, b) => a * b, 1);
      return {
        inputList,
        inputStr: `[${inputList.join(', ')}]`,
        outputList: [product],
        outputStr: String(product),
        code: `nums = [${inputList.join(', ')}]\nfrom functools import reduce\nresult = reduce(lambda a, b: a * b, nums)\nprint(result)`,
        expression: 'reduce(lambda a, b: a * b, nums)',
      };
    },
  },
];

/**
 * list-transform generator
 *
 * Generates list transformation exercises (map, filter, reduce).
 *
 * Output params:
 * - inputList: original list
 * - inputStr: string representation of input
 * - outputList: transformed list
 * - outputStr: string representation of output (or single value for reduce)
 * - code: Python code snippet
 * - expression: the transformation expression
 * - description: what the transformation does
 * - transformType: map, filter, or reduce
 * - scenario: scenario name
 */
export const listTransformGenerator: Generator = {
  name: 'list-transform',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const scenario = rng.pick(SCENARIOS);
    const generated = scenario.generate(rng);

    return {
      inputList: generated.inputList,
      inputStr: generated.inputStr,
      outputList: generated.outputList,
      outputStr: generated.outputStr,
      code: generated.code,
      expression: generated.expression,
      description: scenario.description,
      transformType: scenario.transformType,
      scenario: scenario.name,
    };
  },

  validate(params: GeneratorParams): boolean {
    const { inputList, outputStr, scenario: scenarioName, transformType } = params;

    if (
      !Array.isArray(inputList) ||
      typeof outputStr !== 'string' ||
      typeof scenarioName !== 'string' ||
      typeof transformType !== 'string'
    ) {
      return false;
    }

    const scenario = SCENARIOS.find((s) => s.name === scenarioName);
    if (!scenario) return false;

    return ['map', 'filter', 'reduce'].includes(transformType);
  },
};
