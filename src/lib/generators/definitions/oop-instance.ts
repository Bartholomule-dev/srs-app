// src/lib/generators/definitions/oop-instance.ts
// Generator for OOP instance attribute exercises

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';
import { tinyStoreLexicon } from '../tinystore-data';

/**
 * oop-instance generator
 *
 * Generates parameters for OOP instance attribute exercises.
 * Produces person names and ages for class instantiation.
 *
 * Constraints:
 * - personName: from curated pool of common names
 * - age: [18, 65]
 */

const PERSON_NAMES = tinyStoreLexicon.customerNames;

export const oopInstanceGenerator: Generator = {
  name: 'oop-instance',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const personName = rng.pick(PERSON_NAMES);
    const age = rng.int(18, 65);

    return { personName, age };
  },

  validate(params: GeneratorParams): boolean {
    const { personName, age } = params;

    // Type checks
    if (typeof personName !== 'string' || typeof age !== 'number') {
      return false;
    }

    // Range checks
    if (age < 18 || age > 65) {
      return false;
    }

    // Name should be capitalized (from our pool)
    if (!/^[A-Z][a-z]+$/.test(personName)) {
      return false;
    }

    return true;
  },
};
