// tests/unit/exercise/execution.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  executePythonCode,
  verifyPredictAnswer,
  verifyWriteAnswer,
  captureStdout,
} from '@/lib/exercise/execution';
import type { PyodideInterface } from '@/lib/context/PyodideContext';
import { createMockPyodide } from '@tests/fixtures/pyodide';

describe('captureStdout', () => {
  it('returns wrapper code that captures stdout', () => {
    const code = 'print("hello")';
    const wrapped = captureStdout(code);

    expect(wrapped).toContain('import io');
    expect(wrapped).toContain('sys.stdout');
    expect(wrapped).toContain('print("hello")');
  });
});

describe('executePythonCode', () => {
  it('returns success result with output', async () => {
    const mockPyodide = createMockPyodide({ output: 'hello\n' });

    const result = await executePythonCode(mockPyodide, 'print("hello")');

    expect(result.success).toBe(true);
    expect(result.output).toBe('hello\n');
    expect(result.error).toBeNull();
  });

  it('returns error result on execution failure', async () => {
    const mockPyodide = createMockPyodide({ error: new Error('SyntaxError') });

    const result = await executePythonCode(mockPyodide, 'invalid python');

    expect(result.success).toBe(false);
    expect(result.output).toBeNull();
    expect(result.error).toBe('SyntaxError');
  });

  it('handles timeout', async () => {
    // Create a pyodide that hangs
    const mockPyodide: PyodideInterface = {
      runPython: vi.fn(() => {
        // Simulate hang - but test should use timeout
        return new Promise(() => {}); // never resolves
      }),
      runPythonAsync: vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        return 'result';
      }),
      loadPackage: vi.fn(async () => {}),
      globals: new Map(),
    };

    const result = await executePythonCode(mockPyodide, 'while True: pass', {
      timeoutMs: 100,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('timeout');
  });
});

describe('verifyPredictAnswer', () => {
  it('returns true when output matches expected', async () => {
    const mockPyodide = createMockPyodide({ output: '42\n' });

    const isCorrect = await verifyPredictAnswer(
      mockPyodide,
      'print(6 * 7)',
      '42'
    );

    expect(isCorrect).toBe(true);
  });

  it('returns false when output differs', async () => {
    const mockPyodide = createMockPyodide({ output: '43\n' });

    const isCorrect = await verifyPredictAnswer(
      mockPyodide,
      'print(6 * 7)',
      '42'
    );

    expect(isCorrect).toBe(false);
  });

  it('normalizes whitespace in comparison', async () => {
    const mockPyodide = createMockPyodide({ output: 'hello\n\n' });

    const isCorrect = await verifyPredictAnswer(
      mockPyodide,
      'print("hello")',
      'hello'
    );

    expect(isCorrect).toBe(true);
  });

  it('throws error on execution failure for fallback', async () => {
    const mockPyodide = createMockPyodide({ error: new Error('Error') });

    await expect(
      verifyPredictAnswer(mockPyodide, 'invalid', 'expected')
    ).rejects.toThrow('Execution failed');
  });
});

describe('verifyWriteAnswer', () => {
  it('returns true when user code produces expected output', async () => {
    const mockPyodide = createMockPyodide({ output: '[2, 4, 6]\n' });

    const isCorrect = await verifyWriteAnswer(
      mockPyodide,
      '[x*2 for x in [1, 2, 3]]',
      '[2, 4, 6]',
      'result = {{answer}}\nprint(result)'
    );

    expect(isCorrect).toBe(true);
  });

  it('substitutes {{answer}} in verification template', async () => {
    const mockPyodide = createMockPyodide({ output: '6\n' });

    await verifyWriteAnswer(
      mockPyodide,
      '1 + 2 + 3',
      '6',
      'print({{answer}})'
    );

    expect(mockPyodide.runPython).toHaveBeenCalledWith(
      expect.stringContaining('print(1 + 2 + 3)')
    );
  });

  it('uses default template when none provided', async () => {
    const mockPyodide = createMockPyodide({ output: 'result\n' });

    await verifyWriteAnswer(mockPyodide, '"result"', 'result');

    expect(mockPyodide.runPython).toHaveBeenCalled();
  });
});
