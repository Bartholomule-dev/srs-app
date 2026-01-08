// src/lib/generators/definitions/operator-chain.ts
// Generator for operator precedence and chained expression exercises

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

interface ExpressionScenario {
  name: string;
  generate: (rng: ReturnType<typeof seededRandom>) => {
    expression: string;
    result: number;
    description: string;
  };
}

const SCENARIOS: ExpressionScenario[] = [
  {
    name: 'add_multiply',
    generate: (rng) => {
      const a = rng.int(2, 5);
      const b = rng.int(2, 5);
      const c = rng.int(2, 5);
      return {
        expression: `${a} + ${b} * ${c}`,
        result: a + b * c,
        description: 'multiplication before addition',
      };
    },
  },
  {
    name: 'parens_first',
    generate: (rng) => {
      const a = rng.int(2, 5);
      const b = rng.int(2, 5);
      const c = rng.int(2, 5);
      return {
        expression: `(${a} + ${b}) * ${c}`,
        result: (a + b) * c,
        description: 'parentheses override precedence',
      };
    },
  },
  {
    name: 'divide_subtract',
    generate: (rng) => {
      const c = rng.int(2, 4);
      const b = c * rng.int(2, 5); // ensure clean division
      const a = rng.int(10, 20);
      return {
        expression: `${a} - ${b} / ${c}`,
        result: a - b / c,
        description: 'division before subtraction',
      };
    },
  },
  {
    name: 'power_first',
    generate: (rng) => {
      const a = rng.int(2, 4);
      const b = rng.int(2, 3);
      const c = rng.int(1, 5);
      return {
        expression: `${a} ** ${b} + ${c}`,
        result: Math.pow(a, b) + c,
        description: 'exponentiation before addition',
      };
    },
  },
  {
    name: 'floor_division',
    generate: (rng) => {
      const a = rng.int(10, 30);
      const b = rng.int(3, 7);
      const c = rng.int(1, 5);
      return {
        expression: `${a} // ${b} + ${c}`,
        result: Math.floor(a / b) + c,
        description: 'floor division with addition',
      };
    },
  },
  {
    name: 'modulo_chain',
    generate: (rng) => {
      const a = rng.int(15, 30);
      const b = rng.int(4, 8);
      const c = rng.int(2, 4);
      return {
        expression: `${a} % ${b} + ${c}`,
        result: (a % b) + c,
        description: 'modulo with addition',
      };
    },
  },
  {
    name: 'nested_parens',
    generate: (rng) => {
      const a = rng.int(2, 5);
      const b = rng.int(2, 5);
      const c = rng.int(1, 3);
      const d = rng.int(2, 4);
      return {
        expression: `(${a} + ${b}) * (${c} + ${d})`,
        result: (a + b) * (c + d),
        description: 'multiple parenthesized groups',
      };
    },
  },
  {
    name: 'left_to_right',
    generate: (rng) => {
      const a = rng.int(20, 40);
      const b = rng.int(5, 10);
      const c = rng.int(2, 4);
      return {
        expression: `${a} - ${b} - ${c}`,
        result: a - b - c,
        description: 'same precedence evaluates left-to-right',
      };
    },
  },
];

export const operatorChainGenerator: Generator = {
  name: 'operator-chain',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    const scenario = rng.pick(SCENARIOS);
    const generated = scenario.generate(rng);

    return {
      expression: generated.expression,
      result: generated.result,
      resultStr: String(generated.result),
      description: generated.description,
      scenario: scenario.name,
      code: `result = ${generated.expression}\nprint(result)`,
    };
  },

  validate(params: GeneratorParams): boolean {
    return (
      typeof params.expression === 'string' &&
      params.expression.length > 0 &&
      typeof params.result === 'number' &&
      typeof params.resultStr === 'string' &&
      typeof params.description === 'string' &&
      typeof params.scenario === 'string' &&
      typeof params.code === 'string'
    );
  },
};
