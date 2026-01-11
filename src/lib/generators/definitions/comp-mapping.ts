// src/lib/generators/definitions/comp-mapping.ts
// Generator for list comprehension mapping exercises

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';
import { tinyStoreLexicon } from '../tinystore-data';

/**
 * comp-mapping generator
 *
 * Generates parameters for list comprehension mapping exercises.
 * Produces a range upper bound and a multiplier, with the computed result.
 * Also generates TinyStore-themed string mapping parameters.
 *
 * Constraints:
 * - n: [3, 6] range upper bound
 * - m: [2, 4] multiplier
 * - result: computed list as string (e.g., "[0, 2, 4, 6]")
 * - items: List of TinyStore product names
 * - items_upper: Same items transformed to uppercase
 * - items_str: Python list literal for items
 */
export const compMappingGenerator: Generator = {
  name: 'comp-mapping',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    // n: range upper bound (3-6)
    const n = rng.int(3, 6);
    // m: multiplier (2-4)
    const m = rng.int(2, 4);

    // Compute the numeric result
    const values: number[] = [];
    for (let i = 0; i < n; i++) {
      values.push(i * m);
    }
    const result = `[${values.join(', ')}]`;

    // Generate TinyStore-themed string mapping parameters
    const shuffledProducts = rng.shuffle([...tinyStoreLexicon.productNames]);
    const items = shuffledProducts.slice(0, n);
    const items_upper = items.map(item => item.toUpperCase());
    const items_str = `[${items.map(item => `"${item}"`).join(', ')}]`;
    const items_upper_str = `[${items_upper.map(item => `"${item}"`).join(', ')}]`;

    return { n, m, result, items, items_upper, items_str, items_upper_str };
  },

  validate(params: GeneratorParams): boolean {
    const { n, m, result, items, items_upper } = params;

    // Type checks
    if (typeof n !== 'number' || typeof m !== 'number' || typeof result !== 'string') {
      return false;
    }

    // Range checks
    if (n < 3 || n > 6 || m < 2 || m > 4) {
      return false;
    }

    // Consistency check for numeric result
    const values: number[] = [];
    for (let i = 0; i < n; i++) {
      values.push(i * m);
    }
    const expectedResult = `[${values.join(', ')}]`;

    if (result !== expectedResult) {
      return false;
    }

    // Validate items array (if present)
    if (items !== undefined) {
      if (!Array.isArray(items) || items.length !== n) {
        return false;
      }
      const itemsArr = items as string[];
      for (const item of itemsArr) {
        if (!tinyStoreLexicon.productNames.includes(item)) {
          return false;
        }
      }
    }

    // Validate items_upper is consistent (if present)
    if (items_upper !== undefined && items !== undefined) {
      if (!Array.isArray(items) || !Array.isArray(items_upper)) {
        return false;
      }
      if (items_upper.length !== items.length) {
        return false;
      }
      const itemsArr = items as string[];
      const upperArr = items_upper as string[];
      for (let i = 0; i < itemsArr.length; i++) {
        if (upperArr[i] !== itemsArr[i].toUpperCase()) {
          return false;
        }
      }
    }

    return true;
  },
};
