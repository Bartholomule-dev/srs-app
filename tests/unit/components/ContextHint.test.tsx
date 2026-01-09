// tests/unit/components/ContextHint.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContextHint } from '@/components/exercise/ContextHint';

describe('ContextHint', () => {
  it('renders context text', () => {
    render(
      <ContextHint context="Every task manager needs somewhere to store tasks." />
    );

    expect(
      screen.getByText('Every task manager needs somewhere to store tasks.')
    ).toBeInTheDocument();
  });

  it('renders nothing when context is null', () => {
    const { container } = render(<ContextHint context={null} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when context is empty string', () => {
    const { container } = render(<ContextHint context="" />);

    expect(container.firstChild).toBeNull();
  });

  it('applies custom className', () => {
    render(<ContextHint context="Test context" className="custom-class" />);

    // The text is directly inside the div, so closest('div') gets the container
    const element = screen.getByText('Test context').closest('div');
    expect(element).toHaveClass('custom-class');
  });

  it('renders with proper styling', () => {
    render(<ContextHint context="Test context" />);

    const element = screen.getByText('Test context');
    expect(element.closest('div')).toBeInTheDocument();
  });
});
