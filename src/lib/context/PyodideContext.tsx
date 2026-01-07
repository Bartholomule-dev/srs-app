// src/lib/context/PyodideContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';

/**
 * Pyodide interface type (minimal subset we use).
 * Full type from 'pyodide' package, but we define minimal interface
 * to avoid importing the large module in type definitions.
 */
export interface PyodideInterface {
  runPython(code: string): unknown;
  runPythonAsync(code: string): Promise<unknown>;
  loadPackage(packages: string | string[]): Promise<void>;
  globals: Map<string, unknown>;
}

export interface PyodideContextValue {
  /** Pyodide instance, null until loaded */
  pyodide: PyodideInterface | null;
  /** Whether Pyodide is currently loading */
  loading: boolean;
  /** Any error during loading */
  error: Error | null;
  /** Trigger lazy loading of Pyodide */
  loadPyodide: () => Promise<PyodideInterface | null>;
  /** Whether Pyodide has been loaded */
  isReady: boolean;
}

const PyodideContext = createContext<PyodideContextValue | null>(null);

/** CDN URL for Pyodide - update version as needed */
const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/';

export interface PyodideProviderProps {
  children: ReactNode;
}

/**
 * PyodideProvider - Lazy-loads Pyodide on demand.
 *
 * Usage:
 * 1. Wrap app in <PyodideProvider>
 * 2. Call loadPyodide() when needed (e.g., predict exercise in session)
 * 3. Use pyodide instance for code execution
 */
export function PyodideProvider({ children }: PyodideProviderProps) {
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Ref to prevent multiple simultaneous loads
  const loadPromiseRef = useRef<Promise<PyodideInterface | null> | null>(null);

  const loadPyodideInstance = useCallback(async (): Promise<PyodideInterface | null> => {
    // Already loaded
    if (pyodide) {
      return pyodide;
    }

    // Load in progress - return existing promise
    if (loadPromiseRef.current) {
      return loadPromiseRef.current;
    }

    setLoading(true);
    setError(null);

    loadPromiseRef.current = (async () => {
      try {
        // Dynamic import to avoid loading Pyodide until needed
        const { loadPyodide: loadPyodideFromCDN } = await import('pyodide');

        const instance = await loadPyodideFromCDN({
          indexURL: PYODIDE_CDN_URL,
        });

        setPyodide(instance as unknown as PyodideInterface);
        return instance as unknown as PyodideInterface;
      } catch (err) {
        const loadError = err instanceof Error
          ? err
          : new Error('Failed to load Pyodide');
        setError(loadError);
        console.error('Pyodide load failed:', err);
        return null;
      } finally {
        setLoading(false);
        loadPromiseRef.current = null;
      }
    })();

    return loadPromiseRef.current;
  }, [pyodide]);

  const value: PyodideContextValue = {
    pyodide,
    loading,
    error,
    loadPyodide: loadPyodideInstance,
    isReady: pyodide !== null,
  };

  return (
    <PyodideContext.Provider value={value}>
      {children}
    </PyodideContext.Provider>
  );
}

/**
 * Hook to access Pyodide context.
 */
export function usePyodide(): PyodideContextValue {
  const context = useContext(PyodideContext);
  if (!context) {
    throw new Error('usePyodide must be used within a PyodideProvider');
  }
  return context;
}
