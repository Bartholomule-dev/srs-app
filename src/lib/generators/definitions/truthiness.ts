import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * Truthiness scenarios covering falsy and truthy values
 */
interface TruthinessScenario {
  valueStr: string;
  isTruthy: boolean;
  category: string;
}

const FALSY_SCENARIOS: TruthinessScenario[] = [
  { valueStr: 'False', isTruthy: false, category: 'boolean-false' },
  { valueStr: 'None', isTruthy: false, category: 'none' },
  { valueStr: '0', isTruthy: false, category: 'zero-int' },
  { valueStr: '0.0', isTruthy: false, category: 'zero-float' },
  { valueStr: '""', isTruthy: false, category: 'empty-string' },
  { valueStr: "''", isTruthy: false, category: 'empty-string-single' },
  { valueStr: '[]', isTruthy: false, category: 'empty-list' },
  { valueStr: '{}', isTruthy: false, category: 'empty-dict' },
  { valueStr: 'set()', isTruthy: false, category: 'empty-set' },
  { valueStr: '()', isTruthy: false, category: 'empty-tuple' },
];

const TRUTHY_SCENARIOS: TruthinessScenario[] = [
  { valueStr: 'True', isTruthy: true, category: 'boolean-true' },
  { valueStr: '1', isTruthy: true, category: 'nonzero-int' },
  { valueStr: '-1', isTruthy: true, category: 'negative-int' },
  { valueStr: '0.1', isTruthy: true, category: 'nonzero-float' },
  { valueStr: '"hello"', isTruthy: true, category: 'nonempty-string' },
  { valueStr: '"0"', isTruthy: true, category: 'string-zero' },
  { valueStr: '"False"', isTruthy: true, category: 'string-false' },
  { valueStr: '[0]', isTruthy: true, category: 'list-with-zero' },
  { valueStr: '[False]', isTruthy: true, category: 'list-with-false' },
  { valueStr: '{"a": 1}', isTruthy: true, category: 'nonempty-dict' },
  { valueStr: '{1}', isTruthy: true, category: 'nonempty-set' },
  { valueStr: '(0,)', isTruthy: true, category: 'tuple-with-zero' },
];

/**
 * truthiness generator
 *
 * Generates truthiness evaluation exercises for Python values.
 *
 * Output params:
 * - valueStr: string representation of the value
 * - isTruthy: 'True' or 'False'
 * - category: scenario category for validation
 * - explanation: why this value is truthy/falsy
 */
export const truthinessGenerator: Generator = {
  name: 'truthiness',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    // Mix of truthy and falsy, slightly favoring tricky falsy cases
    const useFalsy = rng.next() < 0.55;
    const scenarios = useFalsy ? FALSY_SCENARIOS : TRUTHY_SCENARIOS;
    const scenario = rng.pick(scenarios);

    const explanation = scenario.isTruthy
      ? `Non-empty/non-zero values are truthy`
      : `Empty collections, zero, None, and False are falsy`;

    return {
      valueStr: scenario.valueStr,
      isTruthy: scenario.isTruthy ? 'True' : 'False',
      category: scenario.category,
      explanation,
    };
  },

  validate(params: GeneratorParams): boolean {
    const { valueStr, isTruthy, category } = params;

    if (
      typeof valueStr !== 'string' ||
      typeof isTruthy !== 'string' ||
      typeof category !== 'string'
    ) {
      return false;
    }

    if (isTruthy !== 'True' && isTruthy !== 'False') {
      return false;
    }

    // Find matching scenario
    const allScenarios = [...FALSY_SCENARIOS, ...TRUTHY_SCENARIOS];
    const scenario = allScenarios.find((s) => s.category === category);
    if (!scenario) return false;

    const expectedTruthy = scenario.isTruthy ? 'True' : 'False';
    return isTruthy === expectedTruthy && valueStr === scenario.valueStr;
  },
};
