import { vi } from 'vitest';
import type { PyodideInterface } from '@/lib/context/PyodideContext';

/**
 * Options for creating a mock Pyodide interface
 */
export interface MockPyodideOptions {
  /** Value to return from runPython/runPythonAsync */
  output?: string;
  /** Error to throw from runPython/runPythonAsync */
  error?: Error;
  /** Dynamic runPython implementation for multi-call tests */
  runPythonFn?: (code: string) => string | null;
}

/**
 * Create a mock Pyodide interface for testing.
 *
 * @param options.output - String to return from runPython calls (default: '')
 * @param options.error - Error to throw instead of returning output
 *
 * @example
 * // Simple output mock
 * const pyodide = createMockPyodide({ output: '42\n' });
 *
 * @example
 * // Error mock
 * const pyodide = createMockPyodide({ error: new Error('Runtime error') });
 */
export function createMockPyodide(options: MockPyodideOptions = {}): PyodideInterface {
  const { output = '', error, runPythonFn } = options;

  const execute = (code?: string) => {
    if (error) throw error;
    if (runPythonFn) return runPythonFn(code ?? '');
    return output;
  };

  return {
    runPython: vi.fn(execute),
    runPythonAsync: vi.fn(async (code?: string) => execute(code)),
    loadPackage: vi.fn(async () => {}),
    globals: new Map(),
  };
}
