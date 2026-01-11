// src/lib/generators/definitions/dict-values.ts
// Generator for dictionary access exercises with existing/missing key scenarios

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';
import { tinyStoreLexicon } from '../tinystore-data';

// Use TinyStore product names as keys for more realistic dictionary exercises
const KEY_POOL = tinyStoreLexicon.productNames;

/**
 * dict-values generator
 *
 * Generates dictionary access scenarios with existing/missing keys.
 * Uses TinyStore product names as dictionary keys for narrative consistency.
 * Constraints:
 * - dict_str: Valid Python dict syntax
 * - key: String key to access (TinyStore product name)
 * - value: The value at key (or 'KeyError' if missing)
 * - exists: Boolean indicating if key exists in dict
 * - ~80% chance of existing key, ~20% missing key
 */
export const dictValuesGenerator: Generator = {
  name: 'dict-values',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const numEntries = rng.int(2, 4);
    const availableKeys = rng.shuffle([...KEY_POOL]);
    const selectedKeys = availableKeys.slice(0, numEntries);

    const dict: Record<string, number> = {};
    for (const k of selectedKeys) {
      dict[k] = rng.int(1, 99);
    }

    const entries = Object.entries(dict)
      .map(([k, v]) => `"${k}": ${v}`)
      .join(', ');
    const dict_str = `{${entries}}`;

    const shouldExist = rng.next() < 0.8;
    let key: string;
    let value: string;
    let exists: boolean;

    if (shouldExist && selectedKeys.length > 0) {
      key = rng.pick(selectedKeys);
      value = String(dict[key]);
      exists = true;
    } else {
      const missingKeys = KEY_POOL.filter(k => !selectedKeys.includes(k));
      key = missingKeys.length > 0 ? rng.pick(missingKeys) : 'missing';
      value = 'KeyError';
      exists = false;
    }

    return { dict_str, key, value, exists };
  },

  validate(params: GeneratorParams): boolean {
    const { dict_str, key, value, exists } = params;

    // Type checks
    if (typeof dict_str !== 'string' || typeof key !== 'string' ||
        typeof value !== 'string' || typeof exists !== 'boolean') {
      return false;
    }

    // dict_str must be valid Python dict syntax
    if (!dict_str.startsWith('{') || !dict_str.endsWith('}')) {
      return false;
    }

    return true;
  },
};
