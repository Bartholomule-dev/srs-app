// src/lib/generators/definitions/try-except-flow.ts
// Generator for try-except flow prediction exercises

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * try-except-flow generator
 *
 * Generates parameters for try-except flow prediction exercises.
 * Randomly selects between success and error scenarios.
 *
 * Scenarios:
 * - Success: valid int conversion, prints "success"
 * - Error: invalid int conversion, raises ValueError
 */

interface Scenario {
  value: string;
  exception: boolean;
  output: string;
}

const scenarios: Scenario[] = [
  { value: '"123"', exception: false, output: 'success' },
  { value: '"456"', exception: false, output: 'success' },
  { value: '"789"', exception: false, output: 'success' },
  { value: '"abc"', exception: true, output: 'error' },
  { value: '"xyz"', exception: true, output: 'error' },
  { value: '"3.14"', exception: true, output: 'error' },  // float string
  { value: '""', exception: true, output: 'error' },  // empty string
];

export const tryExceptFlowGenerator: Generator = {
  name: 'try-except-flow',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const scenario = rng.pick(scenarios);

    return {
      value: scenario.value,
      output: scenario.output,
    };
  },

  validate(params: GeneratorParams): boolean {
    const { value, output } = params;

    // Type checks
    if (typeof value !== 'string' || typeof output !== 'string') {
      return false;
    }

    // Output should be either "success" or "error"
    if (output !== 'success' && output !== 'error') {
      return false;
    }

    // Check that value is one of our known scenarios
    const scenario = scenarios.find(s => s.value === value);
    if (!scenario) {
      return false;
    }

    // Verify output matches scenario
    return scenario.output === output;
  },
};
