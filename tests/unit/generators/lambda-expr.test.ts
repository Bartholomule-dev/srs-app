// tests/unit/generators/lambda-expr.test.ts
import { describe, it, expect } from 'vitest';
import { lambdaExprGenerator } from '@/lib/generators/definitions/lambda-expr';
import { createSeed } from '@/lib/generators/seed';
import fc from 'fast-check';

describe('lambda-expr generator', () => {
  it('has correct name', () => {
    expect(lambdaExprGenerator.name).toBe('lambda-expr');
  });

  it('generates required params', () => {
    const seed = createSeed('user1', 'test-exercise', new Date());
    const params = lambdaExprGenerator.generate(seed);

    expect(params).toHaveProperty('lambdaExpr');
    expect(params).toHaveProperty('params');
    expect(params).toHaveProperty('body');
    expect(params).toHaveProperty('arg1');
    expect(params).toHaveProperty('argList');
    expect(params).toHaveProperty('result');
    expect(params).toHaveProperty('description');
    expect(params).toHaveProperty('opName');
  });

  it('generates deterministic output for same seed', () => {
    const seed = createSeed('user1', 'test-exercise', new Date('2026-01-08'));
    const params1 = lambdaExprGenerator.generate(seed);
    const params2 = lambdaExprGenerator.generate(seed);

    expect(params1).toEqual(params2);
  });

  it('generates different output for different seeds', () => {
    const seed1 = createSeed('user1', 'test', new Date('2026-01-08'));
    const seed2 = createSeed('user2', 'test', new Date('2026-01-08'));

    const params1 = lambdaExprGenerator.generate(seed1);
    const params2 = lambdaExprGenerator.generate(seed2);

    expect(
      params1.opName !== params2.opName || params1.argList !== params2.argList
    ).toBe(true);
  });

  it('validates correct params', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = lambdaExprGenerator.generate(seed);

    expect(lambdaExprGenerator.validate(params)).toBe(true);
  });

  it('produces valid lambda expression format', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = lambdaExprGenerator.generate(seed);

    expect(params.lambdaExpr).toMatch(/^lambda \w+(, \w+)?: .+$/);
  });

  it('produces valid operation names', () => {
    const validOps = [
      'double',
      'square',
      'add',
      'multiply',
      'subtract',
      'increment',
      'negate',
      'is_even',
      'is_positive',
      'max_of_two',
    ];

    const seed = createSeed('user1', 'test', new Date());
    const params = lambdaExprGenerator.generate(seed);

    expect(validOps).toContain(params.opName);
  });

  it('rejects invalid opName', () => {
    const params = {
      params: 'x',
      body: 'x * 2',
      argList: '5',
      result: '10',
      opName: 'invalid_op',
    };
    expect(lambdaExprGenerator.validate(params)).toBe(false);
  });

  it('rejects wrong result', () => {
    const params = {
      params: 'x',
      body: 'x * 2',
      argList: '5',
      result: '15', // Wrong - should be 10
      opName: 'double',
    };
    expect(lambdaExprGenerator.validate(params)).toBe(false);
  });

  describe('property-based tests', () => {
    it('always produces valid params for any seed', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = lambdaExprGenerator.generate(seed);
          return lambdaExprGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });

    it('lambdaExpr always matches params and body', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = lambdaExprGenerator.generate(seed);
          const expected = `lambda ${params.params}: ${params.body}`;
          return params.lambdaExpr === expected;
        }),
        { numRuns: 100 }
      );
    });
  });
});
