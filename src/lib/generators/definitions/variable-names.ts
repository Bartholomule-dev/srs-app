// src/lib/generators/definitions/variable-names.ts
// Generator for variable name exercises

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * Pool of common, readable variable names.
 * All are valid Python identifiers (lowercase, may contain underscores/digits).
 */
const VARIABLE_NAMES = [
  'count',
  'total',
  'value',
  'result',
  'num',
  'item',
  'data',
  'text',
  'name',
  'score',
  'index',
  'size',
  'length',
  'sum',
  'max_val',
  'min_val',
  'current',
  'temp',
  'flag',
  'status',
  'message',
  'output',
  'input_val',
  'answer',
  'number',
  'amount',
  'price',
  'quantity',
  'customer_id',
  'product_id',
  'order_total',
  'order_status',
  'inventory_count',
  'discount_pct',
  'tax_rate',
  'line_items',
  'email',
  'age',
  'height',
];

/**
 * Python keywords - cannot be used as variable names.
 * https://docs.python.org/3/reference/lexical_analysis.html#keywords
 */
const PYTHON_KEYWORDS = new Set([
  'False',
  'None',
  'True',
  'and',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'class',
  'continue',
  'def',
  'del',
  'elif',
  'else',
  'except',
  'finally',
  'for',
  'from',
  'global',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'nonlocal',
  'not',
  'or',
  'pass',
  'raise',
  'return',
  'try',
  'while',
  'with',
  'yield',
]);

/**
 * variable-names generator
 *
 * Generates two distinct variable names for exercises.
 * All names are valid Python identifiers from a curated pool.
 */
export const variableNamesGenerator: Generator = {
  name: 'variable-names',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    // Shuffle and pick first two (guaranteed different)
    const shuffled = rng.shuffle([...VARIABLE_NAMES]);
    return { name: shuffled[0], name2: shuffled[1] };
  },

  validate(params: GeneratorParams): boolean {
    const { name, name2 } = params;

    // Type checks
    if (typeof name !== 'string' || typeof name2 !== 'string') {
      return false;
    }

    // Valid Python identifier pattern (lowercase, may start with letter, contain digits/underscores)
    const validIdentifier = /^[a-z][a-z0-9_]*$/;
    if (!validIdentifier.test(name) || !validIdentifier.test(name2)) {
      return false;
    }

    // Not Python keywords
    if (PYTHON_KEYWORDS.has(name) || PYTHON_KEYWORDS.has(name2)) {
      return false;
    }

    // Must be different
    if (name === name2) {
      return false;
    }

    return true;
  },
};
