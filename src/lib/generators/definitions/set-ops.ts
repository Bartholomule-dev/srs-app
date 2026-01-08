import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

interface SetScenario {
  name: string;
  operation: string;
  generate: (rng: ReturnType<typeof seededRandom>) => {
    set1: number[];
    set2: number[];
    result: number[];
    code: string;
    description: string;
  };
}

const SCENARIOS: SetScenario[] = [
  {
    name: 'union',
    operation: '|',
    generate: (rng) => {
      const set1 = [rng.int(1, 5), rng.int(6, 10)];
      const set2 = [rng.int(1, 5), rng.int(11, 15)];
      const result = [...new Set([...set1, ...set2])].sort((a, b) => a - b);
      return {
        set1,
        set2,
        result,
        code: `{${set1.join(', ')}} | {${set2.join(', ')}}`,
        description: 'union combines all elements',
      };
    },
  },
  {
    name: 'intersection',
    operation: '&',
    generate: (rng) => {
      const common = rng.int(1, 10);
      const set1 = [common, rng.int(11, 20)];
      const set2 = [common, rng.int(21, 30)];
      const result = [common];
      return {
        set1,
        set2,
        result,
        code: `{${set1.join(', ')}} & {${set2.join(', ')}}`,
        description: 'intersection keeps only common elements',
      };
    },
  },
  {
    name: 'difference',
    operation: '-',
    generate: (rng) => {
      const common = rng.int(1, 10);
      const unique = rng.int(11, 20);
      const set1 = [common, unique];
      const set2 = [common, rng.int(21, 30)];
      const result = [unique];
      return {
        set1,
        set2,
        result,
        code: `{${set1.join(', ')}} - {${set2.join(', ')}}`,
        description: 'difference removes elements in second set',
      };
    },
  },
  {
    name: 'symmetric_difference',
    operation: '^',
    generate: (rng) => {
      const common = rng.int(1, 10);
      const unique1 = rng.int(11, 20);
      const unique2 = rng.int(21, 30);
      const set1 = [common, unique1];
      const set2 = [common, unique2];
      const result = [unique1, unique2].sort((a, b) => a - b);
      return {
        set1,
        set2,
        result,
        code: `{${set1.join(', ')}} ^ {${set2.join(', ')}}`,
        description: 'symmetric difference keeps elements in exactly one set',
      };
    },
  },
];

export const setOpsGenerator: Generator = {
  name: 'set-ops',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    const scenario = rng.pick(SCENARIOS);
    const data = scenario.generate(rng);

    return {
      set1: `{${data.set1.join(', ')}}`,
      set2: `{${data.set2.join(', ')}}`,
      result: `{${data.result.join(', ')}}`,
      operation: scenario.operation,
      operationName: scenario.name,
      code: data.code,
      description: data.description,
    };
  },

  validate(params: GeneratorParams): boolean {
    return (
      typeof params.set1 === 'string' &&
      typeof params.set2 === 'string' &&
      typeof params.result === 'string' &&
      typeof params.operation === 'string'
    );
  },
};
