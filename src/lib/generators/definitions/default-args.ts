// src/lib/generators/definitions/default-args.ts
// Generator for default argument and function parameter exercises

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

interface DefaultArgScenario {
  name: string;
  generate: (rng: ReturnType<typeof seededRandom>) => {
    funcName: string;
    params: string;
    callArgs: string;
    result: string;
    description: string;
    code: string;
  };
}

const SCENARIOS: DefaultArgScenario[] = [
  {
    name: 'single_default',
    generate: (rng) => {
      const funcName = rng.pick(['greet', 'welcome', 'hello']);
      const defaultName = rng.pick(['World', 'User', 'Guest', 'Friend']);
      const callName = rng.pick(['Alice', 'Bob', 'Charlie', 'David']);
      const useDefault = rng.pick([true, false]);

      if (useDefault) {
        return {
          funcName,
          params: `name="${defaultName}"`,
          callArgs: '',
          result: `Hello, ${defaultName}!`,
          description: 'uses default when no argument given',
          code: `def ${funcName}(name="${defaultName}"):\n    return f"Hello, {name}!"\n\nprint(${funcName}())`,
        };
      } else {
        return {
          funcName,
          params: `name="${defaultName}"`,
          callArgs: `"${callName}"`,
          result: `Hello, ${callName}!`,
          description: 'overrides default with explicit argument',
          code: `def ${funcName}(name="${defaultName}"):\n    return f"Hello, {name}!"\n\nprint(${funcName}("${callName}"))`,
        };
      }
    },
  },
  {
    name: 'mixed_params',
    generate: (rng) => {
      const a = rng.int(1, 5);
      const defaultMult = rng.int(2, 4);

      return {
        funcName: 'calculate',
        params: `x, multiplier=${defaultMult}`,
        callArgs: String(a),
        result: String(a * defaultMult),
        description: 'required param with default param',
        code: `def calculate(x, multiplier=${defaultMult}):\n    return x * multiplier\n\nprint(calculate(${a}))`,
      };
    },
  },
  {
    name: 'override_default',
    generate: (rng) => {
      const x = rng.int(5, 10);
      const defaultY = rng.int(1, 3);
      const overrideY = rng.int(4, 8);

      return {
        funcName: 'power',
        params: `base, exp=${defaultY}`,
        callArgs: `${x}, ${overrideY}`,
        result: String(Math.pow(x, overrideY)),
        description: 'override default with explicit value',
        code: `def power(base, exp=${defaultY}):\n    return base ** exp\n\nprint(power(${x}, ${overrideY}))`,
      };
    },
  },
  {
    name: 'keyword_arg',
    generate: (rng) => {
      const items = rng.int(1, 5);
      const price = rng.int(10, 50);
      const defaultTax = rng.pick([0.05, 0.1, 0.15]);
      const total = Math.round(items * price * (1 + defaultTax) * 100) / 100;

      return {
        funcName: 'total_price',
        params: `items, price, tax=${defaultTax}`,
        callArgs: `items=${items}, price=${price}`,
        result: String(total),
        description: 'keyword arguments with default',
        code: `def total_price(items, price, tax=${defaultTax}):\n    return round(items * price * (1 + tax), 2)\n\nprint(total_price(items=${items}, price=${price}))`,
      };
    },
  },
  {
    name: 'multiple_defaults',
    generate: (rng) => {
      const defaultA = rng.int(1, 3);
      const defaultB = rng.int(2, 4);

      return {
        funcName: 'add',
        params: `a=${defaultA}, b=${defaultB}`,
        callArgs: '',
        result: String(defaultA + defaultB),
        description: 'all parameters have defaults',
        code: `def add(a=${defaultA}, b=${defaultB}):\n    return a + b\n\nprint(add())`,
      };
    },
  },
];

export const defaultArgsGenerator: Generator = {
  name: 'default-args',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    const scenario = rng.pick(SCENARIOS);
    const generated = scenario.generate(rng);

    return {
      funcName: generated.funcName,
      params: generated.params,
      callArgs: generated.callArgs,
      result: generated.result,
      description: generated.description,
      scenario: scenario.name,
      code: generated.code,
    };
  },

  validate(params: GeneratorParams): boolean {
    return (
      typeof params.funcName === 'string' &&
      params.funcName.length > 0 &&
      typeof params.params === 'string' &&
      typeof params.callArgs === 'string' &&
      typeof params.result === 'string' &&
      typeof params.description === 'string' &&
      typeof params.scenario === 'string' &&
      typeof params.code === 'string' &&
      params.code.includes('def ')
    );
  },
};
