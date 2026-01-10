// src/lib/exercise/verification.ts
import { executePythonCodeIsolated, type ExecutionResult } from './execution';

export interface VerificationResult {
  passed: boolean;
  /** True if execution ran successfully (even if assertions failed) */
  infraAvailable: boolean;
  error?: string;
}

/** Error patterns that indicate infrastructure failure, not user code issues */
const INFRA_ERROR_PATTERNS = [
  'Worker execution error',
  'Worker not ready',
  'Pyodide not loaded',
  'Module not found',
  'NetworkError',
  'Failed to fetch',
];

/**
 * Check if an error indicates infrastructure failure vs user code error.
 */
function isInfraError(error: string | null): boolean {
  if (!error) return false;
  return INFRA_ERROR_PATTERNS.some(pattern =>
    error.includes(pattern)
  );
}

/**
 * Run verification script against user code in isolated worker.
 * Uses worker execution to avoid blocking UI during assertion checks.
 *
 * IMPORTANT: Returns infraAvailable: false for worker/Pyodide failures,
 * allowing the strategy router to fall back. User code errors (syntax,
 * assertion failures) return infraAvailable: true with passed: false.
 */
export async function verifyWithScript(
  userCode: string,
  verificationScript: string
): Promise<VerificationResult> {
  const fullCode = `${userCode}\n\n${verificationScript}`;

  let result: ExecutionResult;
  try {
    result = await executePythonCodeIsolated(fullCode);
  } catch (err) {
    // Worker crashed or network error - infrastructure failure
    return {
      passed: false,
      infraAvailable: false,
      error: err instanceof Error ? err.message : 'Worker execution failed',
    };
  }

  // Check for infrastructure errors vs user code errors
  if (!result.success && isInfraError(result.error)) {
    return {
      passed: false,
      infraAvailable: false,
      error: result.error ?? 'Infrastructure error',
    };
  }

  if (!result.success) {
    // User code error (syntax, assertion, runtime) - infra worked fine
    return {
      passed: false,
      infraAvailable: true,
      error: result.error ?? 'Verification failed',
    };
  }

  return { passed: true, infraAvailable: true };
}
