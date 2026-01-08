// tests/unit/components/dashboard/DueNowBand.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DueNowBand } from '@/components/dashboard/DueNowBand';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('DueNowBand', () => {
  it('shows due count when cards are due', () => {
    render(<DueNowBand dueCount={5} streak={3} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/cards due/i)).toBeInTheDocument();
  });

  it('shows streak warning when streak at risk', () => {
    render(<DueNowBand dueCount={5} streak={7} />);
    expect(screen.getByText(/7-day streak/i)).toBeInTheDocument();
  });

  it('shows all caught up message when no cards due', () => {
    render(<DueNowBand dueCount={0} streak={3} />);
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
  });

  it('renders Start Practice button with pulse when cards due', () => {
    render(<DueNowBand dueCount={5} streak={0} />);
    const button = screen.getByRole('button', { name: /start practice/i });
    expect(button).toBeInTheDocument();
  });

  it('renders Learn New button when no cards due', () => {
    render(<DueNowBand dueCount={0} streak={0} />);
    const button = screen.getByRole('button', { name: /learn new/i });
    expect(button).toBeInTheDocument();
  });

  it('has border-l-4 accent styling', () => {
    const { container } = render(<DueNowBand dueCount={5} streak={0} />);
    const band = container.firstChild;
    expect(band).toHaveClass('border-l-4');
  });
});
