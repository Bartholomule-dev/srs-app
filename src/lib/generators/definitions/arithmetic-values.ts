// src/lib/generators/definitions/arithmetic-values.ts
// Generator for arithmetic exercises with two operands and their computed results

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * arithmetic-values generator
 *
 * Generates x and y operands plus computed results for arithmetic exercises.
 * Constraints:
 * - x: [5, 20] (larger to ensure interesting floor/mod results)
 * - y: [2, 9] (smaller divisor to avoid x/y < 1)
 * - sum: x + y (computed)
 * - product: x * y (computed)
 * - floorDiv: x // y (computed)
 * - modulo: x % y (computed)
 * - divResult: string of x / y (e.g., "2.5")
 * - floatVal: float with decimal (for round exercises)
 * - roundedInt: round(floatVal) as string
 * - truncatedInt: int(floatVal) as string (floor)
 * - ceilInt: ceil(floatVal) as string
 */
export const arithmeticValuesGenerator: Generator = {
  name: 'arithmetic-values',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    // x: 5-20 (larger to ensure floor/mod aren't trivial)
    // y: 2-9 (smaller divisor to ensure x/y > 1)
    const x = rng.int(5, 20);
    const y = rng.int(2, 9);

    // Compute all arithmetic operations
    const floorDiv = Math.floor(x / y);
    const modulo = x % y;
    const divResult = (x / y).toString();

    // Float for round/truncate exercises (e.g., 3.7, 5.2, etc.)
    const floatWhole = rng.int(1, 10);
    const floatDecimal = rng.int(1, 9); // 1-9 to avoid .0
    const floatVal = parseFloat(`${floatWhole}.${floatDecimal}`);
    const roundedInt = Math.round(floatVal).toString();
    const truncatedInt = Math.floor(floatVal).toString();
    const ceilInt = Math.ceil(floatVal).toString();

    return {
      x,
      y,
      sum: x + y,
      product: x * y,
      floorDiv,
      modulo,
      divResult,
      floatVal,
      roundedInt,
      truncatedInt,
      ceilInt,
    };
  },

  validate(params: GeneratorParams): boolean {
    const { x, y, sum, product, floorDiv, modulo } = params;

    // Type checks
    if (typeof x !== 'number' || typeof y !== 'number' ||
        typeof sum !== 'number' || typeof product !== 'number') {
      return false;
    }

    // Range checks
    if (x < 5 || x > 20 || y < 2 || y > 9) {
      return false;
    }

    // Consistency checks
    if (sum !== x + y || product !== x * y) {
      return false;
    }

    if (floorDiv !== Math.floor(x / y) || modulo !== x % y) {
      return false;
    }

    return true;
  },
};
