// src/lib/generators/definitions/arithmetic-values.ts
// Generator for arithmetic exercises with two operands and their computed results

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * arithmetic-values generator
 *
 * Generates x and y operands plus their sum and product for arithmetic exercises.
 * Constraints:
 * - x: [1, 20]
 * - y: [1, 20]
 * - sum: x + y (computed)
 * - product: x * y (computed)
 */
export const arithmeticValuesGenerator: Generator = {
  name: 'arithmetic-values',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    // x and y: 1-20 (avoids zero to prevent trivial arithmetic)
    const x = rng.int(1, 20);
    const y = rng.int(1, 20);

    return { x, y, sum: x + y, product: x * y };
  },

  validate(params: GeneratorParams): boolean {
    const { x, y, sum, product } = params;

    // Type checks
    if (typeof x !== 'number' || typeof y !== 'number' ||
        typeof sum !== 'number' || typeof product !== 'number') {
      return false;
    }

    // Range checks
    if (x < 1 || x > 20 || y < 1 || y > 20) {
      return false;
    }

    // Consistency checks
    if (sum !== x + y || product !== x * y) {
      return false;
    }

    return true;
  },
};
