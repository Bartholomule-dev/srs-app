// src/lib/generators/definitions/index-values.ts
// Generator for list index exercises with valid index values

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * index-values generator
 *
 * Generates an index value for list/string indexing exercises.
 * Constraints:
 * - idx: [0, 4] - valid for typical 5+ element sequences
 */
export const indexValuesGenerator: Generator = {
  name: 'index-values',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    const idx = rng.int(0, 4);
    return { idx };
  },

  validate(params: GeneratorParams): boolean {
    const { idx } = params;

    // Type check
    if (typeof idx !== 'number') {
      return false;
    }

    // Integer check
    if (!Number.isInteger(idx)) {
      return false;
    }

    // Range check [0, 4]
    if (idx < 0 || idx > 4) {
      return false;
    }

    return true;
  },
};
