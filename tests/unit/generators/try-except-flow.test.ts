import { describe, it, expect } from 'vitest';
import { tryExceptFlowGenerator } from '@/lib/generators/definitions/try-except-flow';

describe('tryExceptFlowGenerator', () => {
  it('generates correct params', () => {
    const params = tryExceptFlowGenerator.generate('test-seed');

    expect(typeof params.value).toBe('string');
    expect(typeof params.output).toBe('string');
    expect(['success', 'error']).toContain(params.output);
  });

  it('validates correct params', () => {
    const params = tryExceptFlowGenerator.generate('test-seed');
    expect(tryExceptFlowGenerator.validate(params)).toBe(true);
  });

  it('validates success scenarios', () => {
    expect(tryExceptFlowGenerator.validate({ value: '"123"', output: 'success' })).toBe(true);
    expect(tryExceptFlowGenerator.validate({ value: '"456"', output: 'success' })).toBe(true);
  });

  it('validates error scenarios', () => {
    expect(tryExceptFlowGenerator.validate({ value: '"abc"', output: 'error' })).toBe(true);
    expect(tryExceptFlowGenerator.validate({ value: '""', output: 'error' })).toBe(true);
  });

  it('rejects invalid value', () => {
    expect(tryExceptFlowGenerator.validate({ value: '"unknown"', output: 'error' })).toBe(false);
  });

  it('rejects mismatched output', () => {
    expect(tryExceptFlowGenerator.validate({ value: '"123"', output: 'error' })).toBe(false);
    expect(tryExceptFlowGenerator.validate({ value: '"abc"', output: 'success' })).toBe(false);
  });

  it('produces deterministic output for same seed', () => {
    const params1 = tryExceptFlowGenerator.generate('test-seed');
    const params2 = tryExceptFlowGenerator.generate('test-seed');
    expect(params1).toEqual(params2);
  });
});
