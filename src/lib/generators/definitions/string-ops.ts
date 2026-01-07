// src/lib/generators/definitions/string-ops.ts
// Generator for string method calls with computed results

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

const METHODS = ['upper', 'lower', 'strip', 'title', 'capitalize'] as const;
type StringMethod = (typeof METHODS)[number];

const WORD_POOL = [
  '  hello  ',
  'WORLD',
  'Python',
  '  code  ',
  'TEST',
  'Example',
  '  space  ',
  'hello world',
];

/**
 * string-ops generator
 *
 * Generates string method calls with computed results.
 * Methods: upper, lower, strip, title, capitalize
 */
export const stringOpsGenerator: Generator = {
  name: 'string-ops',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const original = rng.pick(WORD_POOL);
    const method = rng.pick([...METHODS]);

    let result: string;
    switch (method) {
      case 'upper':
        result = original.toUpperCase();
        break;
      case 'lower':
        result = original.toLowerCase();
        break;
      case 'strip':
        result = original.trim();
        break;
      case 'title':
        result = original
          .trim()
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        break;
      case 'capitalize':
        result =
          original.trim().charAt(0).toUpperCase() +
          original.trim().slice(1).toLowerCase();
        break;
    }

    return { original, method, result };
  },

  validate(params: GeneratorParams): boolean {
    const { original, method, result } = params;

    // Type checks
    if (
      typeof original !== 'string' ||
      typeof method !== 'string' ||
      typeof result !== 'string'
    ) {
      return false;
    }

    // Method validity check
    if (!METHODS.includes(method as StringMethod)) {
      return false;
    }

    // Compute expected result
    let expected: string;
    switch (method) {
      case 'upper':
        expected = original.toUpperCase();
        break;
      case 'lower':
        expected = original.toLowerCase();
        break;
      case 'strip':
        expected = original.trim();
        break;
      case 'title':
        expected = original
          .trim()
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        break;
      case 'capitalize':
        expected =
          original.trim().charAt(0).toUpperCase() +
          original.trim().slice(1).toLowerCase();
        break;
      default:
        return false;
    }

    return result === expected;
  },
};
