import { describe, it, expect } from 'vitest';
import { compFilterGenerator } from '@/lib/generators/definitions/comp-filter';

describe('compFilterGenerator', () => {
  it('generates correct params', () => {
    const params = compFilterGenerator.generate('test-seed');

    expect(params.n).toBeGreaterThanOrEqual(5);
    expect(params.n).toBeLessThanOrEqual(8);
    expect(params.mod).toBeGreaterThanOrEqual(2);
    expect(params.mod).toBeLessThanOrEqual(3);
    expect(typeof params.result).toBe('string');
    expect(params.result).toMatch(/^\[[\d, ]*\]$/);
  });

  it('validates correct params', () => {
    const params = compFilterGenerator.generate('test-seed');
    expect(compFilterGenerator.validate(params)).toBe(true);
  });

  it('rejects invalid n', () => {
    expect(compFilterGenerator.validate({ n: 4, mod: 2, result: '[0, 2]' })).toBe(false);
    expect(compFilterGenerator.validate({ n: 9, mod: 2, result: '[0, 2, 4, 6, 8]' })).toBe(false);
  });

  it('rejects invalid mod', () => {
    expect(compFilterGenerator.validate({ n: 6, mod: 1, result: '[0, 1, 2, 3, 4, 5]' })).toBe(false);
    expect(compFilterGenerator.validate({ n: 6, mod: 4, result: '[0, 4]' })).toBe(false);
  });

  it('rejects inconsistent result', () => {
    expect(compFilterGenerator.validate({ n: 6, mod: 2, result: '[0, 2]' })).toBe(false);
  });

  it('produces deterministic output for same seed', () => {
    const params1 = compFilterGenerator.generate('test-seed');
    const params2 = compFilterGenerator.generate('test-seed');
    expect(params1).toEqual(params2);
  });
});
