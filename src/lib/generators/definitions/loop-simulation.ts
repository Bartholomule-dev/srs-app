import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * loop-simulation generator
 *
 * Generates range() parameters and computes actual loop output.
 * Constraints:
 * - start: [0, 5]
 * - step: [1, 3]
 * - stop: ensures 2-5 iterations
 * - output: space-separated values
 */
export const loopSimulationGenerator: Generator = {
  name: 'loop-simulation',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const start = rng.int(0, 5);
    const step = rng.int(1, 3);
    const minStop = start + step * 2;
    const maxStop = start + step * 5;
    const stop = rng.int(minStop, maxStop);

    const values: number[] = [];
    for (let i = start; i < stop; i += step) {
      values.push(i);
    }
    // Output as newline-separated to match print(i) behavior
    const output = values.join('\n');

    return { start, stop, step, output };
  },

  validate(params: GeneratorParams): boolean {
    const { start, stop, step, output } = params;

    if (typeof start !== 'number' || typeof stop !== 'number' ||
        typeof step !== 'number' || typeof output !== 'string') {
      return false;
    }

    if (step <= 0) return false;

    const values: number[] = [];
    for (let i = start; i < stop; i += step) {
      values.push(i);
    }
    return output === values.join('\n');
  },
};
