// src/lib/exercise/execution.ts
// Python code execution helpers using Pyodide

import type { PyodideInterface } from '@/lib/context/PyodideContext';

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
 */
export async function verifyPredictAnswer(
  pyodide: PyodideInterface,
  code: string,
  expectedOutput: string
): Promise<boolean> {
  const result = await executePythonCode(pyodide, code);

  if (!result.success || result.output === null) {
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

  if (!result.success || result.output === null) {
    return false;
  }

  const normalizedActual = normalizeOutput(result.output);
  const normalizedExpected = normalizeOutput(expectedOutput);

  return normalizedActual === normalizedExpected;
}

/**
 * Normalize output for comparison.
 * Trims whitespace and removes trailing newlines.
 */
function normalizeOutput(output: string): string {
  return output.trim().replace(/\n+$/, '');
}
