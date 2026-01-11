// src/lib/runtime/types.ts
// Abstract interface for language-specific code execution and comparison

import type { Language } from '@/lib/types';

/**
 * Result of code execution.
 */
export interface ExecutionResult {
  success: boolean;
  output: string | null;
  error: string | null;
}

/**
 * Result of token-based comparison.
 */
export interface TokenCompareResult {
  match: boolean;
  matchedAlternative: string | null;
}

/**
 * Result of AST-based comparison.
 */
export interface AstCompareResult {
  match: boolean;
  matchedAlternative: string | null;
  infraAvailable: boolean;
  error?: string;
}

/**
 * Options for AST comparison.
 */
export interface AstCompareOptions {
  renameLocals?: boolean;
  normalizeSlices?: boolean;
  ignoreDocstrings?: boolean;
}

/**
 * Abstract interface for language-specific code execution and comparison.
 * Each supported language implements this interface.
 */
export interface LanguageRuntime {
  /** Which language this runtime handles */
  readonly language: Language;

  /** Initialize the runtime (load WASM, start worker, etc.) */
  initialize(): Promise<void>;

  /** Check if runtime is ready for execution */
  isReady(): boolean;

  /** Execute code and capture output */
  execute(code: string, timeoutMs?: number): Promise<ExecutionResult>;

  /** Tokenize code for comparison */
  tokenize(code: string): Promise<[number, string][] | null>;

  /** Compare code by tokens */
  compareByTokens(
    userAnswer: string,
    expectedAnswer: string,
    acceptedSolutions?: string[]
  ): Promise<TokenCompareResult>;

  /** Compare code by AST */
  compareByAst(
    userAnswer: string,
    expectedAnswer: string,
    acceptedSolutions?: string[],
    options?: AstCompareOptions
  ): Promise<AstCompareResult>;

  /** Clean up resources */
  terminate(): void;
}
