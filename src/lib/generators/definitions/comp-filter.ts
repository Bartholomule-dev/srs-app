// src/lib/generators/definitions/comp-filter.ts
// Generator for list comprehension filter exercises

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * comp-filter generator
 *
 * Generates parameters for list comprehension filter exercises.
 * Produces a range upper bound and a modulus for filtering.
 *
 * Constraints:
 * - n: [5, 8] range upper bound
 * - mod: [2, 3] divisor for modulus check
 * - result: filtered list as string (e.g., "[0, 2, 4]")
 */
export const compFilterGenerator: Generator = {
  name: 'comp-filter',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    // n: range upper bound (5-8)
    const n = rng.int(5, 8);
    // mod: divisor (2-3)
    const mod = rng.int(2, 3);

    // Compute the filtered result
    const values: number[] = [];
    for (let i = 0; i < n; i++) {
      if (i % mod === 0) {
        values.push(i);
      }
    }
    const result = `[${values.join(', ')}]`;

    return { n, mod, result };
  },

  validate(params: GeneratorParams): boolean {
    const { n, mod, result } = params;

    // Type checks
    if (typeof n !== 'number' || typeof mod !== 'number' || typeof result !== 'string') {
      return false;
    }

    // Range checks
    if (n < 5 || n > 8 || mod < 2 || mod > 3) {
      return false;
    }

    // Consistency check
    const values: number[] = [];
    for (let i = 0; i < n; i++) {
      if (i % mod === 0) {
        values.push(i);
      }
    }
    const expectedResult = `[${values.join(', ')}]`;

    return result === expectedResult;
  },
};
