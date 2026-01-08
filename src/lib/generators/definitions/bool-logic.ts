// src/lib/generators/definitions/bool-logic.ts
// Generator for boolean logic and compound condition exercises

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * Boolean logic scenarios with various operators
 */
interface BoolScenario {
  name: string;
  expression: string;
  compute: (a: number, b: number) => boolean;
  description: string;
}

const SCENARIOS: BoolScenario[] = [
  {
    name: 'and_both_true',
    expression: '{{a}} > 0 and {{b}} > 0',
    compute: (a, b) => a > 0 && b > 0,
    description: 'both positive',
  },
  {
    name: 'or_either',
    expression: '{{a}} > 10 or {{b}} > 10',
    compute: (a, b) => a > 10 || b > 10,
    description: 'either greater than 10',
  },
  {
    name: 'not_negative',
    expression: 'not {{a}} < 0',
    compute: (a) => !(a < 0),
    description: 'not negative',
  },
  {
    name: 'range_check',
    expression: '0 < {{a}} < 10',
    compute: (a) => 0 < a && a < 10,
    description: 'in range (0, 10)',
  },
  {
    name: 'equal_or_greater',
    expression: '{{a}} >= {{b}}',
    compute: (a, b) => a >= b,
    description: 'greater than or equal',
  },
  {
    name: 'not_equal',
    expression: '{{a}} != {{b}}',
    compute: (a, b) => a !== b,
    description: 'not equal',
  },
  {
    name: 'and_with_equal',
    expression: '{{a}} > 5 and {{a}} == {{b}}',
    compute: (a, b) => a > 5 && a === b,
    description: 'greater than 5 and equal',
  },
  {
    name: 'or_with_zero',
    expression: '{{a}} == 0 or {{b}} == 0',
    compute: (a, b) => a === 0 || b === 0,
    description: 'either is zero',
  },
  {
    name: 'compound_and_or',
    expression: '({{a}} > {{b}}) or ({{a}} == 0)',
    compute: (a, b) => a > b || a === 0,
    description: 'greater or zero',
  },
  {
    name: 'divisibility',
    expression: '{{a}} % 2 == 0 and {{b}} % 2 == 0',
    compute: (a, b) => a % 2 === 0 && b % 2 === 0,
    description: 'both even',
  },
];

/**
 * bool-logic generator
 *
 * Generates boolean logic exercises with compound conditions.
 *
 * Output params:
 * - a, b: integer values
 * - expression: the boolean expression with values substituted
 * - expressionTemplate: template with {{a}}, {{b}} placeholders
 * - result: 'True' or 'False'
 * - description: what the expression checks
 * - scenario: scenario name
 */
export const boolLogicGenerator: Generator = {
  name: 'bool-logic',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const scenario = rng.pick(SCENARIOS);

    // Generate values that will produce interesting results
    // Mix of values that make conditions true/false
    const a = rng.int(0, 15);
    const b = rng.int(0, 15);

    const boolResult = scenario.compute(a, b);
    const result = boolResult ? 'True' : 'False';

    // Create the expression with values substituted
    const expression = scenario.expression
      .replace(/\{\{a\}\}/g, String(a))
      .replace(/\{\{b\}\}/g, String(b));

    return {
      a,
      b,
      expression,
      expressionTemplate: scenario.expression,
      result,
      description: scenario.description,
      scenario: scenario.name,
    };
  },

  validate(params: GeneratorParams): boolean {
    const { a, b, result, scenario: scenarioName } = params;

    if (
      typeof a !== 'number' ||
      typeof b !== 'number' ||
      typeof result !== 'string' ||
      typeof scenarioName !== 'string'
    ) {
      return false;
    }

    const scenario = SCENARIOS.find((s) => s.name === scenarioName);
    if (!scenario) return false;

    const expected = scenario.compute(a, b) ? 'True' : 'False';
    return result === expected;
  },
};
