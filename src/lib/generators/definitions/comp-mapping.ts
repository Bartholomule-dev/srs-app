// src/lib/generators/definitions/comp-mapping.ts
// Generator for list comprehension mapping exercises

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * comp-mapping generator
 *
 * Generates parameters for list comprehension mapping exercises.
 * Produces a range upper bound and a multiplier, with the computed result.
 *
 * Constraints:
 * - n: [3, 6] range upper bound
 * - m: [2, 4] multiplier
 * - result: computed list as string (e.g., "[0, 2, 4, 6]")
 */
export const compMappingGenerator: Generator = {
  name: 'comp-mapping',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    // n: range upper bound (3-6)
    const n = rng.int(3, 6);
    // m: multiplier (2-4)
    const m = rng.int(2, 4);

    // Compute the result
    const values: number[] = [];
    for (let i = 0; i < n; i++) {
      values.push(i * m);
    }
    const result = `[${values.join(', ')}]`;

    return { n, m, result };
  },

  validate(params: GeneratorParams): boolean {
    const { n, m, result } = params;

    // Type checks
    if (typeof n !== 'number' || typeof m !== 'number' || typeof result !== 'string') {
      return false;
    }

    // Range checks
    if (n < 3 || n > 6 || m < 2 || m > 4) {
      return false;
    }

    // Consistency check
    const values: number[] = [];
    for (let i = 0; i < n; i++) {
      values.push(i * m);
    }
    const expectedResult = `[${values.join(', ')}]`;

    return result === expectedResult;
  },
};
