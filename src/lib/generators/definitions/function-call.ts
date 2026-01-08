// src/lib/generators/definitions/function-call.ts
// Generator for realistic function call exercises with computed results

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * Premium function scenarios with realistic names and contexts.
 * Each scenario has a function name, parameter names, computation logic,
 * code body, and realistic value ranges.
 */
interface FunctionScenario {
  funcName: string;
  params: string[];
  compute: (values: number[]) => number | string;
  body: (params: string[]) => string; // Python code for the function body
  valueRanges: [number, number][];
  context: string;
}

const SCENARIOS: FunctionScenario[] = [
  {
    funcName: 'calculate_total',
    params: ['price', 'quantity'],
    compute: ([price, qty]) => price * qty,
    body: ([p, q]) => `return ${p} * ${q}`,
    valueRanges: [
      [10, 100],
      [1, 10],
    ],
    context: 'shopping cart',
  },
  {
    funcName: 'apply_discount',
    params: ['amount', 'percent'],
    compute: ([amount, percent]) => Math.round(amount * (1 - percent / 100)),
    body: ([a, p]) => `return round(${a} * (1 - ${p} / 100))`,
    valueRanges: [
      [50, 200],
      [10, 30],
    ],
    context: 'discount calculation',
  },
  {
    funcName: 'calculate_average',
    params: ['total', 'count'],
    compute: ([total, count]) => Math.round(total / count),
    body: ([t, c]) => `return round(${t} / ${c})`,
    valueRanges: [
      [100, 500],
      [5, 20],
    ],
    context: 'statistics',
  },
  {
    funcName: 'compute_area',
    params: ['width', 'height'],
    compute: ([w, h]) => w * h,
    body: ([w, h]) => `return ${w} * ${h}`,
    valueRanges: [
      [5, 20],
      [5, 20],
    ],
    context: 'geometry',
  },
  {
    funcName: 'get_celsius',
    params: ['fahrenheit'],
    compute: ([f]) => Math.round(((f - 32) * 5) / 9),
    body: ([f]) => `return round((${f} - 32) * 5 / 9)`,
    valueRanges: [[32, 100]],
    context: 'temperature conversion',
  },
  {
    funcName: 'calculate_tip',
    params: ['bill', 'percent'],
    compute: ([bill, percent]) => Math.round((bill * percent) / 100),
    body: ([b, p]) => `return round(${b} * ${p} / 100)`,
    valueRanges: [
      [20, 150],
      [15, 25],
    ],
    context: 'restaurant bill',
  },
  {
    funcName: 'get_percentage',
    params: ['part', 'whole'],
    compute: ([part, whole]) => Math.round((part / whole) * 100),
    body: ([p, w]) => `return round(${p} / ${w} * 100)`,
    valueRanges: [
      [10, 50],
      [100, 200],
    ],
    context: 'percentage calculation',
  },
  {
    funcName: 'calculate_speed',
    params: ['distance', 'time'],
    compute: ([dist, time]) => Math.round(dist / time),
    body: ([d, t]) => `return round(${d} / ${t})`,
    valueRanges: [
      [50, 300],
      [1, 5],
    ],
    context: 'physics',
  },
];

/**
 * function-call generator
 *
 * Generates realistic function call scenarios with computed results.
 * Produces premium exercise content with real-world contexts.
 *
 * Output params:
 * - funcName: the function name (e.g., "calculate_total")
 * - paramNames: comma-separated param names (e.g., "price, quantity")
 * - arg1, arg2, ...: actual argument values
 * - argList: comma-separated arguments (e.g., "25, 4")
 * - result: computed result
 * - context: real-world context for the function
 * - code: full Python code with correct function body
 * - body: the return statement with correct logic
 */
export const functionCallGenerator: Generator = {
  name: 'function-call',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const scenario = rng.pick(SCENARIOS);
    const values: number[] = scenario.valueRanges.map(([min, max]) =>
      rng.int(min, max)
    );

    const result = scenario.compute(values);
    const bodyCode = scenario.body(scenario.params);

    // Build full Python code
    const code = `def ${scenario.funcName}(${scenario.params.join(', ')}):\n    ${bodyCode}\n\nprint(${scenario.funcName}(${values.join(', ')}))`;

    const params: GeneratorParams = {
      funcName: scenario.funcName,
      paramNames: scenario.params.join(', '),
      argList: values.join(', '),
      result: String(result),
      context: scenario.context,
      paramCount: scenario.params.length,
      code,
      body: bodyCode,
    };

    // Add individual args and param names
    values.forEach((val, i) => {
      params[`arg${i + 1}`] = val;
      params[`param${i + 1}`] = scenario.params[i];
    });

    return params;
  },

  validate(params: GeneratorParams): boolean {
    const { funcName, argList, result, code, body } = params;

    if (
      typeof funcName !== 'string' ||
      typeof argList !== 'string' ||
      typeof result !== 'string' ||
      typeof code !== 'string' ||
      typeof body !== 'string'
    ) {
      return false;
    }

    // Find the matching scenario
    const scenario = SCENARIOS.find((s) => s.funcName === funcName);
    if (!scenario) return false;

    // Parse args and compute expected result
    const values = String(argList)
      .split(',')
      .map((s) => parseInt(s.trim(), 10));
    if (values.some(isNaN)) return false;
    if (values.length !== scenario.params.length) return false;

    const expected = scenario.compute(values);
    if (String(expected) !== result) return false;

    // Verify code contains the function definition
    if (!code.includes(`def ${funcName}`)) return false;
    if (!code.includes(body)) return false;

    return true;
  },
};
