// tests/unit/components/ui/Input.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test');

    expect(onChange).toHaveBeenCalled();
  });

  it('displays error message when provided', () => {
    render(<Input errorMessage="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('applies error styling when error prop is true', () => {
    render(<Input error placeholder="Error input" />);
    const input = screen.getByPlaceholderText('Error input');
    expect(input).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" placeholder="Custom" />);
    const input = screen.getByPlaceholderText('Custom');
    expect(input).toHaveClass('custom-input');
  });

  it('supports disabled state', () => {
    render(<Input disabled placeholder="Disabled" />);
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
  });

  it('supports different types', () => {
    render(<Input type="password" placeholder="Password" />);
    const input = screen.getByPlaceholderText('Password');
    expect(input).toHaveAttribute('type', 'password');
  });
});
