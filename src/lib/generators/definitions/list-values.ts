// src/lib/generators/definitions/list-values.ts
// Generator for list exercises with random integer values

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * list-values generator
 *
 * Generates three integer values (a, b, c) for list exercises.
 * Constraints:
 * - a, b, c: [1, 99] inclusive
 * - Values are independent (may or may not be distinct)
 */
export const listValuesGenerator: Generator = {
  name: 'list-values',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    const a = rng.int(1, 99);
    const b = rng.int(1, 99);
    const c = rng.int(1, 99);
    return { a, b, c };
  },

  validate(params: GeneratorParams): boolean {
    const { a, b, c } = params;

    // Type checks
    if (typeof a !== 'number' || typeof b !== 'number' || typeof c !== 'number') {
      return false;
    }

    // Range checks [1, 99]
    if (a < 1 || a > 99) {
      return false;
    }
    if (b < 1 || b > 99) {
      return false;
    }
    if (c < 1 || c > 99) {
      return false;
    }

    return true;
  },
};
