// src/lib/generators/definitions/comp-filter.ts
// Generator for list comprehension filter exercises

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';
import { tinyStoreLexicon } from '../tinystore-data';

/**
 * comp-filter generator
 *
 * Generates parameters for list comprehension filter exercises.
 * Produces a range upper bound and a modulus for filtering.
 * Also generates TinyStore-themed string filtering parameters.
 *
 * Constraints:
 * - n: [5, 8] range upper bound
 * - mod: [2, 3] divisor for modulus check
 * - result: filtered list as string (e.g., "[0, 2, 4]")
 * - items: List of TinyStore product names
 * - filter_char: Character to filter by (first letter)
 * - filtered_items: Items starting with filter_char
 */
export const compFilterGenerator: Generator = {
  name: 'comp-filter',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    // n: range upper bound (5-8)
    const n = rng.int(5, 8);
    // mod: divisor (2-3)
    const mod = rng.int(2, 3);

    // Compute the filtered numeric result
    const values: number[] = [];
    for (let i = 0; i < n; i++) {
      if (i % mod === 0) {
        values.push(i);
      }
    }
    const result = `[${values.join(', ')}]`;

    // Generate TinyStore-themed string filtering parameters
    const shuffledProducts = rng.shuffle([...tinyStoreLexicon.productNames]);
    const items = shuffledProducts.slice(0, n);
    const items_str = `[${items.map(item => `"${item}"`).join(', ')}]`;

    // Pick a filter character that appears in at least one item
    const firstChars = [...new Set(items.map(item => item[0].toLowerCase()))];
    const filter_char = rng.pick(firstChars);

    // Compute filtered items
    const filtered_items = items.filter(item => item[0].toLowerCase() === filter_char);
    const filtered_items_str = `[${filtered_items.map(item => `"${item}"`).join(', ')}]`;

    // Also provide length-based filtering (items with length > threshold)
    const min_len = rng.int(4, 6);
    const long_items = items.filter(item => item.length > min_len);
    const long_items_str = `[${long_items.map(item => `"${item}"`).join(', ')}]`;

    return {
      n,
      mod,
      result,
      items,
      items_str,
      filter_char,
      filtered_items,
      filtered_items_str,
      min_len,
      long_items,
      long_items_str,
    };
  },

  validate(params: GeneratorParams): boolean {
    const { n, mod, result, items, filter_char, filtered_items, min_len, long_items } = params;

    // Type checks
    if (typeof n !== 'number' || typeof mod !== 'number' || typeof result !== 'string') {
      return false;
    }

    // Range checks
    if (n < 5 || n > 8 || mod < 2 || mod > 3) {
      return false;
    }

    // Consistency check for numeric result
    const values: number[] = [];
    for (let i = 0; i < n; i++) {
      if (i % mod === 0) {
        values.push(i);
      }
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

    // Validate filter_char and filtered_items (if present)
    if (filter_char !== undefined && items !== undefined && filtered_items !== undefined) {
      if (typeof filter_char !== 'string' || filter_char.length !== 1) {
        return false;
      }
      if (!Array.isArray(items)) return false;
      const itemsArr = items as string[];
      const expectedFiltered = itemsArr.filter(
        (item) => item[0].toLowerCase() === filter_char
      );
      if (
        !Array.isArray(filtered_items) ||
        filtered_items.length !== expectedFiltered.length
      ) {
        return false;
      }
      const filteredArr = filtered_items as string[];
      if (!filteredArr.every((item, i) => item === expectedFiltered[i])) {
        return false;
      }
    }

    // Validate min_len and long_items (if present)
    if (min_len !== undefined && items !== undefined && long_items !== undefined) {
      if (typeof min_len !== 'number' || min_len < 4 || min_len > 6) {
        return false;
      }
      if (!Array.isArray(items)) return false;
      const itemsArr = items as string[];
      const expectedLong = itemsArr.filter((item) => item.length > min_len);
      if (
        !Array.isArray(long_items) ||
        long_items.length !== expectedLong.length
      ) {
        return false;
      }
      const longArr = long_items as string[];
      if (!longArr.every((item, i) => item === expectedLong[i])) {
        return false;
      }
    }

    return true;
  },
};
