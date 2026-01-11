// src/lib/runtime/javascript-runtime.ts
// JavaScript runtime implementation using Web Worker for execution
// and Acorn for AST/token comparison.
//
// This is the JavaScript counterpart to PythonRuntime. Key differences:
// - No external WASM/Pyodide dependency (uses native JS)
// - AST/token comparison is synchronous (Acorn is pure JS)
// - Lighter weight initialization

import type {
  LanguageRuntime,
  ExecutionResult,
  TokenCompareResult,
  AstCompareResult,
  AstCompareOptions,
} from './types';
import {
  getJavaScriptWorkerManager,
  type JavaScriptWorkerManager,
  resetJavaScriptWorkerManagerInstance,
} from './javascript-worker';
import {
  tokenizeJavaScript,
  compareByTokens as jsCompareByTokens,
  compareByAst as jsCompareByAst,
} from './javascript-ast';

/**
 * JavaScript runtime implementation.
 * Wraps JavaScript worker manager and Acorn-based comparison in the LanguageRuntime interface.
 */
export class JavaScriptRuntime implements LanguageRuntime {
  readonly language = 'javascript' as const;

  private workerManager: JavaScriptWorkerManager | null = null;
  private ready = false;

  /**
   * Initialize the runtime.
   * Sets up the Web Worker for code execution.
   */
  async initialize(): Promise<void> {
    if (this.ready) return;

    this.workerManager = getJavaScriptWorkerManager();
    await this.workerManager.initialize();
    this.ready = true;
  }

  /**
   * Check if runtime is ready for execution.
   */
  isReady(): boolean {
    return this.ready && this.workerManager?.isReady() === true;
  }

  /**
   * Execute JavaScript code in an isolated Web Worker.
   * @param code - JavaScript code to execute
   * @param timeoutMs - Maximum execution time (default: 5s)
   */
  async execute(code: string, timeoutMs = 5000): Promise<ExecutionResult> {
    if (!this.workerManager || !this.isReady()) {
      return { success: false, output: null, error: 'Runtime not initialized' };
    }

    return this.workerManager.execute(code, timeoutMs);
  }

  /**
   * Tokenize JavaScript code using Acorn.
   * Returns array of [tokenLabel, tokenValue] pairs, or null on parse error.
   */
  async tokenize(code: string): Promise<[string, string][] | null> {
    // Acorn tokenization is synchronous, wrap in Promise for interface compliance
    // Note: JavaScript uses string token labels, Python uses numeric token types
    return Promise.resolve(tokenizeJavaScript(code));
  }

  /**
   * Compare two pieces of JavaScript code by tokens.
   * Ignores whitespace differences but catches structural differences.
   */
  async compareByTokens(
    userAnswer: string,
    expectedAnswer: string,
    acceptedSolutions: string[] = []
  ): Promise<TokenCompareResult> {
    return Promise.resolve(jsCompareByTokens(userAnswer, expectedAnswer, acceptedSolutions));
  }

  /**
   * Compare two pieces of JavaScript code by AST.
   * Ignores whitespace, formatting, and position differences.
   */
  async compareByAst(
    userAnswer: string,
    expectedAnswer: string,
    acceptedSolutions: string[] = [],
    options: AstCompareOptions = {}
  ): Promise<AstCompareResult> {
    return Promise.resolve(jsCompareByAst(userAnswer, expectedAnswer, acceptedSolutions, options));
  }

  /**
   * Clean up resources.
   */
  terminate(): void {
    this.workerManager?.terminate();
    this.workerManager = null;
    this.ready = false;
  }
}

// Singleton instance
let javascriptRuntimeInstance: JavaScriptRuntime | null = null;

/**
 * Get or create the singleton JavaScriptRuntime instance.
 */
export function getJavaScriptRuntime(): JavaScriptRuntime {
  if (!javascriptRuntimeInstance) {
    javascriptRuntimeInstance = new JavaScriptRuntime();
  }
  return javascriptRuntimeInstance;
}

/**
 * Reset the singleton instance. Useful for testing.
 */
export function resetJavaScriptRuntimeInstance(): void {
  if (javascriptRuntimeInstance) {
    javascriptRuntimeInstance.terminate();
    javascriptRuntimeInstance = null;
  }
  resetJavaScriptWorkerManagerInstance();
}
