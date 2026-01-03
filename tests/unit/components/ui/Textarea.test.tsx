// tests/unit/components/ui/Textarea.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '@/components/ui/Textarea';

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea onChange={onChange} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'test content');

    expect(onChange).toHaveBeenCalled();
  });

  it('applies monospace font when monospace prop is true', () => {
    render(<Textarea monospace placeholder="Code" />);
    const textarea = screen.getByPlaceholderText('Code');
    expect(textarea).toHaveClass('font-mono');
  });

  it('does not apply monospace font by default', () => {
    render(<Textarea placeholder="Normal" />);
    const textarea = screen.getByPlaceholderText('Normal');
    expect(textarea).not.toHaveClass('font-mono');
  });

  it('applies custom className', () => {
    render(<Textarea className="custom-textarea" placeholder="Custom" />);
    const textarea = screen.getByPlaceholderText('Custom');
    expect(textarea).toHaveClass('custom-textarea');
  });

  it('combines monospace and custom className', () => {
    render(<Textarea monospace className="custom-class" placeholder="Both" />);
    const textarea = screen.getByPlaceholderText('Both');
    expect(textarea).toHaveClass('font-mono');
    expect(textarea).toHaveClass('custom-class');
  });

  it('supports disabled state', () => {
    render(<Textarea disabled placeholder="Disabled" />);
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
  });

  it('supports rows attribute', () => {
    render(<Textarea rows={5} placeholder="Rows" />);
    const textarea = screen.getByPlaceholderText('Rows');
    expect(textarea).toHaveAttribute('rows', '5');
  });
});
