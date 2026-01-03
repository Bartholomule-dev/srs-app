import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PracticeCTA } from '@/components/dashboard/PracticeCTA';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('PracticeCTA', () => {
  it('shows due and new counts when cards are due', () => {
    render(<PracticeCTA dueCount={15} newCount={5} />);
    expect(screen.getByText(/15 cards due/)).toBeInTheDocument();
    expect(screen.getByText(/5 new cards/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start practice/i })).toHaveAttribute('href', '/practice');
  });

  it('shows all caught up message when no cards due but new available', () => {
    render(<PracticeCTA dueCount={0} newCount={10} />);
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
    expect(screen.getByText(/learn new cards/i)).toBeInTheDocument();
  });

  it('shows all caught up with browse link when no cards at all', () => {
    render(<PracticeCTA dueCount={0} newCount={0} />);
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse exercises/i })).toHaveAttribute('href', '/practice');
  });

  it('links to practice page', () => {
    render(<PracticeCTA dueCount={5} newCount={2} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/practice');
  });
});
