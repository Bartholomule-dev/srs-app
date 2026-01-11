// src/lib/generators/definitions/string-slice.ts
// Generator for advanced string slicing exercises

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';
import { tinyStoreLexicon } from '../tinystore-data';

/**
 * String slicing scenarios with computed results
 */
interface SliceScenario {
  name: string;
  description: string;
  slice: (s: string, start: number, end: number, step: number) => string;
  generateSliceExpr: (start: number, end: number, step: number, length: number) => string;
}

const WORDS = tinyStoreLexicon.sliceWords;

const SCENARIOS: SliceScenario[] = [
  {
    name: 'basic',
    description: 'basic slice from start to end',
    slice: (s, start, end) => s.slice(start, end),
    generateSliceExpr: (start, end) => `[${start}:${end}]`,
  },
  {
    name: 'from_start',
    description: 'slice from beginning to index',
    slice: (s, _start, end) => s.slice(0, end),
    generateSliceExpr: (_start, end) => `[:${end}]`,
  },
  {
    name: 'to_end',
    description: 'slice from index to end',
    slice: (s, start) => s.slice(start),
    generateSliceExpr: (start) => `[${start}:]`,
  },
  {
    name: 'negative_start',
    description: 'slice using negative start index',
    slice: (s, start) => {
      const actualStart = s.length + start;
      return s.slice(actualStart);
    },
    generateSliceExpr: (start) => `[${start}:]`,
  },
  {
    name: 'negative_end',
    description: 'slice using negative end index',
    slice: (s, start, end) => {
      const actualEnd = s.length + end;
      return s.slice(start, actualEnd);
    },
    generateSliceExpr: (start, end) => `[${start}:${end}]`,
  },
  {
    name: 'step',
    description: 'slice with step',
    slice: (s, start, end, step) => {
      let result = '';
      for (let i = start; i < end; i += step) {
        if (i >= 0 && i < s.length) {
          result += s[i];
        }
      }
      return result;
    },
    generateSliceExpr: (start, end, step) => `[${start}:${end}:${step}]`,
  },
  {
    name: 'reverse',
    description: 'reverse string with [::-1]',
    slice: (s) => s.split('').reverse().join(''),
    generateSliceExpr: () => '[::-1]',
  },
  {
    name: 'every_other',
    description: 'every other character with [::2]',
    slice: (s) => {
      let result = '';
      for (let i = 0; i < s.length; i += 2) {
        result += s[i];
      }
      return result;
    },
    generateSliceExpr: () => '[::2]',
  },
];

/**
 * string-slice generator
 *
 * Generates advanced string slicing exercises.
 *
 * Output params:
 * - word: the string to slice
 * - start: start index (may be negative)
 * - end: end index (may be negative)
 * - step: step value
 * - sliceExpr: the slice expression
 * - result: computed result
 * - description: what kind of slice
 * - code: Python code snippet
 * - scenario: scenario name
 */
export const stringSliceGenerator: Generator = {
  name: 'string-slice',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const word = rng.pick(WORDS);
    const scenario = rng.pick(SCENARIOS);
    const length = word.length;

    let start = 0;
    let end = length;
    let step = 1;

    switch (scenario.name) {
      case 'basic':
        start = rng.int(0, 2);
        end = rng.int(start + 2, length);
        break;
      case 'from_start':
        end = rng.int(2, length - 1);
        break;
      case 'to_end':
        start = rng.int(1, length - 2);
        break;
      case 'negative_start':
        start = -rng.int(1, 3);
        break;
      case 'negative_end':
        start = 0;
        end = -rng.int(1, 3);
        break;
      case 'step':
        start = 0;
        end = length;
        step = 2;
        break;
      case 'reverse':
      case 'every_other':
        // Uses full string
        break;
    }

    const result = scenario.slice(word, start, end, step);
    const sliceExpr = scenario.generateSliceExpr(start, end, step, length);

    const code = `s = "${word}"\nprint(s${sliceExpr})`;

    return {
      word,
      start,
      end,
      step,
      sliceExpr,
      result,
      description: scenario.description,
      code,
      scenario: scenario.name,
    };
  },

  validate(params: GeneratorParams): boolean {
    const { word, result, scenario: scenarioName } = params;

    if (
      typeof word !== 'string' ||
      typeof result !== 'string' ||
      typeof scenarioName !== 'string'
    ) {
      return false;
    }

    const scenario = SCENARIOS.find((s) => s.name === scenarioName);
    if (!scenario) return false;

    // Result should be a substring of word (or reversed, etc.)
    return result.length <= word.length;
  },
};
