import { describe, it, expect } from 'vitest';
import { compMappingGenerator } from '@/lib/generators/definitions/comp-mapping';

describe('compMappingGenerator', () => {
  it('generates correct params', () => {
    const params = compMappingGenerator.generate('test-seed');

    expect(params.n).toBeGreaterThanOrEqual(3);
    expect(params.n).toBeLessThanOrEqual(6);
    expect(params.m).toBeGreaterThanOrEqual(2);
    expect(params.m).toBeLessThanOrEqual(4);
    expect(typeof params.result).toBe('string');
    expect(params.result).toMatch(/^\[[\d, ]+\]$/);
  });

  it('validates correct params', () => {
    const params = compMappingGenerator.generate('test-seed');
    expect(compMappingGenerator.validate(params)).toBe(true);
  });

  it('rejects invalid n', () => {
    expect(compMappingGenerator.validate({ n: 2, m: 2, result: '[0, 2]' })).toBe(false);
    expect(compMappingGenerator.validate({ n: 7, m: 2, result: '[0, 2, 4, 6, 8, 10, 12]' })).toBe(false);
  });

  it('rejects invalid m', () => {
    expect(compMappingGenerator.validate({ n: 3, m: 1, result: '[0, 1, 2]' })).toBe(false);
    expect(compMappingGenerator.validate({ n: 3, m: 5, result: '[0, 5, 10]' })).toBe(false);
  });

  it('rejects inconsistent result', () => {
    expect(compMappingGenerator.validate({ n: 4, m: 2, result: '[0, 2, 4, 6, 8]' })).toBe(false);
  });

  it('produces deterministic output for same seed', () => {
    const params1 = compMappingGenerator.generate('test-seed');
    const params2 = compMappingGenerator.generate('test-seed');
    expect(params1).toEqual(params2);
  });

  it('produces different output for different seeds', () => {
    const params1 = compMappingGenerator.generate('seed-1');
    const params2 = compMappingGenerator.generate('seed-2');
    // At least one param should differ (high probability)
    const same = params1.n === params2.n && params1.m === params2.m;
    expect(same).toBe(false);
  });
});
