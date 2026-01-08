// src/lib/generators/definitions/finally-flow.ts
// Generator for try/except/finally flow exercises

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

interface FinallyScenario {
  name: string;
  generate: (rng: ReturnType<typeof seededRandom>) => {
    tryBlock: string;
    exceptBlock: string;
    finallyBlock: string;
    output: string[];
    description: string;
    raisesException: boolean;
  };
}

const SCENARIOS: FinallyScenario[] = [
  {
    name: 'no_exception',
    generate: (rng) => {
      const value = rng.int(1, 10);
      return {
        tryBlock: `print("try: ${value}")`,
        exceptBlock: 'print("except")',
        finallyBlock: 'print("finally")',
        output: [`try: ${value}`, 'finally'],
        description: 'no exception - finally still runs',
        raisesException: false,
      };
    },
  },
  {
    name: 'with_exception',
    generate: (rng) => {
      const a = rng.int(5, 15);
      return {
        tryBlock: `print("try")\nx = ${a} / 0`,
        exceptBlock: 'print("except: division error")',
        finallyBlock: 'print("finally")',
        output: ['try', 'except: division error', 'finally'],
        description: 'exception caught, finally runs after except',
        raisesException: true,
      };
    },
  },
  {
    name: 'return_in_try',
    generate: (rng) => {
      const result = rng.int(10, 20);
      return {
        tryBlock: `print("try")\nreturn ${result}`,
        exceptBlock: 'print("except")',
        finallyBlock: 'print("finally")',
        output: ['try', 'finally'],
        description: 'finally runs even with return in try',
        raisesException: false,
      };
    },
  },
  {
    name: 'multiple_prints',
    generate: (rng) => {
      const a = rng.int(1, 5);
      const b = rng.int(1, 5);
      return {
        tryBlock: `print("start")\nresult = ${a} + ${b}\nprint(f"result: {result}")`,
        exceptBlock: 'print("error")',
        finallyBlock: 'print("cleanup")',
        output: ['start', `result: ${a + b}`, 'cleanup'],
        description: 'tracks execution order through try and finally',
        raisesException: false,
      };
    },
  },
  {
    name: 'exception_in_middle',
    generate: (rng) => {
      const idx = rng.int(5, 10);
      return {
        tryBlock: `print("accessing")\ndata = [1, 2, 3][${idx}]`,
        exceptBlock: 'print("index error")',
        finallyBlock: 'print("done")',
        output: ['accessing', 'index error', 'done'],
        description: 'exception interrupts try, except then finally run',
        raisesException: true,
      };
    },
  },
];

function buildCode(scenario: ReturnType<FinallyScenario['generate']>): string {
  const lines: string[] = [];
  lines.push('try:');
  scenario.tryBlock.split('\n').forEach((line) => lines.push(`    ${line}`));
  lines.push('except:');
  scenario.exceptBlock.split('\n').forEach((line) => lines.push(`    ${line}`));
  lines.push('finally:');
  scenario.finallyBlock.split('\n').forEach((line) => lines.push(`    ${line}`));
  return lines.join('\n');
}

export const finallyFlowGenerator: Generator = {
  name: 'finally-flow',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    const scenario = rng.pick(SCENARIOS);
    const generated = scenario.generate(rng);
    const code = buildCode(generated);

    return {
      tryBlock: generated.tryBlock,
      exceptBlock: generated.exceptBlock,
      finallyBlock: generated.finallyBlock,
      output: generated.output,
      outputStr: generated.output.join('\n'),
      outputCount: String(generated.output.length),
      description: generated.description,
      scenario: scenario.name,
      raisesException: generated.raisesException,
      code,
    };
  },

  validate(params: GeneratorParams): boolean {
    return (
      typeof params.tryBlock === 'string' &&
      typeof params.exceptBlock === 'string' &&
      typeof params.finallyBlock === 'string' &&
      Array.isArray(params.output) &&
      params.output.length > 0 &&
      typeof params.outputStr === 'string' &&
      typeof params.outputCount === 'string' &&
      typeof params.description === 'string' &&
      typeof params.scenario === 'string' &&
      typeof params.raisesException === 'boolean' &&
      typeof params.code === 'string' &&
      params.code.includes('try:') &&
      params.code.includes('finally:')
    );
  },
};
