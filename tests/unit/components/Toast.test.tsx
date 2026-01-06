import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastContainer } from '@/components/Toast';
import { ToastProvider, useToast } from '@/lib/context/ToastContext';

function TestTrigger() {
  const { showToast } = useToast();
  return (
    <button onClick={() => showToast({ title: 'Test Toast', variant: 'success' })}>
      Trigger
    </button>
  );
}

describe('ToastContainer', () => {
  it('renders toasts from context', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestTrigger />
        <ToastContainer />
      </ToastProvider>
    );

    await user.click(screen.getByText('Trigger'));
    expect(screen.getByText('Test Toast')).toBeInTheDocument();
  });

  it('renders success variant with correct styling', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestTrigger />
        <ToastContainer />
      </ToastProvider>
    );

    await user.click(screen.getByText('Trigger'));
    const toast = screen.getByRole('alert');
    expect(toast).toBeInTheDocument();
  });

  it('renders with dismiss button', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestTrigger />
        <ToastContainer />
      </ToastProvider>
    );

    await user.click(screen.getByText('Trigger'));
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });
});
