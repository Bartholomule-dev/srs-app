// src/lib/runtime/javascript-worker.ts
// Web Worker manager for isolated JavaScript code execution
//
// SECURITY: Provides isolation for user code execution.
// - Runs in separate thread (cannot block main UI)
// - Can be terminated if code runs too long
// - No DOM access, no access to parent scope
// - Custom console override captures output
//
// Usage:
//   const manager = new JavaScriptWorkerManager();
//   await manager.initialize();
//   const result = await manager.execute(code, timeoutMs);
//   manager.terminate();

import type { ExecutionResult } from './types';

export interface WorkerMessage {
  type: 'init' | 'execute' | 'ready' | 'result' | 'error';
  id?: string;
  code?: string;
  output?: string;
  error?: string;
  success?: boolean;
}

/**
 * Web Worker code as a string (will be converted to Blob URL).
 * This approach is compatible with Next.js bundling.
 *
 * SECURITY NOTE: This worker uses Function constructor to execute user code.
 * This is intentional - we are building a code practice application.
 * The worker provides isolation:
 * - Separate thread (no DOM access)
 * - Custom console (captures output)
 * - No access to parent scope variables
 * - Timeout handling via worker termination
 */
const WORKER_CODE = `
// JavaScript Web Worker for isolated code execution

self.onmessage = function(e) {
  const { type, id, code } = e.data;

  if (type === 'init') {
    // JavaScript doesn't need initialization like Pyodide
    self.postMessage({ type: 'ready' });
    return;
  }

  if (type === 'execute') {
    const logs = [];

    // Override console to capture output
    const customConsole = {
      log: function() {
        const args = Array.prototype.slice.call(arguments);
        logs.push(args.map(function(a) { return String(a); }).join(' '));
      },
      error: function() {
        const args = Array.prototype.slice.call(arguments);
        logs.push('[ERROR] ' + args.map(function(a) { return String(a); }).join(' '));
      },
      warn: function() {
        const args = Array.prototype.slice.call(arguments);
        logs.push('[WARN] ' + args.map(function(a) { return String(a); }).join(' '));
      },
      info: function() {
        const args = Array.prototype.slice.call(arguments);
        logs.push('[INFO] ' + args.map(function(a) { return String(a); }).join(' '));
      },
    };

    try {
      // SECURITY: Intentional use of indirect eval for code execution.
      // This is the core feature of a code practice application.
      // The worker sandbox provides isolation from the main thread.
      //
      // We use indirect eval (via Function constructor) to:
      // 1. Return the value of the last expression (REPL-like behavior)
      // 2. Provide a custom console object for output capture
      // 3. Maintain isolation (no access to worker scope variables)
      //
      // The wrapper function:
      // - Shadows the global console with our custom one
      // - Uses eval to execute code and return last expression value
      // eslint-disable-next-line no-new-func, no-eval
      var evalInScope = new Function('console', 'return eval(arguments[1])');
      var result = evalInScope(customConsole, code);

      var output = logs.length > 0
        ? logs.join('\\n')
        : (result !== undefined ? String(result) : '');

      self.postMessage({
        type: 'result',
        id: id,
        success: true,
        output: output,
        error: null
      });
    } catch (err) {
      self.postMessage({
        type: 'result',
        id: id,
        success: false,
        output: null,
        error: err.message || String(err)
      });
    }
  }
};
`;

/**
 * Manages a JavaScript Web Worker for isolated code execution.
 */
export class JavaScriptWorkerManager {
  private worker: Worker | null = null;
  private ready = false;
  private pendingRequests = new Map<
    string,
    {
      resolve: (result: ExecutionResult) => void;
      reject: (error: Error) => void;
      timeoutId: ReturnType<typeof setTimeout>;
    }
  >();

  /**
   * Initialize the worker.
   * Unlike Pyodide, JavaScript doesn't need heavy initialization.
   * @param timeoutMs - Maximum time to wait for initialization (default: 5s)
   */
  async initialize(timeoutMs = 5000): Promise<void> {
    if (this.ready) return;

    // Create worker from Blob URL
    const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    this.worker = new Worker(workerUrl);

    // Clean up blob URL after worker loads
    URL.revokeObjectURL(workerUrl);

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('JavaScript worker initialization timeout'));
        this.terminate();
      }, timeoutMs);

      this.worker!.onmessage = (e: MessageEvent<WorkerMessage>) => {
        const { type, id, error } = e.data;

        if (type === 'ready') {
          clearTimeout(timeoutId);
          this.ready = true;
          this.setupMessageHandler();
          resolve();
        }

        if (type === 'error' && !this.ready) {
          clearTimeout(timeoutId);
          reject(new Error(error || 'Worker initialization failed'));
        }

        // Handle execution results after ready
        if (type === 'result' && id) {
          const pending = this.pendingRequests.get(id);
          if (pending) {
            clearTimeout(pending.timeoutId);
            this.pendingRequests.delete(id);
            pending.resolve({
              success: e.data.success ?? false,
              output: e.data.output ?? null,
              error: e.data.error ?? null,
            });
          }
        }
      };

      this.worker!.onerror = (error) => {
        clearTimeout(timeoutId);
        reject(new Error(`Worker error: ${error.message}`));
      };

      // Send init message
      this.worker!.postMessage({ type: 'init' });
    });
  }

  /**
   * Set up message handler for execution results.
   */
  private setupMessageHandler(): void {
    if (!this.worker) return;

    this.worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const { type, id } = e.data;

      if (type === 'result' && id) {
        const pending = this.pendingRequests.get(id);
        if (pending) {
          clearTimeout(pending.timeoutId);
          this.pendingRequests.delete(id);
          pending.resolve({
            success: e.data.success ?? false,
            output: e.data.output ?? null,
            error: e.data.error ?? null,
          });
        }
      }
    };
  }

  /**
   * Execute JavaScript code in the worker with timeout.
   * If timeout is exceeded, the worker is terminated and recreated.
   *
   * @param code - JavaScript code to execute
   * @param timeoutMs - Maximum execution time (default: 5s)
   */
  async execute(code: string, timeoutMs = 5000): Promise<ExecutionResult> {
    if (!this.ready || !this.worker) {
      return { success: false, output: null, error: 'Worker not initialized' };
    }

    const id = `exec_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);

        // Terminate stuck worker and resolve with timeout error
        // The worker can be reinitialized for future executions
        resolve({
          success: false,
          output: null,
          error: 'Execution timeout - code took too long to run',
        });

        // Mark worker as not ready (will need reinitialization)
        this.terminateAndReset();
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject: () => {}, timeoutId });
      this.worker!.postMessage({ type: 'execute', id, code });
    });
  }

  /**
   * Terminate the worker without cleanup (for timeout scenarios).
   * Worker will need to be reinitialized.
   */
  private terminateAndReset(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.ready = false;
    this.pendingRequests.clear();
  }

  /**
   * Cleanly terminate the worker.
   */
  terminate(): void {
    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('Worker terminated'));
      this.pendingRequests.delete(id);
    }

    this.terminateAndReset();
  }

  /**
   * Check if worker is ready for execution.
   */
  isReady(): boolean {
    return this.ready;
  }
}

// Singleton instance for app-wide use
let workerManagerInstance: JavaScriptWorkerManager | null = null;

/**
 * Get or create the singleton JavaScriptWorkerManager instance.
 */
export function getJavaScriptWorkerManager(): JavaScriptWorkerManager {
  if (!workerManagerInstance) {
    workerManagerInstance = new JavaScriptWorkerManager();
  }
  return workerManagerInstance;
}

/**
 * Reset the singleton instance. Useful for testing.
 */
export function resetJavaScriptWorkerManagerInstance(): void {
  if (workerManagerInstance) {
    workerManagerInstance.terminate();
    workerManagerInstance = null;
  }
}
