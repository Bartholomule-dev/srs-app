// tests/component/exercise/HintButton.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HintButton } from '@/components/exercise';

describe('HintButton', () => {
  describe('before reveal', () => {
    it('renders a button with hint icon', () => {
      render(<HintButton hint="Use print()" revealed={false} onReveal={() => {}} />);
      expect(screen.getByRole('button', { name: /hint/i })).toBeInTheDocument();
    });

    it('does not show hint text before click', () => {
      render(<HintButton hint="Use print()" revealed={false} onReveal={() => {}} />);
      expect(screen.queryByText('Use print()')).not.toBeInTheDocument();
    });

    it('calls onReveal when clicked', () => {
      const handleReveal = vi.fn();
      render(<HintButton hint="Use print()" revealed={false} onReveal={handleReveal} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleReveal).toHaveBeenCalledTimes(1);
    });

    it('shows penalty warning', () => {
      render(<HintButton hint="Use print()" revealed={false} onReveal={() => {}} />);
      expect(screen.getByText(/affects your score/i)).toBeInTheDocument();
    });
  });

  describe('after reveal', () => {
    it('shows the hint text', () => {
      render(<HintButton hint="Use print()" revealed={true} onReveal={() => {}} />);
      expect(screen.getByText('Use print()')).toBeInTheDocument();
    });

    it('disables the button', () => {
      render(<HintButton hint="Use print()" revealed={true} onReveal={() => {}} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows revealed state styling', () => {
      render(<HintButton hint="Use print()" revealed={true} onReveal={() => {}} />);
      expect(screen.getByRole('button')).toHaveClass('opacity-50');
    });
  });

  describe('empty hint', () => {
    it('does not render when hint is empty', () => {
      render(<HintButton hint="" revealed={false} onReveal={() => {}} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not render when hint is null-like', () => {
      render(<HintButton hint={null as unknown as string} revealed={false} onReveal={() => {}} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('can be disabled independently of revealed', () => {
      render(<HintButton hint="Use print()" revealed={false} onReveal={() => {}} disabled />);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
