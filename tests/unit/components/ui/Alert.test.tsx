// tests/unit/components/ui/Alert.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from '@/components/ui/Alert';

describe('Alert', () => {
  it('renders with title', () => {
    render(<Alert title="Alert Title" />);
    expect(screen.getByText('Alert Title')).toBeInTheDocument();
  });

  it('renders with description', () => {
    render(<Alert description="Alert description text" />);
    expect(screen.getByText('Alert description text')).toBeInTheDocument();
  });

  it('renders with both title and description', () => {
    render(<Alert title="Title" description="Description" />);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<Alert>Custom content</Alert>);
    expect(screen.getByText('Custom content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Alert className="custom-alert" title="Custom" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('custom-alert');
  });

  it('supports info variant', () => {
    render(<Alert variant="info" title="Info" />);
    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('supports success variant', () => {
    render(<Alert variant="success" title="Success" />);
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('supports warning variant', () => {
    render(<Alert variant="warning" title="Warning" />);
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('supports error variant', () => {
    render(<Alert variant="error" title="Error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('supports dismissible alerts', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<Alert title="Dismissible" dismissible onDismiss={onDismiss} />);

    const dismissButton = screen.getByRole('button');
    await user.click(dismissButton);

    expect(onDismiss).toHaveBeenCalled();
  });
});
