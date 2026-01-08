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
  const { output = '', error } = options;

  const execute = () => {
    if (error) throw error;
    return output;
  };

  return {
    runPython: vi.fn(execute),
    runPythonAsync: vi.fn(async () => execute()),
    loadPackage: vi.fn(async () => {}),
    globals: new Map(),
  };
}
