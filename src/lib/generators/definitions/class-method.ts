// src/lib/generators/definitions/class-method.ts
// Generator for OOP method call exercises with realistic class scenarios

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * Premium class scenarios with realistic methods and attributes
 */
interface ClassScenario {
  className: string;
  method: string;
  attribute: string;
  compute: (initial: number, arg?: number) => number | string;
  context: string;
  methodCode: string; // Method implementation
}

const SCENARIOS: ClassScenario[] = [
  {
    className: 'Counter',
    method: 'increment',
    attribute: 'count',
    compute: (initial) => initial + 1,
    context: 'counting',
    methodCode: 'self.count += 1',
  },
  {
    className: 'BankAccount',
    method: 'deposit',
    attribute: 'balance',
    compute: (initial, amount) => initial + (amount || 0),
    context: 'banking',
    methodCode: 'self.balance += amount',
  },
  {
    className: 'Temperature',
    method: 'to_fahrenheit',
    attribute: 'celsius',
    compute: (celsius) => Math.round((celsius * 9) / 5 + 32),
    context: 'conversion',
    methodCode: 'return self.celsius * 9 / 5 + 32',
  },
  {
    className: 'Rectangle',
    method: 'area',
    attribute: 'width',
    compute: (width, height) => width * (height || width),
    context: 'geometry',
    methodCode: 'return self.width * self.height',
  },
  {
    className: 'Score',
    method: 'add_points',
    attribute: 'points',
    compute: (initial, bonus) => initial + (bonus || 0),
    context: 'gaming',
    methodCode: 'self.points += bonus',
  },
  {
    className: 'Timer',
    method: 'tick',
    attribute: 'seconds',
    compute: (initial) => initial - 1,
    context: 'countdown',
    methodCode: 'self.seconds -= 1',
  },
];

/**
 * class-method generator
 *
 * Generates OOP method call exercises with realistic scenarios.
 *
 * Output params:
 * - className: class name (e.g., "Counter")
 * - method: method name (e.g., "increment")
 * - attribute: instance attribute (e.g., "count")
 * - initialValue: starting value
 * - arg: optional method argument
 * - result: final attribute value after method call
 * - context: domain context
 */
export const classMethodGenerator: Generator = {
  name: 'class-method',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const scenario = rng.pick(SCENARIOS);
    const initialValue = rng.int(1, 20);
    const arg = rng.int(5, 50);

    // Determine if this scenario uses an argument
    const needsArg = ['deposit', 'area', 'add_points'].includes(scenario.method);
    const result = scenario.compute(initialValue, needsArg ? arg : undefined);

    // Generate code based on scenario
    let code: string;
    let methodCall: string;

    if (scenario.method === 'to_fahrenheit' || scenario.method === 'area') {
      // Methods that return a value
      methodCall = `obj.${scenario.method}()`;
      code = `class ${scenario.className}:
    def __init__(self, ${scenario.attribute}):
        self.${scenario.attribute} = ${scenario.attribute}
${scenario.attribute === 'width' ? '        self.height = height\n' : ''}
    def ${scenario.method}(self):
        ${scenario.methodCode}

obj = ${scenario.className}(${initialValue}${scenario.attribute === 'width' ? `, ${arg}` : ''})
print(${methodCall})`;
    } else if (needsArg) {
      // Methods that modify state with argument
      methodCall = `obj.${scenario.method}(${arg})`;
      code = `class ${scenario.className}:
    def __init__(self, ${scenario.attribute}):
        self.${scenario.attribute} = ${scenario.attribute}

    def ${scenario.method}(self, ${scenario.method === 'deposit' ? 'amount' : 'bonus'}):
        ${scenario.methodCode}

obj = ${scenario.className}(${initialValue})
obj.${scenario.method}(${arg})
print(obj.${scenario.attribute})`;
    } else {
      // Methods that modify state without argument
      methodCall = `obj.${scenario.method}()`;
      code = `class ${scenario.className}:
    def __init__(self, ${scenario.attribute}):
        self.${scenario.attribute} = ${scenario.attribute}

    def ${scenario.method}(self):
        ${scenario.methodCode}

obj = ${scenario.className}(${initialValue})
obj.${scenario.method}()
print(obj.${scenario.attribute})`;
    }

    return {
      className: scenario.className,
      method: scenario.method,
      attribute: scenario.attribute,
      initialValue,
      arg: needsArg ? arg : 0,
      result: String(result),
      context: scenario.context,
      methodCall,
      code,
    };
  },

  validate(params: GeneratorParams): boolean {
    const { className, method, initialValue, arg, result } = params;

    if (
      typeof className !== 'string' ||
      typeof method !== 'string' ||
      typeof initialValue !== 'number' ||
      typeof result !== 'string'
    ) {
      return false;
    }

    const scenario = SCENARIOS.find(
      (s) => s.className === className && s.method === method
    );
    if (!scenario) return false;

    const needsArg = ['deposit', 'area', 'add_points'].includes(method);
    const expected = scenario.compute(initialValue, needsArg ? (arg as number) : undefined);
    return String(expected) === result;
  },
};
