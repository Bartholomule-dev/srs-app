import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '@/components/dashboard';

const mockOnAction = vi.fn();

describe('EmptyState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('all-caught-up variant', () => {
    it('shows all caught up message', () => {
      render(
        <EmptyState
          variant="all-caught-up"
          newCardsAvailable={5}
          onLearnNew={mockOnAction}
        />
      );
      expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
    });

    it('shows learn new option when new cards available', () => {
      render(
        <EmptyState
          variant="all-caught-up"
          newCardsAvailable={5}
          onLearnNew={mockOnAction}
        />
      );
      expect(screen.getByRole('button', { name: /learn.*new/i })).toBeInTheDocument();
    });

    it('calls onLearnNew when button clicked', () => {
      render(
        <EmptyState
          variant="all-caught-up"
          newCardsAvailable={5}
          onLearnNew={mockOnAction}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /learn.*new/i }));
      expect(mockOnAction).toHaveBeenCalledTimes(1);
    });

    it('hides learn new button when no new cards', () => {
      render(
        <EmptyState
          variant="all-caught-up"
          newCardsAvailable={0}
          onLearnNew={mockOnAction}
        />
      );
      expect(
        screen.queryByRole('button', { name: /learn.*new/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('mastered-all variant', () => {
    it('shows mastered message', () => {
      render(<EmptyState variant="mastered-all" />);
      expect(screen.getByText(/mastered everything/i)).toBeInTheDocument();
    });

    it('shows come back tomorrow message', () => {
      render(<EmptyState variant="mastered-all" />);
      expect(screen.getByText(/come back/i)).toBeInTheDocument();
    });
  });
});
