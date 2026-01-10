// src/lib/exercise/execution.ts
// Python code execution helpers using Pyodide
//
// Two execution modes:
// 1. Main thread (PyodideInterface) - faster, but blocks UI during execution
// 2. Web Worker (PyodideWorkerManager) - isolated, terminable, recommended for user code
//
// The worker mode provides better security isolation and can be terminated
// if code runs too long, preventing UI hangs.

import type { PyodideInterface } from '@/lib/context/PyodideContext';
import {
  getPyodideWorkerManager,
  type PyodideWorkerManager,
  type WorkerExecutionResult,
} from '@/lib/pyodide';

/** Default execution timeout in milliseconds */
const DEFAULT_TIMEOUT_MS = 5000;

/** Default template for verifying write exercises */
const DEFAULT_VERIFICATION_TEMPLATE = 'print({{answer}})';

/**
 * Result of executing Python code.
 */
export interface ExecutionResult {
  success: boolean;
  output: string | null;
  error: string | null;
}

/**
 * Options for code execution.
 */
export interface ExecutionOptions {
  /** Timeout in milliseconds */
  timeoutMs?: number;
}

/**
 * Wrap Python code to capture stdout.
 */
export function captureStdout(code: string): string {
  return `
import sys
import io

__captured_stdout = io.StringIO()
__original_stdout = sys.stdout
sys.stdout = __captured_stdout

try:
    ${code.split('\n').join('\n    ')}
finally:
    sys.stdout = __original_stdout

__captured_stdout.getvalue()
`.trim();
}

/**
 * Execute Python code and capture output.
 */
export async function executePythonCode(
  pyodide: PyodideInterface,
  code: string,
  options: ExecutionOptions = {}
): Promise<ExecutionResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  try {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Execution timeout')), timeoutMs);
    });

    // Wrap code to capture stdout
    const wrappedCode = captureStdout(code);

    // Execute with timeout
    const executionPromise = Promise.resolve(pyodide.runPython(wrappedCode));
    const output = await Promise.race([executionPromise, timeoutPromise]);

    return {
      success: true,
      output: String(output ?? ''),
      error: null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      output: null,
      error: errorMessage,
    };
  }
}

/**
 * Verify a predict-output exercise by executing the code.
 *
 * @param pyodide - Pyodide instance
 * @param code - Code to execute
 * @param expectedOutput - Expected output to compare against
 * @returns Whether actual output matches expected
 * @throws Error if execution fails (caller should fall back to string matching)
 */
export async function verifyPredictAnswer(
  pyodide: PyodideInterface,
  code: string,
  expectedOutput: string
): Promise<boolean> {
  const result = await executePythonCode(pyodide, code);

  if (!result.success) {
    // Execution failed - throw so caller can fall back to string matching
    throw new Error(`Execution failed: ${result.error}`);
  }

  if (result.output === null) {
    return false;
  }

  // Normalize both outputs for comparison
  const normalizedActual = normalizeOutput(result.output);
  const normalizedExpected = normalizeOutput(expectedOutput);

  return normalizedActual === normalizedExpected;
}

/**
 * Verify a write exercise by substituting answer into template and executing.
 *
 * @param pyodide - Pyodide instance
 * @param userAnswer - User's code answer
 * @param expectedOutput - Expected output after execution
 * @param verificationTemplate - Template with {{answer}} placeholder
 * @returns Whether execution output matches expected
 * @throws Error if execution fails (caller should fall back to string matching)
 */
export async function verifyWriteAnswer(
  pyodide: PyodideInterface,
  userAnswer: string,
  expectedOutput: string,
  verificationTemplate: string = DEFAULT_VERIFICATION_TEMPLATE
): Promise<boolean> {
  // Substitute user's answer into template
  const codeToRun = verificationTemplate.replace('{{answer}}', userAnswer);

  const result = await executePythonCode(pyodide, codeToRun);

  if (!result.success) {
    // Execution failed - throw so caller can fall back to string matching
    throw new Error(`Execution failed: ${result.error}`);
  }

  if (result.output === null) {
    return false;
  }

  const normalizedActual = normalizeOutput(result.output);
  const normalizedExpected = normalizeOutput(expectedOutput);

  return normalizedActual === normalizedExpected;
}

// =============================================================================
// Output normalization and error parsing utilities
// =============================================================================

export interface NormalizeOptions {
  mode: 'strict' | 'trim' | 'ignore_whitespace';
}

/**
 * Normalize execution output based on mode.
 * - strict: trim + remove trailing newlines (default)
 * - trim: just trim whitespace
 * - ignore_whitespace: remove all whitespace
 */
export function normalizeOutput(
  output: string,
  options: NormalizeOptions = { mode: 'strict' }
): string {
  switch (options.mode) {
    case 'strict':
      return output.trim().replace(/\n+$/, '');
    case 'trim':
      return output.trim();
    case 'ignore_whitespace':
      return output.replace(/\s+/g, '');
    default:
      return output.trim();
  }
}

export interface ParsedError {
  type: string;
  message: string;
}

/**
 * Parse Python error message into structured format.
 */
export function parseExecutionError(error: string): ParsedError {
  if (error.includes('timeout') || error.includes('Timeout')) {
    return { type: 'Timeout', message: 'Code execution timed out' };
  }

  const match = error.match(/^(\w+Error): (.+)$/);
  if (match) {
    return { type: match[1], message: match[2] };
  }

  return { type: 'Unknown', message: error };
}

// =============================================================================
// Web Worker-based execution (recommended for user code)
// =============================================================================

/**
 * Execute Python code in an isolated Web Worker.
 *
 * SECURITY: This is the recommended method for executing user-provided code.
 * Benefits:
 * - Runs in separate thread (cannot block main UI)
 * - Can be terminated if execution takes too long
 * - Better isolation from main application state
 *
 * @param code - Python code to execute
 * @param options - Execution options
 * @returns Execution result with output or error
 */
export async function executePythonCodeIsolated(
  code: string,
  options: ExecutionOptions = {}
): Promise<ExecutionResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const manager = getPyodideWorkerManager();

  try {
    // Initialize worker if not ready
    if (!manager.isReady()) {
      await manager.initialize();
    }

    const result: WorkerExecutionResult = await manager.execute(code, timeoutMs);

    return {
      success: result.success,
      output: result.output,
      error: result.error,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Worker execution error';
    return {
      success: false,
      output: null,
      error: errorMessage,
    };
  }
}

/**
 * Verify a predict-output exercise using isolated worker execution.
 *
 * @param code - Code to execute
 * @param expectedOutput - Expected output to compare against
 * @returns Whether actual output matches expected
 * @throws Error if execution fails (caller should fall back to string matching)
 */
export async function verifyPredictAnswerIsolated(
  code: string,
  expectedOutput: string
): Promise<boolean> {
  const result = await executePythonCodeIsolated(code);

  if (!result.success) {
    throw new Error(`Execution failed: ${result.error}`);
  }

  if (result.output === null) {
    return false;
  }

  const normalizedActual = normalizeOutput(result.output);
  const normalizedExpected = normalizeOutput(expectedOutput);

  return normalizedActual === normalizedExpected;
}

/**
 * Verify a write exercise using isolated worker execution.
 *
 * @param userAnswer - User's code answer
 * @param expectedOutput - Expected output after execution
 * @param verificationTemplate - Template with {{answer}} placeholder
 * @returns Whether execution output matches expected
 * @throws Error if execution fails (caller should fall back to string matching)
 */
export async function verifyWriteAnswerIsolated(
  userAnswer: string,
  expectedOutput: string,
  verificationTemplate: string = DEFAULT_VERIFICATION_TEMPLATE
): Promise<boolean> {
  const codeToRun = verificationTemplate.replace('{{answer}}', userAnswer);
  const result = await executePythonCodeIsolated(codeToRun);

  if (!result.success) {
    throw new Error(`Execution failed: ${result.error}`);
  }

  if (result.output === null) {
    return false;
  }

  const normalizedActual = normalizeOutput(result.output);
  const normalizedExpected = normalizeOutput(expectedOutput);

  return normalizedActual === normalizedExpected;
}

// Re-export types for convenience
export type { PyodideWorkerManager, WorkerExecutionResult };
