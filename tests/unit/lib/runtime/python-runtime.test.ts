// tests/unit/lib/runtime/python-runtime.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PythonRuntime, getPythonRuntime, resetPythonRuntimeInstance } from '@/lib/runtime/python-runtime';
import type { PyodideInterface } from '@/lib/context/PyodideContext';

// Mock the worker manager module
vi.mock('@/lib/pyodide', () => ({
  getPyodideWorkerManager: vi.fn(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    isReady: vi.fn().mockReturnValue(true),
    execute: vi.fn().mockResolvedValue({ success: true, output: 'test output', error: null }),
    terminate: vi.fn(),
  })),
}));

// Mock the token-compare module
vi.mock('@/lib/exercise/token-compare', () => ({
  tokenizeCode: vi.fn().mockResolvedValue([[1, 'x'], [54, '='], [2, '1']]),
  compareByTokens: vi.fn().mockResolvedValue({ match: true, matchedAlternative: null }),
}));

// Mock the ast-compare module
vi.mock('@/lib/exercise/ast-compare', () => ({
  compareByAst: vi.fn().mockResolvedValue({ match: true, matchedAlternative: null, infraAvailable: true }),
}));

describe('PythonRuntime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPythonRuntimeInstance();
  });

  afterEach(() => {
    resetPythonRuntimeInstance();
  });

  describe('basic properties', () => {
    it('should have language set to python', () => {
      const runtime = new PythonRuntime();
      expect(runtime.language).toBe('python');
    });

    it('should not be ready before initialization', () => {
      const runtime = new PythonRuntime();
      expect(runtime.isReady()).toBe(false);
    });
  });

  describe('initialization', () => {
    it('should initialize the worker manager', async () => {
      const { getPyodideWorkerManager } = await import('@/lib/pyodide');
      const runtime = new PythonRuntime();

      await runtime.initialize();

      expect(getPyodideWorkerManager).toHaveBeenCalled();
      expect(runtime.isReady()).toBe(true);
    });

    it('should be idempotent - calling initialize twice should not reinitialize', async () => {
      const { getPyodideWorkerManager } = await import('@/lib/pyodide');
      const runtime = new PythonRuntime();

      await runtime.initialize();
      await runtime.initialize();

      // getPyodideWorkerManager is called once per initialize, but the actual
      // init only happens once due to ready flag
      expect(runtime.isReady()).toBe(true);
    });
  });

  describe('execute', () => {
    it('should return error if runtime not initialized', async () => {
      const runtime = new PythonRuntime();

      const result = await runtime.execute('print("hello")');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Runtime not initialized');
    });

    it('should delegate execution to worker manager', async () => {
      const runtime = new PythonRuntime();
      await runtime.initialize();

      const result = await runtime.execute('print("hello")');

      expect(result.success).toBe(true);
      expect(result.output).toBe('test output');
    });
  });

  describe('tokenize', () => {
    it('should return null if pyodide not set', async () => {
      const runtime = new PythonRuntime();

      const result = await runtime.tokenize('x = 1');

      expect(result).toBeNull();
    });

    it('should delegate to tokenizeCode when pyodide is set', async () => {
      const { tokenizeCode } = await import('@/lib/exercise/token-compare');
      const runtime = new PythonRuntime();
      const mockPyodide = { runPython: vi.fn() } as unknown as PyodideInterface;

      runtime.setPyodide(mockPyodide);
      const result = await runtime.tokenize('x = 1');

      expect(tokenizeCode).toHaveBeenCalledWith(mockPyodide, 'x = 1');
      expect(result).toEqual([[1, 'x'], [54, '='], [2, '1']]);
    });
  });

  describe('compareByTokens', () => {
    it('should return no match if pyodide not set', async () => {
      const runtime = new PythonRuntime();

      const result = await runtime.compareByTokens('x = 1', 'x = 1');

      expect(result.match).toBe(false);
    });

    it('should delegate to compareByTokens when pyodide is set', async () => {
      const { compareByTokens } = await import('@/lib/exercise/token-compare');
      const runtime = new PythonRuntime();
      const mockPyodide = { runPython: vi.fn() } as unknown as PyodideInterface;

      runtime.setPyodide(mockPyodide);
      const result = await runtime.compareByTokens('x = 1', 'x = 1', ['x=1']);

      expect(compareByTokens).toHaveBeenCalledWith(mockPyodide, 'x = 1', 'x = 1', ['x=1']);
      expect(result.match).toBe(true);
    });
  });

  describe('compareByAst', () => {
    it('should return infraAvailable false if pyodide not set', async () => {
      const runtime = new PythonRuntime();

      const result = await runtime.compareByAst('x = 1', 'x = 1');

      expect(result.match).toBe(false);
      expect(result.infraAvailable).toBe(false);
      expect(result.error).toBe('Pyodide not loaded');
    });

    it('should delegate to compareByAst when pyodide is set', async () => {
      const { compareByAst } = await import('@/lib/exercise/ast-compare');
      const runtime = new PythonRuntime();
      const mockPyodide = { runPython: vi.fn() } as unknown as PyodideInterface;

      runtime.setPyodide(mockPyodide);
      const result = await runtime.compareByAst('x = 1', 'x = 1', ['x=1'], { renameLocals: false });

      expect(compareByAst).toHaveBeenCalledWith(mockPyodide, 'x = 1', 'x = 1', ['x=1'], { renameLocals: false });
      expect(result.match).toBe(true);
      expect(result.infraAvailable).toBe(true);
    });
  });

  describe('terminate', () => {
    it('should clean up resources', async () => {
      const { getPyodideWorkerManager } = await import('@/lib/pyodide');
      const runtime = new PythonRuntime();
      await runtime.initialize();

      expect(runtime.isReady()).toBe(true);

      runtime.terminate();

      expect(runtime.isReady()).toBe(false);
    });

    it('should be safe to call terminate without initialization', () => {
      const runtime = new PythonRuntime();

      // Should not throw
      expect(() => runtime.terminate()).not.toThrow();
    });
  });

  describe('singleton', () => {
    it('should return the same instance from getPythonRuntime', () => {
      const runtime1 = getPythonRuntime();
      const runtime2 = getPythonRuntime();

      expect(runtime1).toBe(runtime2);
    });

    it('should return a new instance after reset', () => {
      const runtime1 = getPythonRuntime();
      resetPythonRuntimeInstance();
      const runtime2 = getPythonRuntime();

      expect(runtime1).not.toBe(runtime2);
    });
  });
});
