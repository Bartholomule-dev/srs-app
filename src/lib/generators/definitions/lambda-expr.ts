// src/lib/generators/definitions/lambda-expr.ts
// Generator for lambda expression exercises with computed results

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * Lambda expression operations with different complexity levels
 */
interface LambdaOperation {
  name: string;
  params: string;
  body: string;
  compute: (args: number[]) => number | string;
  description: string;
}

const OPERATIONS: LambdaOperation[] = [
  {
    name: 'double',
    params: 'x',
    body: 'x * 2',
    compute: ([x]) => x * 2,
    description: 'doubles the input',
  },
  {
    name: 'square',
    params: 'x',
    body: 'x ** 2',
    compute: ([x]) => x ** 2,
    description: 'squares the input',
  },
  {
    name: 'add',
    params: 'x, y',
    body: 'x + y',
    compute: ([x, y]) => x + y,
    description: 'adds two numbers',
  },
  {
    name: 'multiply',
    params: 'x, y',
    body: 'x * y',
    compute: ([x, y]) => x * y,
    description: 'multiplies two numbers',
  },
  {
    name: 'subtract',
    params: 'x, y',
    body: 'x - y',
    compute: ([x, y]) => x - y,
    description: 'subtracts y from x',
  },
  {
    name: 'increment',
    params: 'x',
    body: 'x + 1',
    compute: ([x]) => x + 1,
    description: 'adds one to the input',
  },
  {
    name: 'negate',
    params: 'x',
    body: '-x',
    compute: ([x]) => -x,
    description: 'negates the input',
  },
  {
    name: 'is_even',
    params: 'x',
    body: 'x % 2 == 0',
    compute: ([x]) => (x % 2 === 0 ? 'True' : 'False'),
    description: 'checks if even',
  },
  {
    name: 'is_positive',
    params: 'x',
    body: 'x > 0',
    compute: ([x]) => (x > 0 ? 'True' : 'False'),
    description: 'checks if positive',
  },
  {
    name: 'max_of_two',
    params: 'x, y',
    body: 'x if x > y else y',
    compute: ([x, y]) => Math.max(x, y),
    description: 'returns the larger value',
  },
];

/**
 * lambda-expr generator
 *
 * Generates lambda expression exercises with computed results.
 * Covers single and multi-parameter lambdas with various operations.
 *
 * Output params:
 * - lambdaExpr: the full lambda expression (e.g., "lambda x: x * 2")
 * - params: parameter list (e.g., "x" or "x, y")
 * - body: lambda body expression (e.g., "x * 2")
 * - arg1, arg2: argument values
 * - argList: comma-separated arguments for calling
 * - result: computed result
 * - description: what the lambda does
 * - opName: operation name for variable naming
 */
export const lambdaExprGenerator: Generator = {
  name: 'lambda-expr',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const op = rng.pick(OPERATIONS);
    const paramCount = op.params.includes(',') ? 2 : 1;

    // Generate appropriate argument values
    const arg1 = rng.int(1, 15);
    const arg2 = paramCount === 2 ? rng.int(1, 15) : 0;

    const args = paramCount === 2 ? [arg1, arg2] : [arg1];
    const result = op.compute(args);

    const argList = paramCount === 2 ? `${arg1}, ${arg2}` : String(arg1);
    const lambdaExpr = `lambda ${op.params}: ${op.body}`;

    return {
      lambdaExpr,
      params: op.params,
      body: op.body,
      arg1,
      arg2,
      argList,
      result: String(result),
      description: op.description,
      opName: op.name,
      paramCount,
    };
  },

  validate(params: GeneratorParams): boolean {
    const { params: lambdaParams, body, argList, result, opName } = params;

    if (
      typeof lambdaParams !== 'string' ||
      typeof body !== 'string' ||
      typeof argList !== 'string' ||
      typeof result !== 'string' ||
      typeof opName !== 'string'
    ) {
      return false;
    }

    // Find matching operation
    const op = OPERATIONS.find((o) => o.name === opName);
    if (!op) return false;

    // Parse arguments
    const args = String(argList)
      .split(',')
      .map((s) => parseInt(s.trim(), 10));
    if (args.some(isNaN)) return false;

    // Compute expected result
    const expected = op.compute(args);
    return String(expected) === result;
  },
};
