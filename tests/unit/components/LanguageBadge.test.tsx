import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageBadge } from '@/components/ui/LanguageBadge';

describe('LanguageBadge', () => {
  it('shows Python icon and label for python language', () => {
    render(<LanguageBadge language="python" />);

    expect(screen.getByText('🐍')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
  });

  it('shows JavaScript icon and label for javascript language', () => {
    render(<LanguageBadge language="javascript" />);

    expect(screen.getByText('📜')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });

  it('shows fallback icon for unknown language', () => {
    render(<LanguageBadge language="rust" />);

    expect(screen.getByText('💻')).toBeInTheDocument();
    expect(screen.getByText('rust')).toBeInTheDocument();
  });

  it('applies active styling when active prop is true', () => {
    const { container } = render(<LanguageBadge language="python" active />);

    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('text-[var(--accent-primary)]');
    expect(badge).toHaveClass('bg-[var(--accent-primary)]/20');
  });

  it('applies inactive styling when active prop is false', () => {
    const { container } = render(<LanguageBadge language="python" active={false} />);

    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('text-[var(--text-secondary)]');
    expect(badge).toHaveClass('bg-[var(--bg-surface-2)]');
  });

  it('applies inactive styling by default when active prop is not provided', () => {
    const { container } = render(<LanguageBadge language="python" />);

    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('text-[var(--text-secondary)]');
    expect(badge).toHaveClass('bg-[var(--bg-surface-2)]');
  });

  it('applies custom className', () => {
    const { container } = render(
      <LanguageBadge language="python" className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has role="status" for accessibility', () => {
    render(<LanguageBadge language="python" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with correct base styling', () => {
    const { container } = render(<LanguageBadge language="python" />);

    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('inline-flex');
    expect(badge).toHaveClass('items-center');
    expect(badge).toHaveClass('gap-1.5');
    expect(badge).toHaveClass('px-2');
    expect(badge).toHaveClass('py-1');
    expect(badge).toHaveClass('rounded-md');
    expect(badge).toHaveClass('text-sm');
    expect(badge).toHaveClass('font-medium');
  });
});
