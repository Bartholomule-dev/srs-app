// tests/unit/generators/operator-chain.test.ts
import { describe, it, expect } from 'vitest';
import { operatorChainGenerator } from '@/lib/generators/definitions/operator-chain';
import { createSeed } from '@/lib/generators/seed';
import fc from 'fast-check';

describe('operator-chain generator', () => {
  it('has correct name', () => {
    expect(operatorChainGenerator.name).toBe('operator-chain');
  });

  it('generates required params', () => {
    const seed = createSeed('user1', 'test-exercise', new Date());
    const params = operatorChainGenerator.generate(seed);

    expect(params).toHaveProperty('expression');
    expect(params).toHaveProperty('result');
    expect(params).toHaveProperty('resultStr');
    expect(params).toHaveProperty('description');
    expect(params).toHaveProperty('scenario');
    expect(params).toHaveProperty('code');
  });

  it('generates deterministic output for same seed', () => {
    const seed = createSeed('user1', 'test-exercise', new Date('2026-01-08'));
    const params1 = operatorChainGenerator.generate(seed);
    const params2 = operatorChainGenerator.generate(seed);

    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = operatorChainGenerator.generate(seed);

    expect(operatorChainGenerator.validate(params)).toBe(true);
  });

  it('produces valid scenario names', () => {
    const validScenarios = [
      'add_multiply',
      'parens_first',
      'divide_subtract',
      'power_first',
      'floor_division',
      'modulo_chain',
      'nested_parens',
      'left_to_right',
    ];
    const seed = createSeed('user1', 'test', new Date());
    const params = operatorChainGenerator.generate(seed);

    expect(validScenarios).toContain(params.scenario);
  });

  it('result matches resultStr', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = operatorChainGenerator.generate(seed);

    expect(params.resultStr).toBe(String(params.result));
  });

  it('code contains expression and print', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = operatorChainGenerator.generate(seed);
    const code = params.code as string;
    const expression = params.expression as string;

    expect(code).toContain(expression);
    expect(code).toContain('print(result)');
  });

  it('expression contains operators', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = operatorChainGenerator.generate(seed);
    const expression = params.expression as string;
    const operators = ['+', '-', '*', '/', '%', '**', '//'];

    const hasOperator = operators.some((op) => expression.includes(op));
    expect(hasOperator).toBe(true);
  });

  describe('property-based tests', () => {
    it('always produces valid params for any seed', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = operatorChainGenerator.generate(seed);
          return operatorChainGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });

    it('result is always a number', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = operatorChainGenerator.generate(seed);
          return typeof params.result === 'number' && !isNaN(params.result as number);
        }),
        { numRuns: 100 }
      );
    });

    it('resultStr is always the string of result', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = operatorChainGenerator.generate(seed);
          return params.resultStr === String(params.result);
        }),
        { numRuns: 100 }
      );
    });
  });
});
