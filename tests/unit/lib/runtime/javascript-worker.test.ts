// tests/unit/lib/runtime/javascript-worker.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  JavaScriptWorkerManager,
  getJavaScriptWorkerManager,
  resetJavaScriptWorkerManagerInstance,
} from '@/lib/runtime/javascript-worker';

// Mock Worker class for testing environment (jsdom doesn't have real workers)
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  private terminated = false;
  private mockConsoleLog: string[] = [];

  constructor(public url: string) {
    // Simulate worker loading
  }

  postMessage(data: { type: string; id?: string; code?: string }) {
    if (this.terminated) return;

    // Simulate async worker behavior
    setTimeout(() => {
      if (this.terminated || !this.onmessage) return;

      if (data.type === 'init') {
        // Simulate successful initialization
        this.onmessage(new MessageEvent('message', { data: { type: 'ready' } }));
      } else if (data.type === 'execute') {
        // Simulate code execution
        this.executeCode(data.code!, data.id!);
      }
    }, 0);
  }

  private executeCode(code: string, id: string) {
    if (this.terminated || !this.onmessage) return;

    this.mockConsoleLog = [];

    // Create a mock console
    const mockConsole = {
      log: (...args: unknown[]) => {
        this.mockConsoleLog.push(args.map((a) => String(a)).join(' '));
      },
      error: (...args: unknown[]) => {
        this.mockConsoleLog.push('[ERROR] ' + args.map((a) => String(a)).join(' '));
      },
      warn: (...args: unknown[]) => {
        this.mockConsoleLog.push('[WARN] ' + args.map((a) => String(a)).join(' '));
      },
    };

    try {
      // Detect infinite loops in test (simplified check for specific test case)
      if (code.includes('while(true)')) {
        // Don't send response - simulate timeout
        return;
      }

      // SECURITY: This is intentional for a code practice application.
      // We use eval to execute user-submitted code and return the last expression value.
      // In the real worker, this runs in a Web Worker sandbox with no DOM access.
      //
      // We use indirect eval (via Function constructor) to:
      // 1. Return the value of the last expression (REPL-like behavior)
      // 2. Provide a custom console object for output capture
      // eslint-disable-next-line no-new-func, no-eval
      const evalInScope = new Function(
        'console',
        'return eval(arguments[1])'
      ) as (console: typeof mockConsole, code: string) => unknown;
      const result = evalInScope(mockConsole, code);

      const output =
        this.mockConsoleLog.length > 0
          ? this.mockConsoleLog.join('\n')
          : result !== undefined
            ? String(result)
            : '';

      this.onmessage(
        new MessageEvent('message', {
          data: { type: 'result', id, success: true, output, error: null },
        })
      );
    } catch (err) {
      this.onmessage(
        new MessageEvent('message', {
          data: {
            type: 'result',
            id,
            success: false,
            output: null,
            error: err instanceof Error ? err.message : String(err),
          },
        })
      );
    }
  }

  terminate() {
    this.terminated = true;
    this.onmessage = null;
    this.onerror = null;
  }

  addEventListener(type: string, handler: (e: MessageEvent) => void) {
    if (type === 'message') {
      this.onmessage = handler;
    }
  }

  removeEventListener(_type: string, _handler: (e: MessageEvent) => void) {
    // Mock implementation - just clear handler
    if (_type === 'message') {
      this.onmessage = null;
    }
  }
}

// Store original Worker and URL
const originalWorker = globalThis.Worker;
const originalURL = globalThis.URL;

describe('JavaScriptWorkerManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetJavaScriptWorkerManagerInstance();

    // Mock Worker globally
    globalThis.Worker = MockWorker as unknown as typeof Worker;

    // Mock URL.createObjectURL and revokeObjectURL
    globalThis.URL = {
      ...originalURL,
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    } as unknown as typeof URL;
  });

  afterEach(() => {
    resetJavaScriptWorkerManagerInstance();
    globalThis.Worker = originalWorker;
    globalThis.URL = originalURL;
  });

  describe('basic properties', () => {
    it('should not be ready before initialization', () => {
      const manager = new JavaScriptWorkerManager();
      expect(manager.isReady()).toBe(false);
    });

    it('should be ready after initialization', async () => {
      const manager = new JavaScriptWorkerManager();
      await manager.initialize();
      expect(manager.isReady()).toBe(true);
    });

    it('should be idempotent - calling initialize twice should not reinitialize', async () => {
      const manager = new JavaScriptWorkerManager();
      await manager.initialize();
      await manager.initialize();
      expect(manager.isReady()).toBe(true);
      // URL.createObjectURL should only be called once
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    });
  });

  describe('execute', () => {
    it('should return error if manager not initialized', async () => {
      const manager = new JavaScriptWorkerManager();
      const result = await manager.execute('console.log("hello")');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Worker not initialized');
    });

    it('should execute simple JavaScript and return output', async () => {
      const manager = new JavaScriptWorkerManager();
      await manager.initialize();
      const result = await manager.execute('console.log("hello")');
      expect(result.success).toBe(true);
      expect(result.output).toBe('hello');
    });

    it('should capture multiple console.log calls', async () => {
      const manager = new JavaScriptWorkerManager();
      await manager.initialize();
      const result = await manager.execute('console.log(1); console.log(2)');
      expect(result.success).toBe(true);
      expect(result.output).toBe('1\n2');
    });

    it('should handle execution errors', async () => {
      const manager = new JavaScriptWorkerManager();
      await manager.initialize();
      const result = await manager.execute('throw new Error("test error")');
      expect(result.success).toBe(false);
      expect(result.error).toContain('test error');
    });

    it('should handle syntax errors', async () => {
      const manager = new JavaScriptWorkerManager();
      await manager.initialize();
      const result = await manager.execute('function {');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should timeout long-running code', async () => {
      const manager = new JavaScriptWorkerManager();
      await manager.initialize();
      const result = await manager.execute('while(true){}', 100);
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    it('should return expression value when no console.log', async () => {
      const manager = new JavaScriptWorkerManager();
      await manager.initialize();
      const result = await manager.execute('1 + 2');
      expect(result.success).toBe(true);
      expect(result.output).toBe('3');
    });

    it('should return empty string for undefined result with no output', async () => {
      const manager = new JavaScriptWorkerManager();
      await manager.initialize();
      const result = await manager.execute('const x = 1');
      expect(result.success).toBe(true);
      expect(result.output).toBe('');
    });
  });

  describe('terminate', () => {
    it('should clean up resources', async () => {
      const manager = new JavaScriptWorkerManager();
      await manager.initialize();
      expect(manager.isReady()).toBe(true);

      manager.terminate();
      expect(manager.isReady()).toBe(false);
    });

    it('should be safe to call terminate without initialization', () => {
      const manager = new JavaScriptWorkerManager();
      expect(() => manager.terminate()).not.toThrow();
    });

    it('should be safe to call terminate multiple times', async () => {
      const manager = new JavaScriptWorkerManager();
      await manager.initialize();

      manager.terminate();
      manager.terminate();

      expect(manager.isReady()).toBe(false);
    });
  });

  describe('singleton', () => {
    it('should return the same instance from getJavaScriptWorkerManager', () => {
      const manager1 = getJavaScriptWorkerManager();
      const manager2 = getJavaScriptWorkerManager();
      expect(manager1).toBe(manager2);
    });

    it('should return a new instance after reset', () => {
      const manager1 = getJavaScriptWorkerManager();
      resetJavaScriptWorkerManagerInstance();
      const manager2 = getJavaScriptWorkerManager();
      expect(manager1).not.toBe(manager2);
    });
  });
});
