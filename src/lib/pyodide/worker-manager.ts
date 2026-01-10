// src/lib/pyodide/worker-manager.ts
// Web Worker manager for isolated Pyodide execution
//
// SECURITY: Provides additional isolation for user code execution.
// - Runs in separate thread (cannot block main UI)
// - Can be terminated if code runs too long
// - Isolates any potential memory leaks
//
// Usage:
//   const manager = new PyodideWorkerManager();
//   await manager.initialize();
//   const result = await manager.execute(code, timeoutMs);
//   manager.terminate();

export interface WorkerExecutionResult {
  success: boolean;
  output: string | null;
  error: string | null;
}

export interface WorkerMessage {
  type: 'init' | 'execute' | 'ready' | 'result' | 'error';
  id?: string;
  code?: string;
  output?: string;
  error?: string;
  success?: boolean;
}

/** CDN URL for Pyodide */
const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/';

/**
 * Web Worker code as a string (will be converted to Blob URL).
 * This approach is compatible with Next.js bundling.
 */
const WORKER_CODE = `
// Pyodide Web Worker
// Runs user Python code in an isolated thread

let pyodide = null;

// Capture stdout
function captureStdout(code) {
  return \`
import sys
import io

__captured_stdout = io.StringIO()
__original_stdout = sys.stdout
sys.stdout = __captured_stdout

try:
    \${code.split('\\n').join('\\n    ')}
finally:
    sys.stdout = __original_stdout

__captured_stdout.getvalue()
\`.trim();
}

// Handle messages from main thread
self.onmessage = async function(e) {
  const { type, id, code } = e.data;

  if (type === 'init') {
    try {
      // Import Pyodide from CDN
      importScripts('${PYODIDE_CDN_URL}pyodide.js');

      // Load Pyodide
      pyodide = await loadPyodide({
        indexURL: '${PYODIDE_CDN_URL}',
      });

      self.postMessage({ type: 'ready' });
    } catch (error) {
      self.postMessage({
        type: 'error',
        error: error.message || 'Failed to initialize Pyodide'
      });
    }
  }

  if (type === 'execute') {
    if (!pyodide) {
      self.postMessage({
        type: 'result',
        id,
        success: false,
        error: 'Pyodide not initialized',
      });
      return;
    }

    try {
      const wrappedCode = captureStdout(code);
      const output = pyodide.runPython(wrappedCode);

      self.postMessage({
        type: 'result',
        id,
        success: true,
        output: String(output ?? ''),
        error: null,
      });
    } catch (error) {
      self.postMessage({
        type: 'result',
        id,
        success: false,
        output: null,
        error: error.message || 'Execution error',
      });
    }
  }
};
`;

/**
 * Manages a Pyodide Web Worker for isolated code execution.
 */
export class PyodideWorkerManager {
  private worker: Worker | null = null;
  private ready = false;
  private pendingRequests = new Map<
    string,
    {
      resolve: (result: WorkerExecutionResult) => void;
      reject: (error: Error) => void;
      timeoutId: ReturnType<typeof setTimeout>;
    }
  >();

  /**
   * Initialize the worker and load Pyodide.
   * @param timeoutMs - Maximum time to wait for initialization (default: 30s)
   */
  async initialize(timeoutMs = 30000): Promise<void> {
    if (this.ready) return;

    // Create worker from Blob URL
    const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    this.worker = new Worker(workerUrl);

    // Clean up blob URL after worker loads
    URL.revokeObjectURL(workerUrl);

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Pyodide worker initialization timeout'));
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
   * Execute Python code in the worker with timeout.
   * If timeout is exceeded, the worker is terminated and recreated.
   *
   * @param code - Python code to execute
   * @param timeoutMs - Maximum execution time (default: 5s)
   */
  async execute(code: string, timeoutMs = 5000): Promise<WorkerExecutionResult> {
    if (!this.ready || !this.worker) {
      throw new Error('Worker not initialized. Call initialize() first.');
    }

    const id = `exec_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    return new Promise((resolve, reject) => {
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

      this.pendingRequests.set(id, { resolve, reject, timeoutId });
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
let workerManagerInstance: PyodideWorkerManager | null = null;

/**
 * Get or create the singleton PyodideWorkerManager instance.
 */
export function getPyodideWorkerManager(): PyodideWorkerManager {
  if (!workerManagerInstance) {
    workerManagerInstance = new PyodideWorkerManager();
  }
  return workerManagerInstance;
}
