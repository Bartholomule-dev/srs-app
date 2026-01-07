// src/lib/generators/definitions/slice-bounds.ts
// Generator for string slicing exercises with bounded indices

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * slice-bounds generator
 *
 * Generates start and end indices for string slicing exercises.
 * Constraints:
 * - start: [0, 4]
 * - end: [start+1, 7]
 * - Always ensures end > start
 */
export const sliceBoundsGenerator: Generator = {
  name: 'slice-bounds',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    // start: 0-4 (leaves room for meaningful slice)
    const start = rng.int(0, 4);

    // end: at least start+1, at most 7
    const end = rng.int(start + 1, 7);

    return { start, end };
  },

  validate(params: GeneratorParams): boolean {
    const { start, end } = params;

    // Type checks
    if (typeof start !== 'number' || typeof end !== 'number') {
      return false;
    }

    // Range checks
    if (start < 0 || start > 4) {
      return false;
    }

    if (end > 10) {
      return false;
    }

    // Constraint: end > start
    if (end <= start) {
      return false;
    }

    return true;
  },
};
