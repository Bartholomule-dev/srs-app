// tests/component/layout/LandingHeader.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingHeader } from '@/components/layout/LandingHeader';

describe('LandingHeader', () => {
  it('renders logo', () => {
    render(<LandingHeader />);
    expect(screen.getByText(/syntaxsrs/i)).toBeInTheDocument();
  });

  it('shows sign in link that scrolls to form', () => {
    render(<LandingHeader />);
    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toHaveAttribute('href', '#auth');
  });
});
