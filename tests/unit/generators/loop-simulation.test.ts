import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { loopSimulationGenerator } from '@/lib/generators/definitions/loop-simulation';

describe('loop-simulation generator', () => {
  it('has correct name', () => {
    expect(loopSimulationGenerator.name).toBe('loop-simulation');
  });

  it('generates valid parameters from seed', () => {
    const params = loopSimulationGenerator.generate('test-seed-123');

    expect(params).toHaveProperty('start');
    expect(params).toHaveProperty('stop');
    expect(params).toHaveProperty('step');
    expect(params).toHaveProperty('output');
    expect(typeof params.start).toBe('number');
    expect(typeof params.stop).toBe('number');
    expect(typeof params.step).toBe('number');
    expect(typeof params.output).toBe('string');
  });

  it('computes output correctly', () => {
    const params = loopSimulationGenerator.generate('fixed-seed');
    const { start, stop, step, output } = params;

    const expected: number[] = [];
    for (let i = start as number; i < (stop as number); i += step as number) {
      expected.push(i);
    }
    expect(output).toBe(expected.join(' '));
  });

  it('produces deterministic output for same seed', () => {
    const params1 = loopSimulationGenerator.generate('seed-abc');
    const params2 = loopSimulationGenerator.generate('seed-abc');
    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    expect(loopSimulationGenerator.validate({
      start: 0, stop: 6, step: 2, output: '0 2 4'
    })).toBe(true);
  });

  it('rejects zero step', () => {
    expect(loopSimulationGenerator.validate({
      start: 0, stop: 5, step: 0, output: ''
    })).toBe(false);
  });

  it('rejects inconsistent output', () => {
    expect(loopSimulationGenerator.validate({
      start: 0, stop: 6, step: 2, output: '0 1 2'
    })).toBe(false);
  });

  describe('property-based tests', () => {
    it('always produces valid output across 1000 seeds', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 5, maxLength: 50 }), (seed) => {
          const params = loopSimulationGenerator.generate(seed);
          return loopSimulationGenerator.validate(params);
        }),
        { numRuns: 1000 }
      );
    });
  });
});
