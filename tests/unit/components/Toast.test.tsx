import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from '@/lib/context/ToastContext';
import { Toast } from '@/components/Toast';

function TestComponent() {
  const { showToast } = useToast();

  return (
    <div>
      <button onClick={() => showToast({ type: 'success', message: 'Success!' })}>
        Show Success
      </button>
      <button onClick={() => showToast({ type: 'error', message: 'Error!' })}>
        Show Error
      </button>
      <button onClick={() => showToast({ type: 'info', message: 'Info!' })}>
        Show Info
      </button>
    </div>
  );
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows success toast when triggered', async () => {
    render(
      <ToastProvider>
        <TestComponent />
        <Toast />
      </ToastProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Show Success'));
    });

    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('shows error toast with error styling', async () => {
    render(
      <ToastProvider>
        <TestComponent />
        <Toast />
      </ToastProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Show Error'));
    });

    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-red-50');
  });

  it('auto-dismisses after duration', async () => {
    render(
      <ToastProvider>
        <TestComponent />
        <Toast />
      </ToastProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Show Success'));
    });

    expect(screen.getByText('Success!')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText('Success!')).not.toBeInTheDocument();
  });

  it('can be manually dismissed', async () => {
    render(
      <ToastProvider>
        <TestComponent />
        <Toast />
      </ToastProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Show Success'));
    });

    expect(screen.getByText('Success!')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    });

    expect(screen.queryByText('Success!')).not.toBeInTheDocument();
  });

  it('throws when useToast used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function BadComponent() {
      useToast();
      return null;
    }

    expect(() => render(<BadComponent />)).toThrow(
      'useToast must be used within a ToastProvider'
    );

    spy.mockRestore();
  });
});
