import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

interface TupleScenario {
  name: string;
  generate: (rng: ReturnType<typeof seededRandom>) => {
    tuple: string;
    tupleVar: string;
    index: number;
    result: string;
    length: number;
    context: string;
  };
}

const SCENARIOS: TupleScenario[] = [
  {
    name: 'coordinates',
    generate: (rng) => {
      const x = rng.int(1, 100);
      const y = rng.int(1, 100);
      const z = rng.int(1, 100);
      const index = rng.int(0, 2);
      const values = [x, y, z];
      return {
        tuple: `(${x}, ${y}, ${z})`,
        tupleVar: 'point',
        index,
        result: String(values[index]),
        length: 3,
        context: '3D coordinates',
      };
    },
  },
  {
    name: 'rgb',
    generate: (rng) => {
      const r = rng.int(0, 255);
      const g = rng.int(0, 255);
      const b = rng.int(0, 255);
      const index = rng.int(0, 2);
      const values = [r, g, b];
      return {
        tuple: `(${r}, ${g}, ${b})`,
        tupleVar: 'color',
        index,
        result: String(values[index]),
        length: 3,
        context: 'RGB color',
      };
    },
  },
  {
    name: 'pair',
    generate: (rng) => {
      const a = rng.int(1, 50);
      const b = rng.int(1, 50);
      const index = rng.int(0, 1);
      const values = [a, b];
      return {
        tuple: `(${a}, ${b})`,
        tupleVar: 'pair',
        index,
        result: String(values[index]),
        length: 2,
        context: 'number pair',
      };
    },
  },
  {
    name: 'negative_index',
    generate: (rng) => {
      const a = rng.int(10, 50);
      const b = rng.int(10, 50);
      const c = rng.int(10, 50);
      const negIndex = rng.pick([-1, -2, -3]);
      const values = [a, b, c];
      return {
        tuple: `(${a}, ${b}, ${c})`,
        tupleVar: 'data',
        index: negIndex,
        result: String(values[values.length + negIndex]),
        length: 3,
        context: 'negative indexing',
      };
    },
  },
];

export const tupleAccessGenerator: Generator = {
  name: 'tuple-access',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    const scenario = rng.pick(SCENARIOS);
    const data = scenario.generate(rng);

    return {
      tuple: data.tuple,
      tupleVar: data.tupleVar,
      index: data.index,
      result: data.result,
      length: data.length,
      context: data.context,
      scenario: scenario.name,
    };
  },

  validate(params: GeneratorParams): boolean {
    return (
      typeof params.tuple === 'string' &&
      typeof params.tupleVar === 'string' &&
      typeof params.index === 'number' &&
      typeof params.result === 'string' &&
      typeof params.length === 'number'
    );
  },
};
