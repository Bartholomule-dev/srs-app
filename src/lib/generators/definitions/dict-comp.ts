// src/lib/generators/definitions/dict-comp.ts
// Generator for dictionary comprehension exercises with various scenarios

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * Dictionary comprehension scenarios with different transformations
 */
interface DictCompScenario {
  name: string;
  description: string;
  compute: (n: number) => Record<number, number | string>;
  template: string; // Python code template
}

const SCENARIOS: DictCompScenario[] = [
  {
    name: 'squares',
    description: 'maps numbers to their squares',
    compute: (n) => {
      const result: Record<number, number> = {};
      for (let i = 0; i < n; i++) result[i] = i * i;
      return result;
    },
    template: '{x: x**2 for x in range({{n}})}',
  },
  {
    name: 'cubes',
    description: 'maps numbers to their cubes',
    compute: (n) => {
      const result: Record<number, number> = {};
      for (let i = 0; i < n; i++) result[i] = i * i * i;
      return result;
    },
    template: '{x: x**3 for x in range({{n}})}',
  },
  {
    name: 'doubles',
    description: 'maps numbers to their doubles',
    compute: (n) => {
      const result: Record<number, number> = {};
      for (let i = 0; i < n; i++) result[i] = i * 2;
      return result;
    },
    template: '{x: x * 2 for x in range({{n}})}',
  },
  {
    name: 'even_only',
    description: 'maps even numbers to themselves',
    compute: (n) => {
      const result: Record<number, number> = {};
      for (let i = 0; i < n; i++) {
        if (i % 2 === 0) result[i] = i;
      }
      return result;
    },
    template: '{x: x for x in range({{n}}) if x % 2 == 0}',
  },
  {
    name: 'string_keys',
    description: 'maps numbers to string versions',
    compute: (n) => {
      const result: Record<number, string> = {};
      for (let i = 0; i < n; i++) result[i] = String(i);
      return result;
    },
    template: '{x: str(x) for x in range({{n}})}',
  },
];

/**
 * dict-comp generator
 *
 * Generates dictionary comprehension exercises with various transformations.
 *
 * Output params:
 * - n: range limit
 * - scenario: which transformation type
 * - description: what the comprehension does
 * - code: Python code to execute
 * - result: expected output as Python dict string
 */
export const dictCompGenerator: Generator = {
  name: 'dict-comp',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const scenario = rng.pick(SCENARIOS);
    const n = rng.int(3, 6);

    const resultObj = scenario.compute(n);
    // Format as Python dict string
    const resultStr = JSON.stringify(resultObj).replace(/"/g, "'");

    const code = scenario.template.replace('{{n}}', String(n));

    return {
      n,
      scenario: scenario.name,
      description: scenario.description,
      code,
      result: resultStr,
    };
  },

  validate(params: GeneratorParams): boolean {
    const { n, scenario: scenarioName, result } = params;

    if (
      typeof n !== 'number' ||
      typeof scenarioName !== 'string' ||
      typeof result !== 'string'
    ) {
      return false;
    }

    const scenario = SCENARIOS.find((s) => s.name === scenarioName);
    if (!scenario) return false;

    const expected = JSON.stringify(scenario.compute(n)).replace(/"/g, "'");
    return result === expected;
  },
};
