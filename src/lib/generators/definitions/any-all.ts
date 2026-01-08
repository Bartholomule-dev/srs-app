import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

const SCENARIOS = [
  {
    name: 'any_true',
    generate: (rng: ReturnType<typeof seededRandom>) => {
      const bools = [false, false, true];
      rng.shuffle(bools);
      return {
        list: `[${bools.map(b => b ? 'True' : 'False').join(', ')}]`,
        func: 'any',
        result: 'True',
        description: 'at least one True element',
      };
    },
  },
  {
    name: 'any_false',
    generate: () => ({
      list: '[False, False, False]',
      func: 'any',
      result: 'False',
      description: 'no True elements',
    }),
  },
  {
    name: 'all_true',
    generate: () => ({
      list: '[True, True, True]',
      func: 'all',
      result: 'True',
      description: 'all elements are True',
    }),
  },
  {
    name: 'all_false',
    generate: (rng: ReturnType<typeof seededRandom>) => {
      const bools = [true, true, false];
      rng.shuffle(bools);
      return {
        list: `[${bools.map(b => b ? 'True' : 'False').join(', ')}]`,
        func: 'all',
        result: 'False',
        description: 'at least one False element',
      };
    },
  },
  {
    name: 'any_numbers',
    generate: (rng: ReturnType<typeof seededRandom>) => {
      const nums = [0, 0, rng.int(1, 10)];
      rng.shuffle(nums);
      return {
        list: `[${nums.join(', ')}]`,
        func: 'any',
        result: 'True',
        description: 'non-zero is truthy',
      };
    },
  },
  {
    name: 'all_numbers',
    generate: (rng: ReturnType<typeof seededRandom>) => {
      const nums = [rng.int(1, 10), rng.int(1, 10), 0];
      rng.shuffle(nums);
      return {
        list: `[${nums.join(', ')}]`,
        func: 'all',
        result: 'False',
        description: 'zero is falsy',
      };
    },
  },
  {
    name: 'any_empty',
    generate: () => ({
      list: '[]',
      func: 'any',
      result: 'False',
      description: 'any() on empty list is False (no truthy elements)',
    }),
  },
  {
    name: 'all_empty',
    generate: () => ({
      list: '[]',
      func: 'all',
      result: 'True',
      description: 'all() on empty list is True (vacuous truth)',
    }),
  },
];

export const anyAllGenerator: Generator = {
  name: 'any-all',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    const scenario = rng.pick(SCENARIOS);
    const data = scenario.generate(rng);

    return {
      list: data.list,
      func: data.func,
      result: data.result,
      code: `${data.func}(${data.list})`,
      scenario: scenario.name,
      description: data.description || '',
    };
  },

  validate(params: GeneratorParams): boolean {
    return (
      typeof params.list === 'string' &&
      typeof params.func === 'string' &&
      typeof params.result === 'string' &&
      ['True', 'False'].includes(params.result as string)
    );
  },
};
