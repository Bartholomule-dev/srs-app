// tests/unit/generators/list-method.test.ts
import { describe, it, expect } from 'vitest';
import { listMethodGenerator } from '@/lib/generators/definitions/list-method';
import { createSeed } from '@/lib/generators/seed';
import fc from 'fast-check';

describe('list-method generator', () => {
  it('has correct name', () => {
    expect(listMethodGenerator.name).toBe('list-method');
  });

  it('generates required params', () => {
    const seed = createSeed('user1', 'test-exercise', new Date());
    const params = listMethodGenerator.generate(seed);

    expect(params).toHaveProperty('nums');
    expect(params).toHaveProperty('numsStr');
    expect(params).toHaveProperty('method');
    expect(params).toHaveProperty('result');
    expect(params).toHaveProperty('description');
    expect(params).toHaveProperty('code');
    expect(params).toHaveProperty('scenario');
  });

  it('generates deterministic output for same seed', () => {
    const seed = createSeed('user1', 'test-exercise', new Date('2026-01-08'));
    const params1 = listMethodGenerator.generate(seed);
    const params2 = listMethodGenerator.generate(seed);

    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = listMethodGenerator.generate(seed);

    expect(listMethodGenerator.validate(params)).toBe(true);
  });

  it('produces valid method names', () => {
    const validMethods = ['count', 'index', 'sum', 'max', 'min', 'len', 'sorted', 'reversed'];
    const seed = createSeed('user1', 'test', new Date());
    const params = listMethodGenerator.generate(seed);

    expect(validMethods).toContain(params.method);
  });

  it('numsStr matches nums array', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = listMethodGenerator.generate(seed);
    const nums = params.nums as number[];
    const expectedStr = `[${nums.join(', ')}]`;

    expect(params.numsStr).toBe(expectedStr);
  });

  it('code contains numsStr', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = listMethodGenerator.generate(seed);
    const code = params.code as string;
    const numsStr = params.numsStr as string;

    expect(code).toContain(numsStr);
  });

  it('code contains method call', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = listMethodGenerator.generate(seed);
    const code = params.code as string;
    const method = params.method as string;

    expect(code).toContain(method);
  });

  describe('property-based tests', () => {
    it('always produces valid params for any seed', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = listMethodGenerator.generate(seed);
          return listMethodGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });

    it('nums array has 4-6 elements', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = listMethodGenerator.generate(seed);
          const nums = params.nums as number[];
          return nums.length >= 4 && nums.length <= 6;
        }),
        { numRuns: 100 }
      );
    });

    it('nums values are in valid range (1-20)', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = listMethodGenerator.generate(seed);
          const nums = params.nums as number[];
          return nums.every((n) => n >= 1 && n <= 20);
        }),
        { numRuns: 100 }
      );
    });
  });
});
