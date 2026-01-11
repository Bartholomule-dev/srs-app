// src/lib/generators/definitions/list-values.ts
// Generator for list exercises with random integer values and TinyStore items

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';
import { tinyStoreLexicon } from '../tinystore-data';

/**
 * list-values generator
 *
 * Generates three integer values (a, b, c) for list exercises,
 * plus three TinyStore product names (item_a, item_b, item_c) for string-based exercises.
 * Constraints:
 * - a, b, c: [1, 99] inclusive
 * - Values are independent (may or may not be distinct)
 * - item_a, item_b, item_c: Distinct product names from TinyStore lexicon
 */
export const listValuesGenerator: Generator = {
  name: 'list-values',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    const a = rng.int(1, 99);
    const b = rng.int(1, 99);
    const c = rng.int(1, 99);
    const sum = a + b + c;

    // Pick 3 distinct product names for string-based list exercises
    const shuffledProducts = rng.shuffle([...tinyStoreLexicon.productNames]);
    const item_a = shuffledProducts[0];
    const item_b = shuffledProducts[1];
    const item_c = shuffledProducts[2];
    const items_str = `["${item_a}", "${item_b}", "${item_c}"]`;

    return { a, b, c, sum, item_a, item_b, item_c, items_str };
  },

  validate(params: GeneratorParams): boolean {
    const { a, b, c, item_a, item_b, item_c } = params;

    // Type checks for numeric values
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

    // Type checks for string items (if present)
    if (item_a !== undefined && typeof item_a !== 'string') {
      return false;
    }
    if (item_b !== undefined && typeof item_b !== 'string') {
      return false;
    }
    if (item_c !== undefined && typeof item_c !== 'string') {
      return false;
    }

    // Validate items are from TinyStore lexicon (if present)
    if (item_a && !tinyStoreLexicon.productNames.includes(item_a)) {
      return false;
    }
    if (item_b && !tinyStoreLexicon.productNames.includes(item_b)) {
      return false;
    }
    if (item_c && !tinyStoreLexicon.productNames.includes(item_c)) {
      return false;
    }

    return true;
  },
};
