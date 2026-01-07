// src/lib/generators/definitions/comparison-logic.ts
// Generator for comparison expressions with computed boolean results

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

const OPERATORS = ['<', '>', '==', '!=', '<=', '>='] as const;
type ComparisonOp = (typeof OPERATORS)[number];

/**
 * comparison-logic generator
 *
 * Generates comparison expressions with computed boolean results.
 * Constraints:
 * - a, b: [1, 20]
 * - op: one of <, >, ==, !=, <=, >=
 * - result: 'True' or 'False' (Python boolean string)
 */
export const comparisonLogicGenerator: Generator = {
  name: 'comparison-logic',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const a = rng.int(1, 20);
    const b = rng.int(1, 20);
    const op = rng.pick([...OPERATORS]);

    let boolResult: boolean;
    switch (op) {
      case '<':
        boolResult = a < b;
        break;
      case '>':
        boolResult = a > b;
        break;
      case '==':
        boolResult = a === b;
        break;
      case '!=':
        boolResult = a !== b;
        break;
      case '<=':
        boolResult = a <= b;
        break;
      case '>=':
        boolResult = a >= b;
        break;
    }
    const result = boolResult ? 'True' : 'False';

    return { a, b, op, result };
  },

  validate(params: GeneratorParams): boolean {
    const { a, b, op, result } = params;

    if (
      typeof a !== 'number' ||
      typeof b !== 'number' ||
      typeof op !== 'string' ||
      typeof result !== 'string'
    ) {
      return false;
    }

    if (!OPERATORS.includes(op as ComparisonOp)) return false;

    let expected: boolean;
    switch (op) {
      case '<':
        expected = a < b;
        break;
      case '>':
        expected = a > b;
        break;
      case '==':
        expected = a === b;
        break;
      case '!=':
        expected = a !== b;
        break;
      case '<=':
        expected = a <= b;
        break;
      case '>=':
        expected = a >= b;
        break;
      default:
        return false;
    }

    return result === (expected ? 'True' : 'False');
  },
};
