// tests/unit/generators/finally-flow.test.ts
import { describe, it, expect } from 'vitest';
import { finallyFlowGenerator } from '@/lib/generators/definitions/finally-flow';
import { createSeed } from '@/lib/generators/seed';
import fc from 'fast-check';

describe('finally-flow generator', () => {
  it('has correct name', () => {
    expect(finallyFlowGenerator.name).toBe('finally-flow');
  });

  it('generates required params', () => {
    const seed = createSeed('user1', 'test-exercise', new Date());
    const params = finallyFlowGenerator.generate(seed);

    expect(params).toHaveProperty('tryBlock');
    expect(params).toHaveProperty('exceptBlock');
    expect(params).toHaveProperty('finallyBlock');
    expect(params).toHaveProperty('output');
    expect(params).toHaveProperty('outputStr');
    expect(params).toHaveProperty('outputCount');
    expect(params).toHaveProperty('description');
    expect(params).toHaveProperty('scenario');
    expect(params).toHaveProperty('raisesException');
    expect(params).toHaveProperty('code');
  });

  it('generates deterministic output for same seed', () => {
    const seed = createSeed('user1', 'test-exercise', new Date('2026-01-08'));
    const params1 = finallyFlowGenerator.generate(seed);
    const params2 = finallyFlowGenerator.generate(seed);

    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = finallyFlowGenerator.generate(seed);

    expect(finallyFlowGenerator.validate(params)).toBe(true);
  });

  it('produces valid scenario names', () => {
    const validScenarios = [
      'no_exception',
      'with_exception',
      'return_in_try',
      'multiple_prints',
      'exception_in_middle',
    ];
    const seed = createSeed('user1', 'test', new Date());
    const params = finallyFlowGenerator.generate(seed);

    expect(validScenarios).toContain(params.scenario);
  });

  it('code contains try/except/finally blocks', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = finallyFlowGenerator.generate(seed);
    const code = params.code as string;

    expect(code).toContain('try:');
    expect(code).toContain('except:');
    expect(code).toContain('finally:');
  });

  it('output array is non-empty', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = finallyFlowGenerator.generate(seed);
    const output = params.output as string[];

    expect(output.length).toBeGreaterThan(0);
  });

  it('outputStr matches joined output array', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = finallyFlowGenerator.generate(seed);

    expect(params.outputStr).toBe((params.output as string[]).join('\n'));
  });

  it('raisesException is a boolean', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = finallyFlowGenerator.generate(seed);

    expect(typeof params.raisesException).toBe('boolean');
  });

  describe('property-based tests', () => {
    it('always produces valid params for any seed', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = finallyFlowGenerator.generate(seed);
          return finallyFlowGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });

    it('output always contains "finally" related content', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = finallyFlowGenerator.generate(seed);
          const output = params.output as string[];
          // Finally block should always execute, so output should have multiple lines
          return output.length >= 2;
        }),
        { numRuns: 100 }
      );
    });
  });
});
