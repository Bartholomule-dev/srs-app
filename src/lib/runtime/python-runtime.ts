// src/lib/runtime/python-runtime.ts
import type { LanguageRuntime, ExecutionResult, TokenCompareResult, AstCompareResult, AstCompareOptions } from './types';
import type { PyodideInterface } from '@/lib/context/PyodideContext';
import { getPyodideWorkerManager, type PyodideWorkerManager } from '@/lib/pyodide';
import { compareByTokens as pyCompareByTokens, tokenizeCode as pyTokenizeCode } from '@/lib/exercise/token-compare';
import { compareByAst as pyCompareByAst } from '@/lib/exercise/ast-compare';

/**
 * Python runtime implementation using Pyodide.
 * Wraps existing Pyodide infrastructure in the LanguageRuntime interface.
 */
export class PythonRuntime implements LanguageRuntime {
  readonly language = 'python' as const;

  private workerManager: PyodideWorkerManager | null = null;
  private pyodide: PyodideInterface | null = null;
  private ready = false;

  /**
   * Set the Pyodide instance (for main-thread operations like AST/token comparison).
   * This is typically called by PyodideContext.
   */
  setPyodide(pyodide: PyodideInterface): void {
    this.pyodide = pyodide;
  }

  async initialize(): Promise<void> {
    if (this.ready) return;

    this.workerManager = getPyodideWorkerManager();
    await this.workerManager.initialize();
    this.ready = true;
  }

  isReady(): boolean {
    return this.ready && this.workerManager?.isReady() === true;
  }

  async execute(code: string, timeoutMs = 5000): Promise<ExecutionResult> {
    if (!this.workerManager || !this.isReady()) {
      return { success: false, output: null, error: 'Runtime not initialized' };
    }

    const result = await this.workerManager.execute(code, timeoutMs);
    return {
      success: result.success,
      output: result.output,
      error: result.error,
    };
  }

  async tokenize(code: string): Promise<[number, string][] | null> {
    if (!this.pyodide) return null;
    return pyTokenizeCode(this.pyodide, code);
  }

  async compareByTokens(
    userAnswer: string,
    expectedAnswer: string,
    acceptedSolutions: string[] = []
  ): Promise<TokenCompareResult> {
    if (!this.pyodide) {
      return { match: false, matchedAlternative: null };
    }
    return pyCompareByTokens(this.pyodide, userAnswer, expectedAnswer, acceptedSolutions);
  }

  async compareByAst(
    userAnswer: string,
    expectedAnswer: string,
    acceptedSolutions: string[] = [],
    options: AstCompareOptions = {}
  ): Promise<AstCompareResult> {
    if (!this.pyodide) {
      return { match: false, matchedAlternative: null, infraAvailable: false, error: 'Pyodide not loaded' };
    }
    return pyCompareByAst(this.pyodide, userAnswer, expectedAnswer, acceptedSolutions, options);
  }

  terminate(): void {
    this.workerManager?.terminate();
    this.workerManager = null;
    this.pyodide = null;
    this.ready = false;
  }
}

// Singleton instance
let pythonRuntimeInstance: PythonRuntime | null = null;

/**
 * Get or create the singleton PythonRuntime instance.
 */
export function getPythonRuntime(): PythonRuntime {
  if (!pythonRuntimeInstance) {
    pythonRuntimeInstance = new PythonRuntime();
  }
  return pythonRuntimeInstance;
}

/**
 * Reset the singleton instance. Useful for testing.
 */
export function resetPythonRuntimeInstance(): void {
  if (pythonRuntimeInstance) {
    pythonRuntimeInstance.terminate();
    pythonRuntimeInstance = null;
  }
}
