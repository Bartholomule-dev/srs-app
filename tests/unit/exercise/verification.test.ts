// tests/unit/exercise/verification.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyWithScript } from '@/lib/exercise/verification';

// Mock the worker execution
vi.mock('@/lib/exercise/execution', () => ({
  executePythonCodeIsolated: vi.fn(),
}));

import { executePythonCodeIsolated } from '@/lib/exercise/execution';
const mockExecute = vi.mocked(executePythonCodeIsolated);

describe('verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyWithScript', () => {
    it('returns passed: true when all assertions pass', async () => {
      mockExecute.mockResolvedValue({ success: true, output: '', error: null });

      const result = await verifyWithScript(
        'def add(a, b): return a + b',
        'assert add(1, 2) == 3'
      );

      expect(result.passed).toBe(true);
      expect(result.infraAvailable).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns passed: false with error on assertion failure', async () => {
      mockExecute.mockResolvedValue({
        success: false,
        output: null,
        error: 'AssertionError: add(1, 2) should equal 3',
      });

      const result = await verifyWithScript(
        'def add(a, b): return a - b',
        'assert add(1, 2) == 3, "add(1, 2) should equal 3"'
      );

      expect(result.passed).toBe(false);
      expect(result.infraAvailable).toBe(true);
      expect(result.error).toContain('AssertionError');
    });

    it('combines user code with verification script', async () => {
      mockExecute.mockResolvedValue({ success: true, output: '', error: null });

      await verifyWithScript(
        'def multiply(a, b): return a * b',
        'assert multiply(2, 3) == 6'
      );

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('def multiply(a, b): return a * b')
      );
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('assert multiply(2, 3) == 6')
      );
    });

    it('handles syntax errors in user code', async () => {
      mockExecute.mockResolvedValue({
        success: false,
        output: null,
        error: 'SyntaxError: invalid syntax',
      });

      const result = await verifyWithScript(
        'def add(a, b) return a + b',
        'assert add(1, 2) == 3'
      );

      expect(result.passed).toBe(false);
      expect(result.infraAvailable).toBe(true);
      expect(result.error).toContain('SyntaxError');
    });

    it('handles runtime errors in user code', async () => {
      mockExecute.mockResolvedValue({
        success: false,
        output: null,
        error: 'NameError: name "undefined_var" is not defined',
      });

      const result = await verifyWithScript(
        'def broken(): return undefined_var',
        'broken()'
      );

      expect(result.passed).toBe(false);
      expect(result.infraAvailable).toBe(true);
      expect(result.error).toContain('NameError');
    });

    it('handles multiple assertions', async () => {
      mockExecute.mockResolvedValue({ success: true, output: '', error: null });

      const script = `
assert add(1, 2) == 3
assert add(-1, 1) == 0
assert add(0, 0) == 0
`;
      const result = await verifyWithScript('def add(a, b): return a + b', script);

      expect(result.passed).toBe(true);
      expect(result.infraAvailable).toBe(true);
    });
  });

  describe('infrastructure failure detection', () => {
    it('returns infraAvailable: false on worker crash', async () => {
      mockExecute.mockResolvedValue({
        success: false,
        output: null,
        error: 'Worker execution error',
      });

      const result = await verifyWithScript('def add(a, b): return a + b', 'assert add(1, 2) == 3');

      expect(result.passed).toBe(false);
      expect(result.infraAvailable).toBe(false);
    });

    it('returns infraAvailable: false on Pyodide not loaded', async () => {
      mockExecute.mockResolvedValue({
        success: false,
        output: null,
        error: 'Pyodide not loaded',
      });

      const result = await verifyWithScript('code', 'assert True');

      expect(result.passed).toBe(false);
      expect(result.infraAvailable).toBe(false);
    });

    it('returns infraAvailable: true on assertion failure (user error)', async () => {
      mockExecute.mockResolvedValue({
        success: false,
        output: null,
        error: 'AssertionError: Expected 3, got 2',
      });

      const result = await verifyWithScript('def add(a, b): return a - b', 'assert add(1, 2) == 3');

      expect(result.passed).toBe(false);
      expect(result.infraAvailable).toBe(true);
    });

    it('returns infraAvailable: true on syntax error (user error)', async () => {
      mockExecute.mockResolvedValue({
        success: false,
        output: null,
        error: 'SyntaxError: invalid syntax',
      });

      const result = await verifyWithScript('def add(a, b) return a + b', 'assert True');

      expect(result.passed).toBe(false);
      expect(result.infraAvailable).toBe(true);
    });

    it('returns infraAvailable: false when worker throws exception', async () => {
      mockExecute.mockRejectedValue(new Error('Worker crashed'));

      const result = await verifyWithScript('code', 'assert True');

      expect(result.passed).toBe(false);
      expect(result.infraAvailable).toBe(false);
      expect(result.error).toContain('Worker crashed');
    });

    it('returns infraAvailable: false on network error', async () => {
      mockExecute.mockResolvedValue({
        success: false,
        output: null,
        error: 'NetworkError when attempting to fetch resource',
      });

      const result = await verifyWithScript('code', 'assert True');

      expect(result.passed).toBe(false);
      expect(result.infraAvailable).toBe(false);
    });

    it('returns infraAvailable: false on failed to fetch', async () => {
      mockExecute.mockResolvedValue({
        success: false,
        output: null,
        error: 'Failed to fetch Pyodide',
      });

      const result = await verifyWithScript('code', 'assert True');

      expect(result.passed).toBe(false);
      expect(result.infraAvailable).toBe(false);
    });

    it('returns infraAvailable: false on module not found', async () => {
      mockExecute.mockResolvedValue({
        success: false,
        output: null,
        error: 'Module not found: pyodide',
      });

      const result = await verifyWithScript('code', 'assert True');

      expect(result.passed).toBe(false);
      expect(result.infraAvailable).toBe(false);
    });

    it('returns infraAvailable: false on worker not ready', async () => {
      mockExecute.mockResolvedValue({
        success: false,
        output: null,
        error: 'Worker not ready',
      });

      const result = await verifyWithScript('code', 'assert True');

      expect(result.passed).toBe(false);
      expect(result.infraAvailable).toBe(false);
    });
  });
});
