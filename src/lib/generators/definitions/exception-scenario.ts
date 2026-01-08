// src/lib/generators/definitions/exception-scenario.ts
// Generator for realistic exception handling scenarios

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * Realistic exception scenarios with different error types and contexts
 */
interface ExceptionScenario {
  operation: string; // What operation is being performed
  exceptionType: string; // The exception type raised
  message: string; // The error message
  context: string; // Domain context
  code: string; // Python code snippet
  catchBlock: string; // The correct except clause
}

const SCENARIOS: ExceptionScenario[] = [
  {
    operation: 'file read',
    exceptionType: 'FileNotFoundError',
    message: 'No such file or directory',
    context: 'file handling',
    code: 'open("missing.txt")',
    catchBlock: 'except FileNotFoundError:',
  },
  {
    operation: 'division',
    exceptionType: 'ZeroDivisionError',
    message: 'division by zero',
    context: 'arithmetic',
    code: 'result = 10 / 0',
    catchBlock: 'except ZeroDivisionError:',
  },
  {
    operation: 'list access',
    exceptionType: 'IndexError',
    message: 'list index out of range',
    context: 'collections',
    code: 'items = [1, 2, 3]\nitem = items[10]',
    catchBlock: 'except IndexError:',
  },
  {
    operation: 'dict access',
    exceptionType: 'KeyError',
    message: "'missing'",
    context: 'collections',
    code: 'data = {"a": 1}\nvalue = data["missing"]',
    catchBlock: 'except KeyError:',
  },
  {
    operation: 'type conversion',
    exceptionType: 'ValueError',
    message: "invalid literal for int()",
    context: 'parsing',
    code: 'num = int("abc")',
    catchBlock: 'except ValueError:',
  },
  {
    operation: 'attribute access',
    exceptionType: 'AttributeError',
    message: "has no attribute 'missing'",
    context: 'objects',
    code: '"hello".missing()',
    catchBlock: 'except AttributeError:',
  },
  {
    operation: 'type operation',
    exceptionType: 'TypeError',
    message: "unsupported operand type",
    context: 'types',
    code: '"hello" + 5',
    catchBlock: 'except TypeError:',
  },
  {
    operation: 'import',
    exceptionType: 'ImportError',
    message: "No module named 'nonexistent'",
    context: 'modules',
    code: 'import nonexistent',
    catchBlock: 'except ImportError:',
  },
];

/**
 * exception-scenario generator
 *
 * Generates realistic exception handling exercises with various error types.
 *
 * Output params:
 * - operation: what's being done
 * - exceptionType: the exception class name
 * - message: the error message
 * - context: domain context
 * - code: Python code that raises the exception
 * - catchBlock: correct except clause
 */
export const exceptionScenarioGenerator: Generator = {
  name: 'exception-scenario',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const scenario = rng.pick(SCENARIOS);

    return {
      operation: scenario.operation,
      exceptionType: scenario.exceptionType,
      message: scenario.message,
      context: scenario.context,
      code: scenario.code,
      catchBlock: scenario.catchBlock,
    };
  },

  validate(params: GeneratorParams): boolean {
    const { operation, exceptionType, message, context, code, catchBlock } = params;

    if (
      typeof operation !== 'string' ||
      typeof exceptionType !== 'string' ||
      typeof message !== 'string' ||
      typeof context !== 'string' ||
      typeof code !== 'string' ||
      typeof catchBlock !== 'string'
    ) {
      return false;
    }

    // Find matching scenario
    const scenario = SCENARIOS.find(
      (s) => s.exceptionType === exceptionType && s.operation === operation
    );
    if (!scenario) return false;

    return (
      scenario.message === message &&
      scenario.context === context &&
      scenario.catchBlock === catchBlock
    );
  },
};
