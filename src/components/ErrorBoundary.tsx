'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface FallbackProps {
  error: Error;
  reset: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: FallbackProps) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props;

      if (typeof fallback === 'function') {
        return fallback({ error: this.state.error, reset: this.reset });
      }

      if (fallback) {
        return fallback;
      }

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center">
          <h2 className="mb-2 text-lg font-semibold text-red-600 dark:text-red-400">
            Something went wrong
          </h2>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            {this.state.error.message}
          </p>
          <button
            onClick={this.reset}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
