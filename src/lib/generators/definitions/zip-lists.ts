import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

const SCENARIOS = [
  {
    name: 'equal_length',
    generate: (rng: ReturnType<typeof seededRandom>) => {
      const list1 = [rng.int(1, 10), rng.int(11, 20), rng.int(21, 30)];
      const list2 = ['a', 'b', 'c'];
      const zipped = list1.map((v, i) => `(${v}, '${list2[i]}')`);
      return {
        list1: `[${list1.join(', ')}]`,
        list2: "['a', 'b', 'c']",
        output: `[${zipped.join(', ')}]`,
        code: `list(zip([${list1.join(', ')}], ['a', 'b', 'c']))`,
        description: 'zip pairs elements by position',
      };
    },
  },
  {
    name: 'unequal_length',
    generate: (rng: ReturnType<typeof seededRandom>) => {
      const list1 = [rng.int(1, 10), rng.int(11, 20)];
      const list2 = ['x', 'y', 'z'];
      const zipped = list1.map((v, i) => `(${v}, '${list2[i]}')`);
      return {
        list1: `[${list1.join(', ')}]`,
        list2: "['x', 'y', 'z']",
        output: `[${zipped.join(', ')}]`,
        code: `list(zip([${list1.join(', ')}], ['x', 'y', 'z']))`,
        description: 'zip stops at shortest list',
      };
    },
  },
  {
    name: 'numbers_only',
    generate: (rng: ReturnType<typeof seededRandom>) => {
      const list1 = [rng.int(1, 5), rng.int(6, 10)];
      const list2 = [rng.int(11, 15), rng.int(16, 20)];
      const sums = list1.map((v, i) => v + list2[i]);
      return {
        list1: `[${list1.join(', ')}]`,
        list2: `[${list2.join(', ')}]`,
        output: `[${sums.join(', ')}]`,
        code: `[a + b for a, b in zip([${list1.join(', ')}], [${list2.join(', ')}])]`,
        description: 'zip with comprehension for pairwise sum',
      };
    },
  },
];

export const zipListsGenerator: Generator = {
  name: 'zip-lists',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    const scenario = rng.pick(SCENARIOS);
    const data = scenario.generate(rng);

    return {
      list1: data.list1,
      list2: data.list2,
      output: data.output,
      description: data.description,
      code: data.code,
      scenario: scenario.name,
    };
  },

  validate(params: GeneratorParams): boolean {
    return (
      typeof params.list1 === 'string' &&
      typeof params.list2 === 'string' &&
      typeof params.output === 'string'
    );
  },
};
