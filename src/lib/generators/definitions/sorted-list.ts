import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

const SCENARIOS = [
  {
    name: 'sorted_asc',
    generate: (rng: ReturnType<typeof seededRandom>) => {
      const nums = [rng.int(1, 20), rng.int(21, 40), rng.int(41, 60)];
      rng.shuffle(nums);
      const sorted = [...nums].sort((a, b) => a - b);
      return {
        input: `[${nums.join(', ')}]`,
        output: `[${sorted.join(', ')}]`,
        code: `sorted([${nums.join(', ')}])`,
        func: 'sorted',
        reverse: false,
      };
    },
  },
  {
    name: 'sorted_desc',
    generate: (rng: ReturnType<typeof seededRandom>) => {
      const nums = [rng.int(1, 20), rng.int(21, 40), rng.int(41, 60)];
      rng.shuffle(nums);
      const sorted = [...nums].sort((a, b) => b - a);
      return {
        input: `[${nums.join(', ')}]`,
        output: `[${sorted.join(', ')}]`,
        code: `sorted([${nums.join(', ')}], reverse=True)`,
        func: 'sorted',
        reverse: true,
      };
    },
  },
  {
    name: 'reversed',
    generate: (rng: ReturnType<typeof seededRandom>) => {
      const nums = [rng.int(1, 30), rng.int(31, 60), rng.int(61, 90)];
      const rev = [...nums].reverse();
      return {
        input: `[${nums.join(', ')}]`,
        output: `[${rev.join(', ')}]`,
        code: `list(reversed([${nums.join(', ')}]))`,
        func: 'reversed',
        reverse: false,
      };
    },
  },
];

export const sortedListGenerator: Generator = {
  name: 'sorted-list',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    const scenario = rng.pick(SCENARIOS);
    const data = scenario.generate(rng);

    return {
      input: data.input,
      output: data.output,
      code: data.code,
      func: data.func,
      reverse: data.reverse,
      scenario: scenario.name,
    };
  },

  validate(params: GeneratorParams): boolean {
    return (
      typeof params.input === 'string' &&
      typeof params.output === 'string' &&
      typeof params.code === 'string' &&
      typeof params.func === 'string'
    );
  },
};
